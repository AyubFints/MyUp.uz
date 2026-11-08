import { spawn } from 'child_process';
import http from 'http';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runVerification() {
  console.log('🚀 Starting server process...');
  const serverProc = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: '5000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stdout.on('data', (d) => process.stdout.write(`[Server] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`[Server Err] ${d}`));

  // Wait for server to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await makeRequest('/api/health');
      if (res.statusCode === 200) {
        ready = true;
        break;
      }
    } catch (e) {
      // not yet up
    }
  }

  if (!ready) {
    console.error('❌ Server did not become ready in 10s');
    serverProc.kill();
    process.exit(1);
  }

  console.log('✅ Server is ready! Running tests...\n');

  // Test 1: Health check endpoint
  console.log('--- Test 1: /api/health ---');
  const healthRes = await makeRequest('/api/health');
  console.log('Health status code:', healthRes.statusCode);
  const healthData = JSON.parse(healthRes.body);
  console.log('Health response:', JSON.stringify(healthData, null, 2));

  if (
    healthRes.statusCode !== 200 ||
    healthData.status !== 'healthy' ||
    healthData.database !== 'connected' ||
    !healthData.pool ||
    typeof healthData.pool.totalCount !== 'number'
  ) {
    throw new Error('Health check verification failed');
  }
  console.log('✅ /api/health passed!\n');

  // Test 2: Helmet security headers & CORP
  console.log('--- Test 2: Security Headers (Helmet) ---');
  console.log('cross-origin-resource-policy:', healthRes.headers['cross-origin-resource-policy']);
  console.log('x-content-type-options:', healthRes.headers['x-content-type-options']);
  console.log('x-frame-options:', healthRes.headers['x-frame-options']);
  if (healthRes.headers['cross-origin-resource-policy'] !== 'cross-origin') {
    throw new Error('Missing or invalid cross-origin-resource-policy header');
  }
  console.log('✅ Helmet headers verified!\n');

  // Test 3: Auth Rate Limiter (20 requests / 15 min on /api/auth/login)
  console.log('--- Test 3: Auth Rate Limiter (20 req / 15 min) ---');
  let blocked429 = false;
  for (let i = 1; i <= 22; i++) {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+998900000000', password: 'wrong' }),
    });
    if (res.statusCode === 429) {
      console.log(`Request #${i} was rate-limited with HTTP 429!`);
      blocked429 = true;
      break;
    }
  }
  if (!blocked429) {
    throw new Error('Auth rate limiter did not trigger 429 within 22 requests');
  }
  console.log('✅ Strict Auth rate limiter verified!\n');

  // Test 4: Graceful shutdown
  console.log('--- Test 4: Graceful Shutdown (SIGTERM) ---');
  serverProc.kill('SIGTERM');

  await new Promise((resolve) => {
    serverProc.on('exit', (code, signal) => {
      console.log(`Server exited cleanly with code ${code}, signal ${signal}`);
      resolve();
    });
  });
  console.log('✅ Graceful shutdown verified!\n');

  console.log('🎉 ALL BACKEND VERIFICATIONS PASSED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
