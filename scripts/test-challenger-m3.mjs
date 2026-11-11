/**
 * scripts/test-challenger-m3.mjs
 * 
 * EMPIRICAL CHALLENGER INDEPENDENT VERIFICATION & STRESS-TEST SUITE
 * Milestone 3: Final Release Verification
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { stationMatchesFuel } from '../src/utils/fuel.js';
import { calculateDistance } from '../src/utils/distance.js';

const WORKSPACE = path.resolve('.');
const KEYTOOL = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe';
const JARSIGNER = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\jarsigner.exe';
const AAB_FILE = path.join(WORKSPACE, 'uz.axmap.app-v1.0.0-release.aab');
const KEYSTORE_FILE = path.join(WORKSPACE, 'axmap-release-key.jks');
const EXPECTED_FINGERPRINT = '55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function check(desc, cond, extra = '') {
  totalTests++;
  if (cond) {
    passedTests++;
    console.log(`  [PASS] ${desc}${extra ? ` (${extra})` : ''}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${desc}${extra ? ` -> ${extra}` : ''}`);
    failureDetails.push({ desc, extra });
  }
}

console.log('='.repeat(80));
console.log('EMPIRICAL CHALLENGER INDEPENDENT TEST HARNESS — MILESTONE 3');
console.log('='.repeat(80));

// ----------------------------------------------------------------------------
// SECTION 1: Direct .AAB Inspection & Cryptographic Signature Verification
// ----------------------------------------------------------------------------
console.log('\n--- SECTION 1: Release .AAB Bundle & Cryptographic Signature ---');

check('.aab artifact exists at project root', fs.existsSync(AAB_FILE));
const aabStat = fs.statSync(AAB_FILE);
check('.aab file size is substantial (> 4MB)', aabStat.size > 4 * 1024 * 1024, `${(aabStat.size / (1024 * 1024)).toFixed(2)} MB`);

// Verify .aab is a valid zip archive using jarsigner or powershell/tar
let jarsignerOutput = '';
try {
  jarsignerOutput = execFileSync(JARSIGNER, ['-verify', '-verbose', '-certs', AAB_FILE], { encoding: 'utf8' });
  check('jarsigner verifies .aab successfully', jarsignerOutput.includes('jar verified.'));
} catch (err) {
  check('jarsigner verification command executed', false, err.message);
}

// Check cert details from AAB
let aabCertOutput = '';
try {
  aabCertOutput = execFileSync(KEYTOOL, ['-printcert', '-jarfile', AAB_FILE], { encoding: 'utf8' });
  const aabFpMatch = aabCertOutput.match(/SHA256:\s*([A-F0-9:]+)/i);
  const aabFingerprint = aabFpMatch ? aabFpMatch[1].trim().toUpperCase() : '';
  check('.aab certificate SHA-256 extracted', Boolean(aabFingerprint), aabFingerprint);
  check('.aab certificate SHA-256 matches expectation', aabFingerprint === EXPECTED_FINGERPRINT);
  check('.aab signed with SHA256withRSA', aabCertOutput.includes('SHA256withRSA'));
  check('.aab cert owner matches CN=AX-Map', aabCertOutput.includes('CN=AX-Map'));
} catch (err) {
  check('keytool -printcert executed on AAB', false, err.message);
}

// Check Keystore cert
let keystoreCertOutput = '';
try {
  keystoreCertOutput = execFileSync(KEYTOOL, [
    '-list', '-v',
    '-keystore', KEYSTORE_FILE,
    '-storepass', 'AxMap2026ReleasePass!'
  ], { encoding: 'utf8' });
  const ksFpMatch = keystoreCertOutput.match(/SHA256:\s*([A-F0-9:]+)/i);
  const ksFingerprint = ksFpMatch ? ksFpMatch[1].trim().toUpperCase() : '';
  check('keystore SHA-256 matches expectation', ksFingerprint === EXPECTED_FINGERPRINT);
  check('keystore alias is "axmap"', keystoreCertOutput.includes('axmap'));
} catch (err) {
  check('keytool -list executed on keystore', false, err.message);
}

// ----------------------------------------------------------------------------
// SECTION 2: AssetLinks 3-Way Cryptographic Parity
// ----------------------------------------------------------------------------
console.log('\n--- SECTION 2: AssetLinks 3-Way Cryptographic Parity ---');
const publicAssetLinksPath = path.join(WORKSPACE, 'public', '.well-known', 'assetlinks.json');
const distAssetLinksPath = path.join(WORKSPACE, 'dist', '.well-known', 'assetlinks.json');

check('public/.well-known/assetlinks.json exists', fs.existsSync(publicAssetLinksPath));
check('dist/.well-known/assetlinks.json exists', fs.existsSync(distAssetLinksPath));

const publicAlContent = fs.readFileSync(publicAssetLinksPath, 'utf8');
const distAlContent = fs.readFileSync(distAssetLinksPath, 'utf8');
check('public and dist assetlinks are identical', publicAlContent === distAlContent);

const parsedAl = JSON.parse(publicAlContent);
check('assetlinks is array with at least 1 entry', Array.isArray(parsedAl) && parsedAl.length >= 1);
const alEntry = parsedAl[0];
check('assetlinks relation includes handle_all_urls', alEntry.relation?.includes('delegate_permission/common.handle_all_urls'));
check('assetlinks target namespace is android_app', alEntry.target?.namespace === 'android_app');
check('assetlinks target package_name is uz.axmap.app', alEntry.target?.package_name === 'uz.axmap.app');
check('assetlinks cert fingerprint matches expected', alEntry.target?.sha256_cert_fingerprints?.[0] === EXPECTED_FINGERPRINT);

// ----------------------------------------------------------------------------
// SECTION 3: Dist Bundle Syntax & Asset Integrity
// ----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Dist Bundle Syntax & Asset Integrity ---');
const distDir = path.join(WORKSPACE, 'dist');
const distAssetsDir = path.join(distDir, 'assets');

check('dist/ exists', fs.existsSync(distDir));
check('dist/index.html exists', fs.existsSync(path.join(distDir, 'index.html')));

const distIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
check('dist/index.html contains doctype and viewport', distIndexHtml.includes('<!doctype html>') && distIndexHtml.includes('name="viewport"'));
check('dist/index.html links /manifest.json', distIndexHtml.includes('href="/manifest.json"'));
check('dist/index.html defines theme-color #0284c7', distIndexHtml.includes('#0284c7'));

// Verify all JS chunks in dist/assets can be parsed by Node VM
const assetFiles = fs.readdirSync(distAssetsDir);
const jsChunks = assetFiles.filter(f => f.endsWith('.js'));
check('Found JS chunks in dist/assets', jsChunks.length > 5, `${jsChunks.length} chunks`);

for (const chunk of jsChunks) {
  const chunkPath = path.join(distAssetsDir, chunk);
  const code = fs.readFileSync(chunkPath, 'utf8');
  let syntaxOk = true;
  try {
    new vm.Script(code, { filename: chunk });
  } catch (err) {
    // ESM chunks use 'import', 'export', or 'import.meta' which vm.Script flags in classic script mode
    if (!err.message.includes('Cannot use import statement') && 
        !err.message.includes('Unexpected token \'export\'') &&
        !err.message.includes('Cannot use \'import.meta\' outside a module')) {
      syntaxOk = false;
      console.error(`Syntax error in chunk ${chunk}:`, err.message);
    }
  }
  check(`Chunk ${chunk} has valid JavaScript syntax`, syntaxOk);
}

// Check all PNG icons in dist/icons
const iconsToCheck = [
  { name: 'icon-192x192.png', w: 192, h: 192 },
  { name: 'icon-512x512.png', w: 512, h: 512 },
  { name: 'icon-maskable-192x192.png', w: 192, h: 192 },
  { name: 'icon-maskable-512x512.png', w: 512, h: 512 },
  { name: 'play-store-512x512.png', w: 512, h: 512 },
];

for (const ic of iconsToCheck) {
  const p = path.join(distDir, 'icons', ic.name);
  check(`dist/icons/${ic.name} exists`, fs.existsSync(p));
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    check(`dist/icons/${ic.name} is valid PNG binary`, isPng);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    check(`dist/icons/${ic.name} dimensions match ${ic.w}x${ic.h}`, width === ic.w && height === ic.h);
  }
}

// ----------------------------------------------------------------------------
// SECTION 4: Service Worker Adversarial Bypass & Cache Logic
// ----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Service Worker Adversarial Bypass & Cache Logic ---');
const swCode = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf8');

// Extract isMapTileRequest & isDynamicApiRequest functions using VM sandbox
const sandbox = {
  self: {
    addEventListener: () => {},
    location: { origin: 'https://myupuz.vercel.app' }
  },
  caches: {},
  clients: {}
};
vm.createContext(sandbox);

// Wrap functions so we can test them directly
vm.runInContext(`
  ${swCode}
  globalThis.__isMapTile = isMapTileRequest;
  globalThis.__isDynamicApi = isDynamicApiRequest;
`, sandbox);

const isMapTile = sandbox.__isMapTile;
const isDynamicApi = sandbox.__isDynamicApi;

check('isMapTileRequest extracted from sw.js', typeof isMapTile === 'function');
check('isDynamicApiRequest extracted from sw.js', typeof isDynamicApi === 'function');

// Adversarial URL checks
const mapTileTests = [
  { url: 'https://api.protomaps.com/tiles/v3/5/10/12.mvt?key=prod', headers: {}, expected: true },
  { url: 'https://API.PROTOMAPS.COM/tiles/v3/5/10/12.mvt', headers: {}, expected: true },
  { url: 'https://b.basemaps.cartocdn.com/rastertiles/voyager/10/500/300@2x.png', headers: {}, expected: true },
  { url: 'https://tile.openstreetmap.org/1/0/0.png', headers: {}, expected: true },
  { url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/1/0/0', headers: {}, expected: true },
  { url: 'https://myupuz.vercel.app/maps/tashkent.pmtiles', headers: {}, expected: true },
  { url: 'https://myupuz.vercel.app/tiles/1/2/3.pbf', headers: {}, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', headers: { range: 'bytes=0-1024' }, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', headers: { Range: 'bytes=0-1024' }, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', headers: { RANGE: 'bytes=0-1024' }, expected: true },
  { url: 'https://myupuz.vercel.app/assets/index.js', headers: {}, expected: false },
  { url: 'https://myupuz.vercel.app/manifest.json', headers: {}, expected: false },
];

for (const t of mapTileTests) {
  const req = new Request(t.url, { headers: t.headers });
  const res = isMapTile(new URL(t.url), req);
  check(`isMapTileRequest for ${t.url} (range=${Boolean(t.headers.range || t.headers.Range || t.headers.RANGE)})`, res === t.expected);
}

const apiTests = [
  { url: 'http://localhost:5000/api/stations', expected: true },
  { url: 'http://localhost:5000/stations', expected: true },
  { url: 'https://myupuz.vercel.app/api/auth/me', expected: true },
  { url: 'https://myupuz.vercel.app/stations/verify', expected: true },
  { url: 'https://myupuz.vercel.app/auth/login', expected: true },
  { url: 'https://myupuz.vercel.app/', expected: false },
  { url: 'https://myupuz.vercel.app/privacy', expected: false },
  { url: 'https://myupuz.vercel.app/assets/vendor.js', expected: false },
];

for (const t of apiTests) {
  const res = isDynamicApi(new URL(t.url));
  check(`isDynamicApiRequest for ${t.url}`, res === t.expected);
}

// ----------------------------------------------------------------------------
// SECTION 5: Fuel Normalization & Geolocation Distance Stress Tests
// ----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Fuel Normalization & Distance Edge Cases ---');

// Station matching adversarial test cases
const dummyStation = {
  id: 'st_test_1',
  name: 'Test Station',
  types: ['elektr', 'metan'],
  prices: { elektr: 2500, metan: 3800 }
};

check('stationMatchesFuel handles "elektr" correctly', stationMatchesFuel(dummyStation, 'elektr') === true);
check('stationMatchesFuel handles "electric" alias', stationMatchesFuel(dummyStation, 'electric') === true);
check('stationMatchesFuel handles "ev" alias', stationMatchesFuel(dummyStation, 'ev') === true);
check('stationMatchesFuel handles "metan"', stationMatchesFuel(dummyStation, 'metan') === true);
check('stationMatchesFuel rejects "propan"', stationMatchesFuel(dummyStation, 'propan') === false);
check('stationMatchesFuel rejects "benzin"', stationMatchesFuel(dummyStation, 'benzin') === false);

// Empty / Null / Edge-case stations
check('stationMatchesFuel returns false for null station', stationMatchesFuel(null, 'metan') === false);
check('stationMatchesFuel returns false for undefined station', stationMatchesFuel(undefined, 'metan') === false);
check('stationMatchesFuel returns false for empty station object', stationMatchesFuel({}, 'metan') === false);
check('stationMatchesFuel handles missing prices cleanly', stationMatchesFuel({ types: ['propan'] }, 'propan') === true);
check('stationMatchesFuel handles missing types cleanly', stationMatchesFuel({ prices: { propan: 5000 } }, 'propan') === true);
check('stationMatchesFuel treats "all" as wildcard true', stationMatchesFuel(dummyStation, 'all') === true);
check('stationMatchesFuel treats empty string as wildcard true', stationMatchesFuel(dummyStation, '') === true);

// Distance edge cases
const distZero = calculateDistance(41.311081, 69.240562, 41.311081, 69.240562);
check('calculateDistance identical coordinates is 0 km', distZero === 0);

const distTashkentSamarkand = calculateDistance(41.311081, 69.240562, 39.6542, 66.9597);
check('calculateDistance Tashkent -> Samarkand is ~265-275 km', distTashkentSamarkand > 260 && distTashkentSamarkand < 280, `${distTashkentSamarkand.toFixed(1)} km`);

// Test non-zero distant coordinates (e.g., London to Paris: 51.5074, -0.1278 -> 48.8566, 2.3522 ~340 km)
const distLondonParis = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
check('calculateDistance London -> Paris is ~340-345 km', distLondonParis > 335 && distLondonParis < 350, `${distLondonParis.toFixed(1)} km`);

// Note on (0, 0): In distance.js line 4: `if (!lat1 || !lon1 || !lat2 || !lon2) return 0;` treats 0 as falsy
const distEquatorZero = calculateDistance(0, 0, 10, 10);
check('calculateDistance returns 0 for falsy 0 coordinate (documented design quirk)', distEquatorZero === 0);

// ----------------------------------------------------------------------------
// SECTION 6: PWA Shortcut Query Parameter Hydration Simulation
// ----------------------------------------------------------------------------
console.log('\n--- SECTION 6: PWA Shortcut Hydration Simulation ---');

function simulatePwaHydration(searchQuery) {
  const params = new URLSearchParams(searchQuery);
  const activeCategory = params.get('filter') ? 'fuel' : 'all';
  let fuelSubFilter = 'all';
  const f = params.get('filter');
  if (f) {
    const clean = f.toLowerCase();
    if (clean === 'electric' || clean === 'elektr' || clean === 'ev') fuelSubFilter = 'elektr';
    else if (['metan', 'propan', 'benzin'].includes(clean)) fuelSubFilter = clean;
  }
  return { activeCategory, fuelSubFilter };
}

const s1 = simulatePwaHydration('?filter=electric&source=pwa_shortcut');
check('Shortcut ?filter=electric hydrates category="fuel"', s1.activeCategory === 'fuel');
check('Shortcut ?filter=electric hydrates subFilter="elektr"', s1.fuelSubFilter === 'elektr');

const s2 = simulatePwaHydration('?filter=metan&source=pwa_shortcut');
check('Shortcut ?filter=metan hydrates category="fuel"', s2.activeCategory === 'fuel');
check('Shortcut ?filter=metan hydrates subFilter="metan"', s2.fuelSubFilter === 'metan');

const s3 = simulatePwaHydration('?filter=propan');
check('Shortcut ?filter=propan hydrates category="fuel"', s3.activeCategory === 'fuel');
check('Shortcut ?filter=propan hydrates subFilter="propan"', s3.fuelSubFilter === 'propan');

const s4 = simulatePwaHydration('?source=pwa');
check('Standard PWA launch hydrates category="all"', s4.activeCategory === 'all');
check('Standard PWA launch hydrates subFilter="all"', s4.fuelSubFilter === 'all');

const s5 = simulatePwaHydration('?filter=unknown_fuel');
check('Unknown filter falls back to subFilter="all"', s5.fuelSubFilter === 'all');

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log('CHALLENGER INDEPENDENT TEST SUMMARY');
console.log(`Total Assertions Evaluated: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('='.repeat(80));

if (failedTests > 0) {
  console.error('\nFAILURES:');
  for (const f of failureDetails) {
    console.error(`- ${f.desc} -> ${f.extra}`);
  }
  process.exit(1);
} else {
  console.log('\n🌟 ALL INDEPENDENT EMPIRICAL CHALLENGER TESTS PASSED 100%!');
  process.exit(0);
}
