

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
  window.location.hostname === "[::1]" ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/
  )
);

export function register(config) {
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then((registration) => {
          console.log("Service worker ready.");
          initializeAdvancedFeatures(registration); // Initialize advanced features
        });
      } else {
        registerValidSW(swUrl, config)
          .then(registration => {
            if (registration) initializeAdvancedFeatures(registration);
          });
      }
    });
  }
}

// Modified to return registration promise
function registerValidSW(swUrl, config) {
  return navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("New content is available; please refresh.");
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log("Content is cached for offline use.");
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
      return registration; // Return registration for chaining
    })
    .catch(error => {
      console.error("Error during service worker registration:", error);
      return null;
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { "Service-Worker": "script" },
  })
    .then(response => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf("javascript") === -1)
      ) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config)
          .then(registration => {
            if (registration) initializeAdvancedFeatures(registration);
          });
      }
    })
    .catch(() => {
      console.log("No internet connection found. App is running in offline mode.");
    });
}

// NEW: Initialize advanced PWA features
function initializeAdvancedFeatures(registration) {
  // Initialize Background Sync
  if ('SyncManager' in window) {
    registration.sync.register('update-crypto-data')
      .then(() => console.log('Registered background sync for crypto data updates'))
      .catch(err => console.error('Background sync registration failed:', err));
  }

  // Initialize Periodic Sync (for newer browsers)
  if ('PeriodicSyncManager' in window) {
    registration.periodicSync.register('refresh-crypto-data', {
      minInterval: 24 * 60 * 60 * 1000 // 24 hours
    }).then(() => console.log('Periodic sync registered'))
     .catch(err => console.error('Periodic sync registration failed:', err));
  }

  // Check notification permission
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Push notifications permission granted');
        // You would typically subscribe to push here
      }
    });
  }
}

// NEW: Push notification subscription helper
export async function subscribeToPushNotifications(registration) {
  if (!('PushManager' in window)) {
    console.warn('Push messaging not supported');
    return null;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    const vapidPublicKey = 'BMBxhbDmmbLZEkDX7ijx3f-PuVMXKc_A97CTjyr3b50QsuBJmCnYMjfBHQDXY6bALYjhBLdpnG7yN5NrgFjE-IM';
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Push subscription successful');
    return newSubscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// Helper function for VAPID key conversion
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}