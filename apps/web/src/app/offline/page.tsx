/**
 * Offline Fallback Page
 * 
 * Displayed when the user is offline and tries to access a page
 * that is not cached.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect when back online
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-slate-700">
        {/* Offline Icon */}
        <div className="text-6xl mb-6">
          {isOnline ? '✅' : '📡'}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {isOnline ? 'Back Online!' : 'You\'re Offline'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
          {isOnline
            ? 'Your connection has been restored. Redirecting...'
            : 'It looks like you\'re not connected to the internet. Some features may be unavailable.'}
        </p>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          isOnline
            ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
            : 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700'
        }`}>
          <p className={`font-semibold ${
            isOnline
              ? 'text-green-800 dark:text-green-300'
              : 'text-orange-800 dark:text-orange-300'
          }`}>
            {isOnline ? '🌐 Connected' : '⚠️ No Internet Connection'}
          </p>
        </div>

        {/* Features Available Offline */}
        {!isOnline && (
          <div className="text-left mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Available Offline:
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>View cached documents</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Study flashcards</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>View analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">✗</span>
                <span>Create new documents</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">✗</span>
                <span>AI generation</span>
              </li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              🔄 Try Again
            </button>
          )}
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
          >
            📚 Go to Dashboard
          </button>
        </div>

        {/* Tips */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Tip:</strong> Changes you make offline will be synced automatically when you reconnect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
