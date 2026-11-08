# Project: MyUp & A-Maps Super Admin Production Optimization & Deployment

## Architecture
- **Main Frontend**: React 19 + Vite 8 (Rolldown) location/fuel station finder (`c:\Users\user\Desktop\MyUp`). Uses MapLibre GL, PMTiles, Lucide React. Served as SPA via Nginx (`myup.uz`).
- **Admin Frontend**: Vanilla JS + Vite 5 admin dashboard (`C:\Users\user\Desktop\A-Maps supper admin`). Uses Leaflet, Chart.js, Lucide. Served as SPA via Nginx (`admin.myup.uz`).
- **Backend API**: Node.js Express (ES Modules) REST API (`c:\Users\user\Desktop\MyUp\server`). Connects to PostgreSQL via `pg` connection pool. Managed by PM2 in cluster mode on port 5000, reverse-proxied via Nginx (`/api/`).
- **Deployment**: Linux VPS with Nginx reverse proxy, Certbot SSL, systemd/PM2, and automated bash deployment script (`deploy.sh`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Main Frontend Chunk Splitting | Function-based `manualChunks(id)` in Vite 8 Rolldown isolating `vendor-maplibre`, `vendor-react`, `vendor-icons` | M1 | Survey 1 |
| 2 | Main Frontend Dynamic Imports | `React.lazy()` for `MapView`, `NavigationMode`, `AddStationModal`, modals & views with Suspense fallbacks | M1 | Survey 1 |
| 3 | Main Frontend Dependency Pruning | Uninstall unused `firebase`, `leaflet`, `react-leaflet` dependencies from package.json | M1 | Survey 1 |
| 4 | Main Frontend Dead Code Removal | Remove `.bak` files, unimported legacy components (`MapComponent`, `AuthModal`, etc.) | M1 | Survey 1 |
| 5 | Main Frontend Asset & Font Optimization | Optimize images to WebP (~3.5MB savings), replace blocking CSS `@import` font with HTML `<link>` | M1 | Survey 1 |
| 6 | Admin Lucide Icon Tree-Shaking | Selective 84-icon registry in `src/core/icons.js` reducing 748 kB bundle to ~32.5 kB (95.6% reduction) | M2 | Survey 2 |
| 7 | Admin CDN Script Removal | Remove blocking unpinned unpkg Lucide CDN script from `index.html` | M2 | Survey 2 |
| 8 | Admin Chart.js Tree-Shaking | Replace `chart.js/auto` with selective controllers/elements in `analytics.js` (~25 kB savings) | M2 | Survey 2 |
| 9 | Admin Build Hardening & Standard Limit | Reset `chunkSizeWarningLimit: 500`, configure dev proxy in `vite.config.js` | M2 | Survey 2 |
| 10 | Admin Dynamic Backend Health URL | Replace hardcoded `localhost:5000/api/health` with dynamic relative `/api/health` | M2 | Survey 2 |
| 11 | Admin Dead Code & Env Template | Remove unimported `update_mapview_popup.js`, `Component.js`, `Security.js`, `geoData.js`, add `.env.production` | M2 | Survey 2 |
| 12 | Backend Security Middleware | Install and configure `helmet`, `express-rate-limit`, `compression`, and `app.set('trust proxy', 1)` | M3 | Survey 3 |
| 13 | Backend Dynamic CORS Whitelist | Dynamic matching of origins based on comma-separated `CORS_ORIGIN` env variable | M3 | Survey 3 |
| 14 | Backend Rate Limiting Tiers | General API rate limiter (300/15min) + strict Auth limiter (20/15min on `/api/auth/*`) | M3 | Survey 3 |
| 15 | Backend Comprehensive Health Check | `/api/health` returning 200/503, uptime, memory, and PostgreSQL pool metrics | M3 | Survey 3 |
| 16 | PostgreSQL Connection Pool Tuning | Tune `DB_POOL_MAX: 10`, fail-fast connection timeouts, statement timeout, error listener | M3 | Survey 3 |
| 17 | Database Schema Synchronization | Idempotent table creation for `app_visits` and `admin_cards` in init scripts to prevent drift | M3 | Survey 3 |
| 18 | Backend Production Env & PM2 Config | Comprehensive `.env.production.example` and cluster-mode `ecosystem.config.cjs` | M3 | Survey 3 |
| 19 | Dual-Host Nginx Reverse Proxy Config | Nginx server blocks for `myup.uz` (main app SPA), `admin.myup.uz` (admin SPA), and `/api` proxy with SSL & cache | M4 | Survey 3 |
| 20 | SSL & Certbot Setup Documentation | Automated SSL provisioning and renewal instructions for Ubuntu/Debian VPS | M4 | Survey 3 |
| 21 | Automated Bash Deployment Script | `deploy.sh` script automating git pull, migrations, frontend builds, zero-downtime PM2 reload, and health check | M4 | Survey 3 |
| 22 | E2E Verification & Security Audit | Comprehensive verification of builds, server startup, health endpoint, rate limiting, and headers | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Main Frontend Optimization | Chunk splitting, React.lazy, dead code/deps pruning, asset optimization | none | DONE |
| M2 | Admin Frontend Optimization | Lucide tree-shaking, Chart.js pruning, relative API URLs, dead code cleanup | none | DONE |
| M3 | Backend Production Hardening | Security middleware, CORS, rate limits, pg pool tuning, health check, PM2 | none | DONE |
| M4 | Linux VPS Deployment Infra | Nginx dual-host template, SSL/Certbot guide, automated deploy.sh script | M1, M2, M3 | DONE |
| M5 | E2E Verification & Audit | Zero-error build validation, server startup, health endpoint, security audit | M1, M2, M3, M4 | DONE |

## Code Layout
- `c:\Users\user\Desktop\MyUp`:
  - `src/`: React source code (App.jsx, components, assets)
  - `public/`: Public static assets (images, pmtiles, favicon)
  - `vite.config.js`: Main frontend Vite configuration
  - `package.json`: Main frontend dependencies
- `C:\Users\user\Desktop\A-Maps supper admin`:
  - `src/`: Admin frontend source code (main.js, modules, core/icons.js)
  - `index.html`: Admin entry HTML
  - `vite.config.js`: Admin frontend Vite configuration
  - `package.json`: Admin frontend dependencies
- `c:\Users\user\Desktop\MyUp\server`:
  - `src/server.js`: Express application entrypoint
  - `src/config/db.js`: PostgreSQL connection pool configuration
  - `ecosystem.config.cjs`: PM2 cluster process manager config
  - `.env.production.example`: Production environment template
  - `package.json`: Backend dependencies
- `c:\Users\user\Desktop\MyUp\deploy`:
  - `nginx/myup.conf`: Nginx reverse proxy configuration template
  - `deploy.sh`: Automated production deployment script
  - `DEPLOYMENT_GUIDE.md`: Step-by-step VPS, PM2, and SSL/Certbot setup documentation
  - `systemd/myup-api.service`: Systemd service unit template
  - `verify-deployment.cjs`: Deployment verification test suite

## Interface Contracts
### Main Frontend ↔ Backend API
- Base URL: `/api` (or `VITE_API_URL`)
- Health Check: `GET /api/health` -> `{ success: true, status: 'healthy', database: 'connected', ... }`
- Auth: `POST /api/auth/login`, `POST /api/auth/register` (rate limited to 20 req/15min)
- Stations: `GET /api/stations`, `POST /api/stations`

### Admin Frontend ↔ Backend API
- Base URL: `/api` (or `VITE_API_BASE_URL`)
- Health Check: `GET /api/health` -> HTTP 200 with JSON payload
- Analytics: `GET /api/analytics/live`, `GET /api/admin/stats`
- Moderation & Cards: `GET /api/admin/cards`, `GET /api/admin/places`
