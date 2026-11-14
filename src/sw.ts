/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

// ── App shell ──────────────────────────────────────────────────────────────
// Every hashed build file is precached, so the app opens instantly and works offline.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

// SPA navigations: try the network (fresh HTML after a deploy), fall back to the cached shell.
const shell = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(async (options) => {
    try {
      return await new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 3 }).handle(options);
    } catch {
      return shell(options);
    }
  })
);

// ── Images ─────────────────────────────────────────────────────────────────
// Cloudinary URLs are immutable (versioned), so cache-first is safe.
registerRoute(
  ({ url }) => url.hostname === 'res.cloudinary.com',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true }),
    ],
  })
);
registerRoute(
  ({ url }) => url.hostname === 'i.ytimg.com',
  new StaleWhileRevalidate({
    cacheName: 'yt-posters',
    plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

// ── API reads ──────────────────────────────────────────────────────────────
// Content people browse (episodes, feed, leaderboard, frames…) is network-first with a short
// timeout: fresh when online, last copy when the connection drops (college Wi-Fi, metro).
const OFFLINE_READS = /\/api\/(episodes|community\/posts|leaderboard|frames|xp-settings|users\/usernames|questions\/daily|auth\/me)(\/|\?|$)/;
registerRoute(
  ({ url, request }) => request.method === 'GET' && OFFLINE_READS.test(url.pathname + url.search),
  new NetworkFirst({
    cacheName: 'api-reads',
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 3 * 24 * 60 * 60 }),
    ],
  }),
  'GET'
);

// ── Offline likes ──────────────────────────────────────────────────────────
// A like tapped while offline is queued and replayed when the connection returns (Chromium).
const likeQueue = new BackgroundSyncPlugin('likes', { maxRetentionTime: 24 * 60 });
registerRoute(
  ({ url }) => /\/api\/(community\/posts\/\d+\/like|community\/comments\/\d+\/like)$/.test(url.pathname),
  new NetworkFirst({ cacheName: 'noop-likes', plugins: [likeQueue] }),
  'POST'
);

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data: { title: string; body: string; icon: string; badge: string; data: { url: string } } = {
    title: 'تنبيه جديد من Leh Physio! 📢',
    body: 'تفقد آخر التحديثات في المنصة الآن.',
    icon: '/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed, data: parsed.data || { url: '/' } };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      lang: 'ar',
      dir: 'auto',
      // @ts-expect-error vibrate is supported on Android Chrome but missing from lib.dom typings
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.url || '/';
  const absoluteUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('navigate' in client && 'focus' in client) {
          (client as WindowClient).navigate(absoluteUrl);
          return (client as WindowClient).focus();
        }
      }
      return self.clients.openWindow(absoluteUrl);
    })
  );
});

// The page asks the waiting worker to take over when the user taps "update".
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
