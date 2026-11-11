# Project: AX-Map Production PWA, Privacy Policy & Google Play TWA Release

## Architecture
AX-Map is a high-performance React 19 + Vite 8 Single Page Application (SPA) designed for finding fuel stations (metan, propan, benzin, electric charging) and local services across Uzbekistan.
- **Frontend & PWA Architecture**: React 19, Vite 8, MapLibre GL JS, PMTiles, Lucide React. Single-page navigation with browser History API (`pushState` / `popstate`). Standard W3C Web App Manifest (`public/manifest.json`), responsive branding icons (standard, maskable, store), dedicated responsive `/privacy` route and component, and a production Service Worker (`public/sw.js`) implementing Cache-First static shell caching with strict network bypass for external map tiles and live REST APIs.
- **TWA Android Architecture**: Trusted Web Activity project wrapping `https://myupuz.vercel.app` under package ID `uz.axmap.app`, verified through Digital Asset Links (`public/.well-known/assetlinks.json`) and signed with production RSA release keystore (`axmap-release-key.jks`) to produce Google Play Store release Android App Bundle (`.aab`).

## Code Layout
- `src/App.jsx`: Top-level application component, tab router, state management.
- `src/components/PrivacyPolicyPage.jsx`: Responsive privacy policy view with Google Play disclosures.
- `src/components/MapView.jsx`: MapLibre interactive map view with custom station markers and layers.
- `src/components/NavigationMode.jsx`: Driving directions and turn-by-turn navigation via OSRM.
- `public/manifest.json`: Web App Manifest with `uz.axmap.app` identity.
- `public/icons/`: PWA and store icons (192x192, 512x512, maskable icons).
- `public/sw.js`: Service worker with static caching and map/API bypass.
- `public/.well-known/assetlinks.json`: Digital Asset Links for TWA domain verification.
- `vercel.json`: SPA routing rewrites for clean URL resolution.
- `android-twa/`: Android TWA project source and build scripts.
- `axmap-release-key.jks`: Production release signing keystore.
- `RELEASE_GUIDE.md`: Documentation of credentials, fingerprints, build commands, and release assets.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Web App Manifest | W3C manifest.json with id, name, short_name, start_url, standalone, theme/bg colors | M1 | Survey R1 |
| 2 | HTML PWA Meta Tags | Link manifest, theme-color, viewport, apple-touch-icon in index.html | M1 | Survey R1 |
| 3 | Standard PWA Icons | Generate 192x192 and 512x512 PNG application icons | M1 | Survey R1 |
| 4 | Maskable PWA Icons | Generate 192x192 and 512x512 maskable PNG icons with 80% safe zone and #090d16 background | M1 | Survey R1 |
| 5 | Play Store 512x512 Icon | Full-bleed square 512x512 icon for Google Play Store listing | M1 | Survey R1 |
| 6 | Service Worker Pre-cache | Cache core shell assets (HTML, manifest, icons) on install | M1 | Survey R1 |
| 7 | Service Worker Asset Cache | Cache-First strategy for hashed Vite bundles in /assets/ | M1 | Survey R1 |
| 8 | Service Worker Navigation Fallback | Network-First with cached index.html fallback on offline | M1 | Survey R1 |
| 9 | Map Tiles Strict Bypass | SW bypasses Protomaps, CartoDB, OSM, Mapbox, and .mvt/.pbf/.pmtiles | M1 | Survey R1 |
| 10 | Dynamic API Strict Bypass | SW bypasses /api/*, /stations, and dynamic backend requests | M1 | Survey R1 |
| 11 | Non-GET & External Bypass | SW passes through non-GET methods and non-HTTP schemes | M1 | Survey R1 |
| 12 | Preserve Push Notification Handler | Retain existing notificationclick listener for OPEN_REOPEN_STATION_MODAL | M1 | Survey R1 |
| 13 | SPA Server Rewrites | vercel.json routing rewrites to support clean URLs on Vercel | M1 | Survey R1 |
| 14 | Privacy Policy Component | Responsive PrivacyPolicyPage component in React | M1 | Survey R2 |
| 15 | Route /privacy Integration | Mount privacy view on /privacy pathname and popstate in App.jsx | M1 | Survey R2 |
| 16 | Location Disclosures | Foreground GPS usage for nearest station discovery and route calculation | M1 | Survey R2 |
| 17 | Background Tracking Clarity | Explicit disclosure that NO background location tracking is performed | M1 | Survey R2 |
| 18 | Station Data & Feedback Terms | Terms governing user station reviews, submissions, and gas pressure data | M1 | Survey R2 |
| 19 | User Data Safety & Retention | Data storage, account deletion requests, and support contact info | M1 | Survey R2 |
| 20 | Return to Map Navigation | Working navigation button returning driver to active map session | M1 | Survey R2 |
| 21 | Release Keystore Generation | Generate axmap-release-key.jks (RSA 2048, SHA256withRSA, alias axmap) | M2 | Survey R3 |
| 22 | Keystore Credential Documentation | Document keystore path, alias, and passwords in RELEASE_GUIDE.md | M2 | Survey R3 |
| 23 | SHA-256 Fingerprint Extraction | Extract certificate SHA-256 fingerprint in uppercase colon format | M2 | Survey R3 |
| 24 | Digital Asset Links File | Generate public/.well-known/assetlinks.json for uz.axmap.app | M2 | Survey R3 |
| 25 | TWA Android Project Setup | Configure TWA project targeting https://myupuz.vercel.app with package uz.axmap.app | M2 | Survey R3 |
| 26 | Signed Release .aab Build | Build verified signed Android App Bundle (.aab) for Google Play Console | M2 | Survey R3 |
| 27 | Web Map Zero-Regression | Verify map rendering, custom markers, clustering, and tile loading | M3 | Survey R4 |
| 28 | Station Filter Zero-Regression | Verify fuel type filters (metan, propan, benzin, electric) and search | M3 | Survey R4 |
| 29 | Routing Zero-Regression | Verify OSRM route calculation, navigation mode, and popup station details | M3 | Survey R4 |
| 30 | Verification & Release Guide | Comprehensive test suite and build verification documentation | M3 | Survey R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Web App PWA Assets, Compliance & Privacy Policy | Features 1-20: manifest, icons, sw.js, index.html, vercel.json, /privacy route & component | none | DONE |
| 2 | TWA Android Project, Release Keystore & Signed .aab | Features 21-26: keystore, assetlinks.json, TWA project, signed .aab bundle | M1 | DONE |
| 3 | Final Milestone: E2E Verification, Zero-Regression & Release Guide | Features 27-30: 100% E2E testing, zero-regression checks, release documentation | M1, M2 | DONE |

## Interface Contracts
### PWA ↔ Web App Shell
- `index.html` references `/manifest.json`, `/icons/icon-192x192.png`, and theme color `#0284c7`.
- `public/manifest.json` specifies `start_url: "/?source=pwa"`, `display: "standalone"`, `scope: "/"`.
- `public/sw.js` caches app shell while bypassing `api.protomaps.com`, `cartocdn.com`, `openstreetmap.org`, `mapbox.com`, `/api/*`.

### Privacy Route ↔ Application Navigation
- In `src/App.jsx`: Check `window.location.pathname === '/privacy'` or `activeTab === 'privacy'`.
- Navigation back button calls `handleTabChange('home')` and invokes `window.history.pushState({ tab: 'home' }, '', '/')`.

### Keystore ↔ Digital Asset Links ↔ TWA
- Keystore file: `axmap-release-key.jks`, alias `axmap`.
- SHA-256 fingerprint from keystore is populated in `public/.well-known/assetlinks.json`.
- TWA package `uz.axmap.app` signed with `axmap-release-key.jks` validates against `https://myupuz.vercel.app/.well-known/assetlinks.json`.
