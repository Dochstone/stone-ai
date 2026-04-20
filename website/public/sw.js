// Self-destruct worker: replaces any previous sw, unregisters itself,
// wipes all caches, reloads open clients to drop stale bundles.
// Kept as a file (not deleted) so existing clients can fetch and run it.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
