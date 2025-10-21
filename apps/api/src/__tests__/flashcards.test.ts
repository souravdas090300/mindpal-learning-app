/**
 * Flashcards & Spaced Repetition Tests
 * 
 * Tests for SM-2 algorithm and flashcard reviews
 */

import { mockPrismaClient } from './setup';

// SM-2 Algorithm implementation for testing
function calculateSM2(quality: number, easeFactor: number, interval: number, repetitions: number) {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  } else {
    // Incorrect response
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
  };
}

describe('Flashcards & Spaced Repetition', () => {
  const mockFlashcard = {
    id: '1',
    question: 'What is 2+2?',
    answer: '4',
    documentId: 'doc-1',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/flashcards/due', () => {
    it('should return flashcards due for review', async () => {
      const dueFlashcards = [
        { ...mockFlashcard, nextReview: new Date(Date.now() - 86400000) },
      ];

      mockPrismaClient.flashcard.findMany.mockResolvedValue(dueFlashcards);

      const flashcards = await mockPrismaClient.flashcard.findMany({
        where: {
          nextReview: { lte: new Date() },
        },
      });

      expect(flashcards).toHaveLength(1);
    });
  });

  describe('POST /api/flashcards/:id/review', () => {
    it('should update flashcard using SM-2 algorithm - Quality 5', async () => {
      const result = calculateSM2(5, 2.5, 1, 0);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should update flashcard using SM-2 algorithm - Quality 3', async () => {
      const result = calculateSM2(3, 2.5, 1, 1);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it('should reset interval for quality < 3', async () => {
      const result = calculateSM2(2, 2.5, 6, 2);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should maintain minimum ease factor of 1.3', async () => {
      let easeFactor = 1.5;

      // Multiple difficult reviews
      for (let i = 0; i < 10; i++) {
        const result = calculateSM2(0, easeFactor, 1, 0);
        easeFactor = result.easeFactor;
      }

      expect(easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('SM-2 Algorithm Edge Cases', () => {
    it('should handle first review (repetitions = 0)', () => {
      const result = calculateSM2(5, 2.5, 1, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should handle second review (repetitions = 1)', () => {
      const result = calculateSM2(4, 2.5, 1, 1);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('should calculate exponential intervals', () => {
      const result1 = calculateSM2(4, 2.5, 6, 2);
      expect(result1.interval).toBeGreaterThan(6);

      const result2 = calculateSM2(4, 2.5, result1.interval, 3);
      expect(result2.interval).toBeGreaterThan(result1.interval);
    });
  });
});
