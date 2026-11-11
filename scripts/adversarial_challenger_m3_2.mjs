/**
 * Milestone 3 Challenger 2 Adversarial Test Harness
 * Stress-Testing Fuel Station Filtering, Search Queries, Query Strings, and Haversine Distance
 */

import { stationMatchesFuel } from '../src/utils/fuel.js';
import { calculateDistance, formatDistance } from '../src/utils/distance.js';

let passed = 0;
let failed = 0;
const failures = [];
const findings = [];

function assert(condition, description, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}${details ? ` -> ${details}` : ''}`);
  } else {
    failed++;
    const err = `[FAIL] ${description}${details ? ` -> ${details}` : ''}`;
    failures.push(err);
    console.error(`  ${err}`);
  }
}

function recordFinding(severity, title, description, empiricalProof) {
  findings.push({ severity, title, description, empiricalProof });
  console.log(`\n  [!FINDING - ${severity.toUpperCase()}] ${title}`);
  console.log(`    ${description}`);
  console.log(`    Proof: ${empiricalProof}\n`);
}

console.log('='.repeat(80));
console.log('CHALLENGER M3-2: ADVERSARIAL STRESS TEST HARNESS');
console.log('='.repeat(80));

// ============================================================================
// 1. ADVERSARIAL STRESS TESTS: stationMatchesFuel (Task 1)
// ============================================================================
console.log('\n--- 1. Adversarial Stress Tests: stationMatchesFuel ---');

// 1.1 Corrupt / Malformed Station Objects
console.log('\n  1.1 Corrupt and Boundary Station Objects:');
assert(stationMatchesFuel(null, 'metan') === false, 'stationMatchesFuel(null, "metan") returns false');
assert(stationMatchesFuel(undefined, 'metan') === false, 'stationMatchesFuel(undefined, "metan") returns false');
assert(stationMatchesFuel('', 'metan') === false, 'stationMatchesFuel("", "metan") returns false');
assert(stationMatchesFuel(12345, 'metan') === false, 'stationMatchesFuel(12345, "metan") returns false');
assert(stationMatchesFuel(true, 'metan') === false, 'stationMatchesFuel(true, "metan") returns false');
assert(stationMatchesFuel(false, 'metan') === false, 'stationMatchesFuel(false, "metan") returns false');
assert(stationMatchesFuel([], 'metan') === false, 'stationMatchesFuel([], "metan") returns false');
assert(stationMatchesFuel({}, 'metan') === false, 'stationMatchesFuel({}, "metan") returns false');
assert(stationMatchesFuel({ id: 1 }, 'metan') === false, 'Station without types or prices returns false');

// Finding check: null station with 'all' vs 'metan'
const nullAll = stationMatchesFuel(null, 'all');
const nullEmpty = stationMatchesFuel(null, '');
const nullUndefined = stationMatchesFuel(null, undefined);
assert(nullAll === true, 'stationMatchesFuel(null, "all") returns true due to fuel guard precedence');
assert(nullEmpty === true, 'stationMatchesFuel(null, "") returns true due to empty fuel guard');
assert(nullUndefined === true, 'stationMatchesFuel(null, undefined) returns true');

// 1.2 Corrupt Types Arrays & Schemas
console.log('\n  1.2 Corrupt Types Formats:');
assert(stationMatchesFuel({ types: null }, 'metan') === false, 'types: null does not throw and returns false');
assert(stationMatchesFuel({ types: undefined }, 'metan') === false, 'types: undefined does not throw and returns false');
assert(stationMatchesFuel({ types: 'metan' }, 'metan') === false, 'types as string (wrong schema) handled gracefully without throw');
assert(stationMatchesFuel({ type: 'metan' }, 'metan') === true, 'type as string (valid alternative schema) returns true');
assert(stationMatchesFuel({ type: ['metan'] }, 'metan') === true, 'type as array (valid alternative schema) returns true');
assert(stationMatchesFuel({ fuelType: 'metan' }, 'metan') === true, 'fuelType as string returns true');
assert(stationMatchesFuel({ fuelTypes: ['metan'] }, 'metan') === true, 'fuelTypes as array returns true');

// Array with corrupt non-string items
const dirtyStation = { types: [null, undefined, 42, true, false, 'metan', { foo: 'bar' }] };
assert(stationMatchesFuel(dirtyStation, 'metan') === true, 'Dirty array with mixed primitives matches "metan"');
assert(stationMatchesFuel(dirtyStation, 'propan') === false, 'Dirty array does not match unrelated "propan"');

// 1.3 Corrupted & Boundary Prices
console.log('\n  1.3 Corrupt Prices Objects & Non-numeric Values:');
assert(stationMatchesFuel({ prices: null }, 'metan') === false, 'prices: null does not throw');
assert(stationMatchesFuel({ prices: undefined }, 'metan') === false, 'prices: undefined does not throw');
assert(stationMatchesFuel({ prices: '3800' }, 'metan') === false, 'prices as string does not throw');
assert(stationMatchesFuel({ prices: 12345 }, 'metan') === false, 'prices as number does not throw');
assert(stationMatchesFuel({ prices: [3800] }, 'metan') === false, 'prices as array does not match metan');

assert(stationMatchesFuel({ prices: { metan: null } }, 'metan') === false, 'prices.metan: null returns false');
assert(stationMatchesFuel({ prices: { metan: undefined } }, 'metan') === false, 'prices.metan: undefined returns false');
assert(stationMatchesFuel({ prices: { metan: NaN } }, 'metan') === false, 'prices.metan: NaN returns false');
assert(stationMatchesFuel({ prices: { metan: 0 } }, 'metan') === false, 'prices.metan: 0 returns false');
assert(stationMatchesFuel({ prices: { metan: -100 } }, 'metan') === false, 'prices.metan: negative price returns false');
assert(stationMatchesFuel({ prices: { metan: '0' } }, 'metan') === false, 'prices.metan: "0" returns false');
assert(stationMatchesFuel({ prices: { metan: '3800' } }, 'metan') === true, 'prices.metan: string "3800" returns true');
assert(stationMatchesFuel({ prices: { metan: '3800.50' } }, 'metan') === true, 'prices.metan: decimal string returns true');
assert(stationMatchesFuel({ prices: { metan: 'free' } }, 'metan') === false, 'prices.metan: non-numeric string returns false');
assert(stationMatchesFuel({ prices: { cng: 3800 } }, 'metan') === true, 'prices.cng: 3800 matches metan filter');
assert(stationMatchesFuel({ prices: { lpg: 5500 } }, 'propan') === true, 'prices.lpg: 5500 matches propan filter');

// 1.4 Fuel Variants & Aliases (metan, propan, benzin, elektr, electric, ev, all, gaz)
console.log('\n  1.4 Fuel Variants and Aliases:');
const multiStation = {
  types: ['metan', 'lpg', 'ai92', 'elektr'],
  prices: { metan: 3800, propan: 5500, ai92: 9500, elektr: 2200 }
};

assert(stationMatchesFuel(multiStation, 'metan') === true, 'Multi-station matches "metan"');
assert(stationMatchesFuel(multiStation, 'propan') === true, 'Multi-station matches "propan" via lpg/propan');
assert(stationMatchesFuel(multiStation, 'benzin') === true, 'Multi-station matches "benzin" via ai92');
assert(stationMatchesFuel(multiStation, 'elektr') === true, 'Multi-station matches "elektr"');
assert(stationMatchesFuel(multiStation, 'electric') === true, 'Multi-station matches "electric" alias');
assert(stationMatchesFuel(multiStation, 'ev') === true, 'Multi-station matches "ev" alias');
assert(stationMatchesFuel(multiStation, 'gaz') === true, 'Multi-station matches "gaz" (metan/propan composite)');
assert(stationMatchesFuel(multiStation, 'all') === true, 'Multi-station matches "all"');

// Electric variants in types
const evOnlyStation = { types: ['charge_point'], prices: { ev: 2000 } };
assert(stationMatchesFuel(evOnlyStation, 'elektr') === true, 'charge_point matches elektr');
assert(stationMatchesFuel(evOnlyStation, 'electric') === true, 'charge_point matches electric');
assert(stationMatchesFuel(evOnlyStation, 'ev') === true, 'charge_point matches ev');

// 1.5 Case Sensitivity and "ALL" upper-case check
console.log('\n  1.5 Case Sensitivity Stress Tests:');
assert(stationMatchesFuel(multiStation, 'METAN') === true, 'stationMatchesFuel matches uppercase "METAN"');
assert(stationMatchesFuel(multiStation, 'ProPan') === true, 'stationMatchesFuel matches mixed-case "ProPan"');
assert(stationMatchesFuel(multiStation, 'BENZIN') === true, 'stationMatchesFuel matches uppercase "BENZIN"');
assert(stationMatchesFuel(multiStation, 'ELECTRIC') === true, 'stationMatchesFuel matches uppercase "ELECTRIC"');
assert(stationMatchesFuel(multiStation, 'EV') === true, 'stationMatchesFuel matches uppercase "EV"');

// Scrutinize uppercase "ALL"
const allUpperMatch = stationMatchesFuel(multiStation, 'ALL');
console.log(`    stationMatchesFuel(multiStation, 'ALL'): ${allUpperMatch}`);
console.log(`    stationMatchesFuel(multiStation, 'all'): ${stationMatchesFuel(multiStation, 'all')}`);

if (!allUpperMatch) {
  recordFinding(
    'Medium',
    'Case-sensitivity asymmetry for "ALL" / "All" in stationMatchesFuel',
    'stationMatchesFuel checks `if (!fuel || fuel === "all") return true;` before lowercasing fuel. Consequently, stationMatchesFuel(st, "ALL") or "All" bypasses the guard, attempts to match fuel type "all" against types/prices, and evaluates to false instead of true.',
    `stationMatchesFuel(station, 'ALL') === false while stationMatchesFuel(station, 'all') === true`
  );
}

// 1.6 Non-string Fuel Arguments
console.log('\n  1.6 Non-String Fuel Arguments:');
try {
  stationMatchesFuel(multiStation, 123);
  assert(false, 'stationMatchesFuel with number fuel did not throw');
} catch (e) {
  assert(e instanceof TypeError, 'stationMatchesFuel with number fuel throws TypeError (fuel.toLowerCase is not a function)');
  recordFinding(
    'Low',
    'Unhandled non-string fuel argument throws TypeError',
    'stationMatchesFuel assumes fuel has .toLowerCase() method when fuel is truthy. Passing a number, boolean true, or object throws TypeError: fuel.toLowerCase is not a function.',
    `stationMatchesFuel(st, 123) throws "${e.message}"`
  );
}


// ============================================================================
// 2. ADVERSARIAL STRESS TESTS: Search Input Parsing (Task 2)
// ============================================================================
console.log('\n--- 2. Adversarial Stress Tests: Search Input Parsing ---');

// Reference station dataset for search
const searchStations = [
  { id: 1, name: 'Lukoil Toshkent', brand: 'Lukoil', address: 'Toshkent sh., Yunusobod t., Amir Temur 100' },
  { id: 2, name: 'Шаффоф Газ Сервис', brand: 'Шаффоф', address: 'Фарғона ш., Мустақиллик кўчаси 45' },
  { id: 3, name: "Farg'ona O'zbekneftgaz", brand: "O'zbekneftgaz", address: "Farg'ona vil., Qo'qon sh." },
  { id: 4, name: 'Caravan Gas & Electric ⚡', brand: 'Caravan', address: 'Samarqand sh., Registon ko‘chasi 12' },
  { id: 5, name: 'Special [CNG+LPG] (Tashkent.Central)', brand: 'UNG', address: 'Tashkent, Chilonzor-9/12' }
];

// Production filter logic from App.jsx: lines 2520-2527
function filterAppJsx(stations, searchQuery) {
  return stations.filter((st) => {
    if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        (st.name || "").toLowerCase().includes(q) ||
        (st.brand || "").toLowerCase().includes(q) ||
        (st.address || "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

// MapView filter logic from MapView.jsx: line 676
function filterMapViewJsx(stations, searchQuery) {
  const q = (searchQuery || '').trim().toLowerCase();
  return stations.filter((st) => {
    if (!q) return true;
    return (
      (st.name || '').toLowerCase().includes(q) ||
      (st.brand || '').toLowerCase().includes(q) ||
      (st.address || '').toLowerCase().includes(q)
    );
  });
}

// 2.1 Unicode & Non-Latin Queries
console.log('\n  2.1 Unicode and Cyrillic Queries:');
assert(filterAppJsx(searchStations, 'Шаффоф').length === 1, 'Cyrillic query "Шаффоф" matches station name');
assert(filterAppJsx(searchStations, 'шаффоф').length === 1, 'Lowercase Cyrillic "шаффоф" matches');
assert(filterAppJsx(searchStations, 'Фарғона').length === 1, 'Uzbek Cyrillic with "ғ" matches address');
assert(filterAppJsx(searchStations, '⚡').length === 1, 'Emoji query "⚡" matches name');
assert(filterAppJsx(searchStations, '加油站').length === 0, 'Non-existent Chinese characters gracefully return 0 results without error');
assert(filterAppJsx(searchStations, 'محطة').length === 0, 'RTL Arabic query gracefully returns 0 results without error');

// 2.2 Special Regex and SQL Injection Characters
console.log('\n  2.2 Special / Metacharacters in Search:');
assert(filterAppJsx(searchStations, '[CNG+LPG]').length === 1, 'Bracketed regex characters "[CNG+LPG]" match literally');
assert(filterAppJsx(searchStations, '(Tashkent.Central)').length === 1, 'Parentheses and dot "(Tashkent.Central)" match literally');
assert(filterAppJsx(searchStations, '.*').length === 0, 'Regex wildcard ".*" treated as literal characters');
assert(filterAppJsx(searchStations, '` OR 1=1 --').length === 0, 'SQL injection string treated as literal characters');
assert(filterAppJsx(searchStations, '<script>alert(1)</script>').length === 0, 'XSS string treated as literal characters');

// 2.3 Non-String Search Queries
console.log('\n  2.3 Non-String Search Query Resilience:');
assert(filterAppJsx(searchStations, null).length === 5, 'searchQuery: null returns all stations without error');
assert(filterAppJsx(searchStations, undefined).length === 5, 'searchQuery: undefined returns all stations');
assert(filterAppJsx(searchStations, 12345).length === 5, 'searchQuery: 12345 returns all stations (guarded by typeof string)');
assert(filterAppJsx(searchStations, true).length === 5, 'searchQuery: true returns all stations');
assert(filterAppJsx(searchStations, { search: 'lukoil' }).length === 5, 'searchQuery: object returns all stations');
assert(filterAppJsx(searchStations, ['lukoil']).length === 5, 'searchQuery: array returns all stations');

// 2.4 Whitespace Handling Stress Test (Leading, Trailing, Internal)
console.log('\n  2.4 Whitespace Handling Scrutiny:');
const untrimmedQuery = '  Lukoil  ';
const appJsxTrimMatch = filterAppJsx(searchStations, untrimmedQuery);
const mapViewTrimMatch = filterMapViewJsx(searchStations, untrimmedQuery);

console.log(`    App.jsx match count for "${untrimmedQuery}": ${appJsxTrimMatch.length}`);
console.log(`    MapView.jsx match count for "${untrimmedQuery}": ${mapViewTrimMatch.length}`);

assert(mapViewTrimMatch.length === 1, 'MapView.jsx trims search query and correctly matches "Lukoil"');

if (appJsxTrimMatch.length === 0) {
  recordFinding(
    'Medium',
    'App.jsx search filter fails to trim search query string',
    'In src/App.jsx (line 2520-2521), `if (searchQuery && typeof searchQuery === "string" && searchQuery.trim())` checks .trim(), but line 2521 assigns `const q = searchQuery.toLowerCase();` without .trim(). Consequently, leading or trailing whitespace in the search bar fails to match stations in App.jsx station list, whereas MapView.jsx line 676 correctly uses `searchQuery.trim().toLowerCase()`.',
    `filterAppJsx(stations, "  Lukoil  ").length === 0 (expected 1)`
  );
}


// ============================================================================
// 3. ADVERSARIAL STRESS TESTS: Haversine Distance Calculations (Task 3)
// ============================================================================
console.log('\n--- 3. Adversarial Stress Tests: Haversine Distance ---');

// 3.1 Zero-distance Identical Points
console.log('\n  3.1 Identical Coordinates (Zero Distance):');
const dIdentical = calculateDistance(41.311081, 69.240562, 41.311081, 69.240562);
assert(dIdentical === 0, 'Identical coordinates return exactly 0 km', `${dIdentical} km`);
assert(formatDistance(0) === '0 m', 'formatDistance(0) returns "0 m"');
assert(formatDistance(dIdentical) === '0 m', 'formatDistance(dIdentical) returns "0 m"');

// 3.2 Negative Coordinates (Southern & Western Hemispheres)
console.log('\n  3.2 Negative Coordinates:');
// Sydney (-33.8688, 151.2093) to Melbourne (-37.8136, 144.9631) ~ 713 km
const dSydneyMelb = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
assert(Math.abs(dSydneyMelb - 713.8) < 5, 'Negative coordinates calculate accurately for Sydney-Melbourne', `${dSydneyMelb.toFixed(1)} km`);

// Buenos Aires (-34.6037, -58.3816) to Rio de Janeiro (-22.9068, -43.1729) ~ 1967 km
const dRioBA = calculateDistance(-34.6037, -58.3816, -22.9068, -43.1729);
assert(Math.abs(dRioBA - 1967.5) < 10, 'Both negative lat and lon calculate accurately', `${dRioBA.toFixed(1)} km`);

// 3.3 Poles
console.log('\n  3.3 Polar Coordinates:');
// North Pole to South Pole along non-zero meridian (e.g. lon 10)
const dPoleToPole = calculateDistance(90, 10, -90, 10);
assert(Math.abs(dPoleToPole - 20015) < 10, 'Distance from North Pole to South Pole is ~20,015 km', `${dPoleToPole.toFixed(1)} km`);

// 3.4 Equator and Prime Meridian (lat = 0, lon = 0)
console.log('\n  3.4 Equator and Prime Meridian Coordinates (0.0):');
// Points on Equator: (0, 10) to (0, 20) -> should be ~1111 km
const dEquator = calculateDistance(0, 10, 0, 20);
console.log(`    calculateDistance(0, 10, 0, 20) on Equator: ${dEquator} km`);

// Points on Prime Meridian: (10, 0) to (20, 0) -> should be ~1111 km
const dPrimeMeridian = calculateDistance(10, 0, 20, 0);
console.log(`    calculateDistance(10, 0, 20, 0) on Prime Meridian: ${dPrimeMeridian} km`);

if (dEquator === 0 || dPrimeMeridian === 0) {
  recordFinding(
    'High',
    'Haversine distance guard falsy check treats valid coordinate 0 (Equator / Prime Meridian) as missing',
    'In src/utils/distance.js line 4: `if (!lat1 || !lon1 || !lat2 || !lon2) return 0;`. In JavaScript, !0 evaluates to true. Any valid geographical point located on the Equator (lat = 0) or the Greenwich Prime Meridian (lon = 0) causes calculateDistance to prematurely return 0 km instead of the actual distance.',
    `calculateDistance(0, 10, 0, 20) === 0 (actual distance ~1,111 km); calculateDistance(10, 0, 20, 0) === 0`
  );
}

// 3.5 Antipodal Points & Floating Point Stability
console.log('\n  3.5 Antipodal Points Stability:');
// Specific antipodal pair known to trigger floating point a > 1:
const dAntipodalExact = calculateDistance(-87.5, -179, 87.5, 1);
console.log(`    calculateDistance(-87.5, -179, 87.5, 1): ${dAntipodalExact}`);

let nanCount = 0;
let validAntipodalCount = 0;

for (let lat = -89; lat <= 89; lat += 0.5) {
  for (let lon = -179; lon <= 179; lon += 5) {
    const antiLat = -lat;
    const antiLon = lon > 0 ? lon - 180 : lon + 180;
    const d = calculateDistance(lat, lon, antiLat, antiLon);
    if (isNaN(d)) {
      nanCount++;
    } else {
      validAntipodalCount++;
    }
  }
}

console.log(`    Antipodal grid scan: ${validAntipodalCount} valid, ${nanCount} NaN results`);

if (isNaN(dAntipodalExact) || nanCount > 0) {
  recordFinding(
    'High',
    'Floating point rounding causes NaN on antipodal coordinates',
    'In src/utils/distance.js lines 10-17: for points near or at antipodal opposites (halfway across the globe), floating point rounding can cause the Haversine variable `a` to exceed 1.0 (e.g. 1.0000000000000002). Consequently, `1 - a` becomes negative (-2.22e-16), `Math.sqrt(1 - a)` yields NaN, and calculateDistance returns NaN. formatDistance(NaN) returns "0 m", causing opposite-side-of-the-world stations to sort as nearest.',
    `calculateDistance(-87.5, -179, 87.5, 1) === NaN; grid scan yielded ${nanCount} NaNs out of ${nanCount + validAntipodalCount} antipodal pairs.`
  );
}

// 3.6 formatDistance Edge Cases
console.log('\n  3.6 formatDistance Formatting Verification:');
assert(formatDistance(undefined) === '0 m', 'formatDistance(undefined) returns "0 m"');
assert(formatDistance(null) === '0 m', 'formatDistance(null) returns "0 m"');
assert(formatDistance(NaN) === '0 m', 'formatDistance(NaN) returns "0 m"');
assert(formatDistance(0.005) === '5 m', 'formatDistance(0.005) returns "5 m"');
assert(formatDistance(0.35) === '350 m', 'formatDistance(0.35) returns "350 m"');
assert(formatDistance(0.999) === '999 m', 'formatDistance(0.999) returns "999 m"');
assert(formatDistance(1.0) === '1.0 km', 'formatDistance(1.0) returns "1.0 km"');
assert(formatDistance(12.456) === '12.5 km', 'formatDistance(12.456) returns "12.5 km"');
assert(formatDistance(1200.2) === '1200.2 km', 'formatDistance(1200.2) returns "1200.2 km"');

// 3.7 Realistic Uzbekistan Distances
console.log('\n  3.7 Uzbekistan Realistic Distance Benchmarks:');
// Tashkent (41.2995, 69.2401) to Samarkand (39.6542, 66.9597)
const dSamarkand = calculateDistance(41.2995, 69.2401, 39.6542, 66.9597);
assert(Math.abs(dSamarkand - 268) < 5, 'Tashkent to Samarkand distance is ~268 km', `${dSamarkand.toFixed(1)} km`);

// Tashkent (41.2995, 69.2401) to Bukhara (39.7681, 64.4556)
const dBukhara = calculateDistance(41.2995, 69.2401, 39.7681, 64.4556);
assert(Math.abs(dBukhara - 440) < 5, 'Tashkent to Bukhara distance is ~440 km', `${dBukhara.toFixed(1)} km`);


// ============================================================================
// 4. ADVERSARIAL STRESS TESTS: App.jsx URL Query Parameter Parsing (Task 4)
// ============================================================================
console.log('\n--- 4. Adversarial Stress Tests: URL Query Parsing ---');

function simulateAppJsxHydration(searchString) {
  // Replicates lines 1200-1222 in App.jsx
  let activeCategory = "all";
  let fuelSubFilter = "all";

  try {
    const params = new URLSearchParams(searchString);
    activeCategory = params.get("filter") ? "fuel" : "all";
  } catch {}

  try {
    const params = new URLSearchParams(searchString);
    const f = params.get("filter");
    if (f) {
      const clean = f.toLowerCase();
      if (clean === "electric" || clean === "elektr" || clean === "ev") fuelSubFilter = "elektr";
      if (["metan", "propan", "benzin"].includes(clean)) fuelSubFilter = clean;
    }
  } catch {}

  return { activeCategory, fuelSubFilter };
}

const urlTestCases = [
  { url: '?filter=', expectedCat: 'all', expectedSub: 'all', desc: 'Empty filter param (?filter=)' },
  { url: '?filter=unknown', expectedCat: 'fuel', expectedSub: 'all', desc: 'Unknown filter param (?filter=unknown)' },
  { url: '?filter=METAN&unknown=123', expectedCat: 'fuel', expectedSub: 'metan', desc: 'Uppercase filter with extra query (?filter=METAN&unknown=123)' },
  { url: '?filter', expectedCat: 'all', expectedSub: 'all', desc: 'Valueless filter param (?filter)' },
  { url: '?filter=%', expectedCat: 'fuel', expectedSub: 'all', desc: 'Malformed percent encoding (?filter=%)' },
  { url: '?filter=%ZZ', expectedCat: 'fuel', expectedSub: 'all', desc: 'Invalid hex percent encoding (?filter=%ZZ)' },
  { url: '???&&&===', expectedCat: 'all', expectedSub: 'all', desc: 'Garbage delimiters (???&&&===)' },
  { url: '?filter=null', expectedCat: 'fuel', expectedSub: 'all', desc: 'Literal string "null"' },
  { url: '?filter=undefined', expectedCat: 'fuel', expectedSub: 'all', desc: 'Literal string "undefined"' },
  { url: '?filter=elektr', expectedCat: 'fuel', expectedSub: 'elektr', desc: 'Native alias (?filter=elektr)' },
  { url: '?filter=electric', expectedCat: 'fuel', expectedSub: 'elektr', desc: 'PWA shortcut alias (?filter=electric)' },
  { url: '?filter=EV', expectedCat: 'fuel', expectedSub: 'elektr', desc: 'Uppercase EV alias (?filter=EV)' },
  { url: '?filter=BENZIN', expectedCat: 'fuel', expectedSub: 'benzin', desc: 'Uppercase BENZIN (?filter=BENZIN)' },
  { url: '?filter=PROPAN', expectedCat: 'fuel', expectedSub: 'propan', desc: 'Uppercase PROPAN (?filter=PROPAN)' },
  { url: '?filter=metan', expectedCat: 'fuel', expectedSub: 'metan', desc: 'Lowercase metan (?filter=metan)' },
  { url: '?source=pwa_shortcut&filter=electric', expectedCat: 'fuel', expectedSub: 'elektr', desc: 'PWA launcher URL (?source=pwa_shortcut&filter=electric)' },
  { url: '', expectedCat: 'all', expectedSub: 'all', desc: 'Empty query string' }
];

for (const tc of urlTestCases) {
  const res = simulateAppJsxHydration(tc.url);
  assert(
    res.activeCategory === tc.expectedCat && res.fuelSubFilter === tc.expectedSub,
    `URL query: ${tc.desc}`,
    `cat: ${res.activeCategory}, sub: ${res.fuelSubFilter}`
  );
}

// 4.2 Tab Navigation Query Preservation Check
console.log('\n  4.2 URL State History Preservation:');
// App.jsx lines 257-259:
function simulateTabTransition(currentSearch, newTab) {
  const targetPath = newTab === "privacy" ? "/privacy" : "/";
  const searchStr = currentSearch || "";
  return targetPath + searchStr;
}

assert(
  simulateTabTransition('?filter=electric', 'privacy') === '/privacy?filter=electric',
  'Transition to /privacy preserves ?filter=electric'
);
assert(
  simulateTabTransition('?filter=electric', 'home') === '/?filter=electric',
  'Transition back to home preserves ?filter=electric'
);
assert(
  simulateTabTransition('', 'privacy') === '/privacy',
  'Transition to /privacy with empty search yields clean /privacy'
);


// ============================================================================
// 5. SUMMARY OF RESULTS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log(`TOTAL TESTS EVALUATED: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`FINDINGS LOGGED: ${findings.length}`);
console.log('='.repeat(80));

for (let i = 0; i < findings.length; i++) {
  const f = findings[i];
  console.log(`\nFinding #${i + 1} [${f.severity}]: ${f.title}`);
  console.log(`  Description: ${f.description}`);
  console.log(`  Proof: ${f.empiricalProof}`);
}
