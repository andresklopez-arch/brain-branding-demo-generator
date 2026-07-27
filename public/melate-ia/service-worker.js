const CACHE_NAME = 'melate-ia-v23';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=21',
  './app.js?v=22',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './lottery_database.json'
];

self.addEventListener('install', e => {
  self.skipWaiting(); // Bypass waiting state to activate immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching files...');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', e => {
  console.log('Service Worker: Activado');
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antiguo');
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim active clients immediately
  );
});

self.addEventListener('fetch', e => {
  // Ignore API requests
  if (e.request.url.includes('/api/')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
