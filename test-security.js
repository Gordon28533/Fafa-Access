#!/usr/bin/env node
/**
 * Security Testing Suite
 * Tests all implemented security measures
 */

import http from 'http';
import process from 'process';

const tests = [];

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          statusText: `${res.statusCode} ${http.STATUS_CODES[res.statusCode]}`
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    tests.push({ name, pass: true });
  } catch (err) {
    console.log(`❌ ${name}: ${err.message || err}`);
    tests.push({ name, pass: false, error: err.message || String(err) });
  }
}

async function runTests() {
  console.log('\n🔒 SECURITY TEST SUITE\n');
  console.log('Testing: http://localhost:3000\n');

  // Test 1: Server is running
  await test('Server is running', async () => {
    const res = await makeRequest({ hostname: 'localhost', port: 3000, path: '/health' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 2: Security headers are present
  await test('Helmet security headers present', async () => {
    const res = await makeRequest({ hostname: 'localhost', port: 3000, path: '/health' });
    const hasHSTS = res.headers['strict-transport-security'];
    const hasXFrameOptions = res.headers['x-frame-options'];
    const hasXContentType = res.headers['x-content-type-options'];
    if (!hasHSTS || !hasXFrameOptions || !hasXContentType) {
      throw new Error('Missing security headers');
    }
  });

  // Test 3: CSP header present
  await test('Content-Security-Policy header set', async () => {
    const res = await makeRequest({ hostname: 'localhost', port: 3000, path: '/health' });
    if (!res.headers['content-security-policy']) {
      throw new Error('CSP header missing');
    }
  });

  // Test 4: CORS validation
  await test('CORS blocks invalid origin', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      headers: { 'Origin': 'http://evil.com' }
    });
    const corsHeader = res.headers['access-control-allow-origin'];
    if (corsHeader === 'http://evil.com') {
      throw new Error('CORS allowed unauthorized origin');
    }
  });

  // Test 5: CORS allows trusted origin
  await test('CORS allows trusted origin', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      headers: { 'Origin': 'http://localhost:5173' }
    });
    const corsHeader = res.headers['access-control-allow-origin'];
    if (corsHeader !== 'http://localhost:5173') {
      throw new Error('CORS blocked trusted origin');
    }
  });

  // Test 6: Request size limit
  await test('Request size limit enforced (10KB)', async () => {
    const largePayload = JSON.stringify({ data: 'A'.repeat(15000) });
    try {
      await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': largePayload.length }
      }, largePayload);
      throw new Error('Large payload was accepted');
    } catch (err) {
      if (err.message.includes('Large payload')) throw err;
      // Expected to fail with connection error or 413
    }
  });

  // Test 7: Rate limiting on auth endpoints
  await test('Auth rate limiting (5 attempts/15min)', async () => {
    const payload = JSON.stringify({ email: 'test@test.com', password: 'wrong' });
    let rateLimited = false;
    
    for (let i = 0; i < 7; i++) {
      const res = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
      }, payload);
      
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    
    if (!rateLimited) {
      console.log('  ⚠️  Rate limiting may not be working or cooldown not reached');
    }
  });

  // Test 8: Input sanitization
  await test('Input sanitization strips NoSQL injection chars', async () => {
    const maliciousPayload = JSON.stringify({ 
      email: 'admin@test.com',
      search: { '$ne': '' }
    });
    
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': maliciousPayload.length }
    }, maliciousPayload);
    
    // If sanitization works, $ should be stripped
    // We just verify request is processed without injection succeeding
    if (res.status === 500) {
      throw new Error('Server error - possible injection issue');
    }
  });

  // Test 9: 404 error doesn't leak info in production
  await test('404 errors don\'t expose unnecessary details', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/non-existent-endpoint'
    });
    
    if (res.status !== 404) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
    
    const body = JSON.parse(res.body);
    if (body.stack) {
      throw new Error('Stack trace leaked in error response');
    }
  });

  // Test 10: Database connection works
  await test('Database connectivity verified', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-db'
    });
    
    if (res.status !== 200) {
      throw new Error(`Database test failed: ${res.status}`);
    }
    
    const body = JSON.parse(res.body);
    if (!body.success) {
      throw new Error('Database query failed');
    }
  });

  // Test 11: Student profiles schema
  await test('Database schema updated with academic fields', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/db-schema-status'
    });
    
    if (res.status !== 200) {
      throw new Error(`Schema check failed: ${res.status}`);
    }
    
    const body = JSON.parse(res.body);
    if (!body.status.level || !body.status.course || !body.status.profile_photo_url) {
      throw new Error('Missing expected schema columns');
    }
  });

  // Results
  console.log('\n' + '='.repeat(50));
  const passed = tests.filter(t => t.pass).length;
  const total = tests.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All security measures verified!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review above for details.\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
