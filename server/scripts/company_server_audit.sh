#!/usr/bin/env bash
# ==============================================================================
# MYUP — KOMPANIYA SERVERI AUDIT VA DIAGNOSTIKA SKRIPTI (READ-ONLY)
# Ushbu skript serverdagi hech bir servisga zarar yetkazmaydi va o'zgartirish kiritmaydi.
# ==============================================================================

set -u

echo "================================================================================"
echo "📊 KOMPANIYA SERVERI (192.168.23.233) TO'LIQ AUDIT HISOBOTI"
echo "Sana: $(date)"
echo "================================================================================"

echo -e "\n--- 1. OPERATSION TIZIM VA YADRO ---"
if [ -f /etc/os-release ]; then
    cat /etc/os-release | grep -E "PRETTY_NAME|VERSION="
else
    uname -a
fi
uname -r

echo -e "\n--- 2. CPU RESURSLARI VA YUKLAMA ---"
lscpu 2>/dev/null | grep -E "Model name|CPU\(s\):|Thread\(s\) per core|Core\(s\) per socket" || nproc
echo "Joriy Load Average: $(uptime | awk -F'load average:' '{ print $2 }')"

echo -e "\n--- 3. RAM (XOTIRA) HOLATI ---"
free -h -w 2>/dev/null || free -m

echo -e "\n--- 4. DISK HOLATI ---"
df -h -x tmpfs -x devtmpfs

echo -e "\n--- 5. OCHIQ PORTLAR VA TINGLAYOTGAN XIZMATLAR ---"
if command -v ss &>/dev/null; then
    sudo ss -tulpn 2>/dev/null || ss -tulpn
elif command -v netstat &>/dev/null; then
    sudo netstat -tulpn 2>/dev/null || netstat -tulpn
else
    echo "⚠️ ss yoki netstat topilmadi."
fi

echo -e "\n--- 6. DOCKER KONTEYNERLARI (AGAR MAVJUD BO'LSA) ---"
if command -v docker &>/dev/null; then
    echo "Docker versiyasi: $(docker --version)"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker ruxsatsiz yoki ishlamayapti"
else
    echo "Docker o'rnatilmagan."
fi

echo -e "\n--- 7. PM2 PROCESSLARI (AGAR MAVJUD BO'LSA) ---"
if command -v pm2 &>/dev/null; then
    pm2 list 2>/dev/null || echo "PM2 da ishlayotgan servislar yo'q"
else
    echo "PM2 o'rnatilmagan."
fi

echo -e "\n--- 8. MAVJUD XIZMATLAR (POSTGRESQL, NODE, NGINX) ---"
echo "Node.js: $(node -v 2>/dev/null || echo 'O\'rnatilmagan')"
echo "NPM:     $(npm -v 2>/dev/null || echo 'O\'rnatilmagan')"
echo "Nginx:   $(nginx -v 2>&1 || echo 'O\'rnatilmagan')"
echo "Postgres: $(psql --version 2>/dev/null || echo 'O\'rnatilmagan')"

echo -e "\n--- 9. PUBLIC IP VA TASHQI TARMOQ ALOQASI ---"
PUBLIC_IP=$(curl -s --max-time 3 ifconfig.me || curl -s --max-time 3 api.ipify.org || echo "Aniqlab bo'lmadi")
echo "Server Public IP: ${PUBLIC_IP}"
ping -c 2 -W 2 8.8.8.8 &>/dev/null && echo "Tashqi internet aloqasi: MAVJUD (OK)" || echo "Tashqi internet aloqasi: YO'Q yoki Cheklangan"

echo -e "\n--- 10. MYUP UCHUN TAVSIYA ETILADIGAN BO'SH PORT ---"
for PORT in 5000 5050 5100 5200; do
    if ! ss -tuln | grep -q ":${PORT} "; then
        echo "✅ Port ${PORT} BO'SH — MyUp backend uchun xavfsiz ishlatilishi mumkin!"
        break
    else
        echo "⚠️ Port ${PORT} band."
    fi
done

echo -e "\n================================================================================"
echo "✅ AUDIT YAKUNLANDI."
echo "================================================================================"
