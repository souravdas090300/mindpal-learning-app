/**
 * Review Routes - Spaced Repetition System
 * 
 * Handles flashcard reviews using SM-2 algorithm:
 * - GET /api/reviews/due - Get flashcards due for review
 * - POST /api/reviews/:flashcardId - Submit a review
 * - GET /api/reviews/stats - Get user's review statistics
 * - GET /api/reviews/history - Get review history
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { calculateNextReview, getDueFlashcards, getStudyStats, ReviewQuality } from '../lib/spaced-repetition';

const router = Router();

/**
 * GET /api/reviews/due
 * Get all flashcards due for review for the authenticated user
 */
router.get('/due', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Fetch all flashcards for the user
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Get only the cards that are due for review
    const dueCards = getDueFlashcards(flashcards || []);

    // Get study statistics
    const stats = getStudyStats(flashcards || []);

    res.json({
      flashcards: dueCards,
      stats,
      message: `${dueCards.length} cards due for review`
    });
  } catch (error: any) {
    console.error('Error fetching due flashcards:', error);
    res.status(500).json({ error: 'Failed to fetch due flashcards' });
  }
});

/**
 * POST /api/reviews/:flashcardId
 * Submit a review for a flashcard
 * 
 * Body: { quality: 0-5, timeSpent: number (optional, in seconds) }
 */
router.post('/:flashcardId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { flashcardId } = req.params;
    const { quality, timeSpent } = req.body;

    // Validate quality rating
    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ error: 'Quality must be between 0 and 5' });
    }

    // Fetch current flashcard data
    const { data: flashcard, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', flashcardId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Calculate next review using SM-2 algorithm
    const reviewResult = calculateNextReview(
      quality as ReviewQuality,
      flashcard.repetition || 0,
      flashcard.easiness_factor || 2.5,
      flashcard.interval_days || 1
    );

    // Update flashcard with new SM-2 data
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from('flashcards')
      .update({
        repetition: reviewResult.repetition,
        easiness_factor: reviewResult.easinessFactor,
        interval_days: reviewResult.interval,
        next_review_date: reviewResult.nextReviewDate.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        times_reviewed: (flashcard.times_reviewed || 0) + 1
      })
      .eq('id', flashcardId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record review session for analytics
    const { error: sessionError } = await supabase
      .from('review_sessions')
      .insert({
        user_id: userId,
        flashcard_id: flashcardId,
        quality,
        time_spent_seconds: timeSpent,
        previous_interval: flashcard.interval_days || 1,
        new_interval: reviewResult.interval,
        previous_easiness: flashcard.easiness_factor || 2.5,
        new_easiness: reviewResult.easinessFactor,
        review_date: new Date().toISOString()
      });

    if (sessionError) console.error('Error recording session:', sessionError);

    // Update user statistics
    await updateUserStats(userId, reviewResult.passed);

    res.json({
      flashcard: updatedFlashcard,
      review: reviewResult,
      message: reviewResult.passed 
        ? `Great! Review again in ${reviewResult.interval} day${reviewResult.interval !== 1 ? 's' : ''}`
        : 'Keep practicing! This card will appear again soon.'
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * GET /api/reviews/stats
 * Get user's review statistics
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Fetch user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch all user's flashcards for detailed stats
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId);

    if (flashcardsError) throw flashcardsError;

    const detailedStats = getStudyStats(flashcards || []);

    // Fetch recent review sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSessions, error: sessionsError } = await supabase
      .from('review_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('review_date', thirtyDaysAgo.toISOString())
      .order('review_date', { ascending: false });

    res.json({
      userStats: userStats || {
        total_reviews: 0,
        cards_mastered: 0,
        current_streak_days: 0,
        longest_streak_days: 0,
        total_study_time_seconds: 0
      },
      flashcardStats: detailedStats,
      recentActivity: recentSessions || [],
      message: 'Statistics retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/reviews/history
 * Get review history with optional pagination
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: sessions, error } = await supabase
      .from('review_sessions')
      .select(`
        *,
        flashcards:flashcard_id (
          question,
          answer,
          document_id
        )
      `)
      .eq('user_id', userId)
      .order('review_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      sessions: sessions || [],
      pagination: {
        limit,
        offset,
        total: sessions?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching review history:', error);
    res.status(500).json({ error: 'Failed to fetch review history' });
  }
});

/**
 * Helper function to update user statistics
 */
async function updateUserStats(userId: string, passed: boolean) {
  try {
    // Fetch existing stats
    const { data: stats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const lastReviewDate = stats?.last_review_date;
    
    // Calculate streak
    let currentStreak = stats?.current_streak_days || 0;
    if (lastReviewDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastReviewDate === yesterdayStr) {
        currentStreak += 1; // Continue streak
      } else if (!lastReviewDate || lastReviewDate < yesterdayStr) {
        currentStreak = 1; // Start new streak
      }
    }

    const longestStreak = Math.max(stats?.longest_streak_days || 0, currentStreak);

    if (stats) {
      // Update existing stats
      await supabase
        .from('user_stats')
        .update({
          total_reviews: (stats.total_reviews || 0) + 1,
          cards_mastered: passed ? (stats.cards_mastered || 0) + 1 : stats.cards_mastered,
          current_streak_days: currentStreak,
          longest_streak_days: longestStreak,
          last_review_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new stats
      await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_reviews: 1,
          cards_mastered: passed ? 1 : 0,
          current_streak_days: 1,
          longest_streak_days: 1,
          last_review_date: today
        });
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

export default router;
