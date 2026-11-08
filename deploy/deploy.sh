#!/usr/bin/env bash
# ==============================================================================
# MyUp & A-Maps Super Admin Automated Linux VPS Production Deployment Script
# ==============================================================================
# This script automates end-to-end production deployment:
#  1. Validates environment configurations (.env.production / .env).
#  2. Installs production backend dependencies (npm ci --omit=dev).
#  3. Runs idempotent database schema initialization & table migrations.
#  4. Builds Main Frontend SPA (Vite) and verifies dist output.
#  5. Builds Super Admin Frontend SPA (Vite) if available.
#  6. Performs zero-downtime backend reload via PM2 cluster.
#  7. Tests and reloads Nginx reverse proxy service.
#  8. Validates post-deployment health check endpoint (http://127.0.0.1:5000/api/health).
# ==============================================================================

set -euo pipefail

# Text formatting and color codes
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Structured logging utilities
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_step()    { echo -e "\n${BOLD}${CYAN}==>${NC} ${BOLD}$1${NC}"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# Robust error trap with command and line number reporting
trap 'log_error "Deployment failed at line $LINENO in command: \"$BASH_COMMAND\". Aborting."; exit 1' ERR

# Determine base paths regardless of where the script is executed
INVOCATION_DIR="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$(basename "${SCRIPT_DIR}")" == "deploy" ]]; then
    BASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
else
    BASE_DIR="${SCRIPT_DIR}"
fi

SERVER_DIR="${BASE_DIR}/server"
MAIN_FRONTEND_DIR="${BASE_DIR}"

# Determine Admin Frontend directory candidate locations
ADMIN_FRONTEND_DIR=""
if [[ -n "${ADMIN_DIR:-}" ]] && [[ -d "${ADMIN_DIR}" ]]; then
    ADMIN_FRONTEND_DIR="$(cd "${ADMIN_DIR}" && pwd)"
elif [[ -d "${BASE_DIR}/../A-Maps supper admin" ]]; then
    ADMIN_FRONTEND_DIR="$(cd "${BASE_DIR}/../A-Maps supper admin" && pwd)"
elif [[ -d "/var/www/myup-admin" ]]; then
    ADMIN_FRONTEND_DIR="/var/www/myup-admin"
elif [[ -d "${BASE_DIR}/../myup-admin" ]]; then
    ADMIN_FRONTEND_DIR="$(cd "${BASE_DIR}/../myup-admin" && pwd)"
fi

echo -e "${BOLD}==============================================================================${NC}"
echo -e "${BOLD}              🚀 MyUp Production Deployment Automation                        ${NC}"
echo -e "${BOLD}==============================================================================${NC}"
log_info "Base Project Directory:    ${BASE_DIR}"
log_info "Backend Server Directory:  ${SERVER_DIR}"
log_info "Main Frontend Directory:   ${MAIN_FRONTEND_DIR}"
if [[ -n "${ADMIN_FRONTEND_DIR}" ]]; then
    log_info "Admin Frontend Directory:  ${ADMIN_FRONTEND_DIR}"
else
    log_warn "Admin Frontend Directory:  Not found (will skip admin build)"
fi

# ------------------------------------------------------------------------------
# STEP 1: Validate Environment Configuration
# ------------------------------------------------------------------------------
log_step "Step 1: Validating Environment Configuration..."

if [[ -f "${SERVER_DIR}/.env.production" ]]; then
    log_info "Using server production environment: ${SERVER_DIR}/.env.production"
    ENV_FILE="${SERVER_DIR}/.env.production"
elif [[ -f "${SERVER_DIR}/.env" ]]; then
    log_warn "server/.env.production not found; falling back to: ${SERVER_DIR}/.env"
    ENV_FILE="${SERVER_DIR}/.env"
else
    log_error "Missing backend environment configuration!"
    echo "  Expected file: ${SERVER_DIR}/.env.production"
    echo "  Create it by copying: ${SERVER_DIR}/.env.production.example"
    exit 1
fi

# Inspect critical security and database environment keys
if grep -q "replace_with_strong_random_secret" "${ENV_FILE}" 2>/dev/null; then
    log_warn "JWT_SECRET in ${ENV_FILE} appears to be default placeholder. Ensure strong secret in production."
fi

# ------------------------------------------------------------------------------
# STEP 2: Install Backend Production Dependencies
# ------------------------------------------------------------------------------
log_step "Step 2: Installing Backend Production Dependencies..."
cd "${SERVER_DIR}"

if [[ -f "package-lock.json" ]]; then
    log_info "Executing 'npm ci --omit=dev' in server directory..."
    npm ci --omit=dev || {
        log_warn "'npm ci' failed. Retrying with 'npm install --omit=dev'..."
        npm install --omit=dev
    }
else
    log_info "Executing 'npm install --omit=dev' in server directory..."
    npm install --omit=dev
fi
log_success "Backend dependencies installed successfully."

# ------------------------------------------------------------------------------
# STEP 3: Database Schema & Idempotent Migrations
# ------------------------------------------------------------------------------
log_step "Step 3: Running Idempotent Database Migrations..."
cd "${SERVER_DIR}"

if [[ -f "scripts/initDb.js" ]]; then
    log_info "Executing database initialization (scripts/initDb.js)..."
    node scripts/initDb.js
fi

if [[ -f "scripts/migrateAdminTables.js" ]]; then
    log_info "Ensuring admin tables (scripts/migrateAdminTables.js)..."
    node scripts/migrateAdminTables.js
fi

if [[ -f "scripts/createVisitsTable.js" ]]; then
    log_info "Ensuring visits analytics tables (scripts/createVisitsTable.js)..."
    node scripts/createVisitsTable.js
fi

log_success "Database schema verified and migrations applied."

# ------------------------------------------------------------------------------
# STEP 4: Build Main Frontend Application
# ------------------------------------------------------------------------------
log_step "Step 4: Building Main Frontend (MyUp SPA)..."
cd "${MAIN_FRONTEND_DIR}"

log_info "Installing main frontend dependencies..."
if [[ -f "package-lock.json" ]]; then
    npm ci || npm install
else
    npm install
fi

log_info "Building production Vite bundle for main frontend..."
npm run build

if [[ ! -f "${MAIN_FRONTEND_DIR}/dist/index.html" ]]; then
    log_error "Main frontend build failed: dist/index.html does not exist!"
    exit 1
fi

# Sync to Nginx web root /var/www/myup/dist if standard webroot is separate
if [[ -d "/var/www/myup" ]] && [[ "$(cd "${MAIN_FRONTEND_DIR}" && pwd)" != "$(cd "/var/www/myup" && pwd)" ]]; then
    log_info "Syncing main build artifacts to /var/www/myup/dist..."
    mkdir -p /var/www/myup/dist
    if command -v rsync > /dev/null 2>&1; then
        rsync -a --delete "${MAIN_FRONTEND_DIR}/dist/" /var/www/myup/dist/
    else
        cp -r "${MAIN_FRONTEND_DIR}/dist/"* /var/www/myup/dist/
    fi
fi
log_success "Main frontend built successfully."

# ------------------------------------------------------------------------------
# STEP 5: Build Super Admin Frontend Application
# ------------------------------------------------------------------------------
log_step "Step 5: Building Super Admin Frontend (A-Maps Admin SPA)..."

if [[ -n "${ADMIN_FRONTEND_DIR}" ]] && [[ -d "${ADMIN_FRONTEND_DIR}" ]]; then
    cd "${ADMIN_FRONTEND_DIR}"
    log_info "Installing admin frontend dependencies..."
    if [[ -f "package-lock.json" ]]; then
        npm ci || npm install
    else
        npm install
    fi

    log_info "Building production Vite bundle for super admin frontend..."
    npm run build

    if [[ ! -f "${ADMIN_FRONTEND_DIR}/dist/index.html" ]]; then
        log_error "Admin frontend build failed: dist/index.html does not exist!"
        exit 1
    fi

    # Sync to Nginx web root /var/www/myup-admin/dist if standard webroot is separate
    if [[ -d "/var/www/myup-admin" ]] && [[ "$(cd "${ADMIN_FRONTEND_DIR}" && pwd)" != "$(cd "/var/www/myup-admin" && pwd)" ]]; then
        log_info "Syncing admin build artifacts to /var/www/myup-admin/dist..."
        mkdir -p /var/www/myup-admin/dist
        if command -v rsync > /dev/null 2>&1; then
            rsync -a --delete "${ADMIN_FRONTEND_DIR}/dist/" /var/www/myup-admin/dist/
        else
            cp -r "${ADMIN_FRONTEND_DIR}/dist/"* /var/www/myup-admin/dist/
        fi
    fi
    log_success "Super admin frontend built successfully."
else
    log_warn "Admin frontend directory not detected. Skipping admin build."
fi

# ------------------------------------------------------------------------------
# STEP 6: Zero-Downtime Backend Process Management (PM2)
# ------------------------------------------------------------------------------
log_step "Step 6: Managing Backend Process via PM2..."
cd "${SERVER_DIR}"
mkdir -p logs

if command -v pm2 > /dev/null 2>&1; then
    APP_NAME="myup-api"
    if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
        log_info "PM2 application '${APP_NAME}' is active. Performing zero-downtime reload..."
        pm2 reload ecosystem.config.cjs --env production --update-env
        log_success "PM2 cluster reloaded with zero downtime."
    else
        log_info "Starting PM2 application '${APP_NAME}' from ecosystem.config.cjs..."
        pm2 start ecosystem.config.cjs --env production
        log_success "PM2 cluster started."
    fi
    pm2 save || true
elif systemctl is-active --quiet myup-api.service 2>/dev/null; then
    log_info "PM2 not found, but systemd service myup-api.service is active. Restarting..."
    sudo systemctl restart myup-api.service
    log_success "Systemd service myup-api.service restarted."
else
    log_warn "Neither PM2 nor systemd unit was found running."
    log_warn "To run backend: cd ${SERVER_DIR} && npm start"
fi

# ------------------------------------------------------------------------------
# STEP 7: Nginx Configuration Test and Reload
# ------------------------------------------------------------------------------
log_step "Step 7: Validating and Reloading Nginx..."

if command -v nginx > /dev/null 2>&1; then
    log_info "Testing Nginx configuration syntax (sudo nginx -t)..."
    if sudo nginx -t; then
        log_info "Reloading Nginx service..."
        if command -v systemctl > /dev/null 2>&1; then
            sudo systemctl reload nginx
        else
            sudo service nginx reload || sudo nginx -s reload
        fi
        log_success "Nginx reloaded successfully without connection drops."
    else
        log_error "Nginx configuration test failed! Please check your Nginx configuration."
        exit 1
    fi
else
    log_warn "Nginx command not found on host. Skipping Nginx reload."
fi

# ------------------------------------------------------------------------------
# STEP 8: Post-Deployment Health Check Verification
# ------------------------------------------------------------------------------
log_step "Step 8: Performing Health Check Verification..."

HEALTH_URL="http://127.0.0.1:5000/api/health"
MAX_ATTEMPTS=10
RETRY_DELAY=2
PASSED=false

log_info "Polling ${HEALTH_URL} (max ${MAX_ATTEMPTS} attempts)..."

for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
    sleep "${RETRY_DELAY}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" || echo "CONN_REFUSED")

    if [[ "${HTTP_CODE}" == "200" ]]; then
        HEALTH_PAYLOAD=$(curl -s "${HEALTH_URL}" || echo "{}")
        log_success "Health check PASSED on attempt ${attempt} (HTTP 200 OK)!"
        echo -e "${BOLD}Health Response Payload:${NC}\n${HEALTH_PAYLOAD}"
        PASSED=true
        break
    else
        log_warn "Attempt ${attempt}/${MAX_ATTEMPTS}: Health endpoint returned ${HTTP_CODE}. Retrying..."
    fi
done

if [[ "${PASSED}" != "true" ]]; then
    log_error "Post-deployment health check FAILED after ${MAX_ATTEMPTS} attempts!"
    echo "Endpoint: ${HEALTH_URL}"
    echo "Last HTTP Code: ${HTTP_CODE}"
    echo -e "\nServer error logs (last 20 lines):"
    if [[ -f "${SERVER_DIR}/logs/pm2-err.log" ]]; then
        tail -n 20 "${SERVER_DIR}/logs/pm2-err.log" || true
    fi
    exit 1
fi

echo -e "\n${BOLD}${GREEN}==============================================================================${NC}"
echo -e "${BOLD}${GREEN}  🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! All services are active and healthy. ${NC}"
echo -e "${BOLD}${GREEN}==============================================================================${NC}"
