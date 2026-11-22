// Kaghan Properties — Multi-Tier Browser Cache Service Worker (v7)
// Cache-First for immutable images, Stale-While-Revalidate for CSS/JS,
// Network-First with fast fallback for Netlify SSR HTML responses.

const STATIC_CACHE = 'kaghan-static-v9';
const HTML_CACHE = 'kaghan-html-v9';
const IMAGE_CACHE = 'kaghan-images-v9';
const VALID_CACHES = new Set([STATIC_CACHE, HTML_CACHE, IMAGE_CACHE]);

const PRECACHE_ASSETS = [
  '/assets/css/style.css',
  '/assets/js/db.js',
  '/assets/js/shared.js',
  '/assets/js/plot-map.js',
  '/assets/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (!VALID_CACHES.has(k) ? caches.delete(k) : Promise.resolve()))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept cross-origin APIs (Firebase, Cloudinary, Map tiles), Admin, Functions, or Range/Video streams
  if (url.origin !== self.location.origin ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/.netlify/') ||
      url.pathname.endsWith('.mp4') ||
      url.pathname.endsWith('.pdf') ||
      event.request.headers.has('range')) {
    return;
  }

  // 1. Cache-First for images & icons (instant 0ms repeat loads)
  if (url.pathname.startsWith('/assets/images/') || /\.(png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(event.request, res.clone()).catch(() => {});
            }
            return res;
          });
        })
      )
    );
    return;
  }

  // 2. Stale-While-Revalidate for CSS & JS assets (instant load + silent background update)
  if (url.pathname.startsWith('/assets/css/') || url.pathname.startsWith('/assets/js/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request).then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(event.request, res.clone()).catch(() => {});
            }
            return res;
          }).catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // 3. Network-First (backed by Netlify Edge Durable SSR Cache) with instant offline HTML fallback
  const isHtml = (event.request.headers.get('accept') || '').includes('text/html') ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('.html');
  if (isHtml) {
    event.respondWith(
      caches.open(HTML_CACHE).then((cache) =>
        fetch(event.request).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(event.request, res.clone()).catch(() => {});
          }
          return res;
        }).catch(() => cache.match(event.request).then((c) => c || cache.match('/')))
      )
    );
  }
});
