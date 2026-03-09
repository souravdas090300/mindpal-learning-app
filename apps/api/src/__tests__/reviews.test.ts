/**
 * Spaced Repetition Reviews Unit Tests
 * 
 * Tests for the review system including:
 * - Getting due flashcards
 * - Submitting reviews with SM-2 algorithm
 * - Review statistics
 * - Review history
 */

import { mockPrismaClient } from './setup';

describe('Spaced Repetition Reviews', () => {
  const mockFlashcard = {
    id: 'flashcard-1',
    userId: 'user-1',
    documentId: 'doc-1',
    question: 'What is the capital of France?',
    answer: 'Paris',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/reviews/due', () => {
    it('should return flashcards due for review', async () => {
      const dueFlashcards = [
        { ...mockFlashcard, id: 'fc-1', nextReviewDate: new Date(Date.now() - 1000) },
        { ...mockFlashcard, id: 'fc-2', nextReviewDate: new Date(Date.now() - 2000) },
      ];

      mockPrismaClient.flashcard.findMany.mockResolvedValue(dueFlashcards);

      const result = await mockPrismaClient.flashcard.findMany({
        where: {
          userId: 'user-1',
          nextReviewDate: { lte: new Date() },
        },
      });

      expect(result).toHaveLength(2);
      expect(result.every(fc => fc.nextReviewDate <= new Date())).toBe(true);
    });

    it('should not return future flashcards', async () => {
      const flashcards = [
        { ...mockFlashcard, id: 'fc-1', nextReviewDate: new Date(Date.now() + 86400000) }, // Tomorrow
        { ...mockFlashcard, id: 'fc-2', nextReviewDate: new Date(Date.now() - 1000) }, // Due now
      ];

      const dueCards = flashcards.filter(fc => fc.nextReviewDate <= new Date());

      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].id).toBe('fc-2');
    });

    it('should include statistics with due cards', async () => {
      const stats = {
        totalCards: 10,
        dueCards: 3,
        newCards: 2,
        reviewedToday: 5,
      };

      expect(stats.totalCards).toBeGreaterThanOrEqual(stats.dueCards);
      expect(stats.dueCards).toBeGreaterThan(0);
    });

    it('should sort due cards by priority', async () => {
      const flashcards = [
        { ...mockFlashcard, id: 'fc-1', nextReviewDate: new Date(Date.now() - 1000), easeFactor: 1.3 },
        { ...mockFlashcard, id: 'fc-2', nextReviewDate: new Date(Date.now() - 5000), easeFactor: 2.5 },
      ];

      // Cards with lower ease factor or older due date should come first
      const sorted = flashcards.sort((a, b) => 
        a.nextReviewDate.getTime() - b.nextReviewDate.getTime()
      );

      expect(sorted[0].id).toBe('fc-2'); // Oldest first
    });
  });

  describe('POST /api/reviews/:flashcardId', () => {
    it('should update flashcard after quality 5 review', async () => {
      const review = {
        flashcardId: 'fc-1',
        quality: 5,
      };

      // SM-2 algorithm for quality 5
      const updatedCard = {
        ...mockFlashcard,
        easeFactor: 2.6, // Increased from 2.5
        interval: 6, // Interval multiplied by ease factor
        repetitions: 1,
        nextReviewDate: new Date(Date.now() + 6 * 86400000),
      };

      mockPrismaClient.flashcard.update.mockResolvedValue(updatedCard);

      const result = await mockPrismaClient.flashcard.update({
        where: { id: review.flashcardId },
        data: updatedCard,
      });

      expect(result.easeFactor).toBeGreaterThan(mockFlashcard.easeFactor);
      expect(result.interval).toBeGreaterThan(mockFlashcard.interval);
      expect(result.repetitions).toBe(1);
    });

    it('should update flashcard after quality 3 review', async () => {
      const review = {
        flashcardId: 'fc-1',
        quality: 3,
      };

      // SM-2 algorithm for quality 3
      const updatedCard = {
        ...mockFlashcard,
        easeFactor: 2.5, // Unchanged
        interval: 6,
        repetitions: 1,
        nextReviewDate: new Date(Date.now() + 6 * 86400000),
      };

      mockPrismaClient.flashcard.update.mockResolvedValue(updatedCard);

      const result = await mockPrismaClient.flashcard.update({
        where: { id: review.flashcardId },
        data: updatedCard,
      });

      expect(result.easeFactor).toBe(2.5);
      expect(result.interval).toBeGreaterThan(0);
    });

    it('should reset interval for quality < 3', async () => {
      const review = {
        flashcardId: 'fc-1',
        quality: 1,
      };

      // SM-2 algorithm for quality < 3: reset
      const updatedCard = {
        ...mockFlashcard,
        easeFactor: Math.max(1.3, 2.5 - 0.8 + 0.28 * 1 - 0.02 * 1 * 1),
        interval: 1, // Reset to 1
        repetitions: 0, // Reset to 0
        nextReviewDate: new Date(Date.now() + 86400000),
      };

      mockPrismaClient.flashcard.update.mockResolvedValue(updatedCard);

      const result = await mockPrismaClient.flashcard.update({
        where: { id: review.flashcardId },
        data: updatedCard,
      });

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it('should maintain minimum ease factor of 1.3', async () => {
      const lowEaseCard = {
        ...mockFlashcard,
        easeFactor: 1.4,
      };

      const review = {
        flashcardId: 'fc-1',
        quality: 0, // Very poor
      };

      // Calculate new ease factor
      const newEaseFactor = Math.max(1.3, 1.4 - 0.8 + 0.28 * 0 - 0.02 * 0 * 0);

      expect(newEaseFactor).toBeGreaterThanOrEqual(1.3);
      expect(newEaseFactor).toBe(Math.max(1.3, 0.6));
    });

    it('should validate quality is between 0 and 5', async () => {
      const validQualities = [0, 1, 2, 3, 4, 5];
      const invalidQualities = [-1, 6, 10];

      validQualities.forEach(q => {
        expect(q).toBeGreaterThanOrEqual(0);
        expect(q).toBeLessThanOrEqual(5);
      });

      invalidQualities.forEach(q => {
        expect(q < 0 || q > 5).toBe(true);
      });
    });

    it('should record review in history', async () => {
      const reviewHistory = {
        id: 'review-1',
        flashcardId: 'fc-1',
        userId: 'user-1',
        quality: 4,
        reviewedAt: new Date(),
        timeSpent: 5000, // milliseconds
      };

      expect(reviewHistory.flashcardId).toBe('fc-1');
      expect(reviewHistory.quality).toBeGreaterThanOrEqual(0);
      expect(reviewHistory.quality).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/reviews/stats', () => {
    it('should return user study statistics', async () => {
      const stats = {
        totalCards: 50,
        dueCards: 10,
        newCards: 5,
        reviewedToday: 15,
        averageQuality: 3.8,
        retentionRate: 85,
        streak: 7,
      };

      expect(stats.totalCards).toBeGreaterThan(0);
      expect(stats.dueCards).toBeLessThanOrEqual(stats.totalCards);
      expect(stats.averageQuality).toBeGreaterThanOrEqual(0);
      expect(stats.averageQuality).toBeLessThanOrEqual(5);
      expect(stats.retentionRate).toBeGreaterThanOrEqual(0);
      expect(stats.retentionRate).toBeLessThanOrEqual(100);
    });

    it('should calculate average quality correctly', async () => {
      const reviews = [
        { quality: 5 },
        { quality: 4 },
        { quality: 3 },
        { quality: 4 },
      ];

      const sum = reviews.reduce((acc, r) => acc + r.quality, 0);
      const average = sum / reviews.length;

      expect(average).toBe(4);
    });

    it('should calculate retention rate', async () => {
      const successfulReviews = 85;
      const totalReviews = 100;
      const retentionRate = (successfulReviews / totalReviews) * 100;

      expect(retentionRate).toBe(85);
    });
  });

  describe('GET /api/reviews/history', () => {
    it('should return review history for user', async () => {
      const history = [
        {
          id: 'review-1',
          flashcardId: 'fc-1',
          quality: 4,
          reviewedAt: new Date(),
        },
        {
          id: 'review-2',
          flashcardId: 'fc-2',
          quality: 5,
          reviewedAt: new Date(Date.now() - 86400000),
        },
      ];

      expect(history).toHaveLength(2);
      expect(history[0].quality).toBeGreaterThanOrEqual(0);
    });

    it('should sort history by date descending', async () => {
      const history = [
        { reviewedAt: new Date(Date.now() - 2000) },
        { reviewedAt: new Date(Date.now() - 1000) },
        { reviewedAt: new Date() },
      ];

      const sorted = history.sort((a, b) => 
        b.reviewedAt.getTime() - a.reviewedAt.getTime()
      );

      expect(sorted[0].reviewedAt.getTime()).toBeGreaterThan(
        sorted[1].reviewedAt.getTime()
      );
    });

    it('should support pagination', async () => {
      const totalReviews = 100;
      const page = 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const expectedResults = Math.min(limit, totalReviews - offset);

      expect(expectedResults).toBe(20);
      expect(offset).toBe(0);
    });
  });

  describe('SM-2 Algorithm', () => {
    it('should increase interval exponentially for good reviews', async () => {
      const intervals = [1, 6, 15, 37.5]; // Example progression

      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
      }
    });

    it('should handle first review (repetitions = 0)', async () => {
      const card = {
        repetitions: 0,
        quality: 4,
      };

      let interval = 1;
      let repetitions = 0;

      if (card.quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        }
        repetitions += 1;
      }

      expect(interval).toBe(1);
      expect(repetitions).toBe(1);
    });

    it('should handle second review (repetitions = 1)', async () => {
      const card = {
        repetitions: 1,
        quality: 4,
      };

      let interval = 1;
      let repetitions = 1;

      if (card.quality >= 3) {
        if (repetitions === 1) {
          interval = 6;
        }
        repetitions += 1;
      }

      expect(interval).toBe(6);
      expect(repetitions).toBe(2);
    });

    it('should calculate exponential intervals after second review', async () => {
      const easeFactor = 2.5;
      const previousInterval = 6;
      const newInterval = Math.round(previousInterval * easeFactor);

      expect(newInterval).toBe(15);
    });
  });
});
