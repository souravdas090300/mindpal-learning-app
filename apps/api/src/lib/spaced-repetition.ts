/**
 * Spaced Repetition Algorithm (SM-2)
 * 
 * This module implements the SuperMemo SM-2 algorithm for optimizing flashcard review scheduling.
 * The algorithm calculates when a flashcard should be reviewed next based on the user's performance.
 * 
 * @see https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
 */

/**
 * Review quality rating (0-5)
 * - 0: Complete blackout (didn't remember at all)
 * - 1: Incorrect response, but correct answer seemed familiar
 * - 2: Incorrect response, but correct answer was easy to recall
 * - 3: Correct response, but required significant difficulty
 * - 4: Correct response, with some hesitation
 * - 5: Perfect response (immediate recall)
 */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Review result containing all SM-2 calculation data
 */
export interface ReviewResult {
  /** Current repetition count */
  repetition: number;
  /** Current easiness factor (2.5 is default) */
  easinessFactor: number;
  /** Interval in days until next review */
  interval: number;
  /** Next review date */
  nextReviewDate: Date;
  /** Whether the card was answered correctly (quality >= 3) */
  passed: boolean;
}

/**
 * Calculate next review using SM-2 algorithm
 * 
 * @param quality - User's response quality (0-5)
 * @param repetition - Current repetition count
 * @param easinessFactor - Current easiness factor (default: 2.5)
 * @param interval - Current interval in days (default: 1)
 * @returns ReviewResult with next review calculations
 * 
 * @example
 * ```typescript
 * // First review, perfect response
 * const result = calculateNextReview(5, 0, 2.5, 1);
 * // Result: { repetition: 1, easinessFactor: 2.6, interval: 1, nextReviewDate: tomorrow, passed: true }
 * 
 * // Second review, some hesitation
 * const result2 = calculateNextReview(4, 1, 2.6, 1);
 * // Result: { repetition: 2, easinessFactor: 2.5, interval: 6, nextReviewDate: 6 days from now, passed: true }
 * ```
 */
export function calculateNextReview(
  quality: ReviewQuality,
  repetition: number = 0,
  easinessFactor: number = 2.5,
  interval: number = 1
): ReviewResult {
  // SM-2 Algorithm Implementation
  
  // Step 1: Calculate new easiness factor
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEasinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Minimum easiness factor is 1.3
  if (newEasinessFactor < 1.3) {
    newEasinessFactor = 1.3;
  }

  let newRepetition: number;
  let newInterval: number;

  // Step 2: Determine if the response was correct (quality >= 3)
  const passed = quality >= 3;

  if (!passed) {
    // Failed: Reset repetition and interval
    newRepetition = 0;
    newInterval = 1;
  } else {
    // Passed: Calculate next interval based on repetition
    newRepetition = repetition + 1;

    if (newRepetition === 1) {
      // First successful review: repeat in 1 day
      newInterval = 1;
    } else if (newRepetition === 2) {
      // Second successful review: repeat in 6 days
      newInterval = 6;
    } else {
      // Subsequent reviews: multiply previous interval by easiness factor
      newInterval = Math.round(interval * newEasinessFactor);
    }
  }

  // Step 3: Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    repetition: newRepetition,
    easinessFactor: newEasinessFactor,
    interval: newInterval,
    nextReviewDate,
    passed
  };
}

/**
 * Get flashcards due for review
 * 
 * @param flashcards - Array of flashcards with review data
 * @param currentDate - Current date (defaults to now)
 * @returns Array of flashcards that are due for review
 * 
 * @example
 * ```typescript
 * const dueCards = getDueFlashcards(allCards);
 * console.log(`${dueCards.length} cards due for review today`);
 * ```
 */
export function getDueFlashcards<T extends { next_review_date?: Date | string | null }>(
  flashcards: T[],
  currentDate: Date = new Date()
): T[] {
  return flashcards.filter(card => {
    if (!card.next_review_date) {
      // Cards without review date are considered new and due
      return true;
    }

    const reviewDate = typeof card.next_review_date === 'string'
      ? new Date(card.next_review_date)
      : card.next_review_date;

    return reviewDate <= currentDate;
  });
}

/**
 * Calculate study statistics
 * 
 * @param flashcards - Array of flashcards with review data
 * @returns Study statistics including counts and percentages
 */
export function getStudyStats(flashcards: Array<{
  repetition?: number;
  next_review_date?: Date | string | null;
}>) {
  const total = flashcards.length;
  const dueCards = getDueFlashcards(flashcards);
  const newCards = flashcards.filter(card => !card.repetition || card.repetition === 0);
  const learningCards = flashcards.filter(card => card.repetition && card.repetition > 0 && card.repetition < 3);
  const masteredCards = flashcards.filter(card => card.repetition && card.repetition >= 3);

  return {
    total,
    due: dueCards.length,
    new: newCards.length,
    learning: learningCards.length,
    mastered: masteredCards.length,
    duePercentage: total > 0 ? Math.round((dueCards.length / total) * 100) : 0,
    masteredPercentage: total > 0 ? Math.round((masteredCards.length / total) * 100) : 0
  };
}
