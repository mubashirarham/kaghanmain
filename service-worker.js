const CACHE_NAME = 'kaghan-properties-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/projects.html',
  '/property.html',
  '/project-detail.html',
  '/about.html',
  '/assets/css/style.css',
  '/assets/js/db.js',
  '/assets/js/shared.js',
  '/assets/js/plot-map.js',
  '/assets/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => cache.add(asset).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only handle same-origin static assets; never intercept Firebase, Auth, Admin, Cloudinary, Map Tiles, or Video streams
  if (url.origin !== self.location.origin ||
      url.pathname.startsWith('/admin') ||
      url.pathname.includes('/.netlify/functions/') ||
      url.pathname.endsWith('.mp4') ||
      event.request.headers.has('range')) {
    return;
  }

  const isHtmlOrScript = (event.request.headers.get('accept') || '').includes('text/html') ||
                         url.pathname.endsWith('.html') ||
                         url.pathname.endsWith('.js') ||
                         url.pathname === '/';

  // Network-First for HTML & JS so updates appear immediately without stale cache issues
  if (isHtmlOrScript) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, resClone))
            .catch(() => {});
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request).then(cached => cached || caches.match('/index.html'));
      })
    );
    return;
  }

  // Stale-While-Revalidate for images & CSS with safe error catching
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, resClone))
            .catch(() => {});
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
