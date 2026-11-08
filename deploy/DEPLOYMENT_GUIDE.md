# Production Linux VPS Deployment & SSL Guide: MyUp & A-Maps Super Admin

Comprehensive, step-by-step production deployment guide for hosting the **MyUp** location & fuel station finder application, the **A-Maps Super Admin** management portal, and the **Node.js Express API** on an Ubuntu Linux Virtual Private Server (VPS).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server Specifications & Prerequisites](#2-server-specifications--prerequisites)
3. [Initial VPS Setup & Security Hardening](#3-initial-vps-setup--security-hardening)
4. [Software Stack Installation](#4-software-stack-installation)
   - [Node.js 20 LTS](#41-nodejs-20-lts)
   - [PostgreSQL 15+ & Database Setup](#42-postgresql-15--database-setup)
   - [Nginx Web Server](#43-nginx-web-server)
   - [PM2 Process Manager](#44-pm2-process-manager)
   - [Certbot for SSL/TLS](#45-certbot-for-ssltls)
5. [Directory Layout & File Ownership](#5-directory-layout--file-ownership)
6. [DNS Configuration](#6-dns-configuration)
7. [SSL / TLS Provisioning (Let's Encrypt)](#7-ssl--tls-provisioning-lets-encrypt)
   - [Phase A: HTTP Challenge Bootstrap](#phase-a-http-challenge-bootstrap)
   - [Phase B: Certificate Generation](#phase-b-certificate-generation)
   - [Phase C: Production HTTPS Activation](#phase-c-production-https-activation)
   - [Phase D: Automated Renewal Verification](#phase-d-automated-renewal-verification)
8. [Production Environment Setup](#8-production-environment-setup)
9. [Automated Deployment Execution (`deploy.sh`)](#9-automated-deployment-execution-deploysh)
10. [Service Management: PM2 & Systemd](#10-service-management-pm2--systemd)
11. [Verification, Health Checks & Monitoring](#11-verification-health-checks--monitoring)
12. [Troubleshooting & Incident Resolution](#12-troubleshooting--incident-resolution)

---

## 1. Architecture Overview

```
                                  INTERNET
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
     https://myup.uz                                 https://admin.myup.uz
  (www.myup.uz - Main App)                           (Super Admin Portal)
            │                                                   │
            └─────────────────────────┬─────────────────────────┘
                                      │
                         ┌────────────▼───────────┐
                         │   Nginx (Port 80/443)  │
                         │   - TLS 1.2 / TLS 1.3  │
                         │   - HTTP/2 & HSTS      │
                         │   - Gzip Compression   │
                         └────────────┬───────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │ Static Assets            │ Reverse Proxy            │ Static Assets
           ▼                          ▼                          ▼
  /var/www/myup/dist           /api/* requests        /var/www/myup-admin/dist
  (React 19 + MapLibre +       http://127.0.0.1:5000  (Vanilla JS + Leaflet +
   PMTiles + Lucide SPA)              │                Chart.js Admin SPA)
                                      ▼
                           ┌─────────────────────┐
                           │ Node.js Express API │
                           │ (PM2 Cluster Mode)  │
                           └──────────┬──────────┘
                                      │ Connection Pool (pg)
                                      ▼
                           ┌─────────────────────┐
                           │   PostgreSQL 15+    │
                           │   (amaps_db)        │
                           └─────────────────────┘
```

---

## 2. Server Specifications & Prerequisites

### Recommended VPS Sizing
| Resource | Minimum (Development/Pilot) | Recommended (Production) | High Traffic |
|---|---|---|---|
| **CPU** | 2 vCPU | 4 vCPU | 8+ vCPU |
| **RAM** | 2 GB (with swap) | 4 GB - 8 GB | 16 GB+ |
| **Disk** | 25 GB NVMe SSD | 50 GB NVMe SSD | 100 GB+ NVMe |
| **OS** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 22.04 / Debian 12 |

### Domain Names
Ensure you control the following domains or subdomains:
- `myup.uz` (Main customer portal)
- `www.myup.uz` (Alias for main portal)
- `admin.myup.uz` (A-Maps super admin dashboard)

---

## 3. Initial VPS Setup & Security Hardening

Connect to your VPS as root:
```bash
ssh root@YOUR_VPS_IP
```

### 3.1 Create a Dedicated Deployment User
Never run production applications directly as `root`:
```bash
# Add deployer user
adduser deployer

# Grant sudo access
usermod -aG sudo deployer

# Copy SSH keys from root to deployer
mkdir -p /home/deployer/.ssh
cp /root/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
```

### 3.2 Configure UFW Firewall
```bash
# Default policies: deny incoming, allow outgoing
ufw default deny incoming
ufw default allow outgoing

# Allow SSH, HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable
ufw status verbose
```

### 3.3 Configure Swap Space (Crucial for 2-4GB RAM VPS)
Prevents out-of-memory kills during `npm run build`:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 4. Software Stack Installation

Switch to the `deployer` user:
```bash
su - deployer
sudo apt update && sudo apt upgrade -y
```

### 4.1 Node.js 20 LTS
Install Node.js 20.x from NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# Verify versions
node -v   # Expected: v20.x.x
npm -v    # Expected: 10.x.x
```

### 4.2 PostgreSQL 15+ & Database Setup
```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database user and database
sudo -u postgres psql <<EOF
CREATE USER myup_user WITH ENCRYPTED PASSWORD 'StrongSecureDbPasswordHere2026!';
CREATE DATABASE myup_prod_db OWNER myup_user;
GRANT ALL PRIVILEGES ON DATABASE myup_prod_db TO myup_user;
\c myup_prod_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
EOF
```

#### Tune PostgreSQL Connection Pool Settings (`/etc/postgresql/15/main/postgresql.conf`):
```ini
# Ensure sufficient max connections for PM2 cluster workers
max_connections = 100
shared_buffers = 512MB
work_mem = 16MB
effective_cache_size = 1536MB
```
Reload PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 4.3 Nginx Web Server
```bash
sudo apt install -y nginx rsync
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.4 PM2 Process Manager
Install PM2 globally for production cluster process management:
```bash
sudo npm install -g pm2
```

### 4.5 Certbot for SSL/TLS
Install Certbot via snap for guaranteed up-to-date ACME protocol support:
```bash
sudo apt install -y snapd
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

---

## 5. Directory Layout & File Ownership

On the VPS, organize the application into `/var/www`:

```
/var/www/
├── certbot/                     # ACME challenge tokens (/.well-known/acme-challenge/)
├── myup/                        # Main Frontend (Vite React app)
│   ├── dist/                    # Built production SPA
│   ├── src/, public/, etc.
│   └── package.json
├── myup-admin/                  # Super Admin Frontend (Vite Vanilla JS app)
│   ├── dist/                    # Built production admin SPA
│   ├── src/, index.html, etc.
│   └── package.json
└── myup-server/                 # Node.js Express Backend API
    ├── src/
    ├── scripts/
    ├── .env.production
    ├── ecosystem.config.cjs
    └── logs/
```

### Create Directories & Assign Permissions:
```bash
sudo mkdir -p /var/www/certbot
sudo mkdir -p /var/www/myup
sudo mkdir -p /var/www/myup-admin
sudo mkdir -p /var/www/myup-server

# Assign ownership to deployer user and www-data web group
sudo chown -R deployer:www-data /var/www
sudo chmod -R 775 /var/www
```

---

## 6. DNS Configuration

Configure DNS `A` records in your DNS management provider (e.g. Cloudflare, Reg.uz, GoDaddy):

| Type | Name / Host | Value / Target | TTL |
|---|---|---|---|
| `A` | `@` (or `myup.uz`) | `YOUR_VPS_PUBLIC_IP` | 300 |
| `A` | `www` | `YOUR_VPS_PUBLIC_IP` | 300 |
| `A` | `admin` | `YOUR_VPS_PUBLIC_IP` | 300 |

### Verify DNS Propagation
Run from your local terminal or VPS:
```bash
dig +short myup.uz
dig +short www.myup.uz
dig +short admin.myup.uz
```
Ensure all three queries return your VPS IP address before proceeding to SSL provisioning.

---

## 7. SSL / TLS Provisioning (Let's Encrypt)

To avoid the common chicken-and-egg problem where Nginx refuses to start because SSL certificate files do not yet exist, follow this **4-phase procedure**:

### Phase A: HTTP Challenge Bootstrap
1. Copy the initial HTTP-only bootstrap configuration:
   ```bash
   sudo cp deploy/nginx/myup-initial-http.conf /etc/nginx/sites-available/myup.conf
   sudo ln -sf /etc/nginx/sites-available/myup.conf /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   ```
2. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. Test ACME directory accessibility:
   ```bash
   echo "test-challenge" > /var/www/certbot/test.txt
   curl -i http://myup.uz/.well-known/acme-challenge/test.txt
   rm -f /var/www/certbot/test.txt
   ```
   *Should return HTTP 200 with `test-challenge`.*

### Phase B: Certificate Generation
Run Certbot to request a unified certificate covering all three domains:
```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d myup.uz \
  -d www.myup.uz \
  -d admin.myup.uz \
  --email admin@myup.uz \
  --agree-tos \
  --no-eff-email
```
Upon success, Certbot stores certificates in:
`/etc/letsencrypt/live/myup.uz/fullchain.pem`
`/etc/letsencrypt/live/myup.uz/privkey.pem`

### Phase C: Production HTTPS Activation
1. Copy the full production Nginx configuration:
   ```bash
   sudo cp deploy/nginx/myup.conf /etc/nginx/sites-available/myup.conf
   ```
2. Test configuration syntax:
   ```bash
   sudo nginx -t
   ```
3. Reload Nginx to activate HTTPS, HTTP/2, security headers, and reverse proxy:
   ```bash
   sudo systemctl reload nginx
   ```

### Phase D: Automated Renewal Verification
Certbot automatically installs a systemd renewal timer. Verify dry-run renewal:
```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

---

## 8. Production Environment Setup

### 8.1 Backend Configuration (`/var/www/myup-server/.env.production`)
Create the file on your VPS:
```bash
nano /var/www/myup-server/.env.production
```
Populate with production values:
```env
# ===============================================
# MYUP PRODUCTION BACKEND ENVIRONMENT
# ===============================================

NODE_ENV=production
PORT=5000

# Strong random secret for JWT (min 32 characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=c8f5e714a93b4823d1620a816f1947b6a48912e75231b14a896d9e02315fa7b2

# Allowed CORS origins
CORS_ORIGIN=https://myup.uz,https://www.myup.uz,https://admin.myup.uz

# PostgreSQL Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=myup_user
DB_PASSWORD=StrongSecureDbPasswordHere2026!
DB_NAME=myup_prod_db
DB_SSL=false

# Connection Pool per PM2 Worker
# Total connections = PM2_INSTANCES * DB_POOL_MAX <= postgresql max_connections - 15
DB_POOL_MAX=10

# Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
```
Protect the secret file:
```bash
chmod 600 /var/www/myup-server/.env.production
```

### 8.2 Main Frontend Configuration (`/var/www/myup/.env.production`)
```env
VITE_API_URL=/api
VITE_PROTOMAPS_KEY=9fc0781e9f3a803f
```

### 8.3 Admin Frontend Configuration (`/var/www/myup-admin/.env.production`)
```env
VITE_API_BASE_URL=/api
VITE_ADMIN_AUTH_PHONE=+998 77 278 18 08
VITE_ADMIN_AUTH_KEY=admin123
```

---

## 9. Automated Deployment Execution (`deploy.sh`)

The repository includes an end-to-end automated deployment script: `deploy.sh`.

### How to Deploy
1. Ensure the script is executable:
   ```bash
   chmod +x /var/www/myup/deploy.sh
   ```
2. Execute the script:
   ```bash
   /var/www/myup/deploy.sh
   ```

### What `deploy.sh` Automates:
1. **Environment Validation**: Confirms `.env.production` is present and flags insecure defaults.
2. **Backend Dependencies**: Executes `npm ci --omit=dev` in `server/`.
3. **Database Migrations**: Runs `initDb.js`, `migrateAdminTables.js`, and `createVisitsTable.js` idempotently.
4. **Main Frontend Build**: Builds Vite assets in `dist/` and validates `index.html`.
5. **Super Admin Build**: Builds Vite assets for admin dashboard if present.
6. **Zero-Downtime PM2 Reload**: Triggers `pm2 reload ecosystem.config.cjs --env production --update-env` (or starts if not running).
7. **Nginx Reload**: Tests `nginx -t` and executes zero-downtime `systemctl reload nginx`.
8. **Health Check Validation**: Polls `http://127.0.0.1:5000/api/health` with retry loop, guaranteeing that deployment aborts immediately if the server is unhealthy.

---

## 10. Service Management: PM2 & Systemd

### 10.1 PM2 Process Management (Recommended)
PM2 is configured to run Express in **Cluster Mode** utilizing all available CPU cores:

| Command | Action |
|---|---|
| `pm2 list` | Display status of all running instances |
| `pm2 reload myup-api` | Zero-downtime cluster reload |
| `pm2 restart myup-api` | Immediate restart |
| `pm2 stop myup-api` | Stop the API server |
| `pm2 logs myup-api` | Stream consolidated application logs |
| `pm2 logs myup-api --lines 100` | View last 100 log lines |
| `pm2 monit` | Terminal dashboard showing CPU/memory per worker |

#### Enable PM2 to Start on Server Boot:
```bash
pm2 startup systemd -u deployer --hp /home/deployer
# Run the command generated by PM2, then:
pm2 save
```

### 10.2 Native Systemd Alternative (`myup-api.service`)
If your organization standardizes on native systemd rather than PM2, use the provided unit file:
```bash
sudo cp deploy/systemd/myup-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable myup-api.service
sudo systemctl start myup-api.service

# Management commands
sudo systemctl status myup-api.service
sudo systemctl restart myup-api.service
journalctl -u myup-api.service -f
```

---

## 11. Verification, Health Checks & Monitoring

### 11.1 Test Local Health Check Endpoint
```bash
curl -s http://127.0.0.1:5000/api/health | jq
```
Expected output:
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 142.5,
  "database": "connected",
  "pool": {
    "total": 2,
    "idle": 2,
    "waiting": 0
  },
  "timestamp": "2026-11-06T08:00:00.000Z"
}
```

### 11.2 Test Public Endpoints via HTTPS
```bash
# Main app root
curl -I https://myup.uz

# Main app client routing (SPA Fallback)
curl -I https://myup.uz/stations/create

# Admin portal
curl -I https://admin.myup.uz

# Public API health via Nginx
curl -s https://myup.uz/api/health | jq
```

### 11.3 Verify Security Headers
```bash
curl -I https://myup.uz
```
Confirm the presence of:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (or `DENY` on admin)
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 11.4 Rate Limiting Verification
```bash
for i in {1..25}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://myup.uz/api/auth/login
done
```
*Expected: First 20 requests return 400 (Invalid credentials), requests 21-25 return HTTP 429 (Too Many Requests).*

---

## 12. Troubleshooting & Incident Resolution

### Issue: Nginx Returns 502 Bad Gateway
1. Check if Node.js backend is running:
   ```bash
   pm2 status
   ```
2. Check if port 5000 is listening:
   ```bash
   sudo ss -tulpn | grep 5000
   ```
3. Inspect backend error logs:
   ```bash
   pm2 logs myup-api --err --lines 50
   ```
4. Verify database credentials in `/var/www/myup-server/.env.production`.

### Issue: CORS Error in Browser Console
- Check `CORS_ORIGIN` in `/var/www/myup-server/.env.production`.
- Origins must NOT include trailing slashes (e.g. `https://myup.uz`, not `https://myup.uz/`).
- If accessing from a custom domain or staging URL, append it to `CORS_ORIGIN`:
  `CORS_ORIGIN=https://myup.uz,https://www.myup.uz,https://admin.myup.uz,https://staging.myup.uz`
- Reload backend: `pm2 reload myup-api`.

### Issue: Database Connection Limit Exceeded (`sorry, too many clients already`)
- Verify PostgreSQL connection limit:
  ```sql
  sudo -u postgres psql -c "SHOW max_connections;"
  sudo -u postgres psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
  ```
- Adjust `DB_POOL_MAX` in `.env.production` (default: 10 per worker).
- If PM2 runs 4 workers, 4 * 10 = 40 connections. Ensure `max_connections >= 100` in `/etc/postgresql/15/main/postgresql.conf`.

### Issue: Page Refresh Returns 404
- Verify Nginx SPA fallback directive in `/etc/nginx/sites-available/myup.conf`:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
- Run `sudo nginx -t && sudo systemctl reload nginx`.

---

**Deployment Guide Version**: 1.0.0 (Production Release)  
**Maintained by**: MyUp Infrastructure Team  
**Last Updated**: November 2026
