// Custom service worker additions
// This file is merged with the Workbox-generated service worker by next-pwa

// ─── Mapbox tile caching (Task 9.6) ──────────────────────────────────────────
// Cache Mapbox map tiles and styles with a cache-first strategy for offline support.
// Tile URL patterns:
//   - https://api.mapbox.com/styles/v1/**  (map styles)
//   - https://api.mapbox.com/v4/**         (raster/vector tiles)
//   - https://events.mapbox.com/**         (telemetry — network-only, no cache)

const MAPBOX_TILE_CACHE = 'mapbox-tiles-v1';
const MAPBOX_TILE_MAX_ENTRIES = 200;
const MAPBOX_TILE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns true if the request URL is a cacheable Mapbox tile or style URL.
 */
function isMapboxTileRequest(url) {
  return (
    url.startsWith('https://api.mapbox.com/styles/v1/') ||
    url.startsWith('https://api.mapbox.com/v4/')
  );
}

/**
 * Prunes the Mapbox tile cache to stay within MAPBOX_TILE_MAX_ENTRIES.
 * Also removes entries older than MAPBOX_TILE_MAX_AGE_SECONDS.
 */
async function pruneMapboxTileCache(cache) {
  const keys = await cache.keys();
  const now = Date.now();

  // Remove expired entries
  for (const request of keys) {
    const response = await cache.match(request);
    if (!response) continue;

    const dateHeader = response.headers.get('date');
    if (dateHeader) {
      const cachedAt = new Date(dateHeader).getTime();
      if (now - cachedAt > MAPBOX_TILE_MAX_AGE_SECONDS * 1000) {
        await cache.delete(request);
      }
    }
  }

  // Enforce max entries (remove oldest first)
  const remainingKeys = await cache.keys();
  if (remainingKeys.length > MAPBOX_TILE_MAX_ENTRIES) {
    const toDelete = remainingKeys.slice(0, remainingKeys.length - MAPBOX_TILE_MAX_ENTRIES);
    for (const request of toDelete) {
      await cache.delete(request);
    }
  }
}

// Intercept fetch events for Mapbox tile URLs
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (!isMapboxTileRequest(url)) return;

  event.respondWith(
    caches.open(MAPBOX_TILE_CACHE).then(async (cache) => {
      // Cache-first strategy
      const cached = await cache.match(event.request);
      if (cached) {
        return cached;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          // Clone before consuming
          cache.put(event.request, networkResponse.clone());
          // Prune in background (don't await)
          pruneMapboxTileCache(cache).catch(() => {});
        }
        return networkResponse;
      } catch {
        // Network failed and no cache — return a 503
        return new Response('Mapbox tile unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Open the IndexedDB sync queue
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const actions = await getAllFromStore(store);

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body,
      });

      if (response.ok) {
        // Remove from queue on success
        await store.delete(action.id);
      }
    } catch (error) {
      // Leave in queue to retry later
      console.error('Sync failed for action:', action.id, error);
    }
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      notificationId: data.notificationId,
    },
    actions: data.actions || [],
    tag: data.tag || 'vigilhealth-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'VigilHealth Alert', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Helper: open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vigilhealth-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper: get all records from an object store
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
