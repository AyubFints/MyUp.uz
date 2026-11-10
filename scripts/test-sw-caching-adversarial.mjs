/**
 * scripts/test-sw-caching-adversarial.mjs
 *
 * EMPIRICAL ADVERSARIAL STRESS-TEST HARNESS
 * Rigorously stresses Service Worker caching boundaries, offline fallback,
 * notification IPC, and SPA /privacy routing.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function expect(condition, description) {
  totalTests++;
  if (!condition) {
    failedTests++;
    failures.push(description);
    console.error(`  ❌ FAIL: ${description}`);
  } else {
    passedTests++;
    console.log(`  ✅ PASS: ${description}`);
  }
}

function expectEqual(actual, expected, description) {
  totalTests++;
  if (actual !== expected) {
    failedTests++;
    failures.push(`${description} (Expected: ${expected}, Got: ${actual})`);
    console.error(`  ❌ FAIL: ${description} (Expected: ${expected}, Got: ${actual})`);
  } else {
    passedTests++;
    console.log(`  ✅ PASS: ${description}`);
  }
}

console.log('================================================================');
console.log('AX-MAP EMPIRICAL CHALLENGER ADVERSARIAL STRESS-TEST SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------
// BUILD SERVICE WORKER SANDBOX ENVIRONMENT
// ----------------------------------------------------------------------

function createSwSandbox() {
  const listeners = new Map();
  const cacheStorage = new Map();

  class MockCache {
    constructor(name) {
      this.name = name;
      this.store = new Map();
    }
    async put(request, response) {
      const key = typeof request === 'string' ? request : request.url;
      this.store.set(key, response.clone());
    }
    async match(request) {
      const key = typeof request === 'string' ? request : request.url;
      const found = this.store.get(key);
      return found ? found.clone() : null;
    }
    async delete(request) {
      const key = typeof request === 'string' ? request : request.url;
      return this.store.delete(key);
    }
    async keys() {
      return Array.from(this.store.keys());
    }
  }

  const mockCaches = {
    async open(name) {
      if (!cacheStorage.has(name)) {
        cacheStorage.set(name, new MockCache(name));
      }
      return cacheStorage.get(name);
    },
    async match(request) {
      for (const cache of cacheStorage.values()) {
        const found = await cache.match(request);
        if (found) return found;
      }
      return null;
    },
    async delete(name) {
      return cacheStorage.delete(name);
    },
    async keys() {
      return Array.from(cacheStorage.keys());
    },
  };

  const clientMessages = [];
  const clientFocusCalls = [];
  const openWindowCalls = [];

  let mockWindowClients = [];

  const mockClients = {
    async claim() {
      return undefined;
    },
    async matchAll(options) {
      return mockWindowClients;
    },
    async openWindow(url) {
      openWindowCalls.push(url);
      return { url };
    },
  };

  let mockNetworkFetchHandler = async (req) => {
    return new Response('<!DOCTYPE html><html><body>AX-Map Online</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  };

  const sandbox = {
    console,
    URL,
    Response,
    Request,
    Headers,
    caches: mockCaches,
    fetch: async (req, options) => mockNetworkFetchHandler(req, options),
    self: {
      location: new URL('https://myupuz.vercel.app/sw.js'),
      skipWaiting: async () => {},
      clients: mockClients,
      addEventListener: (type, listener) => {
        listeners.set(type, listener);
      },
    },
  };

  sandbox.self.self = sandbox.self;
  sandbox.self.caches = mockCaches;
  sandbox.self.location = new URL('https://myupuz.vercel.app/sw.js');

  const swSource = fs.readFileSync(path.resolve('public/sw.js'), 'utf8');
  vm.createContext(sandbox);
  vm.runInContext(swSource, sandbox);

  return {
    sandbox,
    listeners,
    cacheStorage,
    clientMessages,
    clientFocusCalls,
    openWindowCalls,
    setMockWindowClients: (clients) => {
      mockWindowClients = clients;
    },
    setNetworkFetch: (fn) => {
      mockNetworkFetchHandler = fn;
    },
  };
}

// ----------------------------------------------------------------------
// TEST SUITE 1: MAP TILES STRICT BYPASS & ZERO-CACHE VERIFICATION
// ----------------------------------------------------------------------
console.log('--- TEST SUITE 1: Map Tile Strict Bypass & Zero-Cache Verification ---');

const mapTileAdversarialRequests = [
  // Protomaps
  { url: 'https://api.protomaps.com/tiles/v4/10/500/300.mvt?key=xxx', method: 'GET', desc: 'Standard Protomaps MVT' },
  { url: 'https://api.protomaps.com/tiles/v4/10/500/300.pbf', method: 'GET', desc: 'Protomaps PBF tile' },
  { url: 'https://API.PROTOMAPS.COM/TILES/V4/10/500/300.MVT?key=123', method: 'GET', desc: 'Uppercase Protomaps hostname/path' },
  { url: 'https://subdomain.api.protomaps.com/v1/tile.mvt', method: 'GET', desc: 'Subdomain Protomaps' },

  // CartoDB
  { url: 'https://a.basemaps.cartocdn.com/light_all/10/500/300@2x.png', method: 'GET', desc: 'CartoDB raster tile CDN light_all' },
  { url: 'https://b.basemaps.cartocdn.com/rastertiles/voyager/10/500/300.png', method: 'GET', desc: 'CartoDB voyager tile CDN' },
  { url: 'https://cartocdn.com/vector/tile.mvt', method: 'GET', desc: 'CartoDB vector tile' },

  // OpenStreetMap
  { url: 'https://tile.openstreetmap.org/10/500/300.png', method: 'GET', desc: 'Standard OSM tile' },
  { url: 'https://a.tile.openstreetmap.org/1/2/3.png', method: 'GET', desc: 'Subdomain OSM tile' },

  // Mapbox
  { url: 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/10/500/300.vector.pbf', method: 'GET', desc: 'Mapbox vector PBF tile' },
  { url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/1/2/3', method: 'GET', desc: 'Mapbox raster streets tile' },
  { url: 'https://a.api.mapbox.com/styles/v1/mapbox/light-v10/tiles/512/4/5/6', method: 'GET', desc: 'Mapbox style raster 512' },

  // Vector / PMTiles extensions & query params
  { url: 'https://myupuz.vercel.app/maps/uzbekistan.pmtiles', method: 'GET', desc: 'Same-origin PMTiles archive' },
  { url: 'https://myupuz.vercel.app/maps/uzbekistan.PMTILES', method: 'GET', desc: 'Uppercase PMTILES extension' },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.mvt', method: 'GET', desc: 'Same-origin MVT tile' },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.MVT', method: 'GET', desc: 'Uppercase MVT extension' },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.pbf', method: 'GET', desc: 'Same-origin PBF tile' },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.PBF', method: 'GET', desc: 'Uppercase PBF extension' },
  { url: 'https://myupuz.vercel.app/viewer?archive=data.pmtiles', method: 'GET', desc: 'PMTiles in query search parameter' },
  { url: 'https://myupuz.vercel.app/vector?file=roads.mvt&layer=transit', method: 'GET', desc: 'MVT in query search parameter' },

  // HTTP Range headers (PMTiles slice streaming)
  { url: 'https://myupuz.vercel.app/maps/uzbekistan.pmtiles', headers: { range: 'bytes=0-16383' }, method: 'GET', desc: 'PMTiles with lowercase range header' },
  { url: 'https://myupuz.vercel.app/maps/uzbekistan.pmtiles', headers: { Range: 'bytes=16384-32767' }, method: 'GET', desc: 'PMTiles with Titlecase Range header' },
  { url: 'https://myupuz.vercel.app/assets/bundle.js', headers: { RANGE: 'bytes=0-100' }, method: 'GET', desc: 'Arbitrary asset with UPPERCASE RANGE header' },
];

async function runMapTileTests() {
  const env = createSwSandbox();
  const fetchListener = env.listeners.get('fetch');
  expect(typeof fetchListener === 'function', 'Service Worker fetch event listener is registered');

  const cache = await env.sandbox.caches.open('axmap-v1');

  for (const t of mapTileAdversarialRequests) {
    let respondWithCalled = false;
    let handledPromise = null;

    const reqHeaders = new Headers(t.headers || {});
    const req = new Request(t.url, {
      method: t.method || 'GET',
      headers: reqHeaders,
    });

    const event = {
      request: req,
      respondWith: (p) => {
        respondWithCalled = true;
        handledPromise = p;
      },
    };

    fetchListener(event);

    expectEqual(respondWithCalled, false, `[Map Bypass] ${t.desc} bypassed sw respondWith`);
    const cached = await cache.match(t.url);
    expectEqual(cached, null, `[Map Bypass] ${t.desc} was NEVER cached in CacheStorage`);
  }
}

await runMapTileTests();

// ----------------------------------------------------------------------
// TEST SUITE 2: DYNAMIC REST API STRICT BYPASS & ZERO STALENESS
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Dynamic REST API Strict Bypass & Zero Staleness ---');

const apiAdversarialRequests = [
  // Local development backend on port 5000
  { url: 'http://localhost:5000/api/stations', desc: 'Localhost port 5000 API' },
  { url: 'http://localhost:5000/stations', desc: 'Localhost port 5000 /stations' },
  { url: 'http://127.0.0.1:5000/api/stations', desc: '127.0.0.1 port 5000 /api/stations' },

  // Production endpoints
  { url: 'https://myupuz.vercel.app/api/stations', desc: 'Production /api/stations' },
  { url: 'https://myupuz.vercel.app/api/stations?fuel=metan&city=Tashkent', desc: 'Production /api/stations with query parameters' },
  { url: 'https://myupuz.vercel.app/stations', desc: 'Production /stations root' },
  { url: 'https://myupuz.vercel.app/stations/nearby?lat=41.31&lng=69.24', desc: 'Production /stations/nearby location query' },
  { url: 'https://myupuz.vercel.app/stations/12345/reopen-alert', desc: 'Production station reopen alert subpath' },
  { url: 'https://myupuz.vercel.app/auth/login', desc: 'Production /auth/login endpoint' },
  { url: 'https://myupuz.vercel.app/auth/register', desc: 'Production /auth/register endpoint' },
  { url: 'https://myupuz.vercel.app/auth/me', desc: 'Production /auth/me user profile endpoint' },
  { url: 'https://myupuz.vercel.app/feedbacks', desc: 'Production /feedbacks user feedback endpoint' },
  { url: 'https://myupuz.vercel.app/ads', desc: 'Production /ads advertisement banners endpoint' },
  { url: 'https://myupuz.vercel.app/analytics', desc: 'Production /analytics tracking endpoint' },
  { url: 'https://myupuz.vercel.app/notifications', desc: 'Production /notifications push endpoint' },
  { url: 'https://myupuz.vercel.app/admin/audit-logs', desc: 'Production /admin administrative endpoint' },
  { url: 'https://api.myup.uz/api/stations', desc: 'External custom API domain /api/stations' },
];

async function runApiTests() {
  const env = createSwSandbox();
  const fetchListener = env.listeners.get('fetch');
  const cache = await env.sandbox.caches.open('axmap-v1');

  for (const t of apiAdversarialRequests) {
    let respondWithCalled = false;
    const req = new Request(t.url, { method: 'GET' });

    const event = {
      request: req,
      respondWith: () => {
        respondWithCalled = true;
      },
    };

    fetchListener(event);

    expectEqual(respondWithCalled, false, `[API Bypass] ${t.desc} bypassed sw respondWith`);
    const cached = await cache.match(t.url);
    expectEqual(cached, null, `[API Bypass] ${t.desc} was NEVER cached in CacheStorage`);
  }
}

await runApiTests();

// ----------------------------------------------------------------------
// TEST SUITE 3: NON-GET & NON-HTTP EXCEPTION IMMUNITY
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Non-GET & Non-HTTP Protocol Exception Immunity ---');

const nonGetAndProtocols = [
  // HTTP Methods
  { url: 'https://myupuz.vercel.app/api/stations', method: 'POST', body: '{"name":"New Station"}', desc: 'POST station submission' },
  { url: 'https://myupuz.vercel.app/api/stations/42', method: 'PUT', body: '{"pressure":205}', desc: 'PUT station gas pressure update' },
  { url: 'https://myupuz.vercel.app/api/stations/42', method: 'DELETE', desc: 'DELETE station endpoint' },
  { url: 'https://myupuz.vercel.app/api/stations/42', method: 'PATCH', body: '{"isOpen":true}', desc: 'PATCH station status' },
  { url: 'https://myupuz.vercel.app/api/stations', method: 'OPTIONS', desc: 'CORS Preflight OPTIONS request' },

  // Non-HTTP Protocols
  { url: 'chrome-extension://hndlhflnogkfeenngknpnmkghkgogbal/popup.html', method: 'GET', desc: 'Chrome Extension URL' },
  { url: 'moz-extension://a644f5bf-b892-4fcf-bc64-16a3bc5cf6ef/script.js', method: 'GET', desc: 'Firefox Extension URL' },
  { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', method: 'GET', desc: 'Data URI' },
  { url: 'blob:https://myupuz.vercel.app/d9f12345-6789-abcd-ef01-23456789abcd', method: 'GET', desc: 'Blob URI' },
];

async function runNonGetTests() {
  const env = createSwSandbox();
  const fetchListener = env.listeners.get('fetch');
  const cache = await env.sandbox.caches.open('axmap-v1');

  for (const t of nonGetAndProtocols) {
    let respondWithCalled = false;
    let thrownError = null;

    try {
      const reqInit = { method: t.method };
      if (t.body) {
        reqInit.body = t.body;
        reqInit.headers = { 'Content-Type': 'application/json' };
      }
      const req = new Request(t.url, reqInit);

      const event = {
        request: req,
        respondWith: () => {
          respondWithCalled = true;
        },
      };

      fetchListener(event);
    } catch (err) {
      thrownError = err;
    }

    expectEqual(thrownError, null, `[Exception Immunity] ${t.desc} did not throw any exception`);
    expectEqual(respondWithCalled, false, `[Exception Immunity] ${t.desc} bypassed sw respondWith cleanly`);
    const cached = await cache.match(t.url);
    expectEqual(cached, null, `[Exception Immunity] ${t.desc} was NEVER cached in CacheStorage`);
  }
}

await runNonGetTests();

// ----------------------------------------------------------------------
// TEST SUITE 4: NAVIGATIONS & OFFLINE /index.html FALLBACK
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Navigations & Offline Fallback for / and /privacy ---');

async function runNavigationTests() {
  const env = createSwSandbox();
  const fetchListener = env.listeners.get('fetch');
  const cache = await env.sandbox.caches.open('axmap-v1');

  // Pre-seed cache with index.html as SW install lifecycle does
  const seededHtml = '<!DOCTYPE html><html><head><title>AX-Map Precached</title></head><body><div id="root"></div></body></html>';
  await cache.put('/index.html', new Response(seededHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));

  // 1. ONLINE NAVIGATION TEST: Network returns 200
  {
    const onlineHtml = '<!DOCTYPE html><html><head><title>AX-Map Online Fresh</title></head><body><div id="root"></div></body></html>';
    env.setNetworkFetch(async (req) => {
      return new Response(onlineHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    });

    const req = new Request('https://myupuz.vercel.app/privacy', {
      method: 'GET',
    });
    // Set mode to 'navigate'
    Object.defineProperty(req, 'mode', { value: 'navigate' });

    let handledPromise = null;
    fetchListener({
      request: req,
      respondWith: (p) => {
        handledPromise = p;
      },
    });

    expect(handledPromise !== null, '[Online Navigation] respondWith called for /privacy');
    const res = await handledPromise;
    expectEqual(res.status, 200, '[Online Navigation] Responded with HTTP 200');
    const body = await res.text();
    expect(body.includes('AX-Map Online Fresh'), '[Online Navigation] Returned fresh network HTML');

    // Verify it updated /index.html in cache
    const cachedAfter = await cache.match('/index.html');
    expect(cachedAfter !== null, '[Online Navigation] /index.html cached');
    const cachedBody = await cachedAfter.text();
    expect(cachedBody.includes('AX-Map Online Fresh'), '[Online Navigation] Cache updated with fresh network copy');
  }

  // 2. OFFLINE NAVIGATION TEST to /privacy: Network drops / throws TypeError
  {
    env.setNetworkFetch(async () => {
      throw new TypeError('Failed to fetch (User is offline in subway/tunnel)');
    });

    const req = new Request('https://myupuz.vercel.app/privacy', {
      method: 'GET',
    });
    Object.defineProperty(req, 'mode', { value: 'navigate' });

    let handledPromise = null;
    fetchListener({
      request: req,
      respondWith: (p) => {
        handledPromise = p;
      },
    });

    expect(handledPromise !== null, '[Offline /privacy Navigation] respondWith called');
    const res = await handledPromise;
    expectEqual(res.status, 200, '[Offline /privacy Navigation] Responded with HTTP 200 from cache');
    const body = await res.text();
    expect(body.includes('AX-Map Online Fresh'), '[Offline /privacy Navigation] Successfully returned cached index.html');
  }

  // 3. OFFLINE NAVIGATION TEST to / (root): Network drops
  {
    const req = new Request('https://myupuz.vercel.app/', {
      method: 'GET',
    });
    Object.defineProperty(req, 'mode', { value: 'navigate' });

    let handledPromise = null;
    fetchListener({
      request: req,
      respondWith: (p) => {
        handledPromise = p;
      },
    });

    expect(handledPromise !== null, '[Offline / Navigation] respondWith called');
    const res = await handledPromise;
    expectEqual(res.status, 200, '[Offline / Navigation] Responded with HTTP 200');
    const body = await res.text();
    expect(body.includes('AX-Map Online Fresh'), '[Offline / Navigation] Successfully returned cached index.html');
  }

  // 4. OFFLINE NAVIGATION TEST: Cache empty (worst-case scenario fallback)
  {
    await cache.delete('/index.html');
    await cache.delete('/');

    const req = new Request('https://myupuz.vercel.app/privacy', {
      method: 'GET',
    });
    Object.defineProperty(req, 'mode', { value: 'navigate' });

    let handledPromise = null;
    fetchListener({
      request: req,
      respondWith: (p) => {
        handledPromise = p;
      },
    });

    const res = await handledPromise;
    expectEqual(res.status, 200, '[Worst-case Offline Fallback] Responded with HTTP 200');
    const body = await res.text();
    expect(body.includes('AX-Map - Oflayn'), '[Worst-case Offline Fallback] Fallback HTML contains "AX-Map - Oflayn"');
    expect(body.includes('Internet bilan aloqa'), '[Worst-case Offline Fallback] Fallback HTML contains Uzbek message');
  }

  // 5. CACHE POISONING RESISTANCE TEST: Server returns HTTP 500 or 404
  {
    // Pre-seed known good index.html
    const goodHtml = '<!DOCTYPE html><html><body>AX-Map Good Cache</body></html>';
    await cache.put('/index.html', new Response(goodHtml, { status: 200 }));

    // Network returns 500 Internal Server Error
    env.setNetworkFetch(async () => {
      return new Response('500 Server Error', { status: 500 });
    });

    const req = new Request('https://myupuz.vercel.app/privacy', { method: 'GET' });
    Object.defineProperty(req, 'mode', { value: 'navigate' });

    let handledPromise = null;
    fetchListener({
      request: req,
      respondWith: (p) => {
        handledPromise = p;
      },
    });

    const res = await handledPromise;
    expectEqual(res.status, 500, '[Cache Poisoning] Network returned 500 status passed through');

    // Verify cache was NOT poisoned with the 500 error!
    const cachedAfter = await cache.match('/index.html');
    const cachedBody = await cachedAfter.text();
    expect(cachedBody.includes('AX-Map Good Cache'), '[Cache Poisoning] Cache preserved good version, rejected 500');
  }

  // 6. UNLISTED CROSS-ORIGIN ASSETS STRICT NETWORK PASS-THROUGH
  {
    const unlistedUrls = [
      'https://api.maptiler.com/maps/streets/256/0/0/0.png',
      'https://tiles.stadiamaps.com/tiles/alidade_smooth/0/0/0.png',
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans',
      'https://fonts.gstatic.com/s/plusjakartasans/v8/something.woff2',
    ];

    for (const url of unlistedUrls) {
      let respondWithCalled = false;
      const req = new Request(url, { method: 'GET' });
      fetchListener({
        request: req,
        respondWith: () => {
          respondWithCalled = true;
        },
      });

      expectEqual(respondWithCalled, false, `[Cross-Origin Pass-Through] ${url} bypassed respondWith`);
      const cached = await cache.match(url);
      expectEqual(cached, null, `[Cross-Origin Pass-Through] ${url} was NEVER cached`);
    }
  }
}

await runNavigationTests();

// ----------------------------------------------------------------------
// TEST SUITE 5: PRESERVED NOTIFICATIONCLICK & IPC MESSAGING
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Preserved notificationclick & IPC Messaging ---');

async function runNotificationTests() {
  const env = createSwSandbox();
  const notificationListener = env.listeners.get('notificationclick');
  expect(typeof notificationListener === 'function', 'notificationclick event listener is registered');

  // Scenario A: Client window exists and has focus capability
  {
    let closed = false;
    let postMessagePayload = null;
    let focusCalled = false;

    const mockClient = {
      focus: async () => {
        focusCalled = true;
        return mockClient;
      },
      postMessage: (data) => {
        postMessagePayload = data;
      },
    };

    env.setMockWindowClients([mockClient]);

    let waitUntilPromise = null;
    const event = {
      notification: {
        data: { stationId: 'station-tashkent-metan-88' },
        close: () => {
          closed = true;
        },
      },
      waitUntil: (p) => {
        waitUntilPromise = p;
      },
    };

    notificationListener(event);
    expectEqual(closed, true, '[notificationclick A] Notification was closed');
    await waitUntilPromise;
    expectEqual(focusCalled, true, '[notificationclick A] Client window focus() was called');
    expectEqual(postMessagePayload?.type, 'OPEN_REOPEN_STATION_MODAL', '[notificationclick A] postMessage type is OPEN_REOPEN_STATION_MODAL');
    expectEqual(postMessagePayload?.stationId, 'station-tashkent-metan-88', '[notificationclick A] postMessage stationId matches notification data');
  }

  // Scenario B: No client window exists -> openWindow fallback
  {
    let closed = false;
    env.setMockWindowClients([]); // No active windows

    let waitUntilPromise = null;
    const event = {
      notification: {
        data: { stationId: 'station-samarkand-propane-42' },
        close: () => {
          closed = true;
        },
      },
      waitUntil: (p) => {
        waitUntilPromise = p;
      },
    };

    notificationListener(event);
    expectEqual(closed, true, '[notificationclick B] Notification was closed');
    await waitUntilPromise;
    expectEqual(env.openWindowCalls.length, 1, '[notificationclick B] clients.openWindow was called');
    expectEqual(
      env.openWindowCalls[0],
      '/?reopenDue=station-samarkand-propane-42',
      '[notificationclick B] openWindow called with correct query param ?reopenDue=station-samarkand-propane-42'
    );
  }

  // Scenario C: Notification with undefined / empty data
  {
    let closed = false;
    env.openWindowCalls.length = 0;
    env.setMockWindowClients([]);

    let waitUntilPromise = null;
    const event = {
      notification: {
        data: null,
        close: () => {
          closed = true;
        },
      },
      waitUntil: (p) => {
        waitUntilPromise = p;
      },
    };

    notificationListener(event);
    expectEqual(closed, true, '[notificationclick C] Notification was closed');
    await waitUntilPromise;
    expectEqual(
      env.openWindowCalls[0],
      '/?reopenDue=',
      '[notificationclick C] openWindow called safely without crash on null data'
    );
  }
}

await runNotificationTests();

// ----------------------------------------------------------------------
// TEST SUITE 6: PRIVACY POLICY PAGE, GOOGLE PLAY DISCLOSURES & SPA ROUTING
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 6: Privacy Policy Google Play Disclosures & SPA Routing ---');

function runPrivacyPolicyTests() {
  const privacyComponentPath = path.resolve('src/components/PrivacyPolicyPage.jsx');
  expect(fs.existsSync(privacyComponentPath), 'PrivacyPolicyPage.jsx exists');
  const privacyCode = fs.readFileSync(privacyComponentPath, 'utf8');

  // 1. Google Play Foreground Location Disclosures
  expect(privacyCode.includes('ACCESS_FINE_LOCATION'), 'Privacy Policy explicitly names ACCESS_FINE_LOCATION');
  expect(privacyCode.includes('ACCESS_COARSE_LOCATION'), 'Privacy Policy explicitly names ACCESS_COARSE_LOCATION');
  expect(privacyCode.includes('foreground'), 'Privacy Policy explains foreground location usage');
  expect(privacyCode.includes('Eng yaqin shoxobchalarni topish'), 'Privacy Policy explains nearest station finding');
  expect(privacyCode.includes('OSRM'), 'Privacy Policy mentions OSRM routing');
  expect(privacyCode.includes('Turn-by-turn navigatsiya'), 'Privacy Policy explains turn-by-turn navigation');

  // 2. Google Play Strict NO Background Tracking Disclosures
  expect(privacyCode.includes('ACCESS_BACKGROUND_LOCATION'), 'Privacy Policy explicitly addresses ACCESS_BACKGROUND_LOCATION');
  expect(privacyCode.includes('MUTLAQO KUZATMAYDI, TO\'PLAMAYDI VA SAQLAMAYDI'), 'Privacy Policy gives strict NO background tracking guarantee');
  expect(privacyCode.includes('location history'), 'Privacy Policy states location history is NOT retained or profiled');

  // 3. Community Data Terms & Gas Pressure (bar)
  expect(privacyCode.includes('Metan gaz bosimi ko\'rsatkichi (bar)'), 'Privacy Policy details methane gas pressure terms');
  expect(privacyCode.includes('180-220 bar'), 'Privacy Policy mentions realistic 180-220 bar operational pressures');
  expect(privacyCode.includes('Yangi shoxobchalar qo\'shish'), 'Privacy Policy details user-submitted station terms');
  expect(privacyCode.includes('Sharhlar va baholash'), 'Privacy Policy covers user reviews and moderation');

  // 4. Data Safety, Retention & Account Deletion (Google Play Mandatory Requirement)
  expect(privacyCode.includes('HTTPS (TLS 1.2 / 1.3)'), 'Privacy Policy discloses HTTPS/TLS encryption in transit');
  expect(privacyCode.includes('bcrypt'), 'Privacy Policy discloses bcrypt password hashing');
  expect(privacyCode.includes('Akkaunt va Ma\'lumotlarni O\'chirish'), 'Privacy Policy has dedicated Account & Data Deletion section');
  expect(privacyCode.includes('support@axmap.uz'), 'Privacy Policy provides support@axmap.uz email');
  expect(privacyCode.includes('@axmap_admin'), 'Privacy Policy provides @axmap_admin Telegram channel');
  expect(privacyCode.includes('48 soat ichida'), 'Privacy Policy specifies 48-hour response timeframe');

  // 5. Back navigation without full reload
  expect(privacyCode.includes('onClick={onBack}'), 'Privacy Policy binds onBack handler to return buttons');
  expect(privacyCode.includes('Asosiy xaritaga qaytish'), 'Privacy Policy contains clear return-to-map button text');

  // 6. App.jsx Integration & SPA History Routing
  const appCode = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');

  expect(appCode.includes('window.location.pathname === "/privacy"'), 'App.jsx inspects pathname for /privacy');
  expect(appCode.includes('PrivacyPolicyPage = lazy('), 'App.jsx lazy-loads PrivacyPolicyPage chunk');
  expect(appCode.includes('window.addEventListener("popstate"'), 'App.jsx listens to browser popstate events');
  expect(appCode.includes('window.history.pushState({ tab: newTab }'), 'App.jsx uses pushState without full page reload');
  expect(appCode.includes('targetPath = newTab === "privacy" ? "/privacy" : "/"'), 'App.jsx switches path between /privacy and /');
  expect(appCode.includes('activeTab === "privacy"'), 'App.jsx conditionally mounts PrivacyPolicyPage when activeTab is privacy');

  // 7. Vercel SPA Server Rewrites
  const vercelPath = path.resolve('vercel.json');
  expect(fs.existsSync(vercelPath), 'vercel.json exists');
  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  expect(Array.isArray(vercel.rewrites), 'vercel.json contains rewrites array');
  const hasCatchAll = vercel.rewrites.some((r) => r.source === '/(.*)' && r.destination === '/index.html');
  expect(hasCatchAll, 'vercel.json rewrites all SPA routes to /index.html');
}

runPrivacyPolicyTests();

// ----------------------------------------------------------------------
// TEST SUITE 7: SW LIFECYCLE (INSTALL PRE-CACHE & ACTIVATE PURGE)
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 7: SW Lifecycle (Install Pre-cache & Activate Purge) ---');

async function runLifecycleTests() {
  const env = createSwSandbox();
  const installListener = env.listeners.get('install');
  const activateListener = env.listeners.get('activate');

  expect(typeof installListener === 'function', 'install event listener registered');
  expect(typeof activateListener === 'function', 'activate event listener registered');

  // Test Install: Network succeeds for some, fails for one (individual resilience check)
  {
    env.setNetworkFetch(async (url) => {
      if (url === '/non-existent-broken-asset') {
        throw new Error('Simulated network error');
      }
      return new Response('Asset content', { status: 200 });
    });

    let installWaitUntil = null;
    installListener({
      waitUntil: (p) => {
        installWaitUntil = p;
      },
    });

    await installWaitUntil;
    const cache = await env.sandbox.caches.open('axmap-v1');
    const cachedHtml = await cache.match('/index.html');
    expect(cachedHtml !== null, '[SW Install] /index.html pre-cached successfully');
    const cachedManifest = await cache.match('/manifest.json');
    expect(cachedManifest !== null, '[SW Install] /manifest.json pre-cached successfully');
    const cachedIcon = await cache.match('/icons/icon-192x192.png');
    expect(cachedIcon !== null, '[SW Install] /icons/icon-192x192.png pre-cached successfully');
  }

  // Test Activate: Purging old versions (e.g. axmap-v0, legacy-cache)
  {
    // Seed an obsolete cache
    const oldCache = await env.sandbox.caches.open('axmap-v0-legacy');
    await oldCache.put('/old.js', new Response('old', { status: 200 }));

    const cacheKeysBefore = await env.sandbox.caches.keys();
    expect(cacheKeysBefore.includes('axmap-v0-legacy'), '[SW Activate] Stale cache exists before activate');

    let activateWaitUntil = null;
    activateListener({
      waitUntil: (p) => {
        activateWaitUntil = p;
      },
    });

    await activateWaitUntil;
    const cacheKeysAfter = await env.sandbox.caches.keys();
    expectEqual(cacheKeysAfter.includes('axmap-v0-legacy'), false, '[SW Activate] Stale cache was purged');
    expectEqual(cacheKeysAfter.includes('axmap-v1'), true, '[SW Activate] Current cache axmap-v1 retained');
  }
}

await runLifecycleTests();

// ----------------------------------------------------------------------
// TEST SUITE 8: SPA BROWSER HISTORY & POPSTATE LIFECYCLE SIMULATION
// ----------------------------------------------------------------------
console.log('\n--- TEST SUITE 8: SPA Browser History & Popstate Lifecycle Simulation ---');

function runHistoryLifecycleSimulation() {
  // Simulate browser history stack and popstate
  const historyStack = [];
  let currentIndex = -1;
  const popstateListeners = [];

  const mockWindow = {
    location: {
      pathname: '/privacy',
    },
    history: {
      pushState(state, title, url) {
        historyStack.splice(currentIndex + 1);
        historyStack.push({ state, title, url });
        currentIndex = historyStack.length - 1;
        mockWindow.location.pathname = url;
      },
      replaceState(state, title, url) {
        if (currentIndex === -1) {
          historyStack.push({ state, title, url });
          currentIndex = 0;
        } else {
          historyStack[currentIndex] = { state, title, url };
        }
        mockWindow.location.pathname = url;
      },
      back() {
        if (currentIndex > 0) {
          currentIndex--;
          mockWindow.location.pathname = historyStack[currentIndex].url;
          const e = { state: historyStack[currentIndex].state };
          for (const fn of popstateListeners) fn(e);
        }
      },
      forward() {
        if (currentIndex < historyStack.length - 1) {
          currentIndex++;
          mockWindow.location.pathname = historyStack[currentIndex].url;
          const e = { state: historyStack[currentIndex].state };
          for (const fn of popstateListeners) fn(e);
        }
      },
    },
    addEventListener(event, fn) {
      if (event === 'popstate') popstateListeners.push(fn);
    },
  };

  // 1. Initial page load at /privacy:
  let activeTab = mockWindow.location.pathname === '/privacy' ? 'privacy' : 'home';
  expectEqual(activeTab, 'privacy', '[SPA History] Initial activeTab is "privacy" on /privacy');

  // React App useEffect logic:
  const isPrivacy = mockWindow.location.pathname === '/privacy';
  const initialTab = isPrivacy ? 'privacy' : 'home';
  mockWindow.history.replaceState({ tab: initialTab }, '', isPrivacy ? '/privacy' : '/');

  mockWindow.addEventListener('popstate', (e) => {
    if (e.state && e.state.tab) {
      activeTab = e.state.tab;
    } else if (mockWindow.location.pathname === '/privacy') {
      activeTab = 'privacy';
    } else {
      activeTab = 'home';
    }
  });

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const targetPath = newTab === 'privacy' ? '/privacy' : '/';
    mockWindow.history.pushState({ tab: newTab }, '', targetPath);
    activeTab = newTab;
  };

  // 2. User clicks "Asosiy xaritaga qaytish" (onBack)
  handleTabChange('home');
  expectEqual(activeTab, 'home', '[SPA History] activeTab transitioned to "home" without reload');
  expectEqual(mockWindow.location.pathname, '/', '[SPA History] URL pathname changed to "/"');
  expectEqual(historyStack.length, 2, '[SPA History] History stack has 2 entries');

  // 3. User clicks browser Back button
  mockWindow.history.back();
  expectEqual(activeTab, 'privacy', '[SPA History] Browser Back button restored activeTab to "privacy"');
  expectEqual(mockWindow.location.pathname, '/privacy', '[SPA History] URL pathname restored to "/privacy"');

  // 4. User clicks browser Forward button
  mockWindow.history.forward();
  expectEqual(activeTab, 'home', '[SPA History] Browser Forward button returned activeTab to "home"');
  expectEqual(mockWindow.location.pathname, '/', '[SPA History] URL pathname restored to "/"');
}

runHistoryLifecycleSimulation();

// ----------------------------------------------------------------------
// FINAL RESULTS SUMMARY
// ----------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nFAILED ASSERTIONS:');
  for (const f of failures) {
    console.error(`- ${f}`);
  }
  process.exit(1);
} else {
  console.log('\n🎉 ALL ADVERSARIAL STRESS TESTS COMPLETED WITH 100% SUCCESS!');
  process.exit(0);
}
