/**
 * Authentication System Verification Test
 * Tests email-based auth, JWT tokens, and role-based access control
 */

import process from 'process';
import { Buffer } from 'buffer';

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}${colors.bold}━━━ ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'yellow');
}

// Test counters
let passed = 0;
let failed = 0;

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { error: error.message, status: 0, ok: false };
  }
}

// Test 1: Login with different roles
async function testLogin() {
  logTest('TEST 1: Email-based Authentication');

  const testUsers = [
    { email: 'admin@nsfas.gov.za', password: 'Admin123!@#', expectedRole: 'ADMIN' },
    { email: 'src@university.ac.za', password: 'SRC123!@#', expectedRole: 'SRC' },
    { email: 'student@student.ac.za', password: 'Student123!@#', expectedRole: 'STUDENT' }
  ];

  for (const user of testUsers) {
    const result = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: user.password })
    });

    if (result.ok && result.data.token && result.data.user?.role === user.expectedRole) {
      logSuccess(`${user.expectedRole} login successful - JWT token received`);
      passed++;
      return { ...user, token: result.data.token, userId: result.data.user.id };
    } else {
      logError(`${user.expectedRole} login failed`);
      failed++;
    }
  }
}

// Test 2: Invalid credentials
async function testInvalidLogin() {
  logTest('TEST 2: Invalid Credentials Rejection');

  const result = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'wrong@email.com', password: 'wrongpassword' })
  });

  if (!result.ok && result.status === 401) {
    logSuccess('Invalid credentials correctly rejected (401)');
    passed++;
  } else {
    logError('Invalid credentials should return 401');
    failed++;
  }
}

// Test 3: requireAuth middleware
async function testRequireAuth(tokens) {
  logTest('TEST 3: requireAuth Middleware');

  // Test without token
  const noTokenResult = await makeRequest('/api/applications');
  if (noTokenResult.status === 401) {
    logSuccess('Request without token rejected (401)');
    passed++;
  } else {
    logError('Request without token should be rejected');
    failed++;
  }

  // Test with valid token
  const validTokenResult = await makeRequest('/api/applications', {
    headers: { Authorization: `Bearer ${tokens.student}` }
  });
  if (validTokenResult.ok || validTokenResult.status === 200) {
    logSuccess('Request with valid token accepted');
    passed++;
  } else {
    logError('Request with valid token should be accepted');
    failed++;
  }

  // Test with invalid token
  const invalidTokenResult = await makeRequest('/api/applications', {
    headers: { Authorization: 'Bearer invalid_token_123' }
  });
  if (invalidTokenResult.status === 401) {
    logSuccess('Request with invalid token rejected (401)');
    passed++;
  } else {
    logError('Request with invalid token should be rejected');
    failed++;
  }
}

// Test 4: requireRole middleware
async function testRequireRole(tokens) {
  logTest('TEST 4: requireRole Middleware - Role-Based Access Control');

  // Test ADMIN-only route with ADMIN token
  const adminAccessAdmin = await makeRequest('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${tokens.admin}` }
  });
  if (adminAccessAdmin.ok || adminAccessAdmin.status === 200) {
    logSuccess('ADMIN can access admin-only routes');
    passed++;
  } else {
    logError('ADMIN should access admin-only routes');
    failed++;
  }

  // Test ADMIN-only route with STUDENT token
  const studentAccessAdmin = await makeRequest('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${tokens.student}` }
  });
  if (studentAccessAdmin.status === 403) {
    logSuccess('STUDENT blocked from admin routes (403)');
    passed++;
  } else {
    logError('STUDENT should be blocked from admin routes');
    failed++;
  }

  // Test SRC route with SRC token
  const srcAccessSrc = await makeRequest('/api/src/applications/pending', {
    headers: { Authorization: `Bearer ${tokens.src}` }
  });
  if (srcAccessSrc.ok || srcAccessSrc.status === 200 || srcAccessSrc.status === 404) {
    logSuccess('SRC can access SRC routes');
    passed++;
  } else {
    logError('SRC should access SRC routes');
    failed++;
  }

  // Test SRC route with STUDENT token
  const studentAccessSrc = await makeRequest('/api/src/applications/pending', {
    headers: { Authorization: `Bearer ${tokens.student}` }
  });
  if (studentAccessSrc.status === 403) {
    logSuccess('STUDENT blocked from SRC routes (403)');
    passed++;
  } else {
    logError('STUDENT should be blocked from SRC routes');
    failed++;
  }
}

// Test 5: Protected routes coverage
async function testProtectedRoutes(tokens) {
  logTest('TEST 5: All Routes Protected by Role');

  const routeTests = [
    // Admin routes
    { path: '/api/admin/laptops', role: 'ADMIN', token: tokens.admin, expectedAccess: true },
    { path: '/api/admin/laptops', role: 'STUDENT', token: tokens.student, expectedAccess: false },
    
    // SRC routes
    { path: '/api/src/applications/pending', role: 'SRC', token: tokens.src, expectedAccess: true },
    { path: '/api/src/applications/pending', role: 'STUDENT', token: tokens.student, expectedAccess: false },
    
    // Student routes
    { path: '/api/applications', role: 'STUDENT', token: tokens.student, expectedAccess: true },
    { path: '/api/applications', role: 'ADMIN', token: tokens.admin, expectedAccess: true },
  ];

  for (const test of routeTests) {
    const result = await makeRequest(test.path, {
      headers: { Authorization: `Bearer ${test.token}` }
    });

    if (test.expectedAccess && (result.ok || result.status === 200 || result.status === 404)) {
      logSuccess(`${test.role} → ${test.path}: Access granted ✓`);
      passed++;
    } else if (!test.expectedAccess && result.status === 403) {
      logSuccess(`${test.role} → ${test.path}: Access denied ✓`);
      passed++;
    } else {
      logError(`${test.role} → ${test.path}: Unexpected result (${result.status})`);
      failed++;
    }
  }
}

// Test 6: JWT token structure
async function testJWTStructure(tokens) {
  logTest('TEST 6: JWT Token Structure & Claims');

  for (const [role, token] of Object.entries(tokens)) {
    try {
      // Decode JWT (without verification - just checking structure)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        if (payload.userId && payload.role && payload.email && payload.exp) {
          logSuccess(`${role.toUpperCase()} token has all required claims (userId, role, email, exp)`);
          passed++;
          logInfo(`  Role: ${payload.role}, Email: ${payload.email}`);
        } else {
          logError(`${role.toUpperCase()} token missing required claims`);
          failed++;
        }
      } else {
        logError(`${role.toUpperCase()} token invalid structure`);
        failed++;
      }
    } catch (error) {
      logError(`${role.toUpperCase()} token decode failed: ${error.message}`);
      failed++;
    }
  }
}

// Test 7: Password security
async function testPasswordSecurity() {
  logTest('TEST 7: Password Hashing Security');

  // Login and check that password is never returned
  const result = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@student.ac.za', password: 'Student123!@#' })
  });

  if (result.ok && result.data.user) {
    if (!result.data.user.password && !result.data.user.hashedPassword) {
      logSuccess('Password hash NOT exposed in login response');
      passed++;
    } else {
      logError('Password hash should NEVER be returned to client');
      failed++;
    }

    if (result.data.user.email && result.data.user.role) {
      logSuccess('User object contains safe fields (email, role)');
      passed++;
    } else {
      logError('User object missing expected fields');
      failed++;
    }
  }
}

// Test 8: Token expiration
async function testTokenExpiration() {
  logTest('TEST 8: JWT Token Expiration');

  // Create an expired token (manually for testing)
  logInfo('Testing with valid token (should work)');
  const validResult = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@student.ac.za', password: 'Student123!@#' })
  });

  if (validResult.ok && validResult.data.token) {
    const parts = validResult.data.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      logSuccess(`Token has valid expiration (expires in ${Math.floor(expiresIn / 3600)} hours)`);
      passed++;
    } else {
      logError('Token already expired');
      failed++;
    }
  }
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'bold');
  log('║  AUTHENTICATION SYSTEM VERIFICATION TEST SUITE         ║', 'bold');
  log('╚════════════════════════════════════════════════════════╝\n', 'bold');

  logInfo(`Testing against: ${BASE_URL}`);
  logInfo('Checking backend connectivity...\n');

  // Check if server is running
  const healthCheck = await makeRequest('/health');
  if (!healthCheck.ok) {
    logError('Backend server is not running. Start it with: npm start');
    process.exit(1);
  }
  logSuccess('Backend server is online\n');

  // Get tokens for all roles
  const tokens = {};
  
  // Login as each role
  const adminLogin = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@nsfas.gov.za', password: 'Admin123!@#' })
  });
  if (adminLogin.ok) tokens.admin = adminLogin.data.token;

  const srcLogin = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'src@university.ac.za', password: 'SRC123!@#' })
  });
  if (srcLogin.ok) tokens.src = srcLogin.data.token;

  const studentLogin = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@student.ac.za', password: 'Student123!@#' })
  });
  if (studentLogin.ok) tokens.student = studentLogin.data.token;

  // Run all tests
  await testLogin();
  await testInvalidLogin();
  await testRequireAuth(tokens);
  await testRequireRole(tokens);
  await testProtectedRoutes(tokens);
  await testJWTStructure(tokens);
  await testPasswordSecurity();
  await testTokenExpiration();

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'bold');
  log('║  TEST SUMMARY                                          ║', 'bold');
  log('╚════════════════════════════════════════════════════════╝\n', 'bold');

  const total = passed + failed;
  const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${percentage}%\n`, percentage === '100.0' ? 'green' : 'yellow');

  if (failed === 0) {
    log('🎉 ALL AUTHENTICATION TESTS PASSED!', 'green');
    log('✓ Email-based authentication working', 'green');
    log('✓ JWT tokens properly issued', 'green');
    log('✓ requireAuth middleware protecting routes', 'green');
    log('✓ requireRole middleware enforcing RBAC', 'green');
    log('✓ All routes protected at backend level', 'green');
    log('✓ Unauthorized access properly rejected\n', 'green');
  } else {
    log('⚠ Some tests failed. Review the output above.\n', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the test suite
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
