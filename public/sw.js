// ========================================================
// AX-Map Production Service Worker (sw.js)
// Features 6-12: Offline App Shell, Caching, Bypass Rules,
// & Preserved Notification Click Handler
// ========================================================

const CACHE_NAME = 'axmap-v1';

// Core shell assets to pre-cache on install for 0ms offline startup
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/ax-logo.png',
];

/**
 * Filter 1: Check if request is an external map tile or vector data stream.
 * Tile requests MUST bypass CacheStorage to prevent quota exhaustion and
 * avoid TypeError crashes on HTTP 206 Partial Content byte ranges.
 */
function isMapTileRequest(url, request) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  const search = url.search.toLowerCase();

  // Range requests (e.g., PMTiles slice requests) cannot be cached in Cache API
  if (request.headers && request.headers.has && request.headers.has('range')) {
    return true;
  }

  // External tile CDN hostnames
  if (
    hostname.includes('protomaps.com') ||
    hostname.includes('cartocdn.com') ||
    hostname.includes('openstreetmap.org') ||
    hostname.includes('mapbox.com')
  ) {
    return true;
  }

  // Vector / raster tile extensions and PMTiles archives
  if (
    pathname.endsWith('.mvt') ||
    pathname.endsWith('.pbf') ||
    pathname.endsWith('.pmtiles') ||
    pathname.includes('.mvt') ||
    pathname.includes('.pbf') ||
    pathname.includes('.pmtiles') ||
    search.includes('.mvt') ||
    search.includes('.pbf') ||
    search.includes('.pmtiles')
  ) {
    return true;
  }

  return false;
}

/**
 * Filter 2: Check if request is a dynamic backend REST API query.
 * Must bypass CacheStorage so drivers always get real-time gas pressure (bar),
 * accurate open/closed station status, and fresh queue counts.
 */
function isDynamicApiRequest(url) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // Local development backend
  if (url.port === '5000' || (hostname === 'localhost' && url.port === '5000')) {
    return true;
  }

  // Backend API endpoints
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/stations') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/feedbacks') ||
    pathname.startsWith('/ads') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/admin')
  ) {
    return true;
  }

  return false;
}

// --------------------------------------------------------
// LIFECYCLE: INSTALL
// Pre-cache core shell assets with individual error resilience
// --------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        PRECACHE_ASSETS.map(async (assetUrl) => {
          try {
            const res = await fetch(assetUrl);
            if (res.ok) {
              await cache.put(assetUrl, res);
            } else {
              console.warn(`[SW] Pre-cache skipped: ${assetUrl} (${res.status})`);
            }
          } catch (err) {
            console.warn(`[SW] Pre-cache fetch error: ${assetUrl}`, err.message);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// --------------------------------------------------------
// LIFECYCLE: ACTIVATE
// Purge stale caches from prior versions and claim uncontrolled clients
// --------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[SW] Purging stale cache: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// --------------------------------------------------------
// LIFECYCLE: FETCH
// Enforce strict bypass rules, Cache-First for assets, Network-First for navigations
// --------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass Rule 1: Non-HTTP schemes (e.g., chrome-extension://, moz-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Bypass Rule 2: Non-GET methods (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Rule 3: External map tiles (Protomaps, CartoDB, OSM, Mapbox, .mvt, .pbf, .pmtiles)
  if (isMapTileRequest(url, request)) {
    return;
  }

  // Bypass Rule 4: Dynamic APIs (/api/*, /stations, localhost:5000, etc.)
  if (isDynamicApiRequest(url)) {
    return;
  }

  // Strategy A: Navigation requests (request.mode === 'navigate') -> Network-First with /index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) {
            return cachedIndex;
          }
          const cachedRoot = await caches.match('/');
          if (cachedRoot) {
            return cachedRoot;
          }
          return new Response(
            '<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>AX-Map - Oflayn</title></head><body style="background:#090d16;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;"><h2>Internet bilan aloqa yo\'q</h2><p>Iltimos, internetingizni tekshirib qayta urining.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Strategy B: Hashed Vite bundles (/assets/*) -> Cache-First
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy C: Other same-origin static assets (manifest, favicon, icons, splash) -> Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// --------------------------------------------------------
// NOTIFICATION CLICK: Station Reopen Modal Handler
// Verbatim preservation of existing lines 13-34 from public/sw.js
// --------------------------------------------------------
// Bildirishnoma bosilganda ilovaga olib borish va modalni ochish
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const stationId = event.notification.data?.stationId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'OPEN_REOPEN_STATION_MODAL',
            stationId: stationId,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?reopenDue=' + encodeURIComponent(stationId || ''));
      }
    })
  );
});
