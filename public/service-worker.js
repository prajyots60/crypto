// // public/service-worker.js

// const CACHE_NAME = 'crypto-app-v1';
// const ASSETS_TO_CACHE = [
//   '/',
//   '/index.html',
//   '/manifest.json',
//   '/favicon.ico',
//   '/logo192.png',
//   '/logo512.png',
//   '/banner2.jpg',
//   '/robots.txt',
//   '/static/js/bundle.js',
//   '/static/js/main.chunk.js',
//   '/static/js/0.chunk.js',
//   '/static/js/1.chunk.js',
//   '/static/css/main.chunk.css'
// ];

// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then((cache) => {
//         console.log('[Service Worker] Caching all: app shell and content');
//         return cache.addAll(ASSETS_TO_CACHE);
//       })
//       .catch((err) => {
//         console.log('[Service Worker] Installation failed: ', err);
//       })
//   );
// });

// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((keyList) => {
//       return Promise.all(
//         keyList.map((key) => {
//           if (key !== CACHE_NAME) {
//             console.log('[Service Worker] Removing old cache', key);
//             return caches.delete(key);
//           }
//         })
//       );
//     })
//   );
//   console.log('[Service Worker] Activated');
//   return self.clients.claim();
// });

// self.addEventListener('fetch', (event) => {
//   // Skip cross-origin requests
//   if (
//     event.request.url.includes('hot-update.json') || 
//     event.request.url.startsWith('file://')
//   ) {
//     return;
//   }
//   if (!event.request.url.startsWith(self.location.origin)) {
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       // Cache hit - return response
//       if (response) {
//         return response;
//       }

//       // Clone the request
//       const fetchRequest = event.request.clone();

//       return fetch(fetchRequest).then((response) => {
//         // Check if we received a valid response
//         if (!response || response.status !== 200 || response.type !== 'basic') {
//           return response;
//         }

//         // Clone the response
//         const responseToCache = response.clone();

//         caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, responseToCache);
//         });

//         return response;
//       }).catch(() => {
//         // For API requests, return a fallback response if available
//         if (event.request.headers.get('accept').includes('text/html')) {
//           return caches.match('/index.html');
//         }
//       });
//     })
//   );
// });

// // Handle app updates
// self.addEventListener('message', (event) => {
//   if (event.data.action === 'skipWaiting') {
//     self.skipWaiting();
//   }
// });







const CACHE_NAME = 'crypto-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/banner2.jpg',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event (Network falling back to cache)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Chrome extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // API requests (cryptocurrency data)
  if (event.request.url.includes('/api/')) {
    return event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response for cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Return cached API data if available
          return caches.match(event.request);
        })
    );
  }

  // Static assets
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-crypto-data') {
    console.log('Background sync: updating crypto data');
    event.waitUntil(
      updateCryptoData()
        .then(() => console.log('Crypto data updated'))
        .catch(err => console.error('Sync failed', err))
    );
  }
});

async function updateCryptoData() {
  // Implement your crypto data update logic here
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd');
  await cache.put('api-crypto-data', response.clone());
  return response;
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body || 'New cryptocurrency update available!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Crypto Update', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});