/**
 * Public Share Link Page
 * 
 * Allows anyone with the link to view a shared document.
 * No authentication required.
 * 
 * @page /shared/[token]
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface SharedDocument {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  userId: string;
  createdAt: string;
  flashcards?: Flashcard[];
}

export default function PublicSharePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [permission, setPermission] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFlashcard, setShowFlashcard] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.accessDocumentByToken(params.token);
      setDocument(data.document);
      setPermission(data.permission);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to load document');
      } else {
        setError('Failed to load document');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {error === 'Share link not found or expired' ? 'Link Expired' : 'Access Denied'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This link may have expired or been deactivated.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {document.title}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    permission === 'view'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {permission === 'view' ? '👁️ View Only' : '✏️ Can Edit'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                📅 Created {formatDate(document.createdAt)}
              </p>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/30">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              🔗 <strong>Shared Link:</strong> This document has been shared with you via a public link.
            </p>
          </div>
        </div>

        {/* Summary Section */}
        {document.summary && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ✨ AI Summary
            </h2>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {document.summary}
            </p>
          </div>
        )}

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            📄 Content
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {document.content}
            </p>
          </div>
        </div>

        {/* Flashcards Section */}
        {document.flashcards && document.flashcards.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              🎴 Flashcards ({document.flashcards.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {document.flashcards.map((card, index) => (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700/30 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    if (showFlashcard === index) {
                      setShowFlashcard(null);
                      setShowAnswer(false);
                    } else {
                      setShowFlashcard(index);
                      setShowAnswer(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      Card {index + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showFlashcard === index) {
                          setShowAnswer(!showAnswer);
                        } else {
                          setShowFlashcard(index);
                          setShowAnswer(true);
                        }
                      }}
                      className="text-xs bg-purple-200 dark:bg-purple-700/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full hover:bg-purple-300 dark:hover:bg-purple-700/50 transition-colors"
                    >
                      {showFlashcard === index && showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white mb-2">
                      Q: {card.question}
                    </p>
                    {showFlashcard === index && showAnswer && (
                      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700/30">
                        <p className="text-gray-700 dark:text-gray-300">
                          A: {card.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Want to create your own?</h3>
          <p className="mb-4 text-blue-100">
            Sign up for MindPal to create AI-powered documents and flashcards!
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="bg-white text-purple-600 py-3 px-8 rounded-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  );
}
