

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
// self.addEventListener('push', (event) => {
//   const data = event.data.json();
//   const options = {
//     body: data.body || 'New cryptocurrency update available!',
//     icon: '/logo192.png',
//     badge: '/logo192.png',
//     data: {
//       url: data.url || '/'
//     }
//   };

//   event.waitUntil(
//     self.registration.showNotification(data.title || 'Crypto Update', options)
//   );
// });

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Crypto Update',
      body: 'New cryptocurrency update available!',
      icon: '/logo192.png'
    };
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: '/logo192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
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