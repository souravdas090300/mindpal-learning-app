'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  document_id: string;
  repetition: number;
  easiness_factor: number;
  interval_days: number;
  next_review_date: string;
  times_reviewed: number;
}

interface ReviewStats {
  total: number;
  due: number;
  new: number;
  learning: number;
  mastered: number;
  duePercentage: number;
  masteredPercentage: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchDueCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDueCards = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${apiUrl}/api/reviews/due`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch due cards');

      const data = await response.json();
      setFlashcards(data.flashcards);
      setStats(data.stats);
      setLoading(false);

      if (data.flashcards.length === 0) {
        setReviewComplete(true);
      }
    } catch (error) {
      console.error('Error fetching due cards:', error);
      setLoading(false);
    }
  };

  const submitReview = async (quality: number) => {
    if (reviewing) return;

    setReviewing(true);
    const currentCard = flashcards[currentIndex];
    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/reviews/${currentCard.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quality, timeSpent }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
        setStartTime(new Date());
      } else {
        setReviewComplete(true);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your review session...</p>
        </div>
      </div>
    );
  }

  if (reviewComplete || flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {flashcards.length === 0 ? 'No Cards Due!' : 'Review Complete!'}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {flashcards.length === 0 
                ? 'You\'re all caught up! Come back later for more reviews.'
                : 'Great job! You\'ve completed all your reviews for now.'}
            </p>
            
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Cards</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
                  <div className="text-sm text-gray-600">Mastered</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.learning}</div>
                  <div className="text-sm text-gray-600">Learning</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.new}</div>
                  <div className="text-sm text-gray-600">New</div>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Review Session</h1>
            <span className="text-sm text-gray-600">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Banner */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-6 text-center text-sm">
            <div className="bg-white rounded-lg p-2 shadow">
              <div className="font-bold text-blue-600">{stats.due}</div>
              <div className="text-gray-600 text-xs">Due</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow">
              <div className="font-bold text-green-600">{stats.mastered}</div>
              <div className="text-gray-600 text-xs">Mastered</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow">
              <div className="font-bold text-yellow-600">{stats.learning}</div>
              <div className="text-gray-600 text-xs">Learning</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow">
              <div className="font-bold text-purple-600">{stats.new}</div>
              <div className="text-gray-600 text-xs">New</div>
            </div>
          </div>
        )}

        {/* Flashcard */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-4">
              {currentCard.repetition === 0 ? '🆕 New Card' : `📊 Reviewed ${currentCard.times_reviewed} times`}
            </div>
            
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">Question:</h2>
              <p className="text-2xl font-medium text-gray-800">{currentCard.question}</p>
            </div>

            {showAnswer && (
              <div className="mt-8 pt-8 border-t-2 border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 mb-2">Answer:</h2>
                <p className="text-xl text-gray-700">{currentCard.answer}</p>
              </div>
            )}
          </div>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Show Answer
            </button>
          ) : (
            <div className="mt-8">
              <p className="text-center text-sm text-gray-600 mb-4">How well did you know this?</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <button
                  onClick={() => submitReview(0)}
                  disabled={reviewing}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  0 - No Idea
                </button>
                <button
                  onClick={() => submitReview(1)}
                  disabled={reviewing}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  1 - Wrong
                </button>
                <button
                  onClick={() => submitReview(2)}
                  disabled={reviewing}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  2 - Hard
                </button>
                <button
                  onClick={() => submitReview(3)}
                  disabled={reviewing}
                  className="bg-lime-600 hover:bg-lime-700 text-white py-3 px-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  3 - Good
                </button>
                <button
                  onClick={() => submitReview(4)}
                  disabled={reviewing}
                  className="bg-green-600 hover:bg-green-700 text-white py-3 px-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  4 - Easy
                </button>
                <button
                  onClick={() => submitReview(5)}
                  disabled={reviewing}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  5 - Perfect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
