const CACHE_NAME = 'kaghan-properties-v2';
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
      console.log('[Service Worker v2] Pre-caching static assets');
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

// Activate Event - Clean up all stale caches (v1, etc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Network-First for HTML navigation
self.addEventListener('fetch', (event) => {
  // 1. Bypass caching entirely for non-GET calls
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. Bypass Firestore, analytics, functions, and APIs
  if (url.origin.includes('firestore.googleapis.com') || 
      url.origin.includes('google-analytics.com') || 
      url.origin.includes('tiny.cloud') ||
      url.pathname.includes('/.netlify/functions/')) {
    return;
  }

  const isHtmlNavigation = event.request.headers.get('accept') && 
                           event.request.headers.get('accept').includes('text/html');

  // 3. Network-First Strategy for HTML documents (always get freshest content, fallback to cache)
  if (isHtmlNavigation || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request).then(cached => cached || caches.match('/index.html'));
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate for other static assets (CSS, JS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
