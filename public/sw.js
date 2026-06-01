const CACHE_NAME = 'leh-physio-cache-v1';
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
  // Only intercept GET requests and exclude API requests/WebSockets
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('socket.io')) {
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
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
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

  const targetUrl = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus and navigate it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.endsWith(targetUrl) || 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
