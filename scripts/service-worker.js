/* Generated with a new cache name whenever the application build changes. */
const CACHE = 'apoio-pwa-__BUILD_VERSION__';
const ASSETS = __PRECACHE_ASSETS__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  // Updates wait for existing windows to close, preserving their asset versions.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('apoio-pwa-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && !url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html', { cacheName: CACHE })));
    return;
  }
  // Only build assets are cached. APIs, user data and external providers stay online.
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname, { cacheName: CACHE }).then(cached => cached || fetch(request)));
  }
});
