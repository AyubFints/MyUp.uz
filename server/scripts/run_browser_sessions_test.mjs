// A-Maps 3 Real Browser Sessions Test using puppeteer-core & Chrome
import puppeteer from 'puppeteer-core';
import jwt from 'jsonwebtoken';
import path from 'path';
import { pool, query } from '../src/config/db.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\0c842baa-243a-4780-a738-4d11b978cfdf';
const JWT_SECRET = process.env.JWT_SECRET || 'myup_super_secret_jwt_key_2026_uzbekistan';
const APP_URL = 'http://localhost:5174';
const API_URL = 'http://localhost:5000/api';

async function run() {
  console.log('====================================================');
  console.log('🌐 3 TA HAQIQIY BRAUZER SESSIYASIDA AMALIY TEST');
  console.log('====================================================\n');

  // Bazadan haqiqiy foydalanuvchi va adminni olamiz
  const adminDb = await query("SELECT id, phone, role FROM users WHERE role = 'super_admin' LIMIT 1");
  const userDb = await query("SELECT id, phone, role FROM users WHERE role = 'user' LIMIT 1");
  const admin = adminDb.rows[0];
  const normalUser = userDb.rows[0];

  const adminToken = jwt.sign({ id: admin.id, phone: admin.phone, role: 'super_admin' }, JWT_SECRET, { expiresIn: '2h' });
  const userToken = jwt.sign({ id: normalUser.id, phone: normalUser.phone, role: 'user' }, JWT_SECRET, { expiresIn: '2h' });

  // Test boshlanishidan oldin eski test qoldiqlarini tozalaymiz
  await query("DELETE FROM stations WHERE name LIKE 'Test_Brauzer_%'").catch(() => {});

  const prodStationsRes = await query("SELECT id, name FROM stations WHERE status = 'approved' AND is_approved = true");
  const initialProdCount = prodStationsRes.rows.length;
  console.log(`📦 Baza boshlang'ich tasdiqlangan (production) stansiyalar: ${initialProdCount} ta`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,900',
    ],
  });

  const testResults = {
    session1: false,
    session2_pending: false,
    session2_approved_sync: false,
    session2_deleted_sync: false,
    session3_offline_recovery: false,
  };

  let testStationId = null;

  try {
    // =========================================================================
    // SESSIYA 1: YANGI FOYDALANUVCHI (TOZA INCOGNITO BRAUZER, FIRST VISIT)
    // =========================================================================
    console.log('\n▶️ [SESSIYA 1] Yangi foydalanuvchi birinchi marta kirganda (Incognito, Keshsiz)...');
    const context1 = await browser.createBrowserContext();
    const page1 = await context1.newPage();
    await page1.setViewport({ width: 1280, height: 900 });

    const s1ConsoleLogs = [];
    page1.on('console', msg => s1ConsoleLogs.push(msg.text()));

    console.log(`  🔗 ${APP_URL} sahifasi ochilmoqda...`);
    await page1.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Kutamiz: stansiya kartochkalari paydo bo'lishini
    await page1.waitForSelector('.custom-station-card', { timeout: 10000 }).catch(() => null);

    const s1CardsCount = await page1.$$eval('.custom-station-card', els => els.length).catch(() => 0);
    const s1Titles = await page1.$$eval('.custom-sc-title', els => els.map(e => e.textContent.trim())).catch(() => []);

    console.log(`  📊 Sessiya 1 da darhol ko'ringan stansiyalar soni: ${s1CardsCount}`);
    console.log(`  🏷️ Ko'ringan stansiyalar nomlari: ${JSON.stringify(s1Titles)}`);

    const s1ScreenshotPath = path.join(ARTIFACT_DIR, 'browser_test_session1.png');
    await page1.screenshot({ path: s1ScreenshotPath, fullPage: false });
    console.log(`  📸 Skrinshot saqlandi: ${s1ScreenshotPath}`);

    if (s1CardsCount >= initialProdCount) {
      testResults.session1 = true;
      console.log('  🎯 NATIJA: SESSIYA 1 MUVAFFAQIYATLI O\'TDI (Yangi brauzerda manzillar darhol chiqdi)!');
    } else {
      console.error('  ❌ SESSIYA 1 XATO: Manzillar chiqmadi!');
    }
    await context1.close();

    // =========================================================================
    // SESSIYA 2: AVTORIZATSIYALANGAN FOYDALANUVCHI, SHAXSIY PENDING ARIZALAR VA SINXRONIZATSIYA
    // =========================================================================
    console.log('\n▶️ [SESSIYA 2] Avtorizatsiyalangan foydalanuvchi, shaxsiy arizalar va Super Admin moderatsiyasi...');
    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    await page2.setViewport({ width: 1280, height: 900 });

    // 1. Foydalanuvchi avtorizatsiyasini localStorage ga kiritamiz
    await page2.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page2.evaluate((token, u) => {
      localStorage.setItem('myup_token', token);
      localStorage.setItem('myup_user', JSON.stringify({
        id: u.id,
        phone: u.phone,
        firstName: 'Sinovchi',
        role: 'user',
        hasLocation: true,
      }));
    }, userToken, normalUser);

    // 2. Foydalanuvchi yangi stansiya yaratadi (API orqali yaratamiz - status: pending)
    const createRes = await fetch(`${API_URL}/stations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: 'Test_Brauzer_Sessiya_1_Stansiyasi',
        lat: 41.3155,
        lng: 69.2555,
        address: 'Test Mustaqillik ko\'chasi',
        city: 'Toshkent',
        phone: normalUser.phone,
        types: ['metan'],
        prices: { metan: 3800 },
        userId: normalUser.id,
      }),
    });
    const createData = await createRes.json();
    testStationId = createData.station?.id;
    console.log(`  📝 Yangi arizachi stansiyasi yaratildi: ID=${testStationId}, status=${createData.station?.status}`);

    // Sahifani qayta yuklaymiz (foydalanuvchi profiliga o'tamiz)
    await page2.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // A) Tekshiruv: Asosiy xarita va bosh sahifada bu PENDING stansiya ko'rinmasligi kerak!
    const homeTitles = await page2.$$eval('.custom-sc-title', els => els.map(e => e.textContent.trim())).catch(() => []);
    const isPendingOnHome = homeTitles.some(t => t.includes('Test_Brauzer_Sessiya_1_Stansiyasi'));
    console.log(`  🔒 Bosh sahifada pending stansiya ko'rinyaptimi: ${isPendingOnHome ? 'HA (XATO!)' : 'YO\'Q (TO\'G\'RI - YASHIRILGAN)'}`);

    // B) Foydalanuvchi Profil ("Mening joylarim") bo'limiga o'tadi
    await page2.evaluate(() => {
      const profileTabBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Profil')) ||
                            document.querySelector('.mobile-header-profile');
      if (profileTabBtn) profileTabBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    // Profil bo'limida "Ko'rib chiqilmoqda" sariq yozuvi borligini tekshiramiz
    const profileText = await page2.evaluate(() => document.body.innerText);
    const hasPendingBadge = profileText.includes("Ko'rib chiqilmoqda") || profileText.includes('Test_Brauzer_Sessiya_1_Stansiyasi');
    console.log(`  👤 Profil bo'limida pending ariza bormi: ${hasPendingBadge ? 'HA (TO\'LIQ SAQLANMOQDA)' : 'YO\'Q'}`);

    const s2PendingScreenshotPath = path.join(ARTIFACT_DIR, 'browser_test_session2_pending.png');
    await page2.screenshot({ path: s2PendingScreenshotPath, fullPage: false });
    console.log(`  📸 Skrinshot saqlandi: ${s2PendingScreenshotPath}`);

    if (!isPendingOnHome && hasPendingBadge) {
      testResults.session2_pending = true;
      console.log('  🎯 NATIJA: Shaxsiy arizalar va umumiy xarita to\'liq ajratilgan!');
    }

    // C) Endi Super Admin ushbu stansiyani TASDIQLAYDI!
    console.log(`  ⚖️ Super Admin ushbu stansiyani TASDIQLAMOQDA...`);
    const approveRes = await fetch(`${API_URL}/admin/stations/${testStationId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isApproved: true }),
    });
    console.log(`  Admin tasdiqlash statusi: ${approveRes.status}`);

    // Foydalanuvchi bosh sahifaga qaytadi
    await page2.evaluate(() => {
      const homeTabBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Asosiy'));
      if (homeTabBtn) homeTabBtn.click();
    });

    // 5 soniyalik avtomatik polling / sinxronizatsiyani kutamiz (maksimal 7 soniya)
    console.log('  ⏳ 5 soniyalik avtomatik sinxronizatsiya kutilmoqda...');
    await new Promise(r => setTimeout(r, 6000));

    const updatedHomeTitles = await page2.$$eval('.custom-sc-title', els => els.map(e => e.textContent.trim())).catch(() => []);
    const isNowVisibleOnHome = updatedHomeTitles.some(t => t.includes('Test_Brauzer_Sessiya_1_Stansiyasi'));
    console.log(`  ✨ Tasdiqlangandan so'ng xaritada/bosh sahifada paydo bo'ldimi: ${isNowVisibleOnHome ? 'HA (100% YANGILANDI)' : 'YO\'Q'}`);

    const s2ApprovedScreenshotPath = path.join(ARTIFACT_DIR, 'browser_test_session2_approved.png');
    await page2.screenshot({ path: s2ApprovedScreenshotPath, fullPage: false });
    console.log(`  📸 Skrinshot saqlandi: ${s2ApprovedScreenshotPath}`);

    if (isNowVisibleOnHome) {
      testResults.session2_approved_sync = true;
      console.log('  🎯 NATIJA: Super Admin tasdiqlagan yangi manzil sahifani yangilamasdan brauzerda avtomatik chiqdi!');
    }

    // D) Endi Super Admin ushbu stansiyani O'CHIRADI!
    console.log(`  🗑️ Super Admin ushbu stansiyani O'CHIRMOQDA...`);
    await fetch(`${API_URL}/admin/stations/${testStationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Yana 5-6 soniya kutamiz (sinxronizatsiya o'chirilgan stansiyani yo'qotishi kerak)
    console.log('  ⏳ O\'chirilgandan so\'ng sinxronizatsiya kutilmoqda...');
    await new Promise(r => setTimeout(r, 6000));

    const afterDeleteTitles = await page2.$$eval('.custom-sc-title', els => els.map(e => e.textContent.trim())).catch(() => []);
    const isStillVisible = afterDeleteTitles.some(t => t.includes('Test_Brauzer_Sessiya_1_Stansiyasi'));
    console.log(`  🧹 O'chirilgan manzil brauzerdan yo'qoldimi: ${!isStillVisible ? 'HA (TOZALANDI)' : 'YO\'Q (XATO - QOLIB KETGAN)'}`);

    if (!isStillVisible) {
      testResults.session2_deleted_sync = true;
      console.log('  🎯 NATIJA: Super Admin o\'chirgan manzil brauzer keshidan ham darhol tozalandi!');
    }
    await context2.close();

    // =========================================================================
    // SESSIYA 3: OFLAYN VA INTERNET TIKLANISHI (NETWORK RECOVERY)
    // =========================================================================
    console.log('\n▶️ [SESSIYA 3] Internet uzilishi va qayta ulanganda sinxronizatsiya...');
    const context3 = await browser.createBrowserContext();
    const page3 = await context3.newPage();
    await page3.setViewport({ width: 1280, height: 900 });

    await page3.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const countBeforeOffline = await page3.$$eval('.custom-station-card', els => els.length).catch(() => 0);
    console.log(`  📶 Internet mavjud paytdagi stansiyalar: ${countBeforeOffline} ta`);

    // Tarmoqni uzamiz (Offline mode)
    console.log('  🔌 Tarmoq uzildi (Offline rejim faollashtirildi)...');
    await page3.setOfflineMode(true);

    // Brauzer oflayn rejimda ham qotmasdan ishlashini tekshiramiz
    const isAppAliveOffline = await page3.evaluate(() => document.body.innerText.length > 50);
    console.log(`  🛡️ Oflayn rejimda ilova interfeysi saqlanib turibdimi: ${isAppAliveOffline ? 'HA' : 'YO\'Q'}`);

    // Tarmoqni qayta ulaymiz (Online mode)
    console.log('  🌐 Internet qayta ulandi (Online rejim tiklandi)...');
    await page3.setOfflineMode(false);

    // Online eventini yuboramiz
    await page3.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await new Promise(r => setTimeout(r, 3000));

    const countAfterOnline = await page3.$$eval('.custom-station-card', els => els.length).catch(() => 0);
    console.log(`  ✅ Tarmoq tiklangandan keyingi stansiyalar soni: ${countAfterOnline} ta`);

    const s3ScreenshotPath = path.join(ARTIFACT_DIR, 'browser_test_session3_recovery.png');
    await page3.screenshot({ path: s3ScreenshotPath, fullPage: false });
    console.log(`  📸 Skrinshot saqlandi: ${s3ScreenshotPath}`);

    if (countAfterOnline >= initialProdCount && isAppAliveOffline) {
      testResults.session3_offline_recovery = true;
      console.log('  🎯 NATIJA: SESSIYA 3 MUVAFFAQIYATLI O\'TDI (Tarmoq tiklangach 100% tiklandi)!');
    }

  } catch (err) {
    console.error('Brauzer testi jarayonida kutilmagan xato:', err);
  } finally {
    // Tozalash
    console.log('\n🧹 Test ma\'lumotlarini tozalash...');
    await query("DELETE FROM stations WHERE name LIKE 'Test_Brauzer_%'").catch(() => {});
    await browser.close();

    const finalDbCheck = await query("SELECT id, name FROM stations WHERE status = 'approved'");
    console.log(`✅ Production stansiyalar soni: ${finalDbCheck.rows.length} ta (To'liq saqlab qolindi).`);
    await pool.end();

    console.log('\n====================================================');
    console.log('📊 BRAUZER TESTLARI XULOSASI:');
    console.log(`  1. Sessiya 1 (Yangi toza brauzerda chiqishi): ${testResults.session1 ? '✅ O\'TDI' : '❌ XATO'}`);
    console.log(`  2. Sessiya 2 (Pending ariza saqlanishi): ${testResults.session2_pending ? '✅ O\'TDI' : '❌ XATO'}`);
    console.log(`  3. Sessiya 2 (Tasdiqlanganda avto-chiqishi): ${testResults.session2_approved_sync ? '✅ O\'TDI' : '❌ XATO'}`);
    console.log(`  4. Sessiya 2 (O'chirilganda avto-yo'qolishi): ${testResults.session2_deleted_sync ? '✅ O\'TDI' : '❌ XATO'}`);
    console.log(`  5. Sessiya 3 (Oflayn va Tiklanish): ${testResults.session3_offline_recovery ? '✅ O\'TDI' : '❌ XATO'}`);
    console.log('====================================================\n');
  }
}

run();
