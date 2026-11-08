# Backend & Linux VPS Deployment Infrastructure Survey

**Scope**: Node.js Express Backend (`c:\Users\user\Desktop\MyUp\server`), PostgreSQL database pooling, security middleware, PM2 cluster management, and Linux VPS deployment infrastructure (Nginx, Certbot SSL, systemd, `deploy.sh`) across MyUp and A-Maps Super Admin.
**Inspector**: `teamwork_explorer` (Instance 3: Backend & Deployment Infrastructure Survey)
**Date**: 2026-11-06

---

## 1. Observation

### 1.1 Backend Dependencies & Module System (`server/package.json`)
Direct inspection of `server/package.json` (lines 6, 12-19) reveals:
```json
"type": "module",
"dependencies": {
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.13.1"
}
```
- **Observed Absence**: Security packages `helmet` and `express-rate-limit`, as well as HTTP compression `compression`, are completely absent from `dependencies`.
- **Module System**: `"type": "module"` is configured. All runtime files use ES Modules (`import`/`export`), which impacts PM2 configuration file naming and imports.

### 1.2 Express Server Entrypoint (`server/src/server.js`)
Inspection of `server/src/server.js` shows:
1. **Permissive CORS** (lines 16–20):
   ```javascript
   app.use(cors({
     origin: '*', // Productionda xavfsiz domenlar qo'yiladi
     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization'],
   }));
   ```
   CORS wildcard `*` is hardcoded regardless of `NODE_ENV`. Any origin can query or send requests.
2. **Missing Reverse Proxy Trust**:
   There is no `app.set('trust proxy', 1);`. When deployed behind Nginx, `req.ip` resolves to `127.0.0.1` for all requests, making IP-based rate limiting block all users simultaneously.
3. **Missing Security & Compression Middlewares**:
   No `helmet()` headers, no response compression (`compression()`), and no request rate limiting (`express-rate-limit`).
4. **Health Check Endpoint** (lines 25–42):
   ```javascript
   app.get('/api/health', async (req, res) => {
     try {
       const dbTest = await pool.query('SELECT NOW() AS "currentTime"');
       res.json({
         success: true,
         status: 'Server ishlamoqda',
         database: 'PostgreSQL ulangan',
         dbTime: dbTest.rows[0].currentTime,
         timestamp: new Date().toISOString(),
       });
     } catch (err) {
       res.status(500).json({
         success: false,
         status: 'Server ishlamoqda',
         database: 'PostgreSQL ga ulanishda xato: ' + err.message,
       });
     }
   });
   ```
   While functional, the endpoint returns HTTP 500 rather than standard 503 (Service Unavailable) on database disconnection, and omits process uptime, memory usage, and connection pool saturation metrics.
5. **No Graceful Shutdown Handlers**:
   The process does not listen for `SIGINT` or `SIGTERM`. During PM2 reloads (`pm2 reload`), in-flight HTTP requests and active database connections may be terminated abruptly.

### 1.3 Database Pool Configuration (`server/src/config/db.js`)
Inspection of `server/src/config/db.js` (lines 15–39) shows:
```javascript
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'amaps_db',
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);
pool.on('error', (err) => {
  console.error('Kutilmagan PostgreSQL xatosi:', err.message);
});
```
- **Connection Saturation Risk**: In `ecosystem.config.cjs`, PM2 is configured for `instances: 'max'` (cluster mode). If a VPS has 4 vCPUs, 4 instances * 20 pool connections = 80 connections. On standard PostgreSQL with default `max_connections = 100`, this leaves almost no connections for administration, backups, or migrations, risking `FATAL: sorry, too many clients already`.
- **Missing Query/Statement Timeouts**: No `statement_timeout` is defined; long-running or deadlocked queries can consume worker connections indefinitely.
- **Connection Timeout**: `connectionTimeoutMillis: 10000` is high; failing fast (3–5 seconds) is preferred under load.

### 1.4 Database Migrations & Schema Drift (`server/schema.sql` vs scripts)
- `server/schema.sql` defines: `users`, `stations`, `fuel_prices`, `station_amenities`, `station_payments`, `feedbacks`, `reviews`, `admin_logs`, `ads`, `user_notifications`.
- `server/scripts/createVisitsTable.js` creates: `app_visits` (queried in `server/src/controllers/analyticsController.js:30,38,53,89`).
- `server/scripts/migrateAdminTables.js` creates: `admin_cards` (queried in `server/src/controllers/adminController.js:379,403`).
- **Drift Observation**: `app_visits` and `admin_cards` are NOT included in `server/schema.sql` or `server/scripts/initDb.js`. Running a fresh setup via `schema.sql` or `npm run db:init` causes `/api/analytics` and `/api/admin/cards` queries to fail with `relation "app_visits" does not exist` and `relation "admin_cards" does not exist`.

### 1.5 Cluster Mode Concurrency Bottleneck in Analytics (`server/src/controllers/analyticsController.js`)
Inspection of `analyticsController.js` (lines 3–5) shows:
```javascript
const activeVisitors = new Map(); // visitorId -> lastActiveTimestamp
const ONLINE_WINDOW_MS = 3 * 60 * 1000;
```
- In PM2 cluster mode, each worker process runs in an isolated Node.js process without shared memory. If traffic is distributed across workers via round-robin, each worker only tracks visitors assigned to it.
- Admin dashboard requests (`/api/admin/stats` and `/api/analytics/live`) will return inconsistent `onlineUsers` counts depending on which worker handles the request.
- `app_visits` already stores `last_seen TIMESTAMP`; computing online users via SQL query (`COUNT(DISTINCT visitor_id) WHERE last_seen >= NOW() - INTERVAL '3 minutes'`) is database-backed and cluster-safe.

### 1.6 Environment Configuration & Secrets
- `server/.env.example` contains only basic keys (`PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `JWT_SECRET`).
- `authMiddleware.js` (line 6) and `authController.js` (line 8) fall back to hardcoded string `'myup_super_secret_jwt_key_2026_uzbekistan'`. If `JWT_SECRET` is unset in production, it silently defaults to a public secret.
- In `authMiddleware.js` lines 62–65, `NODE_ENV !== 'production'` bypasses admin authentication entirely:
  ```javascript
  if (process.env.NODE_ENV !== 'production') {
    req.user = { id: 'admin_dev', role: 'super_admin' };
    return next();
  }
  ```
  This reinforces that `NODE_ENV=production` must strictly be set in `.env.production` and PM2 to avoid unauthorized admin access.

### 1.7 PM2 Configuration (`server/ecosystem.config.cjs`)
`server/ecosystem.config.cjs` currently contains:
```javascript
module.exports = {
  apps: [
    {
      name: 'myup-api',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
```
- `max_memory_restart: '600M'` and `exec_mode: 'cluster'` are set.
- Lacks: `wait_ready: true`, `listen_timeout`, `kill_timeout`, log path specifications, exponential backoff restart delay, and cluster instance count cap for constrained VPS environments.

### 1.8 Existing Nginx Example (`server/nginx.conf.example`)
Inspection of `server/nginx.conf.example` shows:
- Configures only `myup.uz` and `/var/www/myup/dist`.
- Does NOT configure or route `A-Maps supper admin` (admin frontend).
- Lacks SSL certificate blocks, HTTP/2, security headers, gzip static asset compression, and asset cache headers.

---

## 2. Logic Chain

```
[Observation 1.1: Missing helmet, compression, rate-limit in package.json]
   │
   ▼
[Step 1: Production hardening requires installing helmet, compression, express-rate-limit]
   │
   ▼
[Observation 1.2: Hardcoded cors origin: '*', no trust proxy, basic health check]
   │
   ▼
[Step 2: Express server must set trust proxy=1 for Nginx, dynamically match CORS_ORIGIN,
 apply API and Auth rate limits, enable compression, and expand /api/health with DB & pool status]
   │
   ▼
[Observation 1.3: DB_POOL_MAX=20 multiplied across PM2 cluster instances exceeds Postgres connections]
   │
   ▼
[Step 3: Tune pool max to 10 per worker, connectionTimeoutMillis to 5000ms, idleTimeoutMillis to 30000ms,
 add statement_timeout, and document total connection formula in .env.production]
   │
   ▼
[Observation 1.4: app_visits & admin_cards missing in schema.sql & initDb.js]
   │
   ▼
[Step 4: Update database schema or provide unified migration script in deploy.sh to prevent production runtime crash]
   │
   ▼
[Observation 1.5: In-memory activeVisitors Map does not synchronize across PM2 cluster workers]
   │
   ▼
[Step 5: Transition live traffic calculation to PostgreSQL-backed query or acknowledge worker boundary]
   │
   ▼
[Observation 1.7 & 1.8: Incomplete PM2 logging/shutdown & single-site Nginx missing admin app]
   │
   ▼
[Step 6: Deliver production-ready Nginx reverse proxy template (dual-site: main app + admin app),
 PM2 ecosystem configuration, SSL Certbot instructions, and deploy.sh bash automation script]
```

---

## 3. Caveats

1. **Domain Architecture Choice for Super Admin Frontend**:
   The admin frontend (`C:\Users\user\Desktop\A-Maps supper admin`) is configured with Vite's default `base: '/'`.
   - **Recommended Architecture**: Host Super Admin on a separate subdomain: `admin.myup.uz` (or `panel.myup.uz`). This keeps Vite's `base: '/'` intact without requiring subpath URL rewrite configurations.
   - **Alternative Architecture**: If both must live on `myup.uz/admin`, Vite's `base` must be set to `'/admin/'` and Nginx must use an `alias` directive. The subdomain approach is strongly recommended.
2. **PM2 CommonJS vs ES Modules**:
   Because `server/package.json` contains `"type": "module"`, PM2 ecosystem files MUST use `.cjs` extension (`ecosystem.config.cjs`) if using `module.exports`, or ES module `export default` if using `.config.js`. Keeping `ecosystem.config.cjs` ensures 100% backward compatibility with PM2 CLI.
3. **Database Migration State**:
   Currently, database initialization relies on raw SQL scripts without a formal migration framework (such as Knex or Prisma). The deployment script must execute idempotent DDL (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) to prevent failures on subsequent deployments.

---

## 4. Conclusion & Production Architecture Specifications

### 4.1 Required Package Additions (`server/package.json`)
The following production packages must be installed in `server`:
- `helmet`: `^8.0.0` (HTTP response security headers)
- `express-rate-limit`: `^7.5.0` (DDoS and brute-force mitigation)
- `compression`: `^1.7.5` (Gzip/Brotli payload compression)

### 4.2 Hardened Express Server Blueprint (`server/src/server.js`)
The hardened entrypoint incorporates:
1. `app.set('trust proxy', 1);` for accurate IP detection behind Nginx.
2. `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })` to ensure map tiles, images, and API responses are not blocked cross-origin.
3. Configurable CORS whitelist parsing `process.env.CORS_ORIGIN` (e.g. `https://myup.uz,https://www.myup.uz,https://admin.myup.uz`), allowing local dev origins when `NODE_ENV !== 'production'`.
4. Two rate limiting tiers:
   - General API limiter: 300 requests / 15 minutes.
   - Strict Auth limiter: 20 requests / 15 minutes applied specifically to `/api/auth/login` and `/api/auth/register`.
5. Response compression for payloads > 1KB.
6. Comprehensive `/api/health` returning HTTP 200 (healthy) or 503 (DB unavailable), uptime, process memory, and pool metrics.
7. Graceful termination hooks (`SIGTERM`, `SIGINT`) closing the HTTP server and draining the PostgreSQL pool.

### 4.3 Database Pool Tuning Blueprint (`server/src/config/db.js`)
Configured specifically for PM2 cluster deployment:
- `max`: `parseInt(process.env.DB_POOL_MAX || '10', 10)` (prevents connection exhaustion across multiple workers)
- `idleTimeoutMillis`: `30000` (reclaims unused connections)
- `connectionTimeoutMillis`: `5000` (fails fast on database overload)
- `statement_timeout`: `15000` (kills runaway queries after 15s)
- Centralized error listener on `pool.on('error')`.

### 4.4 Production `.env.production` Template
Located at `server/.env.production.example`:
```env
# ===============================================
# MYUP PRODUCTION ENVIRONMENT CONFIGURATION
# ===============================================

NODE_ENV=production
PORT=5000

# Security: Set a cryptographically secure random string (min 32 chars)
# e.g.: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=replace_with_strong_random_secret_at_least_32_chars_long

# Allowed CORS origins (comma-separated list without trailing slashes)
CORS_ORIGIN=https://myup.uz,https://www.myup.uz,https://admin.myup.uz

# PostgreSQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=myup_user
DB_PASSWORD=strong_postgres_password_here
DB_NAME=myup_prod_db
DB_SSL=false

# Connection Pool Tuning (Per PM2 worker process)
# Total connections = PM2_INSTANCES * DB_POOL_MAX <= postgresql max_connections - 15
DB_POOL_MAX=10

# Rate Limiting Settings
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
```

### 4.5 Production PM2 Configuration (`server/ecosystem.config.cjs`)
```javascript
module.exports = {
  apps: [
    {
      name: 'myup-api',
      script: './src/server.js',
      instances: 'max', // or fixed number e.g. 2 or 4 on smaller VPS
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
```

### 4.6 Production Nginx Configuration Blueprint
Designed to serve both the main application (`myup.uz`) and the admin portal (`admin.myup.uz`):

```nginx
# ========================================================
# NGINX PRODUCTION CONFIGURATION FOR MYUP & ADMIN
# Location: /etc/nginx/sites-available/myup
# ========================================================

# 1. HTTP -> HTTPS Redirection for all domains
server {
    listen 80;
    listen [::]:80;
    server_name myup.uz www.myup.uz admin.myup.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# 2. Main Frontend Application (myup.uz & www.myup.uz) + API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name myup.uz www.myup.uz;

    ssl_certificate /etc/letsencrypt/live/myup.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myup.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Maximum file upload size (photos, receipts, station assets)
    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # A) Node.js Express API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffers 16 16k;
        proxy_buffer_size 32k;
    }

    # B) Static Frontend SPA (Built Vite Assets)
    root /var/www/myup/dist;
    index index.html;

    # Cache static assets (hashed JS, CSS, images) for 1 year
    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|webp|ico|pmtiles)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
        access_log off;
    }

    # SPA Fallback for client-side routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

# 3. Super Admin Frontend Application (admin.myup.uz)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.myup.uz;

    ssl_certificate /etc/letsencrypt/live/myup.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myup.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Proxy API requests directly through admin host as well
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Super Admin Built Vite Assets
    root /var/www/myup-admin/dist;
    index index.html;

    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|webp|ico)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
        access_log off;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### 4.7 SSL / Certbot Setup Guidelines
Step-by-step setup on Ubuntu/Debian Linux VPS:
1. **DNS Prerequisites**: Ensure DNS A-Records point to the VPS public IP:
   - `myup.uz` -> `[VPS_IP]`
   - `www.myup.uz` -> `[VPS_IP]`
   - `admin.myup.uz` -> `[VPS_IP]`
2. **Install Certbot**:
   ```bash
   sudo apt update && sudo apt install snapd -y
   sudo snap install core && sudo snap refresh core
   sudo snap install --classic certbot
   sudo ln -sf /snap/bin/certbot /usr/bin/certbot
   ```
3. **Generate Initial Certificates**:
   ```bash
   sudo certbot --nginx -d myup.uz -d www.myup.uz -d admin.myup.uz
   ```
4. **Automated Renewal Verification**:
   Snap automatically provisions a systemd timer (`snap.certbot.renew.timer`). Verify with:
   ```bash
   sudo certbot renew --dry-run
   systemctl list-timers | grep certbot
   ```

### 4.8 Automated Bash Deployment Script (`deploy.sh`) Blueprint
A robust deployment script placed at project root or `server/scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
# ==============================================================================
# MyUp & A-Maps Production Deployment Script
# Automated dependency install, database migration, Vite builds, and PM2 reload
# ==============================================================================

set -euo pipefail

# Color formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

trap 'log_error "Deployment failed at line $LINENO. Exiting."; exit 1' ERR

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_DIR="${BASE_DIR}/server"
MAIN_FRONTEND_DIR="${BASE_DIR}"
ADMIN_FRONTEND_DIR="${BASE_DIR}/../A-Maps supper admin"

log_info "Starting MyUp Production Deployment..."
log_info "Server Directory: ${SERVER_DIR}"

# 1. Validate Production Environment
if [ ! -f "${SERVER_DIR}/.env.production" ] && [ ! -f "${SERVER_DIR}/.env" ]; then
    log_error "Neither .env.production nor .env found in ${SERVER_DIR}!"
    exit 1
fi

# 2. Backend Dependency Installation & Verification
log_info "Installing Backend Production Dependencies..."
cd "${SERVER_DIR}"
npm ci --omit=dev || npm install --omit=dev

# 3. Apply Database Migrations (Idempotent)
log_info "Ensuring Database Schema and Tables..."
node scripts/initDb.js
if [ -f "scripts/migrateAdminTables.js" ]; then
    node scripts/migrateAdminTables.js
fi
if [ -f "scripts/createVisitsTable.js" ]; then
    node scripts/createVisitsTable.js
fi
log_success "Database migrations completed successfully."

# 4. Main Frontend Production Build
log_info "Building Main Frontend (MyUp)..."
cd "${MAIN_FRONTEND_DIR}"
npm ci || npm install
npm run build
if [ ! -f "${MAIN_FRONTEND_DIR}/dist/index.html" ]; then
    log_error "Main frontend build output missing dist/index.html!"
    exit 1
fi
log_success "Main Frontend build completed."

# 5. Super Admin Frontend Production Build
if [ -d "${ADMIN_FRONTEND_DIR}" ]; then
    log_info "Building Super Admin Frontend..."
    cd "${ADMIN_FRONTEND_DIR}"
    npm ci || npm install
    npm run build
    if [ ! -f "${ADMIN_FRONTEND_DIR}/dist/index.html" ]; then
        log_error "Admin frontend build output missing dist/index.html!"
        exit 1
    fi
    log_success "Super Admin Frontend build completed."
else
    log_warn "Admin frontend directory not found at ${ADMIN_FRONTEND_DIR}. Skipping."
fi

# 6. PM2 Zero-Downtime Reload
log_info "Reloading Backend via PM2..."
cd "${SERVER_DIR}"
mkdir -p logs
if pm2 describe myup-api > /dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --env production --update-env
    log_success "PM2 cluster reloaded with zero downtime."
else
    pm2 start ecosystem.config.cjs --env production
    log_success "PM2 process started."
fi
pm2 save

# 7. Nginx Reload
if command -v nginx > /dev/null 2>&1; then
    log_info "Testing and reloading Nginx..."
    sudo nginx -t
    sudo systemctl reload nginx
    log_success "Nginx reloaded successfully."
fi

# 8. Post-Deployment Health Check Verification
log_info "Validating API Health Check..."
sleep 2
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/health || echo "FAILED")
if [ "${HEALTH_STATUS}" = "200" ]; then
    log_success "Health check passed (HTTP 200 OK)!"
else
    log_error "Health check returned unexpected status: ${HEALTH_STATUS}"
    curl -s http://127.0.0.1:5000/api/health || true
    exit 1
fi

log_success "=========================================================="
log_success "🎉 DEPLOYMENT SUCCEEDED! All services are active and healthy."
log_success "=========================================================="
```

---

## 5. Verification Method

### 5.1 Backend Hardening Verification
1. **Dependency Installation Check**:
   ```bash
   cd c:\Users\user\Desktop\MyUp\server
   npm ls helmet express-rate-limit compression
   ```
   *Expected Result*: All three dependencies listed without missing package errors.
2. **Security Headers Verification**:
   Start server (`npm start`) and query:
   ```bash
   curl -I http://localhost:5000/api/health
   ```
   *Verify Headers Present*: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `RateLimit-Limit`, `RateLimit-Remaining`.
3. **Rate Limit Verification**:
   Run rapid curl loop on `/api/auth/login`:
   ```bash
   for i in {1..25}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login; done
   ```
   *Verify Result*: Requests 1–20 return 400 (bad input), request 21+ returns HTTP 429 (Too Many Requests).
4. **Health Check Output Verification**:
   ```bash
   curl -s http://localhost:5000/api/health
   ```
   *Verify JSON Fields*: `success: true`, `status: 'healthy'`, `uptime`, `memory`, `database: 'connected'`, `pool: { total, idle, waiting }`.

### 5.2 Nginx & Deployment Script Verification
1. **Nginx Syntax Check**:
   ```bash
   sudo nginx -t -c /etc/nginx/sites-available/myup
   ```
   *Expected Result*: `syntax is ok` and `test is successful`.
2. **PM2 Cluster Check**:
   ```bash
   pm2 list
   pm2 show myup-api
   ```
   *Verify*: Mode is `cluster`, status is `online`, memory < 200MB per worker, 0 unhandled restarts.
3. **Static File Serving & SPA Fallback**:
   ```bash
   curl -I https://myup.uz/
   curl -I https://myup.uz/stations/non-existent-route
   curl -I https://admin.myup.uz/
   ```
   *Verify*: All return HTTP 200 with `Content-Type: text/html`.

### 5.3 Invalidation Conditions
- If PM2 cluster worker memory consistently creeps above 500MB without returning under garbage collection (sign of memory leak).
- If PostgreSQL server logs `sorry, too many clients already` under load, indicating `DB_POOL_MAX * workers` exceeds database limits.
- If `/api/health` returns HTTP 503 or hangs longer than 5 seconds.
