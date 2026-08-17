// Service Worker for Cyber Security Finland website
const CACHE_NAME = 'cybersec-v2.0';
const urlsToCache = [
  '/Cyber Security Finland.jpg'
];

// Install event - cache essential static resources, then take over immediately
// (skipWaiting means an updated worker doesn't wait for old tabs to close)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - network-first for page navigations (so deploys are never masked
// by a stale cache), cache-first for static assets (images/fonts/etc.)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Navigations (actual page loads) must always prefer fresh network content.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache-first, but refresh the cache entry in the background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// Activate event - clean up old caches and take control of open tabs immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for message events from the main thread
self.addEventListener('message', (event) => {
  // Handle messages sent from the main thread
  if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
    console.log('Received performance metrics:', event.data.metrics);
    // Could send to analytics endpoint
  }
});