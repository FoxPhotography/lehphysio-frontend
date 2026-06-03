const CACHE_NAME = 'leh-physio-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install Service Worker and cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Resilient Network-first with Cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests and exclude API requests/WebSockets/Vite dev server assets
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api') || 
    event.request.url.includes('socket.io') ||
    event.request.url.includes('/@vite/') ||
    event.request.url.includes('__vite_ping') ||
    event.request.url.includes('/node_modules/') ||
    event.request.url.includes('/src/') ||
    event.request.url.includes('/@fs/') ||
    event.request.url.includes('/@id/') ||
    event.request.url.includes('.ts') ||
    event.request.url.includes('.tsx')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response and cache it
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline index page
          const acceptHeader = event.request.headers.get('accept');
          if (acceptHeader && acceptHeader.includes('text/html')) {
            return caches.match('/index.html').then((indexResponse) => {
              return indexResponse || new Response(
                '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Offline</h1><p>You are currently offline. Please reconnect to access this page.</p></body></html>',
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' }
                }
              );
            });
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// Handle Background Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Notification received.');
  
  let data = {
    title: 'تنبيه جديد من Leh Physio! 📢',
    body: 'تفقد آخر التحديثات في المنصة الآن.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsedData = event.data.json();
      data = {
        ...data,
        ...parsedData,
        data: parsedData.data || { url: '/' }
      };
    } catch (err) {
      // If payload is plain text
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      { action: 'open', title: 'عرض الآن 👁️' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Clicks (Deep-linking)
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked.');
  event.notification.close();

  const targetPath = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';

  const absoluteUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus and navigate it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('navigate' in client && 'focus' in client) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
    })
  );
});

// Listen for SKIP_WAITING message to trigger hot activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
