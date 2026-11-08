const fs = require('fs');
const path = require('path');

console.log('=== EMPIRICAL VERIFICATION: MyUp Frontend ===\n');

let failed = false;

// 1. Inspect dist/assets
const distDir = path.resolve(__dirname, '../dist/assets');
if (!fs.existsSync(distDir)) {
  console.error('FAIL: dist/assets directory does not exist. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);
const jsFiles = files.filter(f => f.endsWith('.js'));
const indexJs = jsFiles.find(f => f.startsWith('index-'));
const maplibreJs = jsFiles.find(f => f.startsWith('vendor-maplibre-'));
const mapViewJs = jsFiles.find(f => f.startsWith('MapView-'));
const reactJs = jsFiles.find(f => f.startsWith('vendor-react-'));
const iconsJs = jsFiles.find(f => f.startsWith('vendor-icons-'));

console.log('1. Bundle Chunks:');
console.log(' - index.js:', indexJs, `(${(fs.statSync(path.join(distDir, indexJs)).size / 1024).toFixed(2)} KB)`);
console.log(' - vendor-react:', reactJs, `(${(fs.statSync(path.join(distDir, reactJs)).size / 1024).toFixed(2)} KB)`);
console.log(' - vendor-icons:', iconsJs, `(${(fs.statSync(path.join(distDir, iconsJs)).size / 1024).toFixed(2)} KB)`);
console.log(' - vendor-maplibre:', maplibreJs, `(${(fs.statSync(path.join(distDir, maplibreJs)).size / 1024).toFixed(2)} KB)`);
console.log(' - MapView:', mapViewJs, `(${(fs.statSync(path.join(distDir, mapViewJs)).size / 1024).toFixed(2)} KB)`);

// 2. Verify MapLibre GL isolation
console.log('\n2. Testing MapLibre GL Isolation:');
const indexContent = fs.readFileSync(path.join(distDir, indexJs), 'utf8');

// Parse all static imports in index.js: `import ... from "./..."`
const staticImportRegex = /import\s*(?:\{[^}]*\}|\*\s*as\s*[^;]+|[^;]+)\s*from\s*["']([^"']+)["']/g;
const staticImports = [];
let match;
while ((match = staticImportRegex.exec(indexContent)) !== null) {
  staticImports.push(match[1]);
}
console.log(' - Static imports in index.js:', staticImports);

const staticMaplibreImport = staticImports.find(imp => imp.includes('maplibre'));
if (staticMaplibreImport) {
  console.error(` FAIL: index.js statically imports ${staticMaplibreImport}!`);
  failed = true;
} else {
  console.log(` PASS: index.js has NO static import of vendor-maplibre`);
}

// Check index.html to ensure vendor-maplibre is NOT modulepreloaded on initial load
const indexHtmlContent = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), 'utf8');
if (indexHtmlContent.includes('vendor-maplibre')) {
  console.error(' FAIL: dist/index.html contains a preload link for vendor-maplibre!');
  failed = true;
} else {
  console.log(' PASS: dist/index.html does not preload vendor-maplibre on initial page load');
}

// Verify that MapLibre GL code exists ONLY in vendor-maplibre
const maplibreContent = fs.readFileSync(path.join(distDir, maplibreJs), 'utf8');
const maplibreKeySymbols = [
  'maplibregl',
  'StyleSpecification',
  'LngLatBounds',
  'PointGeometry',
  'PMTiles'
];

for (const sym of maplibreKeySymbols) {
  const inIndex = indexContent.includes(sym);
  const inMaplibre = maplibreContent.includes(sym);
  console.log(` - Symbol "${sym}": in vendor-maplibre? ${inMaplibre} | in index.js? ${inIndex}`);
  if (inIndex) {
    console.error(` FAIL: MapLibre symbol "${sym}" leaked into index.js!`);
    failed = true;
  }
}

// 3. Inspect all dist/assets/*.js for unpruned references
console.log('\n3. Testing for Unpruned References in Bundle (dist/assets/*.js):');
const unprunedChecks = ['firebase', 'leaflet'];

for (const f of jsFiles) {
  const content = fs.readFileSync(path.join(distDir, f), 'utf8');
  for (const term of unprunedChecks) {
    const regex = new RegExp(`['"]${term}['"/]|node_modules/${term}`, 'i');
    if (regex.test(content)) {
      console.error(` FAIL: Found unpruned reference to ${term} in ${f}`);
      failed = true;
    }
  }
}
console.log(' PASS: Zero active imports or dependencies on firebase/leaflet in emitted JS bundle');

// 4. Verify WebP images
console.log('\n4. Verifying WebP Image Assets:');
function checkWebpHeader(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 16) return { valid: false, reason: 'File too small' };
  const riff = buf.toString('ascii', 0, 4);
  const webp = buf.toString('ascii', 8, 12);
  const vp8 = buf.toString('ascii', 12, 16);
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    return { valid: false, reason: `Invalid header: riff=${riff}, webp=${webp}` };
  }
  return { valid: true, size: buf.length, vp8Type: vp8.trim() };
}

const webpPaths = [
  path.resolve(__dirname, '../public/map-preview-desktop.webp'),
  path.resolve(__dirname, '../public/map-preview.webp'),
  path.resolve(__dirname, '../public/amaps-empty-notif.webp'),
  path.resolve(__dirname, '../public/amaps-logo.webp'),
  path.resolve(__dirname, '../src/assets/amaps-empty-notif.webp'),
  path.resolve(__dirname, '../dist/map-preview-desktop.webp'),
  path.resolve(__dirname, '../dist/map-preview.webp'),
  path.resolve(__dirname, '../dist/amaps-empty-notif.webp'),
  path.resolve(__dirname, '../dist/amaps-logo.webp')
];

for (const wp of webpPaths) {
  if (!fs.existsSync(wp)) {
    console.error(` FAIL: Expected WebP image does not exist: ${wp}`);
    failed = true;
  } else {
    const result = checkWebpHeader(wp);
    if (!result.valid) {
      console.error(` FAIL: ${wp} is not a valid WebP file (${result.reason})`);
      failed = true;
    } else {
      console.log(` PASS: ${path.relative(path.resolve(__dirname, '..'), wp)} is valid WebP (${result.size} bytes, ${result.vp8Type})`);
    }
  }
}

// 5. Test Suspense coverage in App.jsx
console.log('\n5. Verifying App.jsx Dynamic Imports & Suspense:');
const appJsx = fs.readFileSync(path.resolve(__dirname, '../src/App.jsx'), 'utf8');
const lazyComponents = [
  'AuthScreen',
  'MapView',
  'NavigationMode',
  'AddStationModal',
  'SettingsSection',
  'NotificationsView',
  'StationDetailModal',
  'ProfileDetailModal',
  'StationReviewModal'
];

for (const comp of lazyComponents) {
  const isLazy = appJsx.includes(`const ${comp} = lazy(`);
  if (!isLazy) {
    console.error(` FAIL: ${comp} is not declared with lazy() in App.jsx!`);
    failed = true;
  } else {
    console.log(` PASS: ${comp} is lazily imported`);
  }
}

if (failed) {
  console.log('\n=== EMPIRICAL TEST FAILED ===');
  process.exit(1);
} else {
  console.log('\n=== ALL MYUP EMPIRICAL CHECKS PASSED ===');
  process.exit(0);
}
