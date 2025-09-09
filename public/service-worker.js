// Simple SW with network-first for HTML and cache-first for static assets
const CACHE = "medstudy-cache-v4";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Network-first for navigations (prevents stale index.html on deploys)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || caches.match('/') )
    );
    return;
  }

  // For same-origin static assets: cache-first with lazy revalidation
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => null);
        return cached || net || fetch(req);
      })
    );
    return;
  }

  // Default: try network, fall back to cache
  e.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Clean old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
