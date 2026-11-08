#!/bin/bash
# ==============================================================================
# AX-Map (MyUp) Yangi Serverni 1 Bosqichda To'liq O'rnatish Skripti
# Ubuntu 20.04 / 22.04 / 24.04 LTS uchun
# Ishlatish: sudo bash setup-server.sh
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 AX-Map Backend Serverni O'rnatish va Sozlash Boshlandi"
echo "=========================================================="

# 1. Tizim paketlarini yangilash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw gzip build-essential

# 2. Node.js 20 LTS o'rnatish
if ! command -v node &> /dev/null; then
  echo "📦 Node.js 20 LTS o'rnatilmoqda..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "✅ Node versiyasi: $(node -v), NPM: $(npm -v)"

# 3. PM2 jarayon boshqaruvchisini o'rnatish
if ! command -v pm2 &> /dev/null; then
  echo "📦 PM2 o'rnatilmoqda..."
  sudo npm install -g pm2
fi

# 4. PostgreSQL o'rnatish
if ! command -v psql &> /dev/null; then
  echo "📦 PostgreSQL o'rnatilmoqda..."
  sudo apt install -y postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
fi

# 5. PostgreSQL foydalanuvchisi va parolini sozlash
echo "🔑 PostgreSQL 'postgres' foydalanuvchisi parolini o'rnatish..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'ayub1953';"
sudo -u postgres psql -c "CREATE DATABASE amaps_db;" || true

# 6. Firewall (Xavfsizlik devori) sozlamasi
echo "🛡️ Xavfsizlik devori (UFW) sozlanmoqda..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

# 7. Avtomatik Zaxira (Auto-Backup) Cron job qo'shish (Har kuni soat 03:00 da)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
chmod +x "${BACKUP_SCRIPT}"
chmod +x "${SCRIPT_DIR}/restore.sh"

CRON_JOB="0 3 * * * /bin/bash ${BACKUP_SCRIPT} >> ${SCRIPT_DIR}/../logs/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "${BACKUP_SCRIPT}"; echo "${CRON_JOB}") | crontab -
echo "⏰ Avtomatik zaxiralash (Auto-backup) har kecha soat 03:00 ga o'rnatildi."

echo "=========================================================="
echo "🎉 Server to'liq sozlandi va tayyor holatga keldi!"
echo "Endi 'npm install' qilib, 'pm2 start ecosystem.config.cjs --env production' buyrug'ini bering."
echo "=========================================================="
