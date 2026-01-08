const CACHE_VERSION = 'v1';
const CACHE_NAME = `archive-of-meme-${CACHE_VERSION}`;

// Install - activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate - claim clients and notify about update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('archive-of-meme-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Take control of all clients
      clients.claim(),
    ]).then(() => {
      // Notify all clients about the update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
});

// Fetch - network first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
