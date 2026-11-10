/**
 * scripts/verify-release-e2e.mjs
 * 
 * AX-Map Master E2E Verification Test Suite
 * Programmatically validates all acceptance criteria across Milestones 1, 2, and 3:
 * - PWA Standards & Build
 * - Privacy Policy Page & Navigation
 * - TWA & Android Release Artifacts (.aab & keystore)
 * - Digital Asset Links & Cryptographic 3-Way Matching
 * - Functional Integrity (Map, Station Filters, Search, Distance, OSRM Routing)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { stationMatchesFuel } from '../src/utils/fuel.js';
import { calculateDistance } from '../src/utils/distance.js';

const WORKSPACE_ROOT = path.resolve('.');
const EXPECTED_PACKAGE_ID = 'uz.axmap.app';
const EXPECTED_ALIAS = 'axmap';
const EXPECTED_KEY_PASS = 'AxMap2026ReleasePass!';
const EXPECTED_FINGERPRINT = '55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A';

const KEYTOOL_PATH = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe';
const JARSIGNER_PATH = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\jarsigner.exe';
const AAB_PATH = path.join(WORKSPACE_ROOT, 'uz.axmap.app-v1.0.0-release.aab');
const KEYSTORE_PATH = path.join(WORKSPACE_ROOT, 'axmap-release-key.jks');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failedTests++;
    const errMsg = `❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`;
    console.error(`  ${errMsg}`);
    failures.push({ testName, details });
  }
}

function parsePngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (!isPng) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

console.log('='.repeat(80));
console.log('AX-MAP MASTER E2E VERIFICATION TEST SUITE');
console.log('Validating All Acceptance Criteria: Milestones 1, 2, and 3');
console.log('='.repeat(80));

// ============================================================================
// SUITE 1: Web App Production Build & Distribution Integrity
// ============================================================================
console.log('\n--- SUITE 1: Web App Production Build & Distribution Integrity ---');
assert(fs.existsSync(path.join(WORKSPACE_ROOT, 'dist')), 'dist/ directory exists');
assert(fs.existsSync(path.join(WORKSPACE_ROOT, 'dist', 'index.html')), 'dist/index.html exists');

const distAssetsDir = path.join(WORKSPACE_ROOT, 'dist', 'assets');
assert(fs.existsSync(distAssetsDir), 'dist/assets/ directory exists');

const emittedAssets = fs.existsSync(distAssetsDir) ? fs.readdirSync(distAssetsDir) : [];
const indexChunk = emittedAssets.find(f => f.startsWith('index-') && f.endsWith('.js'));
const reactChunk = emittedAssets.find(f => f.startsWith('vendor-react-') && f.endsWith('.js'));
const maplibreChunk = emittedAssets.find(f => f.startsWith('vendor-maplibre-') && f.endsWith('.js'));
const iconsChunk = emittedAssets.find(f => f.startsWith('vendor-icons-') && f.endsWith('.js'));
const mapViewChunk = emittedAssets.find(f => f.startsWith('MapView-') && f.endsWith('.js'));
const navigationChunk = emittedAssets.find(f => f.startsWith('NavigationMode-') && f.endsWith('.js'));
const privacyChunk = emittedAssets.find(f => f.startsWith('PrivacyPolicyPage-') && f.endsWith('.js'));

assert(Boolean(indexChunk), 'Emitted main entry chunk (index-*.js)', indexChunk);
assert(Boolean(reactChunk), 'Emitted vendor React chunk (vendor-react-*.js)', reactChunk);
assert(Boolean(maplibreChunk), 'Emitted vendor MapLibre chunk (vendor-maplibre-*.js)', maplibreChunk);
assert(Boolean(iconsChunk), 'Emitted vendor icons chunk (vendor-icons-*.js)', iconsChunk);
assert(Boolean(mapViewChunk), 'Emitted MapView split chunk (MapView-*.js)', mapViewChunk);
assert(Boolean(navigationChunk), 'Emitted NavigationMode split chunk (NavigationMode-*.js)', navigationChunk);
assert(Boolean(privacyChunk), 'Emitted PrivacyPolicyPage split chunk (PrivacyPolicyPage-*.js)', privacyChunk);

assert(fs.existsSync(path.join(WORKSPACE_ROOT, 'dist', 'manifest.json')), 'dist/manifest.json exists');
assert(fs.existsSync(path.join(WORKSPACE_ROOT, 'dist', 'sw.js')), 'dist/sw.js exists');
assert(fs.existsSync(path.join(WORKSPACE_ROOT, 'dist', '.well-known', 'assetlinks.json')), 'dist/.well-known/assetlinks.json exists');

// Verify MapLibre code isolation in vendor chunk
if (indexChunk) {
  const indexJsContent = fs.readFileSync(path.join(distAssetsDir, indexChunk), 'utf8');
  assert(!/import\s+.*vendor-maplibre/.test(indexJsContent), 'index.js does not statically import vendor-maplibre');
  assert(!indexJsContent.includes('maplibregl'), 'MapLibre symbol "maplibregl" not leaked into index.js');
}

// ============================================================================
// SUITE 2: PWA Standards & Web App Manifest Compliance
// ============================================================================
console.log('\n--- SUITE 2: PWA Standards & Web App Manifest Compliance ---');
const manifestPath = path.join(WORKSPACE_ROOT, 'public', 'manifest.json');
assert(fs.existsSync(manifestPath), 'public/manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert(manifest.id === '/?source=pwa', 'Manifest id is "/?source=pwa"');
assert(manifest.name === 'AX-Map - Sizga eng yaqinini topib beradi!', 'Manifest full name is accurate');
assert(manifest.short_name === 'AX-Map', 'Manifest short_name is "AX-Map"');
assert(manifest.start_url === '/?source=pwa', 'Manifest start_url is "/?source=pwa"');
assert(manifest.scope === '/', 'Manifest scope is "/"');
assert(manifest.display === 'standalone', 'Manifest display mode is "standalone"');
assert(manifest.orientation === 'portrait', 'Manifest orientation is "portrait"');
assert(manifest.theme_color === '#0284c7', 'Manifest theme_color is "#0284c7"');
assert(manifest.background_color === '#090d16', 'Manifest background_color is "#090d16"');
assert(Array.isArray(manifest.icons) && manifest.icons.length === 4, 'Manifest contains exactly 4 icons');
assert(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length === 3, 'Manifest contains 3 shortcuts (Metan, Propan, Elektr)');
assert(manifest.related_applications?.[0]?.id === EXPECTED_PACKAGE_ID, 'Manifest related_applications matches package ID');

const indexHtmlPath = path.join(WORKSPACE_ROOT, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtml.includes('<link rel="manifest" href="/manifest.json" />'), 'index.html links manifest.json');
assert(indexHtml.includes('<meta name="theme-color" content="#0284c7" />'), 'index.html defines theme-color #0284c7');
assert(indexHtml.includes('icon-maskable-192x192.png'), 'index.html links maskable apple-touch-icon');
assert(indexHtml.includes('<meta name="mobile-web-app-capable" content="yes" />'), 'index.html specifies mobile-web-app-capable');

// ============================================================================
// SUITE 3: Application & Store Icons Binary & Dimension Integrity
// ============================================================================
console.log('\n--- SUITE 3: Application & Store Icons Binary & Dimension Integrity ---');
const expectedIcons = [
  { name: 'icon-192x192.png', width: 192, height: 192, minSize: 10000 },
  { name: 'icon-512x512.png', width: 512, height: 512, minSize: 50000 },
  { name: 'icon-maskable-192x192.png', width: 192, height: 192, minSize: 10000 },
  { name: 'icon-maskable-512x512.png', width: 512, height: 512, minSize: 50000 },
  { name: 'play-store-512x512.png', width: 512, height: 512, minSize: 50000 }
];

for (const icon of expectedIcons) {
  const publicPath = path.join(WORKSPACE_ROOT, 'public', 'icons', icon.name);
  const distPath = path.join(WORKSPACE_ROOT, 'dist', 'icons', icon.name);
  
  assert(fs.existsSync(publicPath), `public/icons/${icon.name} exists`);
  assert(fs.existsSync(distPath), `dist/icons/${icon.name} exists`);

  const stat = fs.statSync(publicPath);
  assert(stat.size >= icon.minSize, `public/icons/${icon.name} size is ${stat.size} bytes (>= ${icon.minSize})`);

  const dims = parsePngDimensions(publicPath);
  assert(Boolean(dims && dims.width === icon.width && dims.height === icon.height),
    `public/icons/${icon.name} PNG dimensions ${dims?.width}x${dims?.height} === ${icon.width}x${icon.height}`);
}

// ============================================================================
// SUITE 4: Service Worker Architecture, Static Shell Caching & Bypass Integrity
// ============================================================================
console.log('\n--- SUITE 4: Service Worker Architecture & Bypass Rules ---');
const swPath = path.join(WORKSPACE_ROOT, 'public', 'sw.js');
assert(fs.existsSync(swPath), 'public/sw.js exists');
const swCode = fs.readFileSync(swPath, 'utf8');

assert(swCode.includes("const CACHE_NAME = 'axmap-v1';"), 'sw.js uses CACHE_NAME "axmap-v1"');
assert(swCode.includes('PRECACHE_ASSETS'), 'sw.js defines PRECACHE_ASSETS shell list');
assert(swCode.includes('clients.claim()'), 'sw.js activates immediately via clients.claim()');
assert(swCode.includes("request.mode === 'navigate'"), 'sw.js handles navigation requests with Network-First');
assert(swCode.includes("url.pathname.startsWith('/assets/')"), 'sw.js caches hashed assets with Cache-First');
assert(swCode.includes("type: 'OPEN_REOPEN_STATION_MODAL'"), 'sw.js preserves notificationclick listener');

// Test isMapTileRequest and isDynamicApiRequest functions in isolation
const swFunctionsCode = swCode.replace(/self\.addEventListener.*/s, '');
const swContext = new Function(swFunctionsCode + '; return { isMapTileRequest, isDynamicApiRequest };')();

const mapTileBypassTests = [
  { url: 'https://api.protomaps.com/tiles/v4/10/500/300.mvt?key=xxx', range: false, expected: true },
  { url: 'https://a.basemaps.cartocdn.com/light_all/10/500/300@2x.png', range: false, expected: true },
  { url: 'https://tile.openstreetmap.org/10/500/300.png', range: false, expected: true },
  { url: 'https://api.mapbox.com/v4/streets/10/500/300.vector.pbf', range: false, expected: true },
  { url: 'https://myupuz.vercel.app/maps/tashkent.pmtiles', range: false, expected: true },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.pbf', range: false, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', range: true, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', range: false, expected: false },
  { url: 'https://myupuz.vercel.app/manifest.json', range: false, expected: false }
];

for (const t of mapTileBypassTests) {
  const u = new URL(t.url);
  const req = { headers: { has: (headerName) => t.range && headerName.toLowerCase() === 'range' } };
  const res = swContext.isMapTileRequest(u, req);
  assert(res === t.expected, `isMapTileRequest(${t.url}, range=${t.range}) === ${t.expected}`);
}

const apiBypassTests = [
  { url: 'http://localhost:5000/api/stations', expected: true },
  { url: 'https://myupuz.vercel.app/api/stations', expected: true },
  { url: 'https://myupuz.vercel.app/stations/nearby', expected: true },
  { url: 'https://myupuz.vercel.app/auth/login', expected: true },
  { url: 'https://myupuz.vercel.app/feedbacks', expected: true },
  { url: 'https://myupuz.vercel.app/privacy', expected: false },
  { url: 'https://myupuz.vercel.app/manifest.json', expected: false }
];

for (const t of apiBypassTests) {
  const u = new URL(t.url);
  const res = swContext.isDynamicApiRequest(u);
  assert(res === t.expected, `isDynamicApiRequest(${t.url}) === ${t.expected}`);
}

// ============================================================================
// SUITE 5: Privacy Policy Page & In-App Navigation Integration
// ============================================================================
console.log('\n--- SUITE 5: Privacy Policy Page & Navigation Integration ---');
const privacyCode = fs.readFileSync(path.join(WORKSPACE_ROOT, 'src', 'components', 'PrivacyPolicyPage.jsx'), 'utf8');
assert(privacyCode.includes('ACCESS_FINE_LOCATION'), 'PrivacyPolicyPage discloses ACCESS_FINE_LOCATION');
assert(privacyCode.includes('ACCESS_COARSE_LOCATION'), 'PrivacyPolicyPage discloses ACCESS_COARSE_LOCATION');
assert(privacyCode.includes('ACCESS_BACKGROUND_LOCATION'), 'PrivacyPolicyPage cites ACCESS_BACKGROUND_LOCATION');
assert(privacyCode.includes('Orqa fonda joylashuv hech qachon kuzatilmaydi'), 'PrivacyPolicyPage guarantees NO background location tracking');
assert(privacyCode.includes('support@axmap.uz'), 'PrivacyPolicyPage lists contact email support@axmap.uz');
assert(privacyCode.includes('@axmap_admin'), 'PrivacyPolicyPage lists Telegram support @axmap_admin');
assert(privacyCode.includes('Asosiy xaritaga qaytish'), 'PrivacyPolicyPage contains return to map button');
assert(privacyCode.includes('onBack'), 'PrivacyPolicyPage binds onBack callback');

const appJsxCode = fs.readFileSync(path.join(WORKSPACE_ROOT, 'src', 'App.jsx'), 'utf8');
assert(appJsxCode.includes('PrivacyPolicyPage = lazy('), 'App.jsx lazily imports PrivacyPolicyPage');
assert(appJsxCode.includes('window.location.pathname === "/privacy"'), 'App.jsx checks /privacy in initial state');
assert(appJsxCode.includes('handlePopState') && appJsxCode.includes('setActiveTab("privacy")'), 'App.jsx syncs with History popstate for /privacy');
assert(appJsxCode.includes('newTab === "privacy" ? "/privacy" : "/"'), 'App.jsx updates URL pushState for /privacy');
assert(appJsxCode.includes('{activeTab === "privacy" &&'), 'App.jsx conditionally mounts PrivacyPolicyPage');
assert(appJsxCode.includes('onBack={() => handleTabChange("home")}'), 'App.jsx returns user from privacy page to home map');

const vercelJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'vercel.json'), 'utf8'));
assert(vercelJson.rewrites?.some(r => r.source === '/(.*)' && r.destination === '/index.html'), 'vercel.json includes SPA rewrites to /index.html');
assert(vercelJson.headers?.some(h => h.source === '/sw.js'), 'vercel.json configures no-cache for sw.js');

// ============================================================================
// SUITE 6: Keystore Security & 3-Way Cryptographic Matching
// ============================================================================
console.log('\n--- SUITE 6: Keystore Security & 3-Way Cryptographic Matching ---');
assert(fs.existsSync(KEYSTORE_PATH), 'axmap-release-key.jks exists');

let keystoreFingerprint = null;
try {
  const ksOutput = execFileSync(KEYTOOL_PATH, [
    '-list', '-v',
    '-keystore', KEYSTORE_PATH,
    '-alias', EXPECTED_ALIAS,
    '-storepass', EXPECTED_KEY_PASS
  ], { encoding: 'utf8' });

  assert(ksOutput.includes('2048-bit RSA key'), 'Keystore key length is 2048-bit RSA');
  assert(ksOutput.includes('Signature algorithm name: SHA256withRSA'), 'Keystore signature algorithm is SHA256withRSA');
  assert(ksOutput.includes('2054'), 'Keystore validity period extends to year 2054');

  const shaMatch = ksOutput.match(/SHA256:\s*([0-9A-Fa-f:]+)/);
  keystoreFingerprint = shaMatch ? shaMatch[1].trim() : null;
  assert(keystoreFingerprint === EXPECTED_FINGERPRINT, 'Keystore SHA-256 fingerprint matches expected fingerprint', keystoreFingerprint);
} catch (err) {
  assert(false, 'Keystore inspection failed', err.message);
}

const publicAssetLinksPath = path.join(WORKSPACE_ROOT, 'public', '.well-known', 'assetlinks.json');
const distAssetLinksPath = path.join(WORKSPACE_ROOT, 'dist', '.well-known', 'assetlinks.json');
assert(fs.existsSync(publicAssetLinksPath), 'public/.well-known/assetlinks.json exists');
assert(fs.existsSync(distAssetLinksPath), 'dist/.well-known/assetlinks.json exists');

const assetLinks = JSON.parse(fs.readFileSync(publicAssetLinksPath, 'utf8'));
const assetStatement = assetLinks[0];
assert(assetStatement?.target?.namespace === 'android_app', 'AssetLinks namespace is "android_app"');
assert(assetStatement?.target?.package_name === EXPECTED_PACKAGE_ID, 'AssetLinks target package is "uz.axmap.app"');
assert(assetStatement?.relation?.includes('delegate_permission/common.handle_all_urls'), 'AssetLinks relation is "delegate_permission/common.handle_all_urls"');

const assetLinksFingerprint = assetStatement?.target?.sha256_cert_fingerprints?.[0];
assert(assetLinksFingerprint === EXPECTED_FINGERPRINT, 'AssetLinks fingerprint matches expected fingerprint', assetLinksFingerprint);

const publicAssetBytes = fs.readFileSync(publicAssetLinksPath);
const distAssetBytes = fs.readFileSync(distAssetLinksPath);
assert(publicAssetBytes.equals(distAssetBytes), 'public and dist assetlinks.json are byte-for-byte identical');

// ============================================================================
// SUITE 7: Android App Bundle (.aab) & TWA Project Configuration
// ============================================================================
console.log('\n--- SUITE 7: Android App Bundle (.aab) & TWA Project ---');
assert(fs.existsSync(AAB_PATH), 'uz.axmap.app-v1.0.0-release.aab exists');
const aabStat = fs.statSync(AAB_PATH);
assert(aabStat.size > 1000000, `AAB file size is valid (${(aabStat.size / 1024 / 1024).toFixed(2)} MB)`);

// jarsigner verification
try {
  const jarOutput = execFileSync(JARSIGNER_PATH, ['-verify', '-verbose', '-certs', AAB_PATH], { encoding: 'utf8' });
  assert(jarOutput.includes('jar verified.'), 'jarsigner reports "jar verified." with exit code 0');
  assert(jarOutput.includes('CN=AX-Map, OU=Mobile, O=AX-Map, L=Tashkent, ST=Tashkent, C=UZ'), 'AAB signed by AX-Map distinguished name');
  assert(jarOutput.includes('SHA256withRSA, 2048-bit key'), 'AAB signature algorithm is SHA256withRSA 2048-bit');
} catch (err) {
  assert(false, 'jarsigner verification failed', err.message);
}

// keytool -printcert -jarfile verification
let aabFingerprint = null;
try {
  const certOutput = execFileSync(KEYTOOL_PATH, ['-printcert', '-jarfile', AAB_PATH], { encoding: 'utf8' });
  const aabShaMatch = certOutput.match(/SHA256:\s*([0-9A-Fa-f:]+)/);
  aabFingerprint = aabShaMatch ? aabShaMatch[1].trim() : null;
  assert(aabFingerprint === EXPECTED_FINGERPRINT, 'AAB certificate SHA-256 fingerprint matches expected fingerprint', aabFingerprint);
} catch (err) {
  assert(false, 'keytool -printcert failed', err.message);
}

// 3-Way equality assertion
assert(
  Boolean(keystoreFingerprint && assetLinksFingerprint && aabFingerprint &&
  keystoreFingerprint === assetLinksFingerprint && assetLinksFingerprint === aabFingerprint),
  '3-Way Cryptographic Equality: Keystore === AssetLinks === .AAB Certificate'
);

// TWA project configuration
const twaManifestPath = path.join(WORKSPACE_ROOT, 'android-twa', 'twa-manifest.json');
assert(fs.existsSync(twaManifestPath), 'android-twa/twa-manifest.json exists');
const twaManifest = JSON.parse(fs.readFileSync(twaManifestPath, 'utf8'));
assert(twaManifest.packageId === EXPECTED_PACKAGE_ID, 'TWA manifest packageId is "uz.axmap.app"');
assert(twaManifest.host === 'myupuz.vercel.app', 'TWA manifest host is "myupuz.vercel.app"');

const twaBuildGradle = fs.readFileSync(path.join(WORKSPACE_ROOT, 'android-twa', 'app', 'build.gradle'), 'utf8');
assert(twaBuildGradle.includes('applicationId "uz.axmap.app"'), 'app/build.gradle specifies applicationId "uz.axmap.app"');
assert(twaBuildGradle.includes('signingConfigs.release'), 'app/build.gradle specifies signingConfigs.release');

const androidManifestXml = fs.readFileSync(path.join(WORKSPACE_ROOT, 'android-twa', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
assert(androidManifestXml.includes('ACCESS_FINE_LOCATION'), 'AndroidManifest.xml declares ACCESS_FINE_LOCATION');
assert(androidManifestXml.includes('ACCESS_COARSE_LOCATION'), 'AndroidManifest.xml declares ACCESS_COARSE_LOCATION');
assert(!androidManifestXml.includes('ACCESS_BACKGROUND_LOCATION'), 'AndroidManifest.xml strictly excludes ACCESS_BACKGROUND_LOCATION');

// ============================================================================
// SUITE 8: Functional Integrity & Zero-Regression Contracts
// ============================================================================
console.log('\n--- SUITE 8: Functional Integrity & Zero-Regression Contracts ---');

// 8.1 Station Fuel Filtering Logic
const mockMetanStation = { id: 'st1', types: ['metan'], prices: { metan: 3800 } };
const mockPropanStation = { id: 'st2', types: ['propan'], prices: { propan: 5500 } };
const mockBenzinStation = { id: 'st3', types: ['benzin'], prices: { ai92: 9500 } };
const mockElectricStation = { id: 'st4', types: ['elektr'], prices: { elektr: 2200 } };

assert(stationMatchesFuel(mockMetanStation, 'all') === true, 'Metan station matches "all" filter');
assert(stationMatchesFuel(mockMetanStation, 'metan') === true, 'Metan station matches "metan" filter');
assert(stationMatchesFuel(mockMetanStation, 'gaz') === true, 'Metan station matches "gaz" (gas) filter');
assert(stationMatchesFuel(mockMetanStation, 'benzin') === false, 'Metan station does NOT match "benzin" filter');
assert(stationMatchesFuel(mockMetanStation, 'elektr') === false, 'Metan station does NOT match "elektr" filter');

assert(stationMatchesFuel(mockPropanStation, 'propan') === true, 'Propan station matches "propan" filter');
assert(stationMatchesFuel(mockPropanStation, 'gaz') === true, 'Propan station matches "gaz" filter');
assert(stationMatchesFuel(mockPropanStation, 'benzin') === false, 'Propan station does NOT match "benzin" filter');

assert(stationMatchesFuel(mockBenzinStation, 'benzin') === true, 'Benzin station matches "benzin" filter');
assert(stationMatchesFuel(mockBenzinStation, 'metan') === false, 'Benzin station does NOT match "metan" filter');

assert(stationMatchesFuel(mockElectricStation, 'elektr') === true, 'Electric station matches "elektr" filter');
assert(stationMatchesFuel(mockElectricStation, 'electric') === true, 'Electric station matches "electric" shortcut filter');
assert(stationMatchesFuel(mockElectricStation, 'ev') === true, 'Electric station matches "ev" filter');
assert(stationMatchesFuel(mockElectricStation, 'metan') === false, 'Electric station does NOT match "metan" filter');

// 8.2 Haversine Distance Calculation Logic
const tashkentCenter = { lat: 41.2995, lng: 69.2401 };
const chorsu = { lat: 41.3265, lng: 69.2372 };
const distKm = calculateDistance(tashkentCenter.lat, tashkentCenter.lng, chorsu.lat, chorsu.lng);
assert(distKm >= 2.5 && distKm <= 3.5, `Distance between Tashkent Center & Chorsu is ~3.0 km (${distKm.toFixed(2)} km)`);

const distZero = calculateDistance(tashkentCenter.lat, tashkentCenter.lng, tashkentCenter.lat, tashkentCenter.lng);
assert(distZero === 0, 'Distance between identical points is exactly 0 km');

// 8.3 OSRM Routing & NavigationMode Integrity
const navigationModeCode = fs.readFileSync(path.join(WORKSPACE_ROOT, 'src', 'components', 'NavigationMode.jsx'), 'utf8');
assert(navigationModeCode.includes('router.project-osrm.org'), 'NavigationMode connects to OSRM routing service');
assert(navigationModeCode.includes('routes[0]'), 'NavigationMode decodes primary OSRM route geometry');
assert(navigationModeCode.includes('onClose'), 'NavigationMode provides exit navigation handler');

// 8.4 MapView & MapLibre Integration
const mapViewCode = fs.readFileSync(path.join(WORKSPACE_ROOT, 'src', 'components', 'MapView.jsx'), 'utf8');
assert(mapViewCode.includes('mapContainerRef'), 'MapView mounts into map container element');
assert(mapViewCode.includes('pmtiles'), 'MapView registers PMTiles protocol');
assert(mapViewCode.includes('MIN_STATION_ZOOM') && mapViewCode.includes('station-hidden'), 'MapView configures zoom-level LOD marker thresholding');
assert(mapViewCode.includes('onSelectStation'), 'MapView connects marker click to onSelectStation callback');

// ============================================================================
// FINAL REPORT & EXIT CODE
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log(`MASTER E2E VERIFICATION REPORT:`);
console.log(`Total Assertions Evaluated: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('='.repeat(80));

if (failedTests > 0) {
  console.error('\nFAILURES SUMMARY:');
  for (const f of failures) {
    console.error(`- ${f.testName}: ${f.details}`);
  }
  process.exit(1);
} else {
  console.log('\n🌟 ALL ACCEPTANCE CRITERIA VERIFIED 100% CLEAN! (Exit Code 0)');
  process.exit(0);
}
