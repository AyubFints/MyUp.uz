// A-Maps Concurrency & Race Condition Stress Test
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'myup_super_secret_jwt_key_2026_uzbekistan';
const BASE_URL = 'http://localhost:5000/api';

async function postJson(endpoint, body, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function patchJson(endpoint, body, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function getJson(endpoint, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 A-MAPS MA\'LUMOTLAR ALMASHISH VA XAVFSIZLIK TESTLARI');
  console.log('====================================================\n');

  // Bazadan haqiqiy admin va foydalanuvchini olamiz
  const adminDb = await query("SELECT id, phone, role FROM users WHERE role = 'super_admin' LIMIT 1");
  const userDb = await query("SELECT id, phone, role FROM users WHERE role = 'user' LIMIT 1");

  const adminUser = adminDb.rows[0];
  const normalUser = userDb.rows[0];

  console.log(`👤 Admin: ${adminUser.phone} (${adminUser.id})`);
  console.log(`👤 Foydalanuvchi: ${normalUser.phone} (${normalUser.id})\n`);

  const adminToken = jwt.sign(
    { id: adminUser.id, phone: adminUser.phone, role: 'super_admin' },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const userToken = jwt.sign(
    { id: normalUser.id, phone: normalUser.phone, role: 'user' },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const testStationIds = [];
  const runId = Date.now();

  // Test boshlanishidan oldin eski test qoldiqlarini tozalaymiz
  await query("DELETE FROM stations WHERE name LIKE 'Stress Test%' OR name LIKE 'Noyob Egizak%' OR name LIKE 'Moderatsiya Poygasi%' OR name LIKE 'Rad Etilishi%'").catch(() => {});

  try {
    // ----------------------------------------------------
    // TEST 1: 100 TA PARALLEL FOYDALANUVCHI SO'ROVI
    // ----------------------------------------------------
    console.log('▶️ TEST 1: Bir vaqtning o‘zida 100 ta parallel foydalanuvchi ma\'lumot yuborishi...');
    const startTime1 = Date.now();
    const concurrentRequests = Array.from({ length: 100 }, (_, i) => {
      const idx = i + 1;
      return postJson(
        '/stations',
        {
          name: `Stress Test Shahobchasi #${runId}_${idx}`,
          lat: 41.28 + (idx * 0.001),
          lng: 69.20 + (idx * 0.001),
          address: `Test Ko'chasi, Uy ${idx}`,
          city: 'Toshkent',
          phone: `+998 90 000 ${String(idx).padStart(4, '0')}`,
          types: ['metan', 'benzin'],
          prices: { metan: 3800, benzin: 9500 },
          amenities: { coffee: true, toilet: true },
        },
        userToken
      );
    });

    const results1 = await Promise.all(concurrentRequests);
    const duration1 = Date.now() - startTime1;
    const successes1 = results1.filter((r) => r.status === 201 && r.data.success);
    const allPending1 = results1.filter((r) => r.data.station?.status === 'pending' && r.data.station?.isApproved === false);

    console.log(`  ⏱️ Sarflangan vaqt: ${duration1} ms`);
    console.log(`  ✅ Muvaffaqiyatli qabul qilingan: ${successes1.length} / 100`);
    console.log(`  🔒 Barchasi 'pending' (tasdiqlanmagan) holatda: ${allPending1.length} / 100`);
    if (successes1.length === 100 && allPending1.length === 100) {
      console.log('  🎯 NATIJA: TEST 1 MUVAFFAQIYATLI O\'TDI!\n');
      successes1.forEach(r => testStationIds.push(r.data.station.id));
    } else {
      console.error('  ❌ TEST 1 XATO: ', results1.find(r => r.status !== 201)?.data);
    }

    // ----------------------------------------------------
    // TEST 2: BIR XIL MANZILNI BIR VAQTDA 10 MARTA YUBORISH (DUBLIKAT HIMOYASI)
    // ----------------------------------------------------
    console.log('▶️ TEST 2: Bir xil manzilni bir vaqtning o‘zida bir necha marta yuborish (Advisory Lock & Deduplication)...');
    const test2Name = `Noyob Egizak Shahobcha #${runId}`;
    const duplicatePayload = {
      name: test2Name,
      lat: 41.3344,
      lng: 69.2844,
      address: 'Markaziy Shox ko\'chasi',
      city: 'Toshkent',
      phone: normalUser.phone,
      types: ['metan'],
      prices: { metan: 3800 },
      userId: normalUser.id,
    };

    const duplicateRequests = Array.from({ length: 10 }, () => postJson('/stations', duplicatePayload, userToken));
    const dupResults = await Promise.all(duplicateRequests);
    const dupCreated = dupResults.filter(r => r.status === 201);
    const dupReused = dupResults.filter(r => r.status === 200);

    const dbCountRes = await query(
      "SELECT id, COUNT(*)::int as count FROM stations WHERE name = $1 GROUP BY id",
      [test2Name]
    );
    const createdStationId = dbCountRes.rows[0]?.id;
    if (createdStationId) testStationIds.push(createdStationId);

    console.log(`  📦 Bir vaqtda yuborilgan so'rovlar soni: 10`);
    console.log(`  🆕 Yangi yaratilgani (201): ${dupCreated.length}`);
    console.log(`  🔁 Deduplication orqali qaytarilgani (200): ${dupReused.length}`);
    console.log(`  🗄️ Bazadagi qatorlar soni: ${dbCountRes.rows.length}`);
    if (dbCountRes.rows.length === 1 && (dupCreated.length + dupReused.length === 10)) {
      console.log('  🎯 NATIJA: TEST 2 MUVAFFAQIYATLI O\'TDI (Bazaga faqat 1 ta yozildi, dublikatlar to\'liq qaytarildi)!\n');
    } else {
      console.error('  ❌ TEST 2 DA DUBLIKAT ANIQLANDI!\n');
    }

    // ----------------------------------------------------
    // TEST 3: IKKI ADMINNING BIR VAQTDA BIR XIL MANZILGA QAROR BERISHI (RACE CONDITION)
    // ----------------------------------------------------
    console.log('▶️ TEST 3: Bir xil manzilni ikki admin bir vaqtda tasdiqlash va rad etishi (Race Condition)...');
    const raceStationRes = await postJson('/stations', {
      name: `Moderatsiya Poygasi #${runId}`,
      lat: 41.3111,
      lng: 69.2444,
      phone: normalUser.phone,
      types: ['metan'],
      prices: { metan: 3800 },
    }, userToken);

    const raceStationId = raceStationRes.data.station?.id;
    if (raceStationId) testStationIds.push(raceStationId);

    // Ikkita admin bir vaqtning o'zida qaror beradi: Biri Tasdiqlaydi, ikkinchisi Rad etadi
    const [admin1Res, admin2Res] = await Promise.all([
      patchJson(`/admin/stations/${raceStationId}/approve`, { isApproved: true }, adminToken),
      patchJson(`/admin/stations/${raceStationId}/approve`, { isApproved: false }, adminToken),
    ]);

    console.log(`  Admin 1 so'rovi (status ${admin1Res.status}): ${admin1Res.data.message}`);
    console.log(`  Admin 2 so'rovi (status ${admin2Res.status}): ${admin2Res.data.message}`);

    const hasSuccess = (admin1Res.status === 200 && admin2Res.status === 409) || (admin1Res.status === 409 && admin2Res.status === 200);

    if (hasSuccess) {
      console.log('  🎯 NATIJA: TEST 3 MUVAFFAQIYATLI O\'TDI (Bitta admin qarori o\'tdi, ikkinchisi 409 bilan xavfsiz bloklandi)!');
    } else {
      console.error('  ❌ TEST 3 DA QARORLAR TO\'QNASHUVI YUZ BERDI!');
    }

    // Keyingi sinov: Allaqachon qaror qabul qilingan manzilga qayta qaror berishga urinish
    const secondTry = await patchJson(`/admin/stations/${raceStationId}/approve`, { isApproved: true }, adminToken);
    console.log(`  Uchinchi marta takroriy qaror berish urinishi (status ${secondTry.status}): ${secondTry.data.message}`);
    if (secondTry.status === 409) {
      console.log('  🎯 NATIJA: Qayta qaror berish qat\'iy bloklandi (409 Conflict)!\n');
    }

    // ----------------------------------------------------
    // TEST 4: XAVFSIZLIK - ODDIY FOYDALANUVCHI ADMIN ENDPOINTGA MUROJAAT QILGANDA
    // ----------------------------------------------------
    console.log('▶️ TEST 4: Xavfsizlik - Oddiy foydalanuvchi admin marshrutiga kurganda...');
    const userAsAdmin = await patchJson(`/admin/stations/${raceStationId}/approve`, { isApproved: true }, userToken);
    const noTokenRes = await patchJson(`/admin/stations/${raceStationId}/approve`, { isApproved: true }, null);

    console.log(`  Oddiy foydalanuvchi tokeni bilan: status ${userAsAdmin.status} (${userAsAdmin.data.message})`);
    console.log(`  Tokensiz so'rov: status ${noTokenRes.status} (${noTokenRes.data.message})`);

    if (userAsAdmin.status === 403 && noTokenRes.status === 401) {
      console.log('  🎯 NATIJA: TEST 4 MUVAFFAQIYATLI O\'TDI (Admin huquqi to\'liq himoyalangan)!\n');
    } else {
      console.error('  ❌ TEST 4 DA XAVFSIZLIK BUZILISHI ANIQLANDI!\n');
    }

    // ----------------------------------------------------
    // TEST 5: RAD ETILGAN MANZILLAR TARIXDA SAQLANISHI
    // ----------------------------------------------------
    console.log('▶️ TEST 5: Rad etilgan manzil foydalanuvchi tarixida saqlanishi...');
    // Bitta rad etilgan stansiya yaratamiz
    const rejStationRes = await postJson('/stations', {
      name: `Rad Etilishi Kerak #${runId}`,
      lat: 41.3122,
      lng: 69.2455,
      phone: normalUser.phone,
      types: ['metan'],
      prices: { metan: 3800 },
    }, userToken);

    const rejStationId = rejStationRes.data.station?.id;
    if (rejStationId) testStationIds.push(rejStationId);

    // Admin uni rad etadi
    await patchJson(`/admin/stations/${rejStationId}/approve`, { isApproved: false }, adminToken);

    // Foydalanuvchi o'z manzillarini tekshiradi
    const myStationsRes = await getJson(`/stations/my?userId=${normalUser.id}`, userToken);
    const foundRejStation = myStationsRes.data.stations?.find(s => s.id === rejStationId);

    console.log(`  Foydalanuvchi jami shaxsiy manzillari soni: ${myStationsRes.data.stations?.length}`);
    console.log(`  Rad etilgan manzil topildimi: ${foundRejStation ? 'HA (status: ' + foundRejStation.status + ')' : 'YO\'Q'}`);
    if (foundRejStation && foundRejStation.status === 'rejected') {
      console.log('  🎯 NATIJA: TEST 5 MUVAFFAQIYATLI O\'TDI (Rad etilgan manzil tarixda saqlanib turibdi)!\n');
    } else {
      console.error('  ❌ TEST 5 XATO: Rad etilgan manzil yo\'qolgan!');
    }

  } catch (err) {
    console.error('Test jarayonida kutilmagan xato:', err);
  } finally {
    // Test ma'lumotlarini bazadan tozalash
    console.log('🧹 Test ma\'lumotlarini tozalash...');
    await query("DELETE FROM stations WHERE name LIKE 'Stress Test%' OR name LIKE 'Noyob Egizak%' OR name LIKE 'Moderatsiya Poygasi%' OR name LIKE 'Rad Etilishi%'").catch((e) => console.error(e));
    await query("DELETE FROM stations WHERE name = 'Sinov'").catch(() => {});
    console.log(`✅ Test yozuvlari tozalandi.`);
    await pool.end();
    console.log('====================================================');
    console.log('🎉 BARCHA TESTLAR YAKUNLANDI!');
    console.log('====================================================');
  }
}

runTests();
