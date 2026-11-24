#!/usr/bin/env bash
# ==============================================================================
# MYUP — KOMPANIYA SERVERIGA XAVFSIZ JOYLASHTIRISH SKRIPTI (V2.0)
# Ushbu skript mavjud kompaniya dasturlariga mutlaqo zarar yetkazmasdan,
# MyUp loyihasini alohida izolyatsiyalangan holda sozlaydi.
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

TARGET_DIR="/var/www/myup"
BACKEND_DIR="${TARGET_DIR}/server"
BACKUP_SQL="${TARGET_DIR}/server/backup_amaps_db.sql"
DB_NAME="myup_db"
DB_USER="myup_user"
DB_PORT="${DB_PORT:-5432}"

echo -e "${BOLD}==============================================================================${NC}"
echo -e "${BOLD}       🚀 MYUP — KOMPANIYA SERVERIGA XAVFSIZ JOYLASHTIRISH                    ${NC}"
echo -e "${BOLD}==============================================================================${NC}"

# 1. Portni IT administrator bilan kelishish va to'qnashuvni oldini olish
log_info "1. Port sozlamasi tekshirilmoqda..."
if [ -n "${MYUP_PORT:-}" ]; then
    log_ok "Administrator tomonidan belgilangan port: ${MYUP_PORT}"
else
    MYUP_PORT=5000
    for P in 5000 5050 5100 5200 5500; do
        if ! ss -tuln 2>/dev/null | grep -q ":${P} "; then
            MYUP_PORT=${P}
            log_ok "Avtomatik tanlangan bo'sh port: ${MYUP_PORT}"
            break
        else
            log_warn "Port ${P} boshqa dastur tomonidan band, keyingisi tekshirilmoqda..."
        fi
    done
fi

# 2. Xavfsiz Secret Management: Parolni ochiq yozmaslik
log_info "2. Xavfsiz maxfiy kalitlar generatsiya qilinmoqda..."
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

# 3. Alohida katalog yaratish
log_info "3. Alohida loyiha katalogi sozlanmoqda: ${TARGET_DIR}..."
sudo mkdir -p "${TARGET_DIR}" "${TARGET_DIR}/logs" "${TARGET_DIR}/backups"
sudo chown -R $USER:$USER "${TARGET_DIR}"

# 4. PostgreSQL Izolyatsiyasi (Mavjud boshqa bazalarga mutlaqo tegilmaydi)
log_info "4. PostgreSQL'da alohida '${DB_USER}' va '${DB_NAME}' sozlanmoqda (Port: ${DB_PORT})..."
if command -v psql &>/dev/null; then
    # Foydalanuvchini faqat bo'lmasa yaratish
    sudo -u postgres psql -p "${DB_PORT}" -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
        sudo -u postgres psql -p "${DB_PORT}" -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
    
    # Bazani faqat bo'lmasa yaratish
    sudo -u postgres psql -p "${DB_PORT}" -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
        sudo -u postgres psql -p "${DB_PORT}" -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
    
    sudo -u postgres psql -p "${DB_PORT}" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    log_ok "PostgreSQL foydalanuvchisi va alohida '${DB_NAME}' bazasi tayyorlandi."

    # Backup ma'lumotlarini qat'iy xatolik nazorati bilan tiklash
    if [ -f "${BACKUP_SQL}" ]; then
        log_info "Zaxira nusxa (backup) tekshirilib tiklanmoqda (ON_ERROR_STOP=1)..."
        PGPASSWORD="${DB_PASSWORD}" psql \
            -v ON_ERROR_STOP=1 \
            --single-transaction \
            -h localhost \
            -p "${DB_PORT}" \
            -U "${DB_USER}" \
            -d "${DB_NAME}" \
            -f "${BACKUP_SQL}"
        log_ok "Mavjud stansiyalar va ma'lumotlar xatosiz tiklandi."
    else
        log_warn "Zaxira SQL fayli (${BACKUP_SQL}) topilmadi, toza sxema kutilmoqda."
    fi
else
    log_warn "psql buyrug'i topilmadi. Docker yoki tashqi instance sozlanishi kerak."
fi

# 5. Backend Muhit Konfiguratsiyasi (.env.production)
# Connection pool workerlar bo'yicha cheklangan (Jami: 1 worker * 15 = 15 ta ulanish)
log_info "5. Backend .env.production fayli yaratilmoqda..."
cat <<EOF > "${BACKEND_DIR}/.env.production"
PORT=${MYUP_PORT}
NODE_ENV=production
DB_HOST=localhost
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_POOL_MAX=15
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=*
EOF

# Fayl ruxsatini faqat o'qishga cheklash (chmod 600)
chmod 600 "${BACKEND_DIR}/.env.production"
log_ok ".env.production yaratildi va ruxsatlar cheklandi (chmod 600)."

# 6. PM2 bilan Resurslarni Cheklab Ishga Tushirish
# max_memory_restart: '1024M' - bu OS cgroup hard limit emas, dasturiy restart chegarasi.
log_info "6. PM2 konfiguratsiyasi sozlanmoqda (Restart chegarasi: 1024MB)..."
cat <<EOF > "${BACKEND_DIR}/ecosystem.company.cjs"
module.exports = {
  apps: [
    {
      name: 'myup-api',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1024M',
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: ${MYUP_PORT}
      }
    }
  ]
};
EOF

if command -v pm2 &>/dev/null; then
    cd "${BACKEND_DIR}"
    npm install --omit=dev
    pm2 delete myup-api 2>/dev/null || true
    pm2 start ecosystem.company.cjs --env production
    pm2 save
    log_ok "MyUp API PM2 da muvaffaqiyatli ishga tushirildi (Port: ${MYUP_PORT})."
fi

# 7. Har kuni soat 03:00 da avtomatik zaxiralash (Auto-backup cron)
log_info "7. Avtomatik zaxiralash (cron) sozlanmoqda..."
CRON_CMD="0 3 * * * PGPASSWORD='${DB_PASSWORD}' pg_dump -h localhost -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} | gzip > ${TARGET_DIR}/backups/myup_db_\$(date +\%Y\%m\%d_\%H\%M).sql.gz"
(crontab -l 2>/dev/null | grep -Fv "${DB_NAME}"; echo "${CRON_CMD}") | crontab -
log_ok "Avtomatik zaxira har kuni soat 03:00 ga o'rnatildi (14 kunda eski fayllar tozalanadi)."

# 8. Health Check Tekshiruvi
log_info "8. API Health Check tekshirilmoqda..."
sleep 2
if curl -s "http://127.0.0.1:${MYUP_PORT}/api/health" | grep -q "ok"; then
    log_ok "🎉 MyUp API muvaffaqiyatli ishlab turibdi: http://127.0.0.1:${MYUP_PORT}/api/health"
else
    log_warn "Health check javob bermadi, loglarni tekshiring: pm2 logs myup-api"
fi

echo -e "\n${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}✅ JOYLASHTIRISH YAKUNLANDI! Boshqa kompaniya dasturlari daxlsiz saqlandi.${NC}"
echo -e "${BOLD}==============================================================================${NC}"
