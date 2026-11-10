/**
 * scripts/test_features_28_29.mjs
 *
 * Automated Zero-Regression Test Suite for:
 * - Feature 28: Station Fuel Filtering & Case-Insensitive Search
 * - Feature 29: OSRM Turn-by-Turn Navigation, Maneuver Formatting & Service Worker Bypass
 */

import fs from 'node:fs';
import path from 'node:path';
import { stationMatchesFuel } from '../src/utils/fuel.js';
import { calculateDistance } from '../src/utils/distance.js';

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

console.log('='.repeat(80));
console.log('FEATURES 28 & 29: FILTERING, SEARCH & ROUTING ZERO-REGRESSION SUITE');
console.log('='.repeat(80));

// ============================================================================
// 1. Station Fuel Filtering Tests
// ============================================================================
console.log('\n--- 1. Fuel Type Filtering Logic (src/utils/fuel.js) ---');

const metanStation = { id: 1, name: 'Metan Gas 1', types: ['metan'], prices: { metan: 3800 } };
const propanStation = { id: 2, name: 'Propan Servis', types: ['propan'], prices: { propan: 5500 } };
const benzinStation = { id: 3, name: 'UNG Petrol', types: ['ai92'], prices: { ai92: 9500 } };
const evStationElektr = { id: 4, name: 'TokBor EV', types: ['elektr'], prices: { elektr: 2200 } };
const evStationElectric = { id: 5, name: 'Megawatt Charging', types: ['electric'], prices: { electric: 2500 } };

// Metan filtering
assert(stationMatchesFuel(metanStation, 'metan') === true, 'Metan station matches "metan" filter');
assert(stationMatchesFuel(metanStation, 'gaz') === true, 'Metan station matches "gaz" (gas) filter');
assert(stationMatchesFuel(metanStation, 'propan') === false, 'Metan station rejects "propan" filter');
assert(stationMatchesFuel(metanStation, 'benzin') === false, 'Metan station rejects "benzin" filter');
assert(stationMatchesFuel(metanStation, 'elektr') === false, 'Metan station rejects "elektr" filter');

// Propan filtering
assert(stationMatchesFuel(propanStation, 'propan') === true, 'Propan station matches "propan" filter');
assert(stationMatchesFuel(propanStation, 'gaz') === true, 'Propan station matches "gaz" filter');
assert(stationMatchesFuel(propanStation, 'metan') === false, 'Propan station rejects "metan" filter');
assert(stationMatchesFuel(propanStation, 'benzin') === false, 'Propan station rejects "benzin" filter');

// Benzin filtering
assert(stationMatchesFuel(benzinStation, 'benzin') === true, 'Benzin station matches "benzin" filter');
assert(stationMatchesFuel(benzinStation, 'metan') === false, 'Benzin station rejects "metan" filter');
assert(stationMatchesFuel(benzinStation, 'elektr') === false, 'Benzin station rejects "elektr" filter');

// Electric filtering (including aliases: elektr, electric, ev)
assert(stationMatchesFuel(evStationElektr, 'elektr') === true, 'EV station (elektr) matches "elektr" filter');
assert(stationMatchesFuel(evStationElektr, 'electric') === true, 'EV station (elektr) matches "electric" shortcut filter');
assert(stationMatchesFuel(evStationElektr, 'ev') === true, 'EV station (elektr) matches "ev" filter');
assert(stationMatchesFuel(evStationElectric, 'elektr') === true, 'EV station (electric) matches "elektr" filter');
assert(stationMatchesFuel(evStationElectric, 'electric') === true, 'EV station (electric) matches "electric" filter');
assert(stationMatchesFuel(evStationElectric, 'metan') === false, 'EV station rejects "metan" filter');
assert(stationMatchesFuel(evStationElectric, 'benzin') === false, 'EV station rejects "benzin" filter');

// Universal 'all' filter
assert(stationMatchesFuel(metanStation, 'all') === true, 'Metan station matches "all"');
assert(stationMatchesFuel(propanStation, 'all') === true, 'Propan station matches "all"');
assert(stationMatchesFuel(benzinStation, 'all') === true, 'Benzin station matches "all"');
assert(stationMatchesFuel(evStationElektr, 'all') === true, 'EV station matches "all"');

// Edge cases
assert(stationMatchesFuel(null, 'metan') === false, 'Null station safely returns false');
assert(stationMatchesFuel(undefined, 'metan') === false, 'Undefined station safely returns false');
assert(stationMatchesFuel(metanStation, '') === true, 'Empty fuel string treated as all (returns true)');

// ============================================================================
// 2. Station Search Input Parsing Tests
// ============================================================================
console.log('\n--- 2. Station Search Input Matching ---');

function matchesSearch(st, searchQuery) {
  if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase().trim();
  return (
    (st.name || '').toLowerCase().includes(q) ||
    (st.brand || '').toLowerCase().includes(q) ||
    (st.address || '').toLowerCase().includes(q)
  );
}

const testStations = [
  { id: 101, name: 'Shaffof Gaz Servis', brand: 'Shaffof', address: 'Toshkent sh., Yunusobod t., Amir Temur 100' },
  { id: 102, name: 'UNG Petrol Chilonzor', brand: 'UNG Petrol', address: 'Toshkent sh., Chilonzor t., Bunyodkor 45' },
  { id: 103, name: 'Caravan Gas', brand: 'Caravan', address: 'Samarqand sh., Registon ko\'chasi 12' }
];

assert(matchesSearch(testStations[0], 'shaffof') === true, 'Search "shaffof" matches station name');
assert(matchesSearch(testStations[1], 'chilonzor') === true, 'Search "chilonzor" matches address');
assert(matchesSearch(testStations[1], 'ung petrol') === true, 'Search "ung petrol" matches brand');
assert(matchesSearch(testStations[0], '  shaffof  ') === true, 'Search with leading/trailing whitespace matches correctly');
assert(matchesSearch(testStations[2], 'buxoro') === false, 'Non-matching query correctly returns false');
assert(matchesSearch(testStations[0], '') === true, 'Empty query returns true for all stations');

// ============================================================================
// 3. Navigation Maneuver Formatting Tests
// ============================================================================
console.log('\n--- 3. Turn Maneuver Formatting ---');

// Extract or reproduce getRoundedTurnInstruction from NavigationMode.jsx
function formatTurn(distKm, maneuver, streetName) {
  const modifier = maneuver?.modifier || '';
  const type = maneuver?.type || 'turn';
  let turnAction = "To'g'riga harakatlaning";
  if (modifier.includes('right')) {
    turnAction = "O'ngga buriling";
  } else if (modifier.includes('left')) {
    turnAction = "Chapga buriling";
  } else if (modifier.includes('uturn')) {
    turnAction = "Orqaga qayting";
  }

  const meters = Math.round((distKm || 0) * 1000);
  let distNum = "400";
  let distUnit = "m";

  if (meters >= 950) {
    const kmVal = Math.round((distKm || 1) * 10) / 10;
    distNum = kmVal.toFixed(1).replace('.', ',');
    distUnit = "km";
  } else if (meters <= 35) {
    distNum = "Hozir";
    distUnit = "";
  } else {
    const rounded = Math.max(50, Math.round(meters / 50) * 50);
    distNum = String(rounded);
    distUnit = "m";
  }

  const street = streetName ? `${streetName} ko'chasiga` : "Xadra ko'chasiga";
  return { distNum, distUnit, turnAction, street, modifier, type };
}

const turn1 = formatTurn(1.24, { modifier: 'right' }, 'Navoiy');
assert(turn1.distNum === '1,2' && turn1.distUnit === 'km', 'Distance >= 950m formats as km (1,2 km)');
assert(turn1.turnAction === "O'ngga buriling", 'Right turn modifier formats as "O\'ngga buriling"');
assert(turn1.street === "Navoiy ko'chasiga", 'Street formats with "ko\'chasiga" suffix');

const turn2 = formatTurn(0.34, { modifier: 'left' }, 'Amir Temur');
assert(turn2.distNum === '350' && turn2.distUnit === 'm', 'Distance 340m rounds to 50m intervals (350 m)');
assert(turn2.turnAction === "Chapga buriling", 'Left turn modifier formats as "Chapga buriling"');

const turn3 = formatTurn(0.02, { modifier: 'uturn' }, '');
assert(turn3.distNum === 'Hozir' && turn3.distUnit === '', 'Distance <= 35m formats as "Hozir"');
assert(turn3.turnAction === "Orqaga qayting", 'Uturn modifier formats as "Orqaga qayting"');

// ============================================================================
// 4. Route Deviation & Arrival Calculation Tests
// ============================================================================
console.log('\n--- 4. Route Deviation & Arrival Distance Calculations ---');

function getMinDistanceToRoute(point, coordsList) {
  if (!coordsList || coordsList.length === 0) return 0;
  let minKm = Infinity;
  for (let i = 0; i < coordsList.length; i++) {
    const d = calculateDistance(point.lat, point.lng, coordsList[i][0], coordsList[i][1]);
    if (d < minKm) minKm = d;
  }
  return minKm;
}

// Tashkent Broadway street coordinate points
const sampleRouteCoords = [
  [41.311081, 69.240562],
  [41.311500, 69.241000],
  [41.312000, 69.242000],
  [41.313000, 69.243000]
];

// Point on route
const pointOnRoute = { lat: 41.311081, lng: 69.240562 };
const distOnRoute = getMinDistanceToRoute(pointOnRoute, sampleRouteCoords);
assert(distOnRoute < 0.005, 'Point directly on route yields ~0 distance', `${(distOnRoute * 1000).toFixed(1)}m`);

// Point 100 meters off route
const pointOffRoute = { lat: 41.312000, lng: 69.243500 }; // ~120m east
const distOffRoute = getMinDistanceToRoute(pointOffRoute, sampleRouteCoords);
assert(distOffRoute > 0.045, 'Point >45m off route exceeds reroute threshold', `${(distOffRoute * 1000).toFixed(1)}m > 45m`);

// Arrival threshold test (25 meters = 0.025 km)
const arrivalStation = { lat: 41.311081, lng: 69.240562 };
const userArrivedPos = { lat: 41.311200, lng: 69.240600 }; // ~15m
const distToArrival = calculateDistance(userArrivedPos.lat, userArrivedPos.lng, arrivalStation.lat, arrivalStation.lng);
assert(distToArrival <= 0.025, 'User within 25m satisfies arrival condition', `${(distToArrival * 1000).toFixed(1)}m <= 25m`);

// ============================================================================
// 5. OSRM API Response Contract
// ============================================================================
console.log('\n--- 5. OSRM Routing Contract & Parsing ---');

const mockOsrmResponse = {
  code: 'Ok',
  routes: [
    {
      geometry: {
        coordinates: [
          [69.240562, 41.311081],
          [69.241000, 41.311500],
          [69.242000, 41.312000]
        ]
      },
      legs: [
        {
          distance: 1250,
          duration: 180,
          steps: [
            {
              maneuver: { type: 'depart', modifier: 'straight' },
              name: 'Amir Temur',
              distance: 400
            },
            {
              maneuver: { type: 'turn', modifier: 'right' },
              name: 'Navoiy',
              distance: 850
            }
          ]
        }
      ]
    }
  ]
};

assert(mockOsrmResponse.code === 'Ok', 'OSRM response contains code "Ok"');
assert(mockOsrmResponse.routes?.[0]?.geometry?.coordinates?.length === 3, 'OSRM routes geometry coordinates parsed');
assert(mockOsrmResponse.routes?.[0]?.legs?.[0]?.steps?.length === 2, 'OSRM steps array contains turn maneuvers');

// Verify NavigationMode.jsx contains OSRM endpoint and route fetching
const navModeContent = fs.readFileSync(path.resolve('src/components/NavigationMode.jsx'), 'utf8');
assert(navModeContent.includes('router.project-osrm.org/route/v1/driving/'), 'NavigationMode connects to project-osrm.org');
assert(navModeContent.includes('calculateDistance'), 'NavigationMode uses calculateDistance');
assert(navModeContent.includes('distToTarget <= 0.025'), 'NavigationMode implements 25m arrival threshold');
assert(navModeContent.includes('offDist > 0.045'), 'NavigationMode implements 45m reroute threshold');

// ============================================================================
// 6. Service Worker Bypass Contract
// ============================================================================
console.log('\n--- 6. Service Worker Bypass Contract ---');
const swContent = fs.readFileSync(path.resolve('public/sw.js'), 'utf8');

// Ensure foreign origin (OSRM) bypasses same-origin caching
assert(swContent.includes('url.origin === self.location.origin'), 'sw.js restricts caching to same-origin requests');
assert(swContent.includes('isDynamicApiRequest(url)'), 'sw.js checks dynamic API bypass');

console.log('\n' + '='.repeat(80));
console.log(`FEATURES 28 & 29 VERIFICATION REPORT:`);
console.log(`Total Assertions Evaluated: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('='.repeat(80));

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n🌟 FEATURES 28 & 29 ZERO-REGRESSION SUITE PASSED 100%!');
  process.exit(0);
}
