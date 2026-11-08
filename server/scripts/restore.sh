#!/bin/bash
# ==============================================================================
# AX-Map (MyUp) Ma'lumotlar Bazasini Tiklash (Restore) Skripti
# Yangi serverga ko'chganda yoki favqulodda tiklashda 1 ta buyruq bilan ishlaydi
# Ishlatish: ./restore.sh [backup_fayli.sql.gz]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${SERVER_DIR}/backups"

# .env yoki .env.production dan konfiguratsiyani olish
if [ -f "${SERVER_DIR}/.env.production" ]; then
  ENV_FILE="${SERVER_DIR}/.env.production"
elif [ -f "${SERVER_DIR}/.env" ]; then
  ENV_FILE="${SERVER_DIR}/.env"
else
  echo "❌ .env fayli topilmadi!"
  exit 1
fi

while IFS='=' read -r key value || [ -n "$key" ]; do
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

# Agar fayl nomi argument sifatida berilmagan bo'lsa, eng so'nggi backupni olish
BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/amaps_db_backup_*.sql.gz 2>/dev/null | head -n 1)
  if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Hech qanday backup fayli topilmadi!"
    echo "Foydalanish: ./restore.sh <backup_fayli.sql.gz>"
    exit 1
  fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Ko'rsatilgan fayl topilmadi: ${BACKUP_FILE}"
  exit 1
fi

echo "⚠️  DIQQAT: Ushbu amal '${DB_NAME}' bazasidagi ma'lumotlarni '${BACKUP_FILE}' faylidan qayta tiklaydi!"
echo "Qayta tiklash boshlanmoqda..."

# 1. Bazaga mavjud barcha ulanishlarni uzish va bazani tozalab qayta yaratish
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" || true

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE ${DB_NAME};"

# 2. Backup faylini ochib bazaga yuklash
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

echo "🎉 Baza muvaffaqiyatli tiklandi! Barcha shahobchalar, reklamalar va foydalanuvchilar o'z joyiga qaytdi."
