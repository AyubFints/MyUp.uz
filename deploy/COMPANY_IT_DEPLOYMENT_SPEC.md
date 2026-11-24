# 🏢 KOMPANIYA IT ADMINISTRATORI UCHUN MYUP LOYIHASINI JOYLASHTIRISH VA XAVFSIZLIK QO‘LLANMASI (V2.0 YAKUNIY)

Ushbu hujjat **192.168.23.233** (Ubuntu 24.04 LTS) serveri administratorlari uchun maxsus tayyorlangan. U MyUp ilovasini kompaniyaning boshqa mavjud loyihalariga **mutlaqo ziyon yetkazmasdan**, xavfsiz izolyatsiyalangan holda joylashtirish tartibi, resurs limitlari, secret management va arxitektura variantlarini belgilaydi.

---

## 1. XAVFSIZ SECRET MANAGEMENT (PAROLLARNI KODDA SAQLAMASLIK)

> [!IMPORTANT]
> Ma'lumotlar bazasi va JWT parollari hech qachon skriptlar, SQL fayllar yoki Git repozitoriysida ochiq (hardcoded) yozilmaydi.

### Xavfsiz Sozlash Standarti:
1. Ma'lumotlar bazasi paroli serverda o‘rnatish paytida `openssl` orqali dinamik 24-baytli kriptografik tasodifiy satr sifatida generatsiya qilinadi (yoki IT admin tomonidan kiritiladi):
   ```bash
   DB_PASSWORD=$(openssl rand -hex 24)
   JWT_SECRET=$(openssl rand -hex 32)
   ```
2. Ushbu maxfiy qiymatlar faqat `/var/www/myup/server/.env.production` fayliga yoziladi va qat'iy fayl ruxsati beriladi:
   ```bash
   sudo chmod 600 /var/www/myup/server/.env.production
   sudo chown myup:myup /var/www/myup/server/.env.production
   ```
   *(Faylni faqat `myup` foydalanuvchisi o‘qiy oladi, boshqa foydalanuvchilar va tizim dasturlari uni ko‘ra olmaydi).*

---

## 2. POSTGRESQL IZOLYATSIYASI VA PUBLIC CONNECT MUAMMOSI

### A. Muammoning Texnik Mohiyati:
PostgreSQL'da standart holatda barcha yangi yaratilgan ma'lumotlar bazalarida `PUBLIC` umumiy roliga `CONNECT` huquqi avtomatik beriladi. Agar boshqa kompaniya bazalarida bu huquq bekor qilinmagan bo‘lsa, har qanday yangi yaratilgan foydalanuvchi (`myup_user`) nazariy jihatdan boshqa bazalarga ulanish (CONNECT) so‘rovini yuborishi mumkin.

Kompaniya talabi: **"Boshqa kompaniya bazalarining mavjud ruxsatlarini o‘zgartirma."**

### B. Boshqa Bazalarga Tegmasdan To‘liq Izolyatsiyani Ta'minlash Yechimi:
Boshqa kompaniya bazalarining ruxsatlariga tegmasdan, `myup_user` ulanishini faqat `myup_db` ga cheklash uchun **PostgreSQL HBA (Host-Based Authentication)** mexanizmi qo‘llaniladi:

`/etc/postgresql/16/main/pg_hba.conf` faylining **eng yuqori qismiga** (boshqa qoidalardan oldin) quyidagi 4 ta satr kiritiladi:
```text
# ==============================================================================
# MYUP USER ISOLATION RULES (Boshqa kompaniya bazalariga ulanishni taqiqlash)
# ==============================================================================
local   myup_db         myup_user                               scram-sha-256
host    myup_db         myup_user       127.0.0.1/32            scram-sha-256
local   all             myup_user                               reject
host    all             myup_user       all                     reject
# ==============================================================================
```
So‘ngra PostgreSQL sozlamalari qayta yuklanadi (servis to‘xtatilmaydi):
```bash
sudo -u postgres psql -c "SELECT pg_reload_conf();"
```

#### Haqiqiy Ruxsat Sinovi (Permission Proof):
```bash
# 1. myup_db ga ulanish (MUVAFFAQIYATLI BO'LISHI KERAK):
psql -h 127.0.0.1 -U myup_user -d myup_db -c "SELECT current_database(), current_user;"
# Natija: myup_db | myup_user

# 2. Boshqa ixtiyoriy kompaniya bazasiga ulanishga urinish (RAD ETILISHI SHART):
psql -h 127.0.0.1 -U myup_user -d postgres -c "SELECT 1;"
# Haqiqiy javob: FATAL: pg_hba.conf rejects connection for host "127.0.0.1", user "myup_user", database "postgres"
```
*Bu usul boshqa kompaniya bazalarining ruxsatlarini 1 bayt ham o‘zgartirmasdan, `myup_user` ning boshqa bazalarga kirishini 100% bloklaydi.*

---

## 3. TAVSIYA ETILADIGAN ALTERNATIVA: ALOHIDA POSTGRESQL INSTANCE

Agar IT administrator umumiy PostgreSQL klasterida `pg_hba.conf` ga qoida qo‘shishni istamasa yoki to‘liq mustaqillikni xohlasa, MyUp uchun **alohida PostgreSQL instance** yaratish tavsiya etiladi.

Ubuntu 24.04 LTS tizimida bu juda qulay va xavfsiz:
```bash
# 1. 5433-portda MyUp uchun mutlaqo alohida PostgreSQL klasterini yaratish:
sudo pg_createcluster 16 myup -p 5433 --locale en_US.UTF-8

# 2. Xizmatni ishga tushirish va avto-yuklashga qo'shish:
sudo systemctl enable postgresql@16-myup
sudo systemctl start postgresql@16-myup
```
* **Afzalliklari:**
  - Alohida xotira buferi (RAM cache), alohida disk katalogi (`/var/lib/postgresql/16/myup`).
  - Asosiy kompaniya PostgreSQL klasteri bilan hech qanday resurs yoki foydalanuvchi to‘qnashuvi bo‘lmaydi.
  - Port: `5433` (MyUp `.env.production` faylida `DB_PORT=5433` qilib ko‘rsatiladi).

---

## 4. RAD ETILGAN MANZILLAR (REJECTED) VA BOG‘LANGAN MA'LUMOTLARNI 24 SOATDAN KEYIN TOZALASH

Shahobchalar rad etilgandan so‘ng 24 soat o‘tgach o‘chirilganda, barcha bog‘langan jadvallar va rasmlar to‘liq tozalanishi tekshirildi:

### A. Ma'lumotlar Bazasidagi Kaskadli Tozalash (ON DELETE CASCADE)
`server/schema.sql` dagi barcha jadvallar `stations(id)` ga `ON DELETE CASCADE` bilan bog‘langan:
- `fuel_prices` — Shahobcha yoqilg‘i narxlari va gaz bosimi o‘chiriladi.
- `station_amenities` — Shahobcha qulayliklari (Wi-Fi, kofe, hojatxona) o‘chiriladi.
- `station_payments` — Shahobcha to‘lov turlari o‘chiriladi.
- `reviews` — Sharhlar va reytinglar o‘chiriladi.
- `user_notifications` — Foydalanuvchiga yuborilgan tegishli bildirishnomalar o‘chiriladi.

### B. Rasmlar va Fayllar Tozalanishi:
- Ilovada shahobcha rasmlari (`images` va `verification_images`) diskda emas, bevosita `stations` jadvalining `JSONB` ustunlarida siqilgan formatda saqlanadi.
- Shu sababli, `stations` qatori o‘chirilishi bilan unga tegishli barcha rasmlar va ma'lumotlar bazadan atomar ravishda 100% yo‘qoladi. Diskda hech qanday "yetim" (orphan) fayl qolmaydi.

### C. 24 Soatlik Tozalash So‘rovi:
```sql
DELETE FROM stations 
WHERE status = 'rejected' 
  AND rejected_at IS NOT NULL 
  AND rejected_at < NOW() - INTERVAL '24 hours';
```

---

## 5. DOMEN VA CLOUDFLARE HOLATI TEKSHIRUVI: `api.myup.uz`

> [!WARNING]
> **Haqiqiy DNS tekshiruvi natijasi:**
> `nslookup api.myup.uz` va `Resolve-DnsName myup.uz` so‘rovlari yuborildi:
> **Natija: Non-existent domain (Domen hozircha mavjud emas).**

* `myup.uz` va `api.myup.uz` domenlari hozircha internetda ro‘yxatdan o‘tkazilmagan yoki Cloudflare DNS tizimiga ulanmagan.
* **Shu sababli, ushbu domenlarni hozir "tayyor" deb hisoblab bo‘lmaydi.**

### Hozirgi Ishlash Mexanizmi:
1. Kompaniya serverida `cloudflared` o‘rnatilganda, agar doimiy domen hali tayyor bo‘lmasa, Cloudflare avtomatik beradigan doimiy tunnel havolasi yoki Cloudflare hisobidagi vaqtinchalik subdomen orqali ulanadi.
2. Domen sotib olinib, Cloudflare hisobiga ulangandan keyingina `api.myup.uz` manzili rasman kuchga kiradi:
   ```bash
   cloudflared tunnel route dns <TUNNEL_ID> api.myup.uz
   ```

---

## 6. BACKUP TIKLASHDA XATOLIKLARNI YASHIRMASLIK VA XAVFSIZ TO‘XTATISH

Deployment skriptidagi (`server/scripts/deploy_company_server.sh`) zaxira nusxani tiklash buyrug‘i qat'iylashtirildi. Xatolar hech qachon yashirilmaydi (`2>/dev/null` olib tashlandi):

```bash
# psql -v ON_ERROR_STOP=1 va --single-transaction parametrlari:
PGPASSWORD="${DB_PASSWORD}" psql \
    -v ON_ERROR_STOP=1 \
    --single-transaction \
    -h localhost \
    -p "${DB_PORT}" \
    -U myup_user \
    -d myup_db \
    -f "${BACKUP_SQL}"
```
* **Xavfsizlik Kafolati:** Agar SQL faylda bitta xatolik yuz bersa:
  1. `ON_ERROR_STOP=1` tufayli `psql` zudlik bilan ishni to‘xtatadi va aniq xatolik xabarini ekranga chiqaradi;
  2. `--single-transaction` sababli bazaga kiritilgan barcha o‘zgarishlar darhol `ROLLBACK` qilinadi (chala ma'lumot qolmaydi);
  3. Skript `set -euo pipefail` rejimida bo‘lgani uchun butun deployment to‘xtatiladi.

---

## 7. RESURS CHEKLOVLARI VA CONNECTION POOL

1. **PM2 RAM chegarasi:** `max_memory_restart: '1024M'` — bu dasturiy restart chegarasi (soft restart threshold) bo‘lib, xotira sizib chiqishini oldini oladi.
2. **PostgreSQL Connection Pool:**
   $$\text{Jami Ulanishlar} = 1 \text{ worker} \times 15 \text{ (DB\_POOL\_MAX)} = 15 \text{ ta ulanish}$$
   *(Kompaniya serveridagi PostgreSQL resurslarini ortiqcha yuklamaydi).*
3. **Port:** IT administrator bilan kelishilgan port (standart: `5000`, muqobil: `5050` yoki `5100`).

---

## 8. ROLLBACK VA LOYIHANI XAVFSIZ O‘CHIRISH (EMERGENCY REMOVAL)

Agar MyUp loyihasini to‘xtatish kerak bo‘lsa:
```bash
# 1. Jarayonni to'xtatish:
pm2 stop myup-api && pm2 delete myup-api

# 2. Bazani xavfsiz o'chirish (faqat myup_db):
sudo -u postgres psql -c "DROP DATABASE IF EXISTS myup_db; DROP USER IF EXISTS myup_user;"

# 3. Fayllarni o'chirish:
sudo rm -rf /var/www/myup
```
*Boshqa kompaniya dasturlariga va ma'lumotlar bazalariga mutlaqo ziyon yetkazilmaydi.*
