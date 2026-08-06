const CACHE_NAME = 'bb-cache-v43';
const ASSETS = [
  '/',
  '/index.html',
  '/index.css?v=3.0.0',
  '/app.js?v=3.0.0',
  '/assets/og-image.jpg?v=3.0.0',
  '/favicon.jpg',
  '/favicon.png',
  '/favicon.ico',
  '/assets/logo.jpg',
  '/privacidad.html',
  '/terminos.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
