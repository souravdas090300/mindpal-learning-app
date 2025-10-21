/**
 * Analytics API Routes
 * 
 * Endpoints for retrieving user study analytics and progress metrics:
 * - Overall statistics (documents, flashcards, reviews)
 * - Study time tracking
 * - Mastery progress
 * - Streak tracking
 * - Activity history
 * 
 * @module routes/analytics
 */

import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, AuthRequest } from "../lib/auth";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/analytics/overview
 * Get overall statistics for the user
 * 
 * @returns {Object} Overview statistics
 */
router.get("/overview", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get total documents
    const { count: documentCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    // Get total flashcards
    const { count: flashcardCount } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    // Get total reviews
    const { count: reviewCount } = await supabase
      .from("review_sessions")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    // Get mastered flashcards (repetition >= 5)
    const { count: masteredCount } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("repetition", 5);

    // Get user stats
    const { data: userStats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    res.json({
      documents: documentCount || 0,
      flashcards: flashcardCount || 0,
      reviews: reviewCount || 0,
      masteredCards: masteredCount || 0,
      totalStudyTime: userStats?.total_study_time || 0,
      currentStreak: userStats?.current_streak || 0,
      longestStreak: userStats?.longest_streak || 0,
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

/**
 * GET /api/analytics/study-time
 * Get study time breakdown by day
 * 
 * @query days - Number of days to look back (default: 30)
 * @returns {Array} Study time per day
 */
router.get("/study-time", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get review sessions grouped by date
    const { data: sessions } = await supabase
      .from("review_sessions")
      .select("reviewed_at, time_spent")
      .eq("userId", userId)
      .gte("reviewed_at", startDate.toISOString())
      .order("reviewed_at", { ascending: true });

    // Group by date
    const studyTimeByDate: Record<string, number> = {};
    
    sessions?.forEach((session) => {
      const date = new Date(session.reviewed_at).toISOString().split("T")[0];
      studyTimeByDate[date] = (studyTimeByDate[date] || 0) + (session.time_spent || 0);
    });

    // Fill in missing dates with 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      result.unshift({
        date: dateStr,
        minutes: Math.round((studyTimeByDate[dateStr] || 0) / 60),
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching study time:", error);
    res.status(500).json({ error: "Failed to fetch study time" });
  }
});

/**
 * GET /api/analytics/mastery-progress
 * Get mastery level distribution of flashcards
 * 
 * @returns {Object} Mastery level counts
 */
router.get("/mastery-progress", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all flashcards with their repetition counts
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("repetition")
      .eq("userId", userId);

    // Categorize by mastery level
    const mastery = {
      new: 0,          // repetition = 0
      learning: 0,     // repetition 1-2
      familiar: 0,     // repetition 3-4
      mastered: 0,     // repetition >= 5
    };

    flashcards?.forEach((card) => {
      const rep = card.repetition || 0;
      if (rep === 0) mastery.new++;
      else if (rep <= 2) mastery.learning++;
      else if (rep <= 4) mastery.familiar++;
      else mastery.mastered++;
    });

    res.json(mastery);
  } catch (error) {
    console.error("Error fetching mastery progress:", error);
    res.status(500).json({ error: "Failed to fetch mastery progress" });
  }
});

/**
 * GET /api/analytics/activity-heatmap
 * Get activity heatmap data for the past year
 * 
 * @returns {Array} Activity data by date
 */
router.get("/activity-heatmap", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    // Get review sessions for the past year
    const { data: sessions } = await supabase
      .from("review_sessions")
      .select("reviewed_at")
      .eq("userId", userId)
      .gte("reviewed_at", startDate.toISOString());

    // Count reviews per day
    const activityByDate: Record<string, number> = {};
    
    sessions?.forEach((session) => {
      const date = new Date(session.reviewed_at).toISOString().split("T")[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching activity heatmap:", error);
    res.status(500).json({ error: "Failed to fetch activity heatmap" });
  }
});

/**
 * GET /api/analytics/performance
 * Get performance metrics (accuracy, speed)
 * 
 * @query days - Number of days to look back (default: 30)
 * @returns {Object} Performance metrics
 */
router.get("/performance", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get recent review sessions
    const { data: sessions } = await supabase
      .from("review_sessions")
      .select("quality, time_spent")
      .eq("userId", userId)
      .gte("reviewed_at", startDate.toISOString());

    if (!sessions || sessions.length === 0) {
      return res.json({
        averageQuality: 0,
        averageTime: 0,
        totalReviews: 0,
        accuracy: 0,
      });
    }

    // Calculate metrics
    const totalQuality = sessions.reduce((sum, s) => sum + (s.quality || 0), 0);
    const totalTime = sessions.reduce((sum, s) => sum + (s.time_spent || 0), 0);
    const correctReviews = sessions.filter((s) => (s.quality || 0) >= 3).length;

    res.json({
      averageQuality: (totalQuality / sessions.length).toFixed(2),
      averageTime: Math.round(totalTime / sessions.length),
      totalReviews: sessions.length,
      accuracy: Math.round((correctReviews / sessions.length) * 100),
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ error: "Failed to fetch performance" });
  }
});

/**
 * GET /api/analytics/streak
 * Get current and historical streak information
 * 
 * @returns {Object} Streak data
 */
router.get("/streak", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get user stats
    const { data: userStats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get recent review dates
    const { data: recentReviews } = await supabase
      .from("review_sessions")
      .select("reviewed_at")
      .eq("userId", userId)
      .order("reviewed_at", { ascending: false })
      .limit(365);

    // Calculate streak
    let currentStreak = 0;
    let lastDate: Date | null = null;

    if (recentReviews && recentReviews.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reviewDates = recentReviews.map(
        (r) => new Date(r.reviewed_at).toISOString().split("T")[0]
      );
      const uniqueDates = [...new Set(reviewDates)].sort().reverse();

      for (const dateStr of uniqueDates) {
        const reviewDate = new Date(dateStr);
        reviewDate.setHours(0, 0, 0, 0);

        if (lastDate === null) {
          // First date - check if it's today or yesterday
          const diffDays = Math.floor(
            (today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 1) {
            currentStreak = 1;
            lastDate = reviewDate;
          } else {
            break;
          }
        } else {
          // Check if consecutive day
          const diffDays = Math.floor(
            (lastDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            currentStreak++;
            lastDate = reviewDate;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      currentStreak,
      longestStreak: userStats?.longest_streak || currentStreak,
      lastReviewDate: recentReviews?.[0]?.reviewed_at || null,
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
});

export default router;
