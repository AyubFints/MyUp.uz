/**
 * Automated Verification Test Suite for Milestone 4:
 * Linux VPS Deployment Infrastructure & Automation Assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('🧪 Verifying Milestone 4 Deployment Assets & Scripts');
console.log('====================================================');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    testsFailed++;
  }
}

const rootDir = path.resolve(__dirname, '..');
const deployDir = __dirname;

// ---------------------------------------------------------
// 1. File Existence Checks
// ---------------------------------------------------------
console.log('\n--- 1. File Existence & Layout Verification ---');
const requiredFiles = [
  path.join(deployDir, 'nginx', 'myup.conf'),
  path.join(deployDir, 'nginx', 'myup-initial-http.conf'),
  path.join(deployDir, 'systemd', 'myup-api.service'),
  path.join(deployDir, 'deploy.sh'),
  path.join(rootDir, 'deploy.sh'),
  path.join(deployDir, 'DEPLOYMENT_GUIDE.md')
];

requiredFiles.forEach((file) => {
  const rel = path.relative(rootDir, file);
  assert(fs.existsSync(file), `Required file exists: ${rel}`);
});

// ---------------------------------------------------------
// 2. Bash Script Syntax Check (bash -n)
// ---------------------------------------------------------
console.log('\n--- 2. Bash Script Syntax Verification (bash -n) ---');
const gitBashCandidates = [
  'C:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
  'bash'
];

let bashCmd = null;
for (const cand of gitBashCandidates) {
  try {
    execSync(`"${cand}" --version`, { stdio: 'ignore' });
    bashCmd = cand;
    break;
  } catch (e) {}
}

if (bashCmd) {
  ['deploy.sh', path.join('deploy', 'deploy.sh')].forEach((relScript) => {
    const fullScript = path.join(rootDir, relScript);
    try {
      execSync(`"${bashCmd}" -n "${fullScript}"`, { stdio: 'pipe' });
      assert(true, `Bash syntax valid (-n check): ${relScript}`);
    } catch (err) {
      assert(false, `Bash syntax valid (-n check): ${relScript}`, err.message);
    }
  });
} else {
  console.log('  ⚠️ WARNING: Bash binary not found, skipping bash -n execution.');
}

// ---------------------------------------------------------
// 3. Bash Deployment Script Content Validation
// ---------------------------------------------------------
console.log('\n--- 3. deploy.sh Feature Completeness ---');
const deployShContent = fs.readFileSync(path.join(deployDir, 'deploy.sh'), 'utf8');

assert(deployShContent.includes('set -euo pipefail'), 'deploy.sh contains strict error handling (set -euo pipefail)');
assert(deployShContent.includes('trap \'log_error'), 'deploy.sh contains trap on ERR with line number reporting');
assert(deployShContent.includes('.env.production') && deployShContent.includes('.env'), 'deploy.sh validates .env.production / .env');
assert(deployShContent.includes('npm ci --omit=dev'), 'deploy.sh installs backend dependencies with npm ci --omit=dev');
assert(deployShContent.includes('scripts/initDb.js'), 'deploy.sh runs database init script (initDb.js)');
assert(deployShContent.includes('npm run build'), 'deploy.sh builds main frontend SPA');
assert(deployShContent.includes('ADMIN_FRONTEND_DIR'), 'deploy.sh handles super admin frontend build conditionally');
assert(deployShContent.includes('pm2 reload') && deployShContent.includes('ecosystem.config.cjs'), 'deploy.sh triggers zero-downtime PM2 reload');
assert(deployShContent.includes('sudo nginx -t') && deployShContent.includes('systemctl reload nginx'), 'deploy.sh tests and reloads Nginx safely');
assert(deployShContent.includes('/api/health'), 'deploy.sh validates post-deployment health check endpoint');
assert(deployShContent.includes('MAX_ATTEMPTS'), 'deploy.sh implements health check retry loop');

// Verify root deploy.sh matches deploy/deploy.sh
const rootDeployShContent = fs.readFileSync(path.join(rootDir, 'deploy.sh'), 'utf8');
assert(deployShContent === rootDeployShContent, 'Root deploy.sh is identical to deploy/deploy.sh');

// ---------------------------------------------------------
// 4. Nginx Configuration Content Validation
// ---------------------------------------------------------
console.log('\n--- 4. Nginx Configuration Verification (myup.conf) ---');
const nginxConf = fs.readFileSync(path.join(deployDir, 'nginx', 'myup.conf'), 'utf8');

// Brace balancing check
let openBraces = (nginxConf.match(/\{/g) || []).length;
let closeBraces = (nginxConf.match(/\}/g) || []).length;
assert(openBraces === closeBraces && openBraces > 0, `Nginx braces balanced: ${openBraces} opened, ${closeBraces} closed`);

// Port 80 redirection
assert(nginxConf.includes('listen 80;'), 'Listens on port 80 for HTTP');
assert(nginxConf.includes('server_name myup.uz www.myup.uz admin.myup.uz;'), 'Handles all required domain names on port 80');
assert(nginxConf.includes('location /.well-known/acme-challenge/'), 'Exposes ACME challenge path for Let\'s Encrypt on port 80');
assert(nginxConf.includes('return 301 https://$host$request_uri;'), 'Permanently redirects HTTP to HTTPS');

// SSL configuration
assert(nginxConf.includes('listen 443 ssl http2;'), 'Listens on port 443 with SSL and HTTP/2');
assert(nginxConf.includes('ssl_protocols TLSv1.2 TLSv1.3;'), 'Restricts protocols to TLS 1.2 and TLS 1.3');
assert(nginxConf.includes('ssl_certificate /etc/letsencrypt/live/myup.uz/fullchain.pem;'), 'Specifies Let\'s Encrypt certificate path');
assert(nginxConf.includes('ssl_certificate_key /etc/letsencrypt/live/myup.uz/privkey.pem;'), 'Specifies Let\'s Encrypt private key path');

// Security Headers
assert(nginxConf.includes('Strict-Transport-Security'), 'Includes HSTS security header');
assert(nginxConf.includes('X-Content-Type-Options "nosniff"'), 'Includes X-Content-Type-Options nosniff');
assert(nginxConf.includes('X-Frame-Options "SAMEORIGIN"') && nginxConf.includes('X-Frame-Options "DENY"'), 'Includes contextual X-Frame-Options (SAMEORIGIN for app, DENY for admin)');

// Reverse proxy /api/
assert(nginxConf.includes('location /api/ {'), 'Contains /api/ reverse proxy location block');
assert(nginxConf.includes('proxy_pass http://myup_api_upstream/api/;') || nginxConf.includes('proxy_pass http://127.0.0.1:5000/api/;'), 'Proxies /api/ to Node backend');
assert(nginxConf.includes('proxy_set_header Upgrade $http_upgrade;') && nginxConf.includes('proxy_set_header Connection $connection_upgrade;'), 'Configures WebSocket upgrade headers');
assert(nginxConf.includes('proxy_set_header X-Real-IP $remote_addr;'), 'Forwards client real IP to backend');
assert(nginxConf.includes('proxy_buffers 16 16k;') && nginxConf.includes('proxy_buffer_size 32k;'), 'Configures optimized proxy buffers');

// Static assets & SPA
assert(nginxConf.includes('root /var/www/myup/dist;'), 'Serves main SPA from /var/www/myup/dist');
assert(nginxConf.includes('root /var/www/myup-admin/dist;'), 'Serves admin SPA from /var/www/myup-admin/dist');
assert(nginxConf.includes('pmtiles'), 'Configures caching for Protomaps vector tiles (.pmtiles)');
assert(nginxConf.includes('max-age=31536000, immutable') || nginxConf.includes('immutable'), 'Applies 1-year immutable caching for static assets');
assert(nginxConf.includes('try_files $uri $uri/ /index.html;'), 'Includes SPA fallback try_files $uri $uri/ /index.html');

// ---------------------------------------------------------
// 5. Systemd Service Unit Validation
// ---------------------------------------------------------
console.log('\n--- 5. Systemd Service Unit Verification (myup-api.service) ---');
const systemdConf = fs.readFileSync(path.join(deployDir, 'systemd', 'myup-api.service'), 'utf8');

assert(systemdConf.includes('[Unit]'), 'Contains [Unit] section');
assert(systemdConf.includes('[Service]'), 'Contains [Service] section');
assert(systemdConf.includes('[Install]'), 'Contains [Install] section');
assert(systemdConf.includes('WorkingDirectory=/var/www/myup-server'), 'Defines correct WorkingDirectory');
assert(systemdConf.includes('ExecStart=/usr/bin/node src/server.js'), 'Defines correct ExecStart node command');
assert(systemdConf.includes('Restart=always'), 'Defines Restart=always policy');
assert(systemdConf.includes('EnvironmentFile=-/var/www/myup-server/.env.production'), 'Loads .env.production via EnvironmentFile');

// ---------------------------------------------------------
// 6. Deployment Guide Documentation Validation
// ---------------------------------------------------------
console.log('\n--- 6. Deployment Guide Verification (DEPLOYMENT_GUIDE.md) ---');
const guideContent = fs.readFileSync(path.join(deployDir, 'DEPLOYMENT_GUIDE.md'), 'utf8');

assert(guideContent.includes('Ubuntu 22.04') || guideContent.includes('Ubuntu 24.04'), 'Documents Ubuntu LTS OS requirement');
assert(guideContent.includes('Node.js 20'), 'Documents Node.js 20 LTS installation');
assert(guideContent.includes('PostgreSQL 15'), 'Documents PostgreSQL installation and tuning');
assert(guideContent.includes('Certbot') && guideContent.includes('snap'), 'Documents Certbot installation via Snap');
assert(guideContent.includes('myup.uz') && guideContent.includes('admin.myup.uz'), 'Documents DNS & SSL for both domains');
assert(guideContent.includes('/var/www/myup') && guideContent.includes('/var/www/myup-admin'), 'Documents VPS directory layout');
assert(guideContent.includes('deploy.sh'), 'Documents automated deployment execution');
assert(guideContent.includes('pm2 startup') && guideContent.includes('pm2 save'), 'Documents PM2 systemd startup integration');
assert(guideContent.includes('/api/health'), 'Documents health check inspection');
assert(guideContent.includes('Troubleshooting'), 'Includes troubleshooting section');

// ---------------------------------------------------------
// Final Summary
// ---------------------------------------------------------
console.log('\n====================================================');
console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All deployment assets verified successfully!');
  process.exit(0);
}
