# 🛠️ MYUP UBUNTU 24.04 PRODUCTION DEPLOYMENT GUIDE (FOR IT ADMIN)
# Server IP: 192.168.23.233 | OS: Ubuntu 24.04 LTS
# Target User: myup | Target Directory: /var/www/myup | Target Port: 5000

This document contains clean, copy-pasteable, idempotent commands designed to deploy MyUp with ZERO IMPACT on existing services.

---

## 1. STACK SPECIFICATION
- **Frontend SPA:** React 19 + Vite 8 + MapLibre GL 6 (Protomaps vector tiles)
- **Backend API:** Node.js 20 LTS + Express 4.21
- **Database:** PostgreSQL 16 (Dedicated database: `myup_db`, User: `myup_user`)
- **Process Manager:** Systemd native unit (`myup.service`) with 1GB RAM hard cap
- **Ingress:** Cloudflare Named Tunnel (`cloudflared`) over secure outbound HTTPS

---

## 2. STEP-BY-STEP EXECUTION

### Step A: Create Dedicated System User & SSH Key Access
Run as root on `192.168.23.233`:
```bash
# 1. Create dedicated unprivileged user
id -u myup &>/dev/null || sudo useradd -m -s /bin/bash myup

# 2. Setup SSH directory
sudo mkdir -p /home/myup/.ssh
sudo chmod 700 /home/myup/.ssh

# 3. Add Developer Deploy Public Key
cat << 'EOF' | sudo tee /home/myup/.ssh/authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIETzQD1YOQ15K9If8Y1ZUFa9S4CxnJkHZFKYwO7eFPXn myup-deploy-key
EOF

sudo chmod 600 /home/myup/.ssh/authorized_keys
sudo chown -R myup:myup /home/myup/.ssh
```

---

### Step B: Application Directory & File Permissions
```bash
# 1. Create isolated app directory
sudo mkdir -p /var/www/myup /var/www/myup/logs /var/www/myup/backups
sudo chown -R myup:myup /var/www/myup
sudo chmod 750 /var/www/myup

# 2. Clone repository as 'myup' user
sudo -u myup git clone https://github.com/AyubFints/MyUp.uz.git /var/www/myup/app || \
  (cd /var/www/myup/app && sudo -u myup git pull origin main)
```

---

### Step C: Dedicated Database Isolation (Zero Impact on Existing DBs)
Run inside PostgreSQL (as `postgres` user):
```bash
# 1. Generate strong random password for myup_user
MYUP_DB_PASS=$(openssl rand -hex 24)
echo "Generated DB Password: ${MYUP_DB_PASS}"

# 2. Create user and database
sudo -u postgres psql << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'myup_user') THEN
      CREATE USER myup_user WITH PASSWORD '${MYUP_DB_PASS}';
   END IF;
END
\$\$;

SELECT 'CREATE DATABASE myup_db OWNER myup_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'myup_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE myup_db TO myup_user;
EOF

# 3. Security Isolation: Ensure myup_user CANNOT access any other company DBs
# Append top-priority rule to pg_hba.conf:
PG_HBA=$(sudo -u postgres psql -t -P format=unaligned -c "SHOW hba_file;")
sudo cp "${PG_HBA}" "${PG_HBA}.backup_$(date +%Y%m%d)"

sudo sed -i '/# MYUP_ISOLATION_START/,/# MYUP_ISOLATION_END/d' "${PG_HBA}"
sudo sed -i '1i # MYUP_ISOLATION_START\nlocal myup_db myup_user scram-sha-256\nhost myup_db myup_user 127.0.0.1/32 scram-sha-256\nlocal all myup_user reject\nhost all myup_user all reject\n# MYUP_ISOLATION_END' "${PG_HBA}"

# Reload PostgreSQL configuration without restarting service
sudo -u postgres psql -c "SELECT pg_reload_conf();"
```

---

### Step D: Build & Install Dependencies
```bash
# 1. Install Backend Dependencies
cd /var/www/myup/app/server
sudo -u myup npm ci --omit=dev

# 2. Install Frontend Dependencies & Build SPA
cd /var/www/myup/app
sudo -u myup npm ci
sudo -u myup npm run build

# 3. Create .env.production with restricted 600 permissions
JWT_KEY=$(openssl rand -hex 32)
cat << EOF | sudo -u myup tee /var/www/myup/app/server/.env.production > /dev/null
PORT=5000
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=myup_user
DB_PASSWORD=${MYUP_DB_PASS}
DB_NAME=myup_db
DB_POOL_MAX=15
JWT_SECRET=${JWT_KEY}
CORS_ORIGIN=*
EOF

sudo chmod 600 /var/www/myup/app/server/.env.production

# 4. Atomic Database Migration from backup_amaps_db.sql
cd /var/www/myup/app/server
PGPASSWORD="${MYUP_DB_PASS}" psql -v ON_ERROR_STOP=1 --single-transaction -h 127.0.0.1 -U myup_user -d myup_db -f backup_amaps_db.sql
```

---

### Step E: Production Systemd Service Unit
Create `/etc/systemd/system/myup.service`:
```ini
[Unit]
Description=MyUp Node.js Production API Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=myup
Group=myup
WorkingDirectory=/var/www/myup/app/server
EnvironmentFile=/var/www/myup/app/server/.env.production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5s

# Hard Resource Quotas (Approved for Ubuntu 24.04 cgroups v2)
MemoryMax=1G
MemoryHigh=900M
CPUQuota=100%
LimitNOFILE=65536

# Security Hardening
PrivateTmp=true
ProtectSystem=full
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable myup.service
sudo systemctl start myup.service
sudo systemctl status myup.service
```

---

### Step F: External HTTPS Access via Cloudflare Named Tunnel
No ports need to be forwarded on router/firewall:
```bash
# 1. Install cloudflared on Ubuntu 24.04
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# 2. Run tunnel service with your tunnel token (provided in Cloudflare Dashboard)
sudo cloudflared service install <CLOUDFLARE_TUNNEL_TOKEN>
```

---

### Step G: Health Check & Verification
```bash
# 1. Local Health Check
curl -I http://127.0.0.1:5000/api/health
# Expected: HTTP/1.1 200 OK

# 2. Verify Port & Process
ss -tulpn | grep 5000
```
