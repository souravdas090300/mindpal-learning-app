/**
 * PWA Manager Component
 * 
 * Handles Progressive Web App functionality:
 * - Service worker registration
 * - Update detection and notification
 * - Online/offline status
 * - Background sync
 * - Push notifications setup
 * 
 * @component
 */

'use client';

import { useEffect, useState } from 'react';

export default function PWAManager() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Monitor online/offline status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      console.log('[PWA] Back online');
      
      // Trigger background sync
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          // @ts-expect-error - Background Sync API not in TypeScript types yet
          return registration.sync.register('sync-requests');
        }).catch((error) => {
          console.error('[PWA] Background sync failed:', error);
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      console.log('[PWA] Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[PWA] New version available');
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        }
      });

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new version
      window.location.reload();
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Update Available Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-blue-500 p-4 max-w-md">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔄</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                  Update Available
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  A new version of MindPal is available. Update now for the latest features and improvements.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-sm"
                  >
                    Update Now
                  </button>
                  <button
                    onClick={dismissUpdate}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors text-sm"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Notification Toast */}
      {showOfflineToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-orange-500 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 max-w-md">
            <span className="text-2xl">📡</span>
            <div className="flex-1">
              <p className="font-semibold">You&apos;re Offline</p>
              <p className="text-sm text-orange-100">
                Some features may be unavailable. Changes will sync when you&apos;re back online.
              </p>
            </div>
            <button
              onClick={() => setShowOfflineToast(false)}
              className="text-white/80 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Online Status Indicator (only show when coming back online) */}
      {isOnline && showOfflineToast === false && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-out">
          <div className="bg-green-500 text-white rounded-lg shadow-2xl p-3 flex items-center gap-2">
            <span className="text-xl">✅</span>
            <p className="font-semibold text-sm">Back Online</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          90% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out;
        }
      `}</style>
    </>
  );
}
