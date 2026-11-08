import { spawn } from 'child_process';
import http from 'http';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverCwd = path.resolve(__dirname, '..');

const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        let bodyText = '';
        if (res.headers['content-encoding'] === 'gzip') {
          try {
            bodyText = zlib.gunzipSync(rawBuffer).toString('utf8');
          } catch (e) {
            bodyText = rawBuffer.toString('utf8');
          }
        } else {
          bodyText = rawBuffer.toString('utf8');
        }

        let parsedJson = null;
        try {
          parsedJson = JSON.parse(bodyText);
        } catch (e) {
          // not json
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBuffer,
          bodyText,
          json: parsedJson,
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('⚔️  STARTING EMPIRICAL ADVERSARIAL STRESS TEST SUITE (PORT 5055)');
  console.log('================================================================');

  let testFailures = 0;
  function reportAssert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      if (details) console.error(`     Details: ${details}`);
      testFailures++;
    }
  }

  // 1. Spawn server process
  console.log(`\n[1/6] Spawning isolated server process on port ${PORT} in ${serverCwd}...`);
  const serverProc = spawn('node', ['src/server.js'], {
    cwd: serverCwd,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://myup.uz,https://www.myup.uz,https://admin.myup.uz',
      DB_HOST: '127.0.0.1',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_PASSWORD: 'ayub1953',
      DB_NAME: 'amaps_db',
      RATE_LIMIT_MAX: '300',
      AUTH_RATE_LIMIT_MAX: '20',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stdout.on('data', (d) => process.stdout.write(`[Proc Out] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`[Proc Err] ${d}`));

  // Wait for server ready
  let isReady = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await httpRequest({ path: '/api/health' });
      if (res.statusCode === 200) {
        isReady = true;
        break;
      }
    } catch (e) {
      // connecting...
    }
  }

  if (!isReady) {
    console.error('❌ FATAL: Server failed to start on port 5055 within 12 seconds');
    serverProc.kill('SIGKILL');
    process.exit(1);
  }
  console.log('  Server is up and listening on port 5055.');

  // 2. Query /api/health and assert all diagnostic fields
  console.log('\n[2/6] Testing /api/health diagnostics and Helmet security headers...');
  const healthRes = await httpRequest({ path: '/api/health' });
  const hData = healthRes.json;

  reportAssert(healthRes.statusCode === 200, 'Health check returns HTTP 200');
  reportAssert(hData && hData.success === true, 'Health check success flag is true');
  reportAssert(hData && hData.status === 'healthy', 'Health check status is "healthy"');
  reportAssert(hData && hData.database === 'connected', 'Database status is "connected"');
  reportAssert(hData && typeof hData.uptime === 'number' && hData.uptime >= 0, `Uptime is numeric (${hData?.uptime}s)`);
  reportAssert(
    hData &&
      hData.memoryUsage &&
      typeof hData.memoryUsage.rss === 'string' &&
      typeof hData.memoryUsage.heapTotal === 'string' &&
      typeof hData.memoryUsage.heapUsed === 'string' &&
      typeof hData.memoryUsage.external === 'string',
    `Memory usage metrics reported (RSS: ${hData?.memoryUsage?.rss}, HeapUsed: ${hData?.memoryUsage?.heapUsed})`
  );
  reportAssert(
    hData &&
      hData.pool &&
      typeof hData.pool.totalCount === 'number' &&
      typeof hData.pool.idleCount === 'number' &&
      typeof hData.pool.waitingCount === 'number',
    `PostgreSQL pool metrics reported (total: ${hData?.pool?.totalCount}, idle: ${hData?.pool?.idleCount}, waiting: ${hData?.pool?.waitingCount})`
  );

  // Helmet header checks
  reportAssert(
    healthRes.headers['cross-origin-resource-policy'] === 'cross-origin',
    'Helmet Cross-Origin-Resource-Policy header is "cross-origin"'
  );
  reportAssert(
    healthRes.headers['x-content-type-options'] === 'nosniff',
    'Helmet X-Content-Type-Options header is "nosniff"'
  );

  // 3. Test Response Compression
  console.log('\n[3/6] Testing Response Compression (gzip)...');
  const gzipRes = await httpRequest({
    path: '/api/stations',
    headers: { 'Accept-Encoding': 'gzip' },
  });
  reportAssert(gzipRes.statusCode === 200, 'Endpoint /api/stations returns HTTP 200');
  reportAssert(gzipRes.headers['content-encoding'] === 'gzip', `Content-Encoding is gzip (got: ${gzipRes.headers['content-encoding']})`);
  reportAssert(
    gzipRes.rawBuffer.length > 0 && gzipRes.bodyText.length > gzipRes.rawBuffer.length,
    `Compression effective: uncompressed payload (${gzipRes.bodyText.length} bytes) compressed to (${gzipRes.rawBuffer.length} bytes, ${(gzipRes.rawBuffer.length / gzipRes.bodyText.length * 100).toFixed(1)}% of original size)`
  );

  // 4. Attack with disallowed Origin header (CORS Adversarial Test)
  console.log('\n[4/6] Adversarial CORS Origin Rejection Testing...');
  const maliciousOrigin = 'https://malicious-attacker.com';
  const corsBlockedRes = await httpRequest({
    path: '/api/stations',
    headers: { Origin: maliciousOrigin },
  });
  reportAssert(
    corsBlockedRes.statusCode === 403,
    `Disallowed origin "${maliciousOrigin}" is rejected with HTTP 403 (got: ${corsBlockedRes.statusCode})`,
    JSON.stringify(corsBlockedRes.json || corsBlockedRes.bodyText)
  );

  // Verify allowed origin succeeds
  const allowedOrigin = 'https://myup.uz';
  const corsAllowedRes = await httpRequest({
    path: '/api/stations',
    headers: { Origin: allowedOrigin },
  });
  reportAssert(
    corsAllowedRes.statusCode === 200 && corsAllowedRes.headers['access-control-allow-origin'] === allowedOrigin,
    `Whitelisted origin "${allowedOrigin}" is allowed with HTTP 200 and Access-Control-Allow-Origin: ${allowedOrigin}`
  );

  // Verify browser-less / origin-less request succeeds
  const noOriginRes = await httpRequest({ path: '/api/stations' });
  reportAssert(noOriginRes.statusCode === 200, 'Origin-less request (curl / mobile app) succeeds with HTTP 200');

  // 5. Attack /api/auth/login with 30 rapid sequential requests (Rate Limiting Stress Test)
  console.log('\n[5/6] Adversarial Rate Limiting Attack: 30 rapid requests to /api/auth/login...');
  const responses = [];
  const postBody = JSON.stringify({ phone: '+998901234567', password: 'wrongpassword' });

  for (let reqNum = 1; reqNum <= 30; reqNum++) {
    const res = await httpRequest(
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody),
        },
      },
      postBody
    );
    responses.push({ reqNum, status: res.statusCode, body: res.json || res.bodyText });
  }

  const reqs1To20 = responses.slice(0, 20);
  const reqs21To30 = responses.slice(20, 30);

  const reqs1To20Valid = reqs1To20.every((r) => r.status === 400 || r.status === 401 || r.status === 404);
  const reqs21To30RateLimited = reqs21To30.every((r) => r.status === 429);

  console.log(`  Requests 1-20 status codes: [${reqs1To20.map((r) => r.status).join(', ')}]`);
  console.log(`  Requests 21-30 status codes: [${reqs21To30.map((r) => r.status).join(', ')}]`);

  reportAssert(
    reqs1To20Valid,
    `Requests 1-20 processed by auth endpoint (returned status ${reqs1To20[0].status}: validation/auth failure without 429)`
  );
  reportAssert(
    reqs21To30RateLimited,
    `Requests 21-30 strictly blocked with HTTP 429 Too Many Requests (all 10 subsequent requests returned 429)`
  );
  reportAssert(
    responses[20].body && responses[20].body.message && responses[20].body.message.includes('limit'),
    `HTTP 429 response body contains informative rate limit message: "${responses[20].body?.message}"`
  );

  // Terminate test server process
  console.log('\n[6/6] Testing Graceful Shutdown via SIGTERM...');
  serverProc.kill();

  // Test native Node.js SIGTERM graceful shutdown logic cleanly
  console.log('  Testing server SIGTERM handler & clean exit code 0...');
  const shutdownPromise = new Promise((resolve) => {
    let output = '';
    const child = spawn(
      'node',
      [
        '--input-type=module',
        '-e',
        `import './src/server.js';
        setTimeout(() => {
          process.emit('SIGTERM');
        }, 1200);`,
      ],
      {
        cwd: serverCwd,
        env: {
          ...process.env,
          PORT: '5056',
          NODE_ENV: 'production',
          CORS_ORIGIN: 'https://myup.uz,https://www.myup.uz,https://admin.myup.uz',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_USER: 'postgres',
          DB_PASSWORD: 'ayub1953',
          DB_NAME: 'amaps_db',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    child.stdout.on('data', (d) => (output += d.toString()));
    child.stderr.on('data', (d) => (output += d.toString()));

    const timer = setTimeout(() => {
      child.kill();
      resolve({ clean: false, code: 'TIMEOUT', output });
    }, 8000);

    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ clean: true, code, signal, output });
    });
  });

  const shutdownResult = await shutdownPromise;

  reportAssert(
    shutdownResult.clean && shutdownResult.code === 0,
    `Server exited cleanly with exit code 0 on SIGTERM (code: ${shutdownResult.code})`,
    shutdownResult.output
  );
  reportAssert(
    shutdownResult.output.includes('SIGTERM signali qabul qilindi'),
    'Server caught SIGTERM signal and logged receipt'
  );
  reportAssert(
    shutdownResult.output.includes('HTTP server ulanishlari toza yopildi'),
    'HTTP server connections closed cleanly'
  );
  reportAssert(
    shutdownResult.output.includes('PostgreSQL ulanishlar puli (pool) yopildi'),
    'PostgreSQL pool closed cleanly'
  );

  console.log('\n================================================================');
  console.log(`Adversarial Suite Completed: ${testFailures === 0 ? 'ALL ASSERTIONS PASSED ✅' : `${testFailures} FAILURES ❌`}`);
  console.log('================================================================');

  if (testFailures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialSuite().catch((err) => {
  console.error('Unhandled test harness error:', err);
  process.exit(1);
});
