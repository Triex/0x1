// 0x1 Service Worker
// Generated with 0x1 PWA support

const CACHE_NAME = '0x1-app-cache-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/styles/main.css', 
  '/app.js',
  '/icons/favicon.svg'
];

// Install event - precache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name !== CACHE_NAME;
        }).map((name) => {
          return caches.delete(name);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Stale-while-revalidate strategy
async function fetchResource(request) {
  // Return cached version immediately (if available)
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await caches.match(request);
  
  // Update cache in background
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  // Return cached version or wait for network
  return cachedResponse || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }
  
  // Handle other requests with stale-while-revalidate
  event.respondWith(fetchResource(event.request));
});
