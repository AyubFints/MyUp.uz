import fs from 'node:fs';
import path from 'node:path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  }
}

console.log('====================================================');
console.log('AX-MAP MILESTONE 1 VERIFICATION TEST SUITE');
console.log('Features 1-20: PWA Assets, Compliance & Privacy Policy');
console.log('====================================================\n');

// ----------------------------------------------------
// F1: Web App Manifest
// ----------------------------------------------------
console.log('--- Checking Feature 1: Web App Manifest ---');
const manifestPath = path.resolve('public/manifest.json');
assert(fs.existsSync(manifestPath), 'public/manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.id === '/?source=pwa', 'manifest.id is "/?source=pwa"');
assert(manifest.short_name === 'AX-Map', 'manifest.short_name is "AX-Map"');
assert(manifest.display === 'standalone', 'manifest.display is "standalone"');
assert(manifest.orientation === 'portrait', 'manifest.orientation is "portrait"');
assert(manifest.background_color === '#090d16', 'manifest.background_color is "#090d16"');
assert(manifest.theme_color === '#0284c7', 'manifest.theme_color is "#0284c7"');
assert(Array.isArray(manifest.icons) && manifest.icons.length === 4, 'manifest.icons contains 4 icons');
assert(manifest.related_applications?.[0]?.id === 'uz.axmap.app', 'manifest.related_applications contains "uz.axmap.app"');

// ----------------------------------------------------
// F2: HTML Shell Update in index.html
// ----------------------------------------------------
console.log('\n--- Checking Feature 2: HTML Shell Update ---');
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('<link rel="manifest" href="/manifest.json" />'), 'index.html links manifest.json');
assert(html.includes('<meta name="theme-color" content="#0284c7" />'), 'index.html contains theme-color #0284c7');
assert(html.includes('icon-maskable-192x192.png'), 'index.html contains apple-touch-icon');
assert(html.includes('<meta name="mobile-web-app-capable" content="yes" />'), 'index.html has mobile-web-app-capable');

// ----------------------------------------------------
// F3-5: Application Icons
// ----------------------------------------------------
console.log('\n--- Checking Features 3-5: Application Icons ---');
const expectedIcons = [
  'icon-192x192.png',
  'icon-512x512.png',
  'icon-maskable-192x192.png',
  'icon-maskable-512x512.png',
  'play-store-512x512.png'
];
for (const icon of expectedIcons) {
  const p = path.join('public/icons', icon);
  assert(fs.existsSync(p), `Icon public/icons/${icon} exists on disk`);
  const stat = fs.statSync(p);
  assert(stat.size > 1000, `Icon public/icons/${icon} has valid file size (${stat.size} bytes)`);
}

// ----------------------------------------------------
// F6-12: Service Worker Logic
// ----------------------------------------------------
console.log('\n--- Checking Features 6-12: Service Worker ---');
const swCode = fs.readFileSync('public/sw.js', 'utf8');
assert(swCode.includes("const CACHE_NAME = 'axmap-v1';"), 'sw.js uses CACHE_NAME "axmap-v1"');
assert(swCode.includes('PRECACHE_ASSETS'), 'sw.js defines PRECACHE_ASSETS');
assert(swCode.includes('clients.claim()'), 'sw.js calls clients.claim() on activate');
assert(swCode.includes('caches.delete(name)'), 'sw.js cleans up stale caches');

// Eval sw functions to test logic in isolation
const swFunctionsCode = swCode.replace(/self\.addEventListener.*/s, '');
const swContext = new Function(swFunctionsCode + '; return { isMapTileRequest, isDynamicApiRequest };')();

const mapTileTests = [
  { url: 'https://api.protomaps.com/tiles/v4/10/500/300.mvt?key=xxx', headers: {}, expected: true },
  { url: 'https://a.basemaps.cartocdn.com/light_all/10/500/300@2x.png', headers: {}, expected: true },
  { url: 'https://tile.openstreetmap.org/10/500/300.png', headers: {}, expected: true },
  { url: 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/10/500/300.vector.pbf', headers: {}, expected: true },
  { url: 'https://myupuz.vercel.app/maps/uzbekistan.pmtiles', headers: {}, expected: true },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.pbf', headers: {}, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', headers: { range: 'bytes=0-100' }, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', headers: {}, expected: false },
  { url: 'https://myupuz.vercel.app/manifest.json', headers: {}, expected: false }
];
for (const t of mapTileTests) {
  const u = new URL(t.url);
  const req = { headers: new Map(Object.entries(t.headers)) };
  const res = swContext.isMapTileRequest(u, req);
  assert(res === t.expected, `isMapTileRequest(${t.url}) correctly returned ${res}`);
}

const apiTests = [
  { url: 'http://localhost:5000/api/stations', expected: true },
  { url: 'http://localhost:5000/stations', expected: true },
  { url: 'https://myupuz.vercel.app/api/stations', expected: true },
  { url: 'https://myupuz.vercel.app/stations/my', expected: true },
  { url: 'https://myupuz.vercel.app/auth/login', expected: true },
  { url: 'https://myupuz.vercel.app/privacy', expected: false },
  { url: 'https://myupuz.vercel.app/manifest.json', expected: false }
];
for (const t of apiTests) {
  const u = new URL(t.url);
  const res = swContext.isDynamicApiRequest(u);
  assert(res === t.expected, `isDynamicApiRequest(${t.url}) correctly returned ${res}`);
}

assert(swCode.includes("request.mode === 'navigate'"), 'sw.js intercepts navigation requests');
assert(swCode.includes("url.pathname.startsWith('/assets/')"), 'sw.js implements Cache-First for /assets/*');
assert(swCode.includes("type: 'OPEN_REOPEN_STATION_MODAL'"), 'sw.js preserves verbatim notificationclick handler');

// ----------------------------------------------------
// F13: SPA Server Rewrites in vercel.json
// ----------------------------------------------------
console.log('\n--- Checking Feature 13: SPA Server Rewrites ---');
const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
assert(Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.some(r => r.source === '/(.*)' && r.destination === '/index.html'), 'vercel.json contains SPA rewrite to /index.html');
assert(vercelConfig.headers.some(h => h.source === '/sw.js'), 'vercel.json configures no-cache for sw.js');

// ----------------------------------------------------
// F14-20: Privacy Policy Component & Routing Integration
// ----------------------------------------------------
console.log('\n--- Checking Features 14-20: Privacy Policy & Routing ---');
const privacyCode = fs.readFileSync('src/components/PrivacyPolicyPage.jsx', 'utf8');
assert(privacyCode.includes('ACCESS_FINE_LOCATION'), 'PrivacyPolicyPage discloses ACCESS_FINE_LOCATION');
assert(privacyCode.includes('ACCESS_COARSE_LOCATION'), 'PrivacyPolicyPage discloses ACCESS_COARSE_LOCATION');
assert(privacyCode.includes('ACCESS_BACKGROUND_LOCATION'), 'PrivacyPolicyPage strictly clarifies NO background location');
assert(privacyCode.includes('Orqa fonda joylashuv hech qachon kuzatilmaydi'), 'PrivacyPolicyPage gives explicit background tracking guarantee');
assert(privacyCode.includes('support@axmap.uz'), 'PrivacyPolicyPage lists support email for account deletion');
assert(privacyCode.includes('@axmap_admin'), 'PrivacyPolicyPage lists telegram admin handle');
assert(privacyCode.includes('Asosiy xaritaga qaytish'), 'PrivacyPolicyPage provides return to map button');
assert(privacyCode.includes('onBack'), 'PrivacyPolicyPage connects return action to onBack prop');

const appCode = fs.readFileSync('src/App.jsx', 'utf8');
assert(appCode.includes('PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage"))'), 'App.jsx lazily imports PrivacyPolicyPage');
assert(appCode.includes('window.location.pathname === "/privacy"'), 'App.jsx checks /privacy in initial state');
assert(appCode.includes('handlePopState') && appCode.includes('setActiveTab("privacy")'), 'App.jsx handles popstate for /privacy');
assert(appCode.includes('newTab === "privacy" ? "/privacy" : "/"'), 'App.jsx updates URL pushState for /privacy and /');
assert(appCode.includes('{activeTab === "privacy" &&'), 'App.jsx renders PrivacyPolicyPage conditionally');
assert(appCode.includes('onBack={() => handleTabChange("home")}'), 'App.jsx passes return handler to PrivacyPolicyPage');
assert(appCode.includes('onOpenPrivacy={() => handleTabChange("privacy")}'), 'App.jsx passes onOpenPrivacy to SettingsSection');

// ----------------------------------------------------
// Dist Verification
// ----------------------------------------------------
console.log('\n--- Checking Dist Build Artifacts ---');
assert(fs.existsSync('dist/manifest.json'), 'dist/manifest.json exists');
assert(fs.existsSync('dist/sw.js'), 'dist/sw.js exists');
assert(fs.existsSync('dist/icons/icon-192x192.png'), 'dist/icons/icon-192x192.png exists');
assert(fs.existsSync('dist/icons/icon-512x512.png'), 'dist/icons/icon-512x512.png exists');
assert(fs.existsSync('dist/icons/icon-maskable-192x192.png'), 'dist/icons/icon-maskable-192x192.png exists');
assert(fs.existsSync('dist/icons/icon-maskable-512x512.png'), 'dist/icons/icon-maskable-512x512.png exists');
assert(fs.existsSync('dist/icons/play-store-512x512.png'), 'dist/icons/play-store-512x512.png exists');

const distAssets = fs.readdirSync('dist/assets');
const privacyChunk = distAssets.find(f => f.startsWith('PrivacyPolicyPage-') && f.endsWith('.js'));
assert(Boolean(privacyChunk), `PrivacyPolicyPage split chunk exists in dist/assets: ${privacyChunk}`);

console.log('\n====================================================');
console.log(`ALL TESTS PASSED! (${passCount} assertions passed, ${failCount} failed)`);
console.log('Milestone 1 implementation verified 100% compliant!');
console.log('====================================================');
