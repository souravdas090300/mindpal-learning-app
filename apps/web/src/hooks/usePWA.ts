/**
 * usePWA Hook
 * 
 * Custom React hook to detect PWA status and capabilities.
 * 
 * @returns {Object} PWA status and capabilities
 */

import { useState, useEffect } from 'react';

export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  supportsServiceWorker: boolean;
  supportsPushNotifications: boolean;
  supportsBackgroundSync: boolean;
}

export default function usePWA(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: true,
    canInstall: false,
    supportsServiceWorker: false,
    supportsPushNotifications: false,
    supportsBackgroundSync: false,
  });

  useEffect(() => {
    // Check if running as installed PWA
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - standalone is iOS-specific property
      (window.navigator).standalone ||
      document.referrer.includes('android-app://');

    // Check online status
    const isOnline = navigator.onLine;

    // Check service worker support
    const supportsServiceWorker = 'serviceWorker' in navigator;

    // Check push notifications support
    const supportsPushNotifications = 
      'PushManager' in window && 
      'Notification' in window;

    // Check background sync support
    const supportsBackgroundSync = 
      'serviceWorker' in navigator &&
      'sync' in ServiceWorkerRegistration.prototype;

    setStatus({
      isInstalled,
      isOnline,
      canInstall: !isInstalled && supportsServiceWorker,
      supportsServiceWorker,
      supportsPushNotifications,
      supportsBackgroundSync,
    });

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}
