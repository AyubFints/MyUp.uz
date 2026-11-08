#!/bin/bash
# ==============================================================================
# AX-Map (MyUp) Avtomatik PostgreSQL Ma'lumotlar Bazasi Zaxiralash (Backup) Skripti
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${SERVER_DIR}/backups"

# .env yoki .env.production dan konfiguratsiyani o'qish
if [ -f "${SERVER_DIR}/.env.production" ]; then
  ENV_FILE="${SERVER_DIR}/.env.production"
elif [ -f "${SERVER_DIR}/.env" ]; then
  ENV_FILE="${SERVER_DIR}/.env"
else
  echo "❌ .env fayli topilmadi!"
  exit 1
fi

while IFS='=' read -r key value || [ -n "$key" ]; do
  # Izoh va bo'sh qatorlarni o'tkazib yuborish
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  key=$(echo "$key" | tr -d '[:space:]')
  value=$(echo "$value" | tr -d '\r')
  [ -n "$key" ] && export "$key"="$value"
done < "$ENV_FILE"

DB_NAME="${DB_NAME:-amaps_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
export PGPASSWORD="${DB_PASSWORD:-ayub1953}"

# Backup katalogini yaratish
mkdir -p "$BACKUP_DIR"

# Fayl nomi: amaps_db_backup_2026-11-08_16-30-00.sql.gz
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/amaps_db_backup_${TIMESTAMP}.sql.gz"

echo "📦 Ma'lumotlar bazasi zaxiralanmoqda: ${DB_NAME} -> ${BACKUP_FILE}..."

# pg_dump orqali to'liq bazani siqilgan holda olish
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Zaxira nusxa muvaffaqiyatli yaratildi! Hajmi: ${FILE_SIZE}"
echo "📁 Manzil: ${BACKUP_FILE}"

# 14 kundan eski backuplarni avtomatik tozalash (disk to'lib ketmasligi uchun)
find "$BACKUP_DIR" -type f -name "amaps_db_backup_*.sql.gz" -mtime +14 -delete 2>/dev/null || true
echo "🧹 14 kundan eski zaxira fayllar tozalandi."
