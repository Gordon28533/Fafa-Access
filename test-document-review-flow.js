#!/usr/bin/env node
/**
 * Test Document Review Flow
 * Tests: Login -> Document Review API call -> Verify response
 */

import http from 'http';
import process from 'process';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@laptopapp.com';
const ADMIN_PASSWORD = 'admin123';
const APP_ID = 'APP-2024-0012'; // Known test application

let accessToken = null;
let cookies = [];

async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (cookies.length > 0) {
      options.headers['Cookie'] = cookies.join('; ');
    }

    if (accessToken) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // Extract Set-Cookie headers
        const setCookies = res.headers['set-cookie'];
        if (setCookies) {
          cookies = setCookies.map((cookie) => cookie.split(';')[0]);
        }

        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========== DOCUMENT REVIEW FLOW TEST ==========\n');

  // Step 1: Health check
  console.log('1️⃣  Testing backend health...');
  try {
    const health = await makeRequest('GET', '/health');
    if (health.status === 200 && health.body?.status === 'healthy') {
      console.log('✅ Backend is running and healthy\n');
    } else {
      console.error('❌ Backend health check failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Cannot reach backend:', err.message);
    process.exit(1);
  }

  // Step 2: Login as admin
  console.log('2️⃣  Logging in as admin...');
  try {
    const login = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (login.status !== 200) {
      console.error(
        `❌ Login failed (${login.status}):`,
        login.body?.error || login.body?.message
      );
      process.exit(1);
    }

    accessToken = login.body?.accessToken;
    if (!accessToken) {
      console.error('❌ No access token in login response');
      process.exit(1);
    }

    const user = login.body?.user;
    console.log(
      `✅ Logged in as ${user?.email} (Role: ${user?.role})\n`
    );
  } catch (err) {
    console.error('❌ Login request failed:', err.message);
    process.exit(1);
  }

  // Step 3: Call document review endpoint
  console.log(`3️⃣  Fetching documents for application ${APP_ID}...`);
  try {
    const docs = await makeRequest(
      'GET',
      `/api/documents/review/${APP_ID}`
    );

    if (docs.status === 404) {
      console.error(
        `⚠️  Application not found (404). Check if ${APP_ID} exists in database`
      );
    } else if (docs.status === 401) {
      console.error(
        '❌ Unauthorized (401). Token might be invalid or expired'
      );
      console.error('Response:', docs.body?.message || docs.rawBody);
    } else if (docs.status !== 200) {
      console.error(
        `❌ Document fetch failed (${docs.status}):`,
        docs.body?.message || docs.body?.error || docs.rawBody
      );
    } else {
      const documents = docs.body?.data?.documents || [];
      console.log(`✅ Successfully fetched ${documents.length} documents\n`);
      console.log('Documents:', JSON.stringify(documents, null, 2));
    }
  } catch (err) {
    console.error('❌ Document fetch request failed:', err.message);
    process.exit(1);
  }

  console.log('\n✅ Document review flow test completed!');
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
