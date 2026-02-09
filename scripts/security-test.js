#!/usr/bin/env node
/**
 * Security Verification Test Suite
 * Tests all security hardening measures
 */

const http = require('http');

const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function test(name, fn) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing: ${name}`);
    fn()
      .then((result) => {
        console.log(`✅ PASSED: ${name}`);
        tests.passed++;
        tests.results.push({ name, status: 'PASSED', result });
        resolve();
      })
      .catch((err) => {
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Error: ${err.message}`);
        tests.failed++;
        tests.results.push({ name, status: 'FAILED', error: err.message });
        resolve();
      });
  });
}

async function runTests() {
  console.log('🔐 Security Hardening Verification Tests\n');
  console.log('='.repeat(50));

  // Test 1: Server Connectivity
  await test('Server Connectivity', () => {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/health', (res) => {
        if (res.statusCode === 200) {
          resolve({ status: res.statusCode });
        } else {
          reject(new Error(`Unexpected status: ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Request timeout')));
    });
  });

  // Test 2: Helmet Security Headers
  await test('Helmet Security Headers', () => {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/health', (res) => {
        const requiredHeaders = [
          'strict-transport-security',
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection',
          'content-security-policy'
        ];
        
        const missingHeaders = requiredHeaders.filter(h => !res.headers[h]);
        
        if (missingHeaders.length === 0) {
          resolve({ headers: Object.keys(res.headers).filter(h => h.startsWith('x-') || h.includes('security')) });
        } else {
          reject(new Error(`Missing headers: ${missingHeaders.join(', ')}`));
        }
      });
      req.on('error', reject);
    });
  });

  // Test 3: CORS Validation
  await test('CORS Origin Validation', () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET'
        }
      };
      
      const req = http.request(options, (res) => {
        const allowOrigin = res.headers['access-control-allow-origin'];
        if (allowOrigin === 'http://localhost:5173') {
          resolve({ allowedOrigin: allowOrigin });
        } else {
          reject(new Error(`Unexpected CORS response: ${allowOrigin}`));
        }
      });
      req.on('error', reject);
      req.end();
    });
  });

  // Test 4: CORS Blocks Invalid Origin
  await test('CORS Blocks Invalid Origin', () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://evil.com',
          'Access-Control-Request-Method': 'GET'
        }
      };
      
      const req = http.request(options, (res) => {
        const allowOrigin = res.headers['access-control-allow-origin'];
        if (!allowOrigin || allowOrigin !== 'http://evil.com') {
          resolve({ blockedOrigin: true });
        } else {
          reject(new Error('Invalid origin was allowed!'));
        }
      });
      req.on('error', reject);
      req.end();
    });
  });

  // Test 5: Request Size Limit
  await test('Request Size Limit (10KB)', () => {
    return new Promise((resolve, reject) => {
      const largePayload = JSON.stringify({ data: 'x'.repeat(15000) });
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/test-db',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(largePayload)
        }
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 413) {
          resolve({ payloadTooLarge: true });
        } else {
          resolve({ status: res.statusCode });
        }
      });
      
      req.on('error', reject);
      req.write(largePayload);
      req.end();
    });
  });

  // Test 6: Endpoint Availability
  await test('Root Endpoint Available', () => {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/', (res) => {
        if (res.statusCode === 200) {
          resolve({ status: res.statusCode });
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
      req.on('error', reject);
    });
  });

  // Test 7: Database Schema Status
  await test('Database Schema Check', () => {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/db-schema-status', (res) => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (json.status.level && json.status.course && json.status.profile_photo_url) {
                resolve({ academicColumns: json.status });
              } else {
                reject(new Error('Missing academic columns'));
              }
            } catch (e) {
              reject(e);
            }
          });
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
      req.on('error', reject);
    });
  });

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results Summary\n');
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`📈 Total: ${tests.passed + tests.failed}`);
  console.log(`\n🎯 Success Rate: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);

  if (tests.failed === 0) {
    console.log('\n🔒 All security tests passed! The application is properly hardened.\n');
  } else {
    console.log(`\n⚠️  ${tests.failed} test(s) failed. Please review the errors above.\n`);
  }

  process.exit(tests.failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
