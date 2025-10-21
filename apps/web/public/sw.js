/**
 * MindPal Service Worker
 * 
 * Provides offline functionality for the PWA:
 * - Caches static assets (HTML, CSS, JS, images)
 * - Caches API responses
 * - Background sync for offline actions
 * - Push notifications support
 * 
 * Cache Strategy:
 * - Static assets: Cache First
 * - API calls: Network First with cache fallback
 * - Images: Cache First with network fallback
 */

const CACHE_NAME = 'mindpal-v1';
const API_CACHE_NAME = 'mindpal-api-v1';
const STATIC_CACHE_NAME = 'mindpal-static-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/analytics',
  '/shared',
  '/login',
  '/signup',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/**
 * Install Event
 * Triggered when the service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

/**
 * Activate Event
 * Triggered when the service worker becomes active
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== API_CACHE_NAME &&
            cacheName !== STATIC_CACHE_NAME
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  return self.clients.claim();
});

/**
 * Fetch Event
 * Intercept all network requests and apply caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.href.includes('localhost:3001')) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API Requests
 * Strategy: Network First, Cache Fallback
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone the response before caching
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for GET requests
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'You are currently offline. Some features may be unavailable.' 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For POST/PUT/DELETE, queue for background sync
    if (request.method !== 'GET') {
      await queueRequest(request);
      return new Response(
        JSON.stringify({ 
          queued: true, 
          message: 'Request queued for when you are back online' 
        }),
        {
          status: 202,
          statusText: 'Accepted',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

/**
 * Handle Static Asset Requests
 * Strategy: Cache First, Network Fallback
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache the response for next time
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Both cache and network failed:', request.url);
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await cache.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

/**
 * Queue Request for Background Sync
 * Store failed requests in IndexedDB for later sync
 */
async function queueRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: await request.clone().text(),
    timestamp: Date.now(),
  };
  
  // Store in IndexedDB (simplified implementation)
  const db = await openDatabase();
  const tx = db.transaction('requests', 'readwrite');
  const store = tx.objectStore('requests');
  await store.add(requestData);
  
  console.log('[Service Worker] Request queued:', request.url);
}

/**
 * Open IndexedDB for storing queued requests
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mindpal-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'timestamp' });
      }
    };
  });
}

/**
 * Background Sync Event
 * Triggered when the device comes back online
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

/**
 * Sync Queued Requests
 * Replay all queued requests when back online
 */
async function syncQueuedRequests() {
  const db = await openDatabase();
  const tx = db.transaction('requests', 'readonly');
  const store = tx.objectStore('requests');
  const requests = await store.getAll();
  
  console.log('[Service Worker] Syncing', requests.length, 'queued requests');
  
  for (const requestData of requests) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: new Headers(requestData.headers),
        body: requestData.body,
      });
      
      if (response.ok) {
        // Remove from queue after successful sync
        const deleteTx = db.transaction('requests', 'readwrite');
        const deleteStore = deleteTx.objectStore('requests');
        await deleteStore.delete(requestData.timestamp);
        
        console.log('[Service Worker] Synced request:', requestData.url);
      }
    } catch (error) {
      console.error('[Service Worker] Failed to sync request:', error);
    }
  }
}

/**
 * Push Notification Event
 * Handle incoming push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data?.json() || {};
  const title = data.title || 'MindPal';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click Event
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message Event
 * Handle messages from the client
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      cache.addAll(urls);
    });
  }
});

console.log('[Service Worker] Script loaded');
