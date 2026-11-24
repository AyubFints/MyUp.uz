// ==============================================================================
// MYUP STRESS VA KONKURENSIYA TESTI (100 PARALLEL FOYDALANUVCHI, DUBLIKATLAR)
// ==============================================================================

import http from 'http';

const API_HOST = process.env.TEST_API_HOST || '127.0.0.1';
const API_PORT = parseInt(process.env.TEST_API_PORT || '5000', 10);

console.log('================================================================');
console.log(`⚡ STRESS VA KONKURENSIYA TESTI: http://${API_HOST}:${API_PORT}/api`);
console.log('================================================================\n');

function makeRequest(path, options = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            duration: Date.now() - startTime,
            body,
            success: res.statusCode >= 200 && res.statusCode < 400,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        duration: Date.now() - startTime,
        error: err.message,
        success: false,
      });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  // TEST 1: Health check
  console.log('--- TEST 1: Health Check & Bog\'lanish ---');
  const health = await makeRequest('/api/health');
  console.log(`  Status: ${health.statusCode}, Vaqt: ${health.duration}ms`);
  if (!health.success) {
    console.error('❌ Server bilan aloqa yo\'q! Server ishga tushirilganini tekshiring.');
    process.exit(1);
  }
  console.log('  ✅ Server sog\'lom va faol.\n');

  // TEST 2: 100 ta Parallel Foydalanuvchi So'rovi (GET /api/stations)
  console.log('--- TEST 2: 100 ta Parallel Foydalanuvchi So\'rovi (/api/stations) ---');
  const CONCURRENT_USERS = 100;
  const startConcur = Date.now();
  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(makeRequest('/api/stations'));
  }
  const results = await Promise.all(promises);
  const totalConcurTime = Date.now() - startConcur;
  const successes = results.filter((r) => r.success).length;
  const failures = results.length - successes;
  const avgTime = Math.round(results.reduce((acc, r) => acc + r.duration, 0) / results.length);
  const maxTime = Math.max(...results.map((r) => r.duration));

  console.log(`  Jami so'rovlar: ${CONCURRENT_USERS}`);
  console.log(`  Muvaffaqiyatli: ${successes} (${Math.round((successes / CONCURRENT_USERS) * 100)}%)`);
  console.log(`  Xatolar:        ${failures}`);
  console.log(`  O'rtacha vaqt:  ${avgTime}ms`);
  console.log(`  Maksimal vaqt:  ${maxTime}ms`);
  console.log(`  Umumiy vaqt:    ${totalConcurTime}ms`);
  if (successes >= 95) {
    console.log('  ✅ 100 ta parallel so\'rov muvaffaqiyatli yakunlandi!\n');
  } else {
    console.error('  ❌ 100 ta parallel so\'rovda ortiqcha xatolik kuzatildi!\n');
  }

  // TEST 3: Bir vaqtning o'zida dublikat yuborish (Concurrency Protection)
  console.log('--- TEST 3: Bir Vaqtning O\'zida Dublikat Ariza Yuborish ---');
  const duplicateStation = {
    name: 'Dublikat_Test_Stansiyasi',
    brand: 'TestBrand',
    latitude: 41.311081,
    longitude: 69.240562,
    address: 'Toshkent shahri',
    fuels: [{ type: 'ai-92', price: 9500, inStock: true }],
  };

  const dupPromises = [
    makeRequest('/api/stations', { method: 'POST', body: duplicateStation }),
    makeRequest('/api/stations', { method: 'POST', body: duplicateStation }),
  ];
  const dupResults = await Promise.all(dupPromises);
  console.log(`  1-so'rov javobi: Status ${dupResults[0].statusCode}`);
  console.log(`  2-so'rov javobi: Status ${dupResults[1].statusCode}`);
  console.log('  ✅ Concurrency va dublikat so\'rovlar tahlil qilindi.\n');

  console.log('================================================================');
  console.log('🎉 TEST YAKUNLANDI.');
  console.log('================================================================');
}

runTests().catch(console.error);
