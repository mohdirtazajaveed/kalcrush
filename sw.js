/* Kal Crush offline mode.
   Only page navigations are handled: when the network works, pages load exactly as before.
   If the network fails, the cached offline page (the Jungle Escape game) is shown instead. */
const CACHE = 'kc-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.add(new Request(OFFLINE_URL, { cache: 'reload' }))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('kc-offline-') && k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;          // images, CSS, scripts, analytics: untouched
  event.respondWith((async () => {
    try {
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
      return await fetch(event.request);
    } catch (err) {
      const cache = await caches.open(CACHE);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }
  })());
});
