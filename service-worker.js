const CACHE_NAME = 'kaghan-properties-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/about.html',
  '/services.html',
  '/projects.html',
  '/blog.html',
  '/contact.html',
  '/login.html',
  '/assets/css/style.css',
  '/assets/js/db.js',
  '/assets/js/users.js',
  '/assets/js/script.js',
  '/assets/images/logo.png'
];

// Install Event - Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      // Use cache.addAll with dynamic catches to prevent single-failure blocking
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] Failed to cache: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale cache keys
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event with Cache Isolation
self.addEventListener('fetch', (event) => {
  // 1. Bypass caching entirely for non-GET calls
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. Bypass Google Firestore API endpoints, Netlify functions, and external analytics tracking
  if (url.origin.includes('firestore.googleapis.com') || 
      url.origin.includes('google-analytics.com') || 
      url.pathname.includes('/.netlify/functions/')) {
    return;
  }

  // 3. Cache-First Strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new local GET requests
        if (networkResponse.status === 200 && url.origin === self.location.origin) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Safe fallback for navigation requests
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
