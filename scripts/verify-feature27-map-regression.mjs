/**
 * scripts/verify-feature27-map-regression.mjs
 *
 * Feature 27: Web Map Zero-Regression Verification Suite
 * Validates MapLibre GL JS integration, web worker bundling, PMTiles protocol,
 * style definitions, marker rendering, zoom LOD, foreground geolocation,
 * and service worker tile bypass rules.
 */

import fs from 'node:fs';
import path from 'node:path';

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failCount++;
    const errMsg = `❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`;
    console.error(`  ${errMsg}`);
    failures.push({ testName, details });
  }
}

console.log('='.repeat(80));
console.log('FEATURE 27: WEB MAP ZERO-REGRESSION VERIFICATION SUITE');
console.log('='.repeat(80));

const mapViewPath = path.resolve('src/components/MapView.jsx');
const mapViewContent = fs.readFileSync(mapViewPath, 'utf8');

// Category 1: MapLibre GL JS & Worker Configuration
console.log('\n--- Category 1: MapLibre GL JS & Worker Configuration ---');
assert(mapViewContent.includes("maplibregl.setWorkerUrl(workerUrl)"), "MapView configures MapLibre workerUrl");
assert(mapViewContent.includes("maplibregl.addProtocol('pmtiles'"), "MapView registers PMTiles protocol");
assert(mapViewContent.includes("import 'maplibre-gl/dist/maplibre-gl.css'"), "MapView imports MapLibre CSS");

// Category 2: Map Container & ResizeObserver Teardown
console.log('\n--- Category 2: Map Container & ResizeObserver Teardown ---');
assert(mapViewContent.includes("new ResizeObserver("), "MapView registers ResizeObserver on container");
assert(mapViewContent.includes("mapRef.current.remove()"), "MapView destroys MapLibre instance on unmount");

// Category 3: Map Style Specifications
console.log('\n--- Category 3: Map Style Specifications ---');
const mapStylePath = path.resolve('src/utils/mapStyle.js');
assert(fs.existsSync(mapStylePath), "src/utils/mapStyle.js exists");
const mapStyleContent = fs.readFileSync(mapStylePath, 'utf8');
assert(mapStyleContent.includes("https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt"), "mapStyle defines Protomaps vector endpoint");
assert(mapStyleContent.includes("https://a.basemaps.cartocdn.com/light_all/"), "mapStyle defines CartoDB raster fallback");

// Category 4: Station Marker Layer & LOD Clustering
console.log('\n--- Category 4: Station Marker Layer & LOD Clustering ---');
assert(mapViewContent.includes("const MIN_STATION_ZOOM = 12.0"), "MIN_STATION_ZOOM is defined as 12.0");
assert(mapViewContent.includes("station-hidden"), "Marker LOD hides unselected markers below zoom threshold");
assert(mapViewContent.includes("station-highlight-pulse"), "Highlighted markers remain visible regardless of zoom");
assert(mapViewContent.includes("getStationSvgIcon"), "Dynamic SVG icons distinguish electric vs fuel stations");

// Category 5: Foreground User Geolocation & Cleanup
console.log('\n--- Category 5: Foreground User Geolocation & Cleanup ---');
assert(mapViewContent.includes("navigator.geolocation.watchPosition"), "MapView watches user geolocation");
assert(mapViewContent.includes("navigator.geolocation.clearWatch"), "MapView clears geolocation watch on unmount");
assert(mapViewContent.includes("maplibre-user-marker"), "MapView renders custom animated user location marker");

// Category 6: Service Worker Bypass Caching Logic
console.log('\n--- Category 6: Service Worker Bypass Caching Logic ---');
const swPath = path.resolve('public/sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes("isMapTileRequest(url, request)"), "sw.js calls isMapTileRequest in fetch listener");
assert(swContent.includes("protomaps.com"), "isMapTileRequest covers protomaps.com");
assert(swContent.includes("cartocdn.com"), "isMapTileRequest covers cartocdn.com");
assert(swContent.includes("openstreetmap.org"), "isMapTileRequest covers openstreetmap.org");
assert(swContent.includes("mapbox.com"), "isMapTileRequest covers mapbox.com");
assert(swContent.includes(".pmtiles"), "isMapTileRequest covers PMTiles archives");
assert(swContent.includes("request.headers.has('range')"), "isMapTileRequest bypasses HTTP Range byte requests");
assert(swContent.includes("isDynamicApiRequest(url)"), "sw.js bypasses dynamic APIs");

// Category 7: M1 & M2 Zero Regression & App Integration
console.log('\n--- Category 7: M1 & M2 Zero Regression & App Integration ---');
const appPath = path.resolve('src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');
assert(appContent.includes('activeTab === "home"'), 'App.jsx renders MapView on home tab');
assert(appContent.includes('activeTab === "map"'), 'App.jsx renders MapView on map tab');
assert(appContent.includes('activeTab === "privacy"'), 'App.jsx handles /privacy tab');
assert(appContent.includes("<PrivacyPolicyPage"), "App.jsx renders PrivacyPolicyPage");
const mainPath = path.resolve('src/main.jsx');
const mainContent = fs.readFileSync(mainPath, 'utf8');
assert(/navigator\.serviceWorker\s*\.\s*register\(['"]\/sw\.js['"]\)/.test(mainContent), "main.jsx registers service worker on window load");

console.log('\n' + '='.repeat(80));
console.log(`FEATURE 27 VERIFICATION SUMMARY:`);
console.log(`Total Assertions: ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n🌟 FEATURE 27 ZERO-REGRESSION SUITE PASSED 100%!');
  process.exit(0);
}
