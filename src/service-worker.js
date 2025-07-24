/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

clientsClaim();
self.skipWaiting();

/* ---------------------------
   Precache and Cleanup
---------------------------- */
precacheAndRoute(self.__WB_MANIFEST); // Precache all build assets
cleanupOutdatedCaches(); // Automatically removes old hashed caches

/* ---------------------------
   Cache Strategies
---------------------------- */
// Cache JS, CSS, and HTML using CacheFirst
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'document',
  new CacheFirst({
    cacheName: 'app-static-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);

// Cache images with CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'app-images',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);

/* ---------------------------
   Manual Skip Waiting
---------------------------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------------------------
   Notify Clients of New Build
---------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientsList.forEach((client) =>
        client.postMessage({ type: 'SW_NEW_BUILD_READY' })
      );
    })()
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Push", {
      body: data.body || "New message!",
      icon: "/logo192.png",
    })
  );
});
