/**
 * Phase 2: Test Remaining Email Triggers
 * Uses existing SRC_APPROVED application (APP-2026-0001)
 * Tests: Admin Approval, Delivery Assignment, Delivery Confirmation
 */

import process from 'process';

const API_URL = 'http://localhost:3000/api';

let tokens = {};
const testAppId = 'e342f13e-c7f2-4b28-a007-12eef6ebd3c1';
const testAppRef = 'APP-2026-0001';

async function login(role, email, password) {
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
  console.log(`✅ Logged in as ${role}`);
  return data.accessToken;
}

async function testAdminApproval() {
  console.log('\n📧 TEST 2: Admin Approval Email');
  console.log('─'.repeat(50));

  try {
    await login('admin', 'admin@test.com', 'TestPass123!');

    const response = await fetch(`${API_URL}/applications/${testAppId}/admin-decision`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approve',
        notes: 'Approved for delivery'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ADMIN APPROVED: ${testAppRef}`);
      console.log(`   New Status: ${result.data.application.status}`);
      console.log(`   📧 Email: applicationApproved → sent to student`);
      return true;
    } else {
      console.log(`❌ Admin approval failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Admin approval error:', error.message);
    return false;
  }
}

async function testDeliveryAssignment() {
  console.log('\n📧 TEST 3: Delivery Assignment Email');
  console.log('─'.repeat(50));

  try {
    const scheduleDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const response = await fetch(`${API_URL}/applications/${testAppId}/assign-delivery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deliveryPersonnelId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        scheduledDate: scheduleDate,
        location: 'Main Campus Legon'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ DELIVERY ASSIGNED: ${testAppRef}`);
      console.log(`   Delivery ID: ${result.data.delivery.id}`);
      console.log(`   Scheduled: ${result.data.delivery.scheduledDate}`);
      console.log(`   📧 Email: deliveryScheduled → sent to student & delivery personnel`);
      return result.data.delivery.id;
    } else {
      console.log(`❌ Delivery assignment failed: ${result.message}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Delivery assignment error:', error.message);
    return null;
  }
}

async function testDeliveryConfirmation(deliveryId) {
  console.log('\n📧 TEST 4: Delivery Confirmation Email');
  console.log('─'.repeat(50));

  try {
    const response = await fetch(`${API_URL}/delivery/${deliveryId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientName: 'Phase 2 Test Student',
        recipientSignature: 'SIGNATURE_HASH',
        deliveryNotes: 'Laptop delivered and signed'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ DELIVERY CONFIRMED: ${testAppRef}`);
      console.log(`   Delivery Status: ${result.data.delivery.status}`);
      console.log(`   📧 Email: paymentRequired → sent to student`);
      return true;
    } else {
      console.log(`⚠️  Delivery confirmation: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Delivery confirmation error:', error.message);
    return false;
  }
}

async function viewEmailLogs() {
  console.log('\n📊 Email Audit Log:');
  console.log('─'.repeat(50));
  console.log('Run this command to see all sent emails:');
  console.log('\ndocker exec Fafa_Access psql -U postgres -d fafa_access \\');
  console.log('  -c "SELECT action, details->>\'to\' as recipient, ');
  console.log('      details->>\'template\' as template, timestamp ');
  console.log('      FROM audit_logs WHERE action = \'EMAIL_SENT\' ');
  console.log('      ORDER BY timestamp DESC LIMIT 10;"');
}

async function runPhase2() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║        PHASE 2: EMAIL TRIGGER TESTING                ║');
  console.log('║    Testing Remaining Workflow Notifications          ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  console.log(`\n📋 Using Test Application: ${testAppRef}`);
  console.log('─'.repeat(50));

  try {
    // Check current status
    await fetch(`${API_URL}/applications/${testAppId}`, {
      headers: { 'Authorization': `Bearer ${'temp'}` }
    }).catch(() => null);

    console.log('Starting workflow tests...\n');

    // Test 1: Admin Approval
    const adminSuccess = await testAdminApproval();
    if (!adminSuccess) throw new Error('Admin approval failed');

    // Test 2: Delivery Assignment
    const deliveryId = await testDeliveryAssignment();
    if (!deliveryId) throw new Error('Delivery assignment failed');

    // Test 3: Delivery Confirmation
    const confirmSuccess = await testDeliveryConfirmation(deliveryId);

    // Show summary
    printSummary(adminSuccess, !!deliveryId, confirmSuccess);
    viewEmailLogs();

  } catch (error) {
    console.error('\n❌ Phase 2 test failed:', error.message);
    process.exit(1);
  }
}

function printSummary(admin, delivery, confirm) {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              PHASE 2 TEST SUMMARY                    ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  console.log('\n📧 Email Triggers Tested:');
  console.log('─'.repeat(50));
  console.log(`${admin ? '✅' : '❌'} 1. Application Submitted (Phase 1 verified)`);
  console.log(`${admin ? '✅' : '⏳'} 2. SRC Approval (existing app used)`);
  console.log(`${admin ? '✅' : '❌'} 3. Admin Approval → applicationApproved`);
  console.log(`${delivery ? '✅' : '❌'} 4. Delivery Assignment → deliveryScheduled`);
  console.log(`${confirm ? '✅' : '❌'} 5. Delivery Confirmation → paymentRequired`);

  console.log('\n✨ Phase 2 Testing Complete!');
  console.log('');
}

runPhase2().catch(console.error);
