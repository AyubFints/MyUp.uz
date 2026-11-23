// A-Maps Multi-Device, Cache & Sync Comprehensive Real-World Test
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'myup_super_secret_jwt_key_2026_uzbekistan';
const LOCAL_URL = 'http://localhost:5000/api';
const TUNNEL_URL = 'https://nirvana-arise-preferred-soc.trycloudflare.com/api';

async function req(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

async function run() {
  console.log('====================================================');
  console.log('🧪 A-MAPS KESH, SINXRONIZATSIYA VA QURILMALAR TESTI');
  console.log('====================================================\n');

  // 1. Bazadagi haqiqiy admin va foydalanuvchini olamiz
  const adminDb = await query("SELECT id, phone, role FROM users WHERE role = 'super_admin' LIMIT 1");
  const userDb = await query("SELECT id, phone, role FROM users WHERE role = 'user' LIMIT 1");

  const admin = adminDb.rows[0];
  const normalUser = userDb.rows[0];

  console.log(`👤 Super Admin: ${admin.phone} (${admin.id})`);
  console.log(`👤 Foydalanuvchi: ${normalUser.phone} (${normalUser.id})\n`);

  const adminToken = jwt.sign({ id: admin.id, phone: admin.phone, role: 'super_admin' }, JWT_SECRET, { expiresIn: '2h' });
  const userToken = jwt.sign({ id: normalUser.id, phone: normalUser.phone, role: 'user' }, JWT_SECRET, { expiresIn: '2h' });

  // Test boshlanishidan oldin eski test qoldiqlarini tozalaymiz (Production stansiyalariga aslo tegmaymiz!)
  await query("DELETE FROM stations WHERE name LIKE 'Sinxron Sinov %'").catch(() => {});

  const prodStationsRes = await query("SELECT id, name FROM stations WHERE status = 'approved' AND is_approved = true");
  const prodCount = prodStationsRes.rows.length;
  console.log(`📦 Baza boshlang'ich tasdiqlangan (production) stansiyalar soni: ${prodCount} ta\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: YANGI QURILMADA (FIRST VISIT) MANZILLAR YUKLANISHI VA NO-CACHE
    // -------------------------------------------------------------------------
    console.log('▶️ TEST 1: Yangi qurilmada birinchi marta kirish (Keshsiz, toza brauzer)...');
    const newDeviceRes = await req(`${LOCAL_URL}/stations`);
    const cacheControlHeader = newDeviceRes.headers.get('cache-control');

    console.log(`  Status: ${newDeviceRes.status}`);
    console.log(`  Cache-Control header: ${cacheControlHeader}`);
    console.log(`  Yuklangan manzillar soni: ${newDeviceRes.data.stations?.length} ta`);

    const test1Passed = newDeviceRes.status === 200 &&
      Array.isArray(newDeviceRes.data.stations) &&
      newDeviceRes.data.stations.length === prodCount &&
      cacheControlHeader?.includes('no-store');

    if (test1Passed) {
      console.log('  🎯 NATIJA: TEST 1 MUVAFFAQIYATLI O\'TDI (Yangi qurilmaga serverdan darhol yuklandi, no-store tasdiqlandi)!\n');
    } else {
      console.error('  ❌ TEST 1 XATO: ', newDeviceRes.data);
    }

    // -------------------------------------------------------------------------
    // TEST 2: 10 TA MANZILDAN 5 TASINI O'CHIRISH VA 20 TA YANGI MANZIL TASDIQLASH
    // -------------------------------------------------------------------------
    console.log('▶️ TEST 2: 10 ta manzil yaratib, 5 tasini o‘chirish va 20 ta yangi manzil tasdiqlash...');

    // A) 10 ta manzil yaratamiz va admin tasdiqlaydi
    const batch1Ids = [];
    for (let i = 1; i <= 10; i++) {
      const createRes = await req(`${LOCAL_URL}/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({
          name: `Sinxron Sinov #Batch1_${i}`,
          lat: 41.30 + (i * 0.001),
          lng: 69.24 + (i * 0.001),
          phone: normalUser.phone,
          types: ['metan'],
          prices: { metan: 3800 },
        }),
      });
      const stId = createRes.data.station?.id;
      if (stId) {
        batch1Ids.push(stId);
        // Admin tasdiqlaydi
        await req(`${LOCAL_URL}/admin/stations/${stId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ isApproved: true }),
        });
      }
    }
    console.log(`  ✅ 10 ta yangi manzil yaratildi va Admin tomonidan tasdiqlandi.`);

    // Eski qurilma (Device A) simulyatsiyasi: ayni paytda serverdan barcha 10 ta manzilni o'z keshiga olgan
    const deviceAResBefore = await req(`${LOCAL_URL}/stations`);
    let deviceACache = deviceAResBefore.data.stations;
    console.log(`  📱 Qurilma A (Eski qurilma) xotirasida jami: ${deviceACache.length} ta manzil saqlandi (Prod: ${prodCount} + Batch1: 10).`);

    // B) Super Admin 10 tadan 5 tasini o'chiradi
    console.log(`  🗑️ Super Admin 10 tadan 5 tasini o'chirmoqda...`);
    for (let i = 0; i < 5; i++) {
      const deleteId = batch1Ids[i];
      await req(`${LOCAL_URL}/admin/stations/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }

    // C) Foydalanuvchilar 20 ta yangi manzil yaratadi va Super Admin tasdiqlaydi
    console.log(`  ✨ 20 ta yangi manzil yaratilmoqda va Admin tomonidan tasdiqlanmoqda...`);
    const batch2Ids = [];
    for (let i = 1; i <= 20; i++) {
      const createRes = await req(`${LOCAL_URL}/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({
          name: `Sinxron Sinov #Batch2_${i}`,
          lat: 41.32 + (i * 0.001),
          lng: 69.26 + (i * 0.001),
          phone: normalUser.phone,
          types: ['benzin'],
          prices: { benzin: 9500 },
        }),
      });
      const stId = createRes.data.station?.id;
      if (stId) {
        batch2Ids.push(stId);
        // Admin tasdiqlaydi
        await req(`${LOCAL_URL}/admin/stations/${stId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ isApproved: true }),
        });
      }
    }
    console.log(`  ✅ 20 ta yangi manzil tasdiqlandi.`);

    // Serverdagi kutilayotgan haqiqiy son:
    // prodCount + (10 - 5) + 20 = prodCount + 25
    const expectedTotal = prodCount + 5 + 20;

    // D) Boshqa qurilma (Device B - yangi kirgan qurilma)
    const deviceBRes = await req(`${LOCAL_URL}/stations`);
    const deviceBStations = deviceBRes.data.stations || [];
    console.log(`  📱 Qurilma B (Yangi qurilma) ko'rayotgan stansiyalar soni: ${deviceBStations.length} ta (Kutilgan: ${expectedTotal})`);

    // E) Eski qurilma (Device A) sinxronizatsiyasi:
    // Device A keshida eski 5 ta o'chirilgan manzil bor edi. Sinxronizatsiya chaqirilganda ular o'chishi kerak!
    const deviceASyncRes = await req(`${LOCAL_URL}/stations`);
    const serverStationIds = new Set(deviceASyncRes.data.stations.map(s => s.id));
    // Frontenddagi tozalash mantig'i:
    deviceACache = deviceASyncRes.data.stations; // to'liq yangilandi

    const hasDeletedStationsInCache = batch1Ids.slice(0, 5).some(delId => serverStationIds.has(delId));
    console.log(`  🧹 Qurilma A keshida o'chirilgan 5 ta stansiya bormi: ${hasDeletedStationsInCache ? 'HA (XATO!)' : 'YO\'Q (TOZALANGAN!)'}`);
    console.log(`  📱 Qurilma A sinxronizatsiyadan keyin ko'rayotgan soni: ${deviceACache.length} ta`);

    const test2Passed = deviceBStations.length === expectedTotal &&
      deviceACache.length === expectedTotal &&
      !hasDeletedStationsInCache;

    if (test2Passed) {
      console.log('  🎯 NATIJA: TEST 2 MUVAFFAQIYATLI O\'TDI (O\'chirilganlar butunlay yo\'qoldi, yangilar barcha qurilmada chiqdi)!\n');
    } else {
      console.error('  ❌ TEST 2 XATO: Manzillar to\'liq sinxronlashmadi!\n');
    }

    // -------------------------------------------------------------------------
    // TEST 3: 3 TA TURLI QURILMA / KANAL ORQALI BIR VAQTDA TEKSHIRISH
    // -------------------------------------------------------------------------
    console.log('▶️ TEST 3: Kamida 3 ta turli kanal orqali bir vaqtda tekshirish...');
    console.log('  1-kanal: Lokal Localhost (Desktop)');
    console.log('  2-kanal: Cloudflare Public Tunnel (Mobil / Tashqi tarmoq)');
    console.log('  3-kanal: GPS ruxsatsiz so\'rov (Standart koordinatalar bilan)');

    const [ch1, ch2, ch3] = await Promise.all([
      req(`${LOCAL_URL}/stations`),
      req(`${TUNNEL_URL}/stations`),
      req(`${LOCAL_URL}/stations?userLat=41.311081&userLng=69.240562`),
    ]);

    console.log(`  1-kanal natijasi (Localhost): status ${ch1.status}, count: ${ch1.data.count}`);
    console.log(`  2-kanal natijasi (Cloudflare Tunnel): status ${ch2.status}, count: ${ch2.data.count}`);
    console.log(`  3-kanal natijasi (GPS koordinatasiz/standart): status ${ch3.status}, count: ${ch3.data.count}`);

    const test3Passed = ch1.status === 200 && ch2.status === 200 && ch3.status === 200 &&
      ch1.data.count === ch2.data.count && ch1.data.count === ch3.data.count;

    if (test3Passed) {
      console.log('  🎯 NATIJA: TEST 3 MUVAFFAQIYATLI O\'TDI (Barcha 3 ta kanal bir xil, eng yangi ma\'lumotlarni qaytardi)!\n');
    } else {
      console.error('  ❌ TEST 3 XATO: Kanallar o\'rtasida nomutanosiblik bor!\n');
    }

    // -------------------------------------------------------------------------
    // TEST 4: INTERNET UZILIB QAYTA ULANGANIDA SINXRONIZATSIYA
    // -------------------------------------------------------------------------
    console.log('▶️ TEST 4: Tarmoq uzilishi va tiklangandan keyingi avtomatik sinxronizatsiya...');
    // A) Tarmoq uzilganda offline kesh saqlanib turishi
    let clientOfflineCache = [...deviceACache];
    console.log(`  📶 Tarmoq uzildi. Qurilma xotirasidagi oxirgi kesh: ${clientOfflineCache.length} ta manzil.`);

    // B) Foydalanuvchi oflayn ekanida serverda o'zgarish bo'ldi (Admin yana 1 ta yangi manzil tasdiqladi)
    const offlineNewRes = await req(`${LOCAL_URL}/stations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: 'Sinxron Sinov #Offline_Recovery_1',
        lat: 41.3300,
        lng: 69.2700,
        phone: normalUser.phone,
        types: ['metan'],
        prices: { metan: 3800 },
      }),
    });
    const offlineStId = offlineNewRes.data.station?.id;
    if (offlineStId) {
      await req(`${LOCAL_URL}/admin/stations/${offlineStId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ isApproved: true }),
      });
    }

    // C) Internet qayta ulandi (Online hodisasi yoki 5s polling ishladi):
    console.log(`  🌐 Internet qayta ulandi (online event). Serverdan yangi ro'yxat tortilmoqda...`);
    const reconnectedRes = await req(`${LOCAL_URL}/stations`);
    clientOfflineCache = reconnectedRes.data.stations;
    const foundNewOfflineStation = clientOfflineCache.find(s => s.id === offlineStId);

    console.log(`  Sinxronizatsiyadan keyingi manzillar soni: ${clientOfflineCache.length}`);
    console.log(`  Oflayn vaqtida tasdiqlangan manzil topildimi: ${foundNewOfflineStation ? 'HA (' + foundNewOfflineStation.name + ')' : 'YO\'Q'}`);

    const test4Passed = Boolean(foundNewOfflineStation);
    if (test4Passed) {
      console.log('  🎯 NATIJA: TEST 4 MUVAFFAQIYATLI O\'TDI (Internet tiklangach 100% yangilandi)!\n');
    } else {
      console.error('  ❌ TEST 4 XATO!\n');
    }

    // -------------------------------------------------------------------------
    // TEST 5: POSTGRESQL VA DASTUR MA'LUMOTLARINI 100% SOLISHTIRISH
    // -------------------------------------------------------------------------
    console.log('▶️ TEST 5: PostgreSQL bazasidagi tasdiqlangan qatorlar va API qaytargan ma\'lumotlarni solishtirish...');
    const dbStations = await query(
      "SELECT id, name, is_approved, status FROM stations WHERE is_approved = true AND status = 'approved' ORDER BY created_at DESC"
    );
    const apiStations = await req(`${LOCAL_URL}/stations`);

    const dbRows = dbStations.rows;
    const apiRows = apiStations.data.stations || [];

    console.log(`  🗄️ PostgreSQL bazasidagi tasdiqlangan qatorlar soni: ${dbRows.length}`);
    console.log(`  🌐 Dasturga (API) yuborilgan stansiyalar soni: ${apiRows.length}`);

    let mismatch = false;
    if (dbRows.length !== apiRows.length) {
      mismatch = true;
    } else {
      for (let i = 0; i < dbRows.length; i++) {
        if (dbRows[i].id !== apiRows[i].id) {
          mismatch = true;
          break;
        }
      }
    }

    console.log(`  Identifikatorlar va tartib 100% mos keladimi: ${mismatch ? 'YO\'Q (XATO)' : 'HA (100% MOS)'}`);
    const test5Passed = !mismatch;

    if (test5Passed) {
      console.log('  🎯 NATIJA: TEST 5 MUVAFFAQIYATLI O\'TDI (PostgreSQL yagona haqiqat manbai ekanligi to\'liq isbotlandi)!\n');
    } else {
      console.error('  ❌ TEST 5 XATO: Baza va API o\'rtasida farq bor!\n');
    }

  } catch (err) {
    console.error('Kutilmagan xato:', err);
  } finally {
    // Test ma'lumotlarini tozalash (Faqat sinov stansiyalarini tozalaymiz, production stansiyalariga tegmaymiz!)
    console.log('🧹 Faqat test stansiyalarini tozalash (Production stansiyalar saqlanadi)...');
    await query("DELETE FROM stations WHERE name LIKE 'Sinxron Sinov %'").catch(() => {});
    const finalProdCheck = await query("SELECT id, name FROM stations WHERE status = 'approved'");
    console.log(`✅ Tozalandi. Production stansiyalari saqlab qolindi: ${finalProdCheck.rows.length} ta.`);
    await pool.end();
    console.log('====================================================');
    console.log('🎉 BARCHA SINXRONIZATSIYA VA KESH TESTLARI YAKUNLANDI!');
    console.log('====================================================');
  }
}

run();
