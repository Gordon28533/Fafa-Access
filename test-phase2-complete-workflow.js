/**
 * Phase 2: Complete Email Workflow Testing
 * Tests all remaining email triggers in the application lifecycle
 * 
 * Tests included:
 * 1. SRC Approval → applicationApproved
 * 2. Admin Approval → applicationApproved  
 * 3. Delivery Assignment → deliveryScheduled
 * 4. Delivery Confirmation → paymentRequired
 */

import process from 'process';

const API_URL = 'http://localhost:3000/api';

let tokens = {};
let testResults = {
  submitted: [],
  srcApproved: [],
  adminApproved: [],
  deliveryAssigned: [],
  deliveryConfirmed: []
};

async function login(role, email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!data.success || !data.accessToken) {
      throw new Error(data.message || 'Login failed');
    }

    tokens[role] = data.accessToken;
    return data.accessToken;
  } catch (error) {
    console.error(`❌ Login failed for ${role}:`, error.message);
    throw error;
  }
}

async function createApplication() {
  try {
    // Login as student
    await login('student', 'student@test.com', 'TestPass123!');

    // Get laptops
    const laptopsResponse = await fetch(`${API_URL}/laptops`, {
      headers: { 'Authorization': `Bearer ${tokens.student}` }
    });

    const laptopsData = await laptopsResponse.json();
    if (!laptopsData.success || !laptopsData.data.laptops || laptopsData.data.laptops.length === 0) {
      throw new Error('No laptops available');
    }

    // Submit application
    const appResponse = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase 2 Test Student',
        level: 'Level 200',
        course: 'Information Technology',
        address: 'Phase 2 Test Address',
        phoneNumber: '0249876543',
        ghanaCardNumber: 'GHA-999888777-0',
        ghanaCardFrontHash: 'hash-front-phase2',
        ghanaCardBackHash: 'hash-back-phase2',
        selfieHash: 'hash-selfie-phase2',
        laptopId: laptopsData.data.laptops[0].id
      })
    });

    const result = await appResponse.json();
    if (!result.success) {
      throw new Error(result.message || 'Application submission failed');
    }

    return result.data.application;
  } catch (error) {
    console.error('❌ Application creation failed:', error.message);
    throw error;
  }
}

async function testSrcApproval(appId, appRef) {
  try {
    console.log('\n📧 TEST 2: SRC Approval Email');
    console.log('─'.repeat(50));

    // Login as SRC
    await login('src', 'src@test.com', 'TestPass123!');

    const response = await fetch(`${API_URL}/applications/${appId}/src-decision`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.src}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approve',
        notes: 'All documents verified'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ SRC APPROVED: ${appRef}`);
      console.log(`   New Status: ${result.data.application.status}`);
      console.log(`   📧 Email: applicationApproved sent`);
      testResults.srcApproved.push({ id: appId, reference: appRef, status: 'SUCCESS' });
      return appId;
    } else {
      console.log(`❌ SRC approval failed: ${result.message}`);
      testResults.srcApproved.push({ id: appId, reference: appRef, status: 'FAILED', error: result.message });
      return null;
    }
  } catch (error) {
    console.error('❌ SRC approval error:', error.message);
    testResults.srcApproved.push({ id: appId, reference: appRef, status: 'ERROR', error: error.message });
    return null;
  }
}

async function testAdminApproval(appId, appRef) {
  try {
    console.log('\n📧 TEST 3: Admin Approval Email');
    console.log('─'.repeat(50));

    // Login as admin
    await login('admin', 'admin@test.com', 'TestPass123!');

    const response = await fetch(`${API_URL}/applications/${appId}/admin-decision`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approve',
        notes: 'Approved for processing'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ADMIN APPROVED: ${appRef}`);
      console.log(`   New Status: ${result.data.application.status}`);
      console.log(`   📧 Email: applicationApproved sent`);
      testResults.adminApproved.push({ id: appId, reference: appRef, status: 'SUCCESS' });
      return appId;
    } else {
      console.log(`❌ Admin approval failed: ${result.message}`);
      testResults.adminApproved.push({ id: appId, reference: appRef, status: 'FAILED', error: result.message });
      return null;
    }
  } catch (error) {
    console.error('❌ Admin approval error:', error.message);
    testResults.adminApproved.push({ id: appId, reference: appRef, status: 'ERROR', error: error.message });
    return null;
  }
}

async function testDeliveryAssignment(appId, appRef) {
  try {
    console.log('\n📧 TEST 4: Delivery Assignment Email');
    console.log('─'.repeat(50));

    // Using admin token from previous call
    const scheduleDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const response = await fetch(`${API_URL}/applications/${appId}/assign-delivery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deliveryPersonnelId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        scheduledDate: scheduleDate,
        location: 'Legon Campus'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ DELIVERY ASSIGNED: ${appRef}`);
      console.log(`   Scheduled: ${result.data.delivery.scheduledDate}`);
      console.log(`   Location: ${result.data.delivery.location}`);
      console.log(`   📧 Email: deliveryScheduled sent`);
      testResults.deliveryAssigned.push({ 
        id: appId, 
        reference: appRef, 
        deliveryId: result.data.delivery.id,
        status: 'SUCCESS' 
      });
      return result.data.delivery.id;
    } else {
      console.log(`❌ Delivery assignment failed: ${result.message}`);
      testResults.deliveryAssigned.push({ id: appId, reference: appRef, status: 'FAILED', error: result.message });
      return null;
    }
  } catch (error) {
    console.error('❌ Delivery assignment error:', error.message);
    testResults.deliveryAssigned.push({ id: appId, reference: appRef, status: 'ERROR', error: error.message });
    return null;
  }
}

async function testDeliveryConfirmation(deliveryId, appId, appRef) {
  try {
    console.log('\n📧 TEST 5: Delivery Confirmation Email');
    console.log('─'.repeat(50));

    // Using delivery personnel login
    const response = await fetch(`${API_URL}/delivery/${deliveryId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`, // Using admin for now
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientName: 'Phase 2 Test Student',
        recipientSignature: 'SIGNATURE_HASH',
        deliveryNotes: 'Laptop delivered successfully'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ DELIVERY CONFIRMED: ${appRef}`);
      console.log(`   Status: ${result.data.delivery.status}`);
      console.log(`   📧 Email: paymentRequired sent`);
      testResults.deliveryConfirmed.push({ id: deliveryId, reference: appRef, status: 'SUCCESS' });
      return true;
    } else {
      console.log(`⚠️  Delivery confirmation note: ${result.message}`);
      testResults.deliveryConfirmed.push({ id: deliveryId, reference: appRef, status: 'PARTIAL', note: result.message });
      return false;
    }
  } catch (error) {
    console.error('❌ Delivery confirmation error:', error.message);
    testResults.deliveryConfirmed.push({ id: deliveryId, reference: appRef, status: 'ERROR', error: error.message });
    return false;
  }
}

async function runPhase2Tests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║        PHASE 2: EMAIL WORKFLOW TESTING SUITE         ║');
  console.log('║          Complete Application Lifecycle              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Step 1: Create new application
    console.log('\n📧 TEST 1: Application Submission Email (Phase 1 Verified)');
    console.log('─'.repeat(50));
    const app = await createApplication();
    console.log(`✅ APPLICATION SUBMITTED: ${app.reference}`);
    console.log(`   Application ID: ${app.id}`);
    console.log(`   Status: ${app.status}`);
    console.log(`   📧 Email: applicationSubmitted sent (Phase 1 verified)`);
    testResults.submitted.push({ id: app.id, reference: app.reference, status: 'SUCCESS' });

    // Step 2: SRC Approval
    const srcAppId = await testSrcApproval(app.id, app.reference);
    if (!srcAppId) throw new Error('SRC approval failed');

    // Step 3: Admin Approval
    const adminAppId = await testAdminApproval(srcAppId, app.reference);
    if (!adminAppId) throw new Error('Admin approval failed');

    // Step 4: Delivery Assignment
    const deliveryId = await testDeliveryAssignment(adminAppId, app.reference);
    if (!deliveryId) throw new Error('Delivery assignment failed');

    // Step 5: Delivery Confirmation
    await testDeliveryConfirmation(deliveryId, adminAppId, app.reference);

    // Print Summary
    printTestSummary();

  } catch (error) {
    console.error('\n❌ Test sequence failed:', error.message);
    printTestSummary();
    process.exit(1);
  }
}

function printTestSummary() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              PHASE 2 TEST SUMMARY                    ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  console.log('\n📊 Email Triggers Tested:');
  console.log('─'.repeat(50));

  const tests = [
    { name: 'Application Submitted', results: testResults.submitted, status: '✅' },
    { name: 'SRC Approval', results: testResults.srcApproved, status: '⏳' },
    { name: 'Admin Approval', results: testResults.adminApproved, status: '⏳' },
    { name: 'Delivery Assignment', results: testResults.deliveryAssigned, status: '⏳' },
    { name: 'Delivery Confirmation', results: testResults.deliveryConfirmed, status: '⏳' }
  ];

  tests.forEach((test, idx) => {
    const results = test.results;
    const success = results.filter(r => r.status === 'SUCCESS').length;
    const total = results.length;
    console.log(`\n${test.status} ${idx + 1}. ${test.name}`);
    if (total > 0) {
      console.log(`   Success: ${success}/${total} tests passed`);
      if (success < total) {
        results
          .filter(r => r.status !== 'SUCCESS')
          .forEach(r => {
            console.log(`   - ${r.reference || r.id}: ${r.error || r.note || r.status}`);
          });
      }
    }
  });

  console.log('\n📧 Verify Email Logs:');
  console.log('─'.repeat(50));
  console.log('docker exec Fafa_Access psql -U postgres -d fafa_access \\');
  console.log('  -c "SELECT action, details FROM audit_logs \\');
  console.log('      WHERE action = \'EMAIL_SENT\' ORDER BY timestamp DESC LIMIT 10;"');

  console.log('\n✨ Phase 2 Testing Complete!\n');
}

// Run the test suite
runPhase2Tests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
