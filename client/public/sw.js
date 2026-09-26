const CACHE_NAME = 'etiraf-v2'; // Version artırdıq
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache açıldı');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - API request-lərini CACHE ETMƏ!
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API və Socket.IO request-lərini cache-dən qaytarma
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('socket.io') ||
      url.hostname.includes('onrender.com') ||
      url.hostname.includes('mongodb.net')) {
    console.log('[SW] Network-dən gətir:', url.pathname);
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Statik fayllar üçün cache strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[SW] Cache-dən gətir:', url.pathname);
          return response;
        }
        console.log('[SW] Network-dən gətir:', url.pathname);
        return fetch(event.request).then((response) => {
          // Yalnız GET request-ləri cache et
          if (event.request.method === 'GET' && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
  );
});

// Activate event - köhnə cache-ləri təmizlə
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Köhnə cache silindi:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push bildirişləri
self.addEventListener('push', (event) => {
  console.log('[SW] Push bildirişi alındı');
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Yeni bildiriş',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Etiraf', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
