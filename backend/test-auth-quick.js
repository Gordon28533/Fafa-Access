/**
 * Quick auth verification script.
 * - Logs in as ADMIN and STUDENT
 * - Checks JWT issuance + role
 * - Verifies 401 without token
 * - Verifies 403 for role-protected route
 */

import process from 'process';

const BASE_URL = process.env.AUTH_BASE_URL || 'http://localhost:3000';

const credentials = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@nsfas.gov.za',
    password: process.env.ADMIN_PASSWORD || 'Admin123!@#'
  },
  student: {
    email: process.env.STUDENT_EMAIL || 'student@student.ac.za',
    password: process.env.STUDENT_PASSWORD || 'Student123!@#'
  }
};

function log(msg) {
  console.log(msg);
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function loginUser(label, email, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (!result.ok) {
    throw new Error(`${label} login failed (${result.status}): ${result.data.error || 'unknown error'}`);
  }

  if (!result.data.accessToken || !result.data.user?.role) {
    throw new Error(`${label} login missing token or role`);
  }

  return {
    token: result.data.accessToken,
    role: result.data.user.role,
    userId: result.data.user.id
  };
}

async function run() {
  log('Quick auth verification starting...');
  log(`Base URL: ${BASE_URL}`);

  // 1) Unauthenticated access should be rejected
  const unauthProfile = await request('/api/auth/profile');
  if (unauthProfile.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated profile, got ${unauthProfile.status}`);
  }
  log('OK: unauthenticated profile access rejected (401)');

  // 2) Login as ADMIN
  const admin = await loginUser('ADMIN', credentials.admin.email, credentials.admin.password);
  log(`OK: ADMIN login success (role=${admin.role})`);

  // 3) Login as STUDENT
  const student = await loginUser('STUDENT', credentials.student.email, credentials.student.password);
  log(`OK: STUDENT login success (role=${student.role})`);

  // 4) Admin can access admin audit logs
  const adminAudit = await request('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${admin.token}` }
  });
  if (!(adminAudit.ok || adminAudit.status === 200)) {
    throw new Error(`Expected ADMIN access to audit logs, got ${adminAudit.status}`);
  }
  log('OK: ADMIN can access /api/admin/audit-logs');

  // 5) Student blocked from admin route
  const studentAudit = await request('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${student.token}` }
  });
  if (studentAudit.status !== 403) {
    throw new Error(`Expected STUDENT to be blocked from admin route, got ${studentAudit.status}`);
  }
  log('OK: STUDENT blocked from /api/admin/audit-logs (403)');

  // 6) Student can access own applications route
  const studentApps = await request('/api/applications', {
    headers: { Authorization: `Bearer ${student.token}` }
  });
  if (!(studentApps.ok || studentApps.status === 200 || studentApps.status === 404)) {
    throw new Error(`Expected STUDENT access to /api/applications, got ${studentApps.status}`);
  }
  log('OK: STUDENT can access /api/applications');

  log('All quick auth checks passed.');
}

run().catch((error) => {
  console.error(`Auth quick test failed: ${error.message}`);
  process.exit(1);
});
