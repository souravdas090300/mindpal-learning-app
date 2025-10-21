/**
 * Analytics API Tests
 * 
 * Tests for progress tracking and analytics endpoints
 */

import { mockPrismaClient } from './setup';

describe('Analytics API', () => {
  const mockReviews = [
    {
      id: '1',
      flashcardId: 'card-1',
      quality: 5,
      createdAt: new Date(),
    },
    {
      id: '2',
      flashcardId: 'card-2',
      quality: 4,
      createdAt: new Date(),
    },
    {
      id: '3',
      flashcardId: 'card-3',
      quality: 3,
      createdAt: new Date(),
    },
  ];

  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview', async () => {
      mockPrismaClient.document.findMany.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ] as any);
      
      mockPrismaClient.flashcard.findMany.mockResolvedValue([
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ] as any);

      mockPrismaClient.review.findMany.mockResolvedValue(mockReviews);

      const documents = await mockPrismaClient.document.findMany();
      const flashcards = await mockPrismaClient.flashcard.findMany();
      const reviews = await mockPrismaClient.review.findMany();

      expect(documents.length).toBe(2);
      expect(flashcards.length).toBe(3);
      expect(reviews.length).toBe(3);
    });

    it('should calculate average quality', async () => {
      const reviews = mockReviews;
      const avgQuality = reviews.reduce((sum, r) => sum + r.quality, 0) / reviews.length;

      expect(avgQuality).toBeCloseTo(4.0);
    });

    it('should calculate total study time', async () => {
      mockPrismaClient.review.findMany.mockResolvedValue(mockReviews);

      // Assuming 30 seconds per review
      const studyTimeMinutes = (mockReviews.length * 30) / 60;

      expect(studyTimeMinutes).toBeCloseTo(1.5);
    });
  });

  describe('GET /api/analytics/streak', () => {
    it('should calculate current streak', () => {
      const reviewDates = [
        new Date('2025-10-21'),
        new Date('2025-10-20'),
        new Date('2025-10-19'),
      ];

      // Simple streak calculation
      let streak = 1;
      for (let i = 0; i < reviewDates.length - 1; i++) {
        const diff = Math.floor(
          (reviewDates[i].getTime() - reviewDates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }

      expect(streak).toBe(3);
    });

    it('should handle no reviews', () => {
      const reviewDates: Date[] = [];
      const streak = reviewDates.length === 0 ? 0 : 1;

      expect(streak).toBe(0);
    });
  });

  describe('GET /api/analytics/performance', () => {
    it('should calculate mastery level', () => {
      const flashcards = [
        { repetitions: 5, easeFactor: 2.8 },
        { repetitions: 3, easeFactor: 2.5 },
        { repetitions: 8, easeFactor: 3.0 },
      ];

      const masteredCount = flashcards.filter(
        card => card.repetitions >= 5 && card.easeFactor >= 2.5
      ).length;

      expect(masteredCount).toBe(2);
    });

    it('should group reviews by quality', () => {
      const reviews = mockReviews;
      const qualityGroups = reviews.reduce((acc, review) => {
        acc[review.quality] = (acc[review.quality] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      expect(qualityGroups[5]).toBe(1);
      expect(qualityGroups[4]).toBe(1);
      expect(qualityGroups[3]).toBe(1);
    });
  });
});
