/* J-Harmonix service worker — offline support via runtime caching.
   Asset filenames are content-hashed by the build, so instead of a static
   precache list we cache same-origin GET responses as they are requested. */

const CACHE = 'jharmonix-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Warm the cache with the app shell (the scoped start URL).
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(self.registration.scope).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function put(request, response) {
  if (response && response.ok && response.type === 'basic') {
    caches.open(CACHE).then((c) => c.put(request, response));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (fonts) pass through

  // Navigations: network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => { put(request, res.clone()); return res; })
        .catch(() => caches.match(request).then((r) => r || caches.match(self.registration.scope)))
    );
    return;
  }

  // Other assets: cache-first, revalidating in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => { put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
