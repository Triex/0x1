/**
 * Service Worker for 0x1 Full App
 * Provides offline support, caching, and background sync
 */

const CACHE_NAME = '0x1-app-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/app.js',
  '/styles/main.css',
  '/public/favicon.svg',
  '/public/manifest.json',
  '/public/icons/icon-192x192.png',
  '/public/icons/icon-512x512.png',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Cache all static assets
      await cache.addAll(ASSETS_TO_CACHE);
      
      // Cache offline page
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      
      // Force waiting service worker to become active
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Get all cache keys
      const cacheKeys = await caches.keys();
      
      // Delete old caches
      await Promise.all(
        cacheKeys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      
      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// Fetch event - network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests differently - network-only with offline queue
  if (event.request.url.includes('/api/')) {
    handleApiRequest(event);
    return;
  }
  
  // For page navigations - use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(event.request);
          
          // Save the response in cache
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          // Network failed, try cache
          const cachedResponse = await caches.match(event.request);
          
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Nothing in cache, return offline page
          return await caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }
  
  // For static assets - use cache-first strategy
  event.respondWith(
    (async () => {
      // Try cache first
      const cachedResponse = await caches.match(event.request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Not in cache, try network
      try {
        const networkResponse = await fetch(event.request);
        
        // Save successful responses in cache
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed and not in cache, return default offline asset
        // if it's an image, font, or stylesheet
        if (
          event.request.destination === 'image' ||
          event.request.destination === 'font' ||
          event.request.destination === 'style'
        ) {
          return new Response('', { status: 408, statusText: 'Resource not available offline' });
        }
        
        throw error;
      }
    })()
  );
});

// Function to handle API requests
function handleApiRequest(event) {
  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request.clone());
      } catch (error) {
        // Network failed, queue request for later if it's a POST
        if (event.request.method === 'POST') {
          await queueRequest(event.request.clone());
          
          // Return a "queued for later" response
          return new Response(JSON.stringify({ 
            success: false, 
            queued: true, 
            message: 'Request queued for background sync' 
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          });
        }
        
        // For non-POST requests, return error response
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'You are offline and this resource is not available offline'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      }
    })()
  );
}

// Queue a request for later sync
async function queueRequest(request) {
  // Extract request data
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  // Open the database
  const db = await openDB();
  
  // Add to request queue
  const tx = db.transaction('requestQueue', 'readwrite');
  await tx.objectStore('requestQueue').add(requestData);
  await tx.complete;
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open('0x1OfflineDB', 1);
    
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requestQueue')) {
        db.createObjectStore('requestQueue', { autoIncrement: true });
      }
    };
    
    openRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    openRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Background sync event handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms' || event.tag === 'sync-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Process queued requests
async function syncQueuedRequests() {
  const db = await openDB();
  const tx = db.transaction('requestQueue', 'readwrite');
  const store = tx.objectStore('requestQueue');
  const requests = await store.getAll();
  
  // Process each request
  for (const requestData of requests) {
    try {
      // Rebuild request
      const request = new Request(requestData.url, {
        method: requestData.method,
        headers: new Headers(requestData.headers),
        body: requestData.body,
        mode: 'same-origin'
      });
      
      // Try to send the request
      await fetch(request);
      
      // If successful, remove from queue
      await store.delete(requestData.id);
    } catch (error) {
      // If still offline, keep in queue
      console.error('Background sync failed:', error);
      // Will retry on next sync event
    }
  }
  
  await tx.complete;
}

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New update',
      icon: data.icon || '/public/icons/icon-192x192.png',
      badge: data.badge || '/public/icons/badge-96x96.png',
      vibrate: data.vibrate || [100, 50, 100],
      data: {
        url: data.url || '/',
        ...data.data
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '0x1 App', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    (async () => {
      const url = event.notification.data?.url || '/';
      const windowClients = await self.clients.matchAll({ type: 'window' });
      
      // Check if there is already a window open
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});
