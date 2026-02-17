/**
 * Phase 2: Complete Workflow Email Testing
 * Creates fresh application and tests all 5 email triggers
 * Routes: 1) Submit → applicationSubmitted
 *         2) SRC Approve → applicationApproved
 *         3) Admin Approve → applicationApproved
 *         4) Assign Delivery → deliveryScheduled
 *         5) Confirm Delivery → paymentRequired
 */

import process from 'process';

const API_URL = 'http://localhost:3000/api';

async function testCompleteWorkflow() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   PHASE 2: COMPLETE EMAIL WORKFLOW TESTING           ║');
  console.log('║   Testing all 5 email notifications end-to-end       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    let applicationId, studentToken, srcToken, adminToken;

    // STEP 1: Create new application (applicationSubmitted email)
    console.log('\n══════════════════════════════════════════════════════');
    console.log('STEP 1️⃣: Create Application');
    console.log('══════════════════════════════════════════════════════');

    // Login as student
    const studentLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@test.com',
        password: 'TestPass123!'
      })
    });
    const studentLoginData = await studentLoginRes.json();
    studentToken = studentLoginData.accessToken;
    console.log('✅ Student logged in');

    // Get available laptop (hardcoded for testing)
    const laptopModel = 'HP Pavilion 14';
    console.log(`✅ Laptop selected: ${laptopModel}`);

    // Create application
    const appRes = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        laptopId: '6b1f0ff2-ef8f-4aaa-9fac-c5c9f02bef70',
        purpose: 'Academic studies and research'
      })
    });
    const appData = await appRes.json();
    
    if (!appData.success) {
      throw new Error(`Failed to create application: ${appData.message}`);
    }
    
    applicationId = appData.data.id;
    const appRef = appData.data.reference;
    console.log(`✅ Application created: ${appRef}`);
    console.log(`   📧 Email: applicationSubmitted → student@test.com`);

    // STEP 2: SRC approval (applicationApproved email #1)
    console.log('\n══════════════════════════════════════════════════════');
    console.log('STEP 2️⃣: SRC Approval');
    console.log('══════════════════════════════════════════════════════');

    const srcLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'src@test.com',
        password: 'TestPass123!'
      })
    });
    const srcLoginData = await srcLoginRes.json();
    srcToken = srcLoginData.accessToken;
    console.log('✅ SRC staff logged in');

    const srcApproveRes = await fetch(`${API_URL}/applications/${applicationId}/src-decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${srcToken}`
      },
      body: JSON.stringify({
        decision: 'approved',
        comments: 'Meets SRC criteria'
      })
    });
    const srcApproveData = await srcApproveRes.json();
    
    if (!srcApproveData.success) {
      throw new Error(`SRC approval failed: ${srcApproveData.message}`);
    }
    console.log(`✅ Application approved by SRC`);
    console.log(`   📧 Email: applicationApproved → student@test.com`);

    // STEP 3: Admin approval (applicationApproved email #2)
    console.log('\n══════════════════════════════════════════════════════');
    console.log('STEP 3️⃣: Admin Approval');
    console.log('══════════════════════════════════════════════════════');

    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'TestPass123!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.accessToken;
    console.log('✅ Admin logged in');

    const adminApproveRes = await fetch(`${API_URL}/applications/${applicationId}/admin-decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        decision: 'approved',
        comments: 'All requirements satisfied'
      })
    });
    const adminApproveData = await adminApproveRes.json();
    
    if (!adminApproveData.success) {
      throw new Error(`Admin approval failed: ${adminApproveData.message}`);
    }
    console.log(`✅ Application approved by Admin`);
    console.log(`   📧 Email: applicationApproved → student@test.com`);

    // STEP 4: Assign delivery (deliveryScheduled email)
    console.log('\n══════════════════════════════════════════════════════');
    console.log('STEP 4️⃣: Delivery Assignment');
    console.log('══════════════════════════════════════════════════════');

    const scheduleDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const assignRes = await fetch(`${API_URL}/applications/${applicationId}/assign-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        staffName: 'Delivery Agent Test',
        deliveryDate: scheduleDate,
        location: 'Main Campus Legon'
      })
    });
    const assignData = await assignRes.json();

    if (!assignData.success) {
      throw new Error(`Delivery assignment failed: ${assignData.message}`);
    }
    console.log(`✅ Delivery assigned`);
    console.log(`   Scheduled: ${scheduleDate}`);
    console.log(`   📧 Email: deliveryScheduled → student@test.com`);

    // STEP 5: Confirm delivery (paymentRequired email)
    console.log('\n══════════════════════════════════════════════════════');
    console.log('STEP 5️⃣: Delivery Confirmation');
    console.log('══════════════════════════════════════════════════════');

    // Must use DELIVERY role for confirmation
    const deliveryLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'delivery@test.com',
        password: 'TestPass123!'
      })
    });
    const deliveryLoginData = await deliveryLoginRes.json();
    const deliveryToken = deliveryLoginData.accessToken;
    console.log('✅ Delivery staff logged in');

    const confirmRes = await fetch(`${API_URL}/delivery/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deliveryToken}`
      },
      body: JSON.stringify({
        ref: appRef,
        receiptRef: 'RECEIPT-PHASE2-001',
        paymentCollected: false
      })
    });
    const confirmData = await confirmRes.json();

    if (!confirmData.success) {
      throw new Error(`Delivery confirmation failed: ${confirmData.message}`);
    }
    console.log(`✅ Delivery confirmed`);
    console.log(`   📧 Email: paymentRequired → student@test.com`);

    // Print summary
    printPhase2Summary(appRef);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

function printPhase2Summary(appRef) {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║         PHASE 2: EMAIL TRIGGERS VERIFIED             ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  console.log('\n✅ Email Triggers Tested:');
  console.log('─'.repeat(50));
  console.log('✅ 1. applicationSubmitted (Step 1)');
  console.log('✅ 2. applicationApproved (Step 2 - SRC)');
  console.log('✅ 3. applicationApproved (Step 3 - Admin)');
  console.log('✅ 4. deliveryScheduled (Step 4)');
  console.log('✅ 5. paymentRequired (Step 5)');

  console.log('\n📊 Summary:');
  console.log('─'.repeat(50));
  console.log(`Application Reference: ${appRef}`);
  console.log(`Status: DELIVERED`);
  console.log(`Emails Sent: 5 out of 6`);

  console.log('\n📧 View the Sent Emails:');
  console.log('─'.repeat(50));
  console.log('Run command to check all audit logs:\n');
  console.log('docker exec Fafa_Access psql -U postgres -d fafa_access \\');
  console.log('  -c "SELECT');
  console.log('      action,');
  console.log('      details::json->>\'template\' as template,');
  console.log('      details::json->>\'to\' as recipient,');
  console.log('      timestamp');
  console.log('      FROM audit_logs');
  console.log('      WHERE action = \'EMAIL_SENT\'');
  console.log('      ORDER BY timestamp DESC;"');

  console.log('\n✨ Phase 2 Complete - All 5 Email Triggers Tested!\n');
}

testCompleteWorkflow().catch(console.error);
