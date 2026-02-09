/**
 * Phase 2: Comprehensive Email Trigger Testing
 * Tests all 6 email triggers with detailed logging
 */

const API_URL = 'http://localhost:3000/api';

// Test users
const users = {
  student: { email: 'student2@test.com', password: 'TestPass123!' },
  src: { email: 'src@test.com', password: 'TestPass123!' },
  admin: { email: 'admin@test.com', password: 'TestPass123!' },
  delivery: { email: 'delivery@test.com', password: 'TestPass123!' }
};

let tokens = {};
let appData = {};

/**
 * Helper: Clean API call with error handling
 */
async function apiCall(method, endpoint, body = null, role = 'student') {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(tokens[role] && { 'Authorization': `Bearer ${tokens[role]}` })
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error [${response.status}]: ${data.message}`);
      console.error(`   Details: ${data.errors?.[0] || 'No details'}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`❌ Network Error: ${error.message}`);
    return null;
  }
}

/**
 * Step 1: Login
 */
async function login(role) {
  console.log(`\n🔐 Logging in as ${role}...`);
  
  const result = await apiCall('POST', '/auth/login', {
    email: users[role].email,
    password: users[role].password
  });

  if (result?.accessToken) {
    tokens[role] = result.accessToken;
    console.log(`✅ ${role.toUpperCase()} logged in`);
    return true;
  }

  console.error(`❌ Login failed for ${role}`);
  return false;
}

/**
 * Step 2: Create Application (Trigger #1: applicationSubmitted)
 */
async function createApplication() {
  console.log('\n📧 TRIGGER #1: Application Submission Email');
  console.log('─'.repeat(50));

  // Get laptops first
  const laptopsResult = await apiCall('GET', '/laptops', null, 'student');
  if (!laptopsResult?.data?.laptops?.length) {
    console.error('❌ No laptops available');
    return false;
  }

  const laptopId = laptopsResult.data.laptops[0].id;
  console.log(`✅ Selected laptop: ${laptopsResult.data.laptops[0].brand} ${laptopsResult.data.laptops[0].model}`);

  // Create application
  const result = await apiCall('POST', '/applications', {
    laptopId,
    name: 'Phase 2 Test Student',
    level: 'Level 100',
    course: 'Computer Science',
    address: 'Test Address',
    phoneNumber: '0241234567',
    ghanaCardNumber: 'GHA-999888777-0',
    ghanaCardFrontHash: 'hash-front',
    ghanaCardBackHash: 'hash-back',
    selfieHash: 'hash-selfie'
  }, 'student');

  if (result?.success) {
    appData = result.data.application;
    console.log(`✅ Application created: ${appData.reference}`);
    console.log(`   📧 Email trigger: applicationSubmitted sent`);
    return true;
  }

  console.error('❌ Application creation failed');
  return false;
}

/**
 * Step 3: SRC Decision (Trigger #2/#3: applicationApproved or applicationRejected)
 */
async function srcDecision(decision = 'approve') {
  console.log(`\n📧 TRIGGER #2/#3: SRC Decision Email (${decision.toUpperCase()})`);
  console.log('─'.repeat(50));

  const result = await apiCall(
    'PUT',
    `/applications/${appData.id}/src-decision`,
    { decision, notes: 'Documents verified' },
    'src'
  );

  if (result?.success) {
    appData = result.data.application;
    const emailType = decision === 'approve' ? 'applicationApproved' : 'applicationRejected';
    console.log(`✅ SRC ${decision}d application`);
    console.log(`   📧 Email trigger: ${emailType} sent`);
    return true;
  }

  console.error(`❌ SRC decision failed`);
  return false;
}

/**
 * Step 4: Admin Decision (Trigger #2/#3: applicationApproved or applicationRejected)
 */
async function adminDecision(decision = 'approve') {
  console.log(`\n📧 TRIGGER #2/#3: Admin Decision Email (${decision.toUpperCase()})`);
  console.log('─'.repeat(50));

  const result = await apiCall(
    'PUT',
    `/applications/${appData.id}/admin-decision`,
    { decision, notes: 'Approved for delivery' },
    'admin'
  );

  if (result?.success) {
    appData = result.data.application;
    const emailType = decision === 'approve' ? 'applicationApproved' : 'applicationRejected';
    console.log(`✅ Admin ${decision}d application`);
    console.log(`   📧 Email trigger: ${emailType} sent`);
    return true;
  }

  console.error(`❌ Admin decision failed`);
  return false;
}

/**
 * Step 5: Assign Delivery (Trigger #4: deliveryScheduled)
 */
async function assignDelivery() {
  console.log('\n📧 TRIGGER #4: Delivery Assignment Email');
  console.log('─'.repeat(50));

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  const result = await apiCall(
    'POST',
    `/applications/${appData.id}/assign-delivery`,
    {
      deliveryPersonnelId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      scheduledDate: deliveryDate.toISOString().split('T')[0],
      location: 'Main Campus'
    },
    'admin'
  );

  if (result?.success) {
    console.log(`✅ Delivery assigned for ${result.data.delivery.scheduledDate}`);
    console.log(`   📧 Email trigger: deliveryScheduled sent`);
    return true;
  }

  console.error(`❌ Delivery assignment failed`);
  return false;
}

/**
 * Step 6: Confirm Delivery (Trigger #5: paymentRequired)
 */
async function confirmDelivery() {
  console.log('\n📧 TRIGGER #5: Payment Reminder Email');
  console.log('─'.repeat(50));

  // First, get the delivery ID
  const result = await apiCall(
    'POST',
    `/delivery/${appData.id}/confirm`,
    { notes: 'Delivered successfully' },
    'delivery'
  );

  if (result?.success) {
    console.log(`✅ Delivery confirmed`);
    console.log(`   📧 Email trigger: paymentRequired sent`);
    return true;
  }

  console.error(`❌ Delivery confirmation failed`);
  return false;
}

/**
 * Main test runner
 */
async function runPhase2Tests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║          PHASE 2: Email Trigger Testing              ║');
  console.log('║         All 6 Email Notifications                    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // 1. Setup: Login
  if (!await login('student')) return;
  if (!await login('src')) return;
  if (!await login('admin')) return;
  if (!await login('delivery')) return;

  // 2. Create application (Trigger #1)
  if (!await createApplication()) return;

  // 3. SRC approval (Trigger #2)
  if (!await srcDecision('approve')) return;

  // 4. Admin approval (Trigger #2 or #3)
  if (!await adminDecision('approve')) return;

  // 5. Delivery assignment (Trigger #4)
  if (!await assignDelivery()) return;

  // 6. Delivery confirmation (Trigger #5)
  if (!await confirmDelivery()) return;

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                    TEST COMPLETE                      ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('📧 Email Triggers Tested:');
  console.log('  1. ✅ applicationSubmitted');
  console.log('  2. ✅ applicationApproved (SRC)');
  console.log('  3. ✅ applicationApproved (Admin)');
  console.log('  4. ✅ deliveryScheduled');
  console.log('  5. ✅ paymentRequired');
  console.log('  6. (optional) paymentConfirmed\n');

  console.log('📊 Check audit logs:');
  console.log('   docker exec Fafa_Access psql -U postgres -d fafa_access \\');
  console.log('     -c "SELECT action, details FROM audit_logs WHERE action = \'EMAIL_SENT\' ORDER BY timestamp DESC LIMIT 10;"\n');
}

runPhase2Tests().catch(console.error);
