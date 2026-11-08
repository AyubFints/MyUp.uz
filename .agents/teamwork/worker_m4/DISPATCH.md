## 2026-11-06T07:58:51Z
You are teamwork_worker (Milestone 4: Linux VPS Deployment Infrastructure & Automation).
Your working directory is: c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m4

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\PROJECT.md
And thoroughly read the survey findings and deployment blueprints at:
c:\Users\user\Desktop\MyUp\.agents\teamwork\explorer_survey_3\handoff.md

WRITE OWNERSHIP:
You have exclusive write ownership of `c:\Users\user\Desktop\MyUp\deploy\` and root `c:\Users\user\Desktop\MyUp\deploy.sh`.
DO NOT modify anything in `src/` or `A-Maps supper admin/src/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks for Milestone 4:
1. Nginx Reverse Proxy Configuration:
   Create `deploy/nginx/myup.conf` (and a copy or reference as appropriate) containing the complete production Nginx configuration:
   - HTTP to HTTPS redirection (listening on port 80 for `myup.uz`, `www.myup.uz`, `admin.myup.uz`, with Let's Encrypt challenge path).
   - Server block for `myup.uz` and `www.myup.uz`: SSL configuration (HTTP/2, TLS 1.2/1.3, modern ciphers, HSTS, security headers), `/api/` reverse proxy to Node.js backend on `http://127.0.0.1:5000/api/` (with proxy buffers, WebSocket upgrade headers, real IP headers), static file serving from `/var/www/myup/dist` with 1-year immutable caching for static assets (`.js`, `.css`, `.webp`, `.png`, `.pmtiles`), and SPA fallback (`try_files $uri $uri/ /index.html`).
   - Server block for `admin.myup.uz`: SSL, security headers, `/api/` reverse proxy, static file serving from `/var/www/myup-admin/dist`, 1-year caching, and SPA fallback.
2. Automated Bash Deployment Script (`deploy.sh`):
   Create `deploy.sh` (both in root `c:\Users\user\Desktop\MyUp\deploy.sh` and `c:\Users\user\Desktop\MyUp\deploy\deploy.sh`) with:
   - `set -euo pipefail` and clean color-coded logging.
   - Validation of `.env.production` / `.env`.
   - Backend production dependency installation (`npm ci --omit=dev` in `server/`).
   - Database schema initialization and idempotent migrations (`node scripts/initDb.js`, etc.).
   - Main frontend build (`npm ci && npm run build` in root `MyUp/`).
   - Admin frontend build (`npm ci && npm run build` in `../A-Maps supper admin/` if present).
   - Zero-downtime PM2 reload (`pm2 reload ecosystem.config.cjs --env production --update-env` or start if not running).
   - Nginx test and reload (`sudo nginx -t && sudo systemctl reload nginx`).
   - Post-deployment health check validation via curl to `http://127.0.0.1:5000/api/health`, failing fast if the endpoint does not return HTTP 200.
3. Systemd / PM2 Service Management Configuration:
   Provide `deploy/systemd/myup-api.service` as an alternative systemd unit file, and document standard PM2 systemd startup integration (`pm2 startup systemd`, `pm2 save`).
4. Step-by-Step SSL & VPS Deployment Guide (`deploy/DEPLOYMENT_GUIDE.md`):
   Document:
   - Linux VPS initial setup (Ubuntu 22.04/24.04, Node.js 20+, PostgreSQL 15+, Nginx, PM2).
   - Step-by-step SSL/Certbot setup instructions (Snap installation, DNS verification, cert generation for `myup.uz` and `admin.myup.uz`, automated renewal verification).
   - Directory structure on VPS (`/var/www/myup`, `/var/www/myup-admin`, `/var/www/myup-server`).
   - Deployment execution via `./deploy.sh`.
   - Log inspection, monitoring, and troubleshooting.
5. Validate all script syntax and configuration integrity.
6. Write your detailed handoff report to:
`c:\Users\user\Desktop\MyUp\.agents\teamwork\worker_m4\handoff.md`
7. Send a message to parent with completion status and path to handoff.md.
