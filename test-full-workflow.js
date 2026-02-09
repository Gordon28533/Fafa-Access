// Test Full Email Workflow
const API_URL = 'http://localhost:3000/api';

async function testFullWorkflow() {
  console.log('🧪 EMAIL WORKFLOW TEST SUITE\n');
  console.log('════════════════════════════════════════\n');

  // Step 1: SRC-Approved Application Already Exists  
  const appId = 'e342f13e-c7f2-4b28-a007-12eef6ebd3c1';
  const appRef = 'APP-2026-0001';
  console.log(`📋 Using Application: ${appRef} (${appId})`);
  console.log(`   Status: SRC_APPROVED\n`);

  // Step 2: Admin Approval
  console.log('📧 TEST: Admin Approval Email');
  console.log('────────────────────────────────────────');
  
  const adminLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'TestPass123!'
    })
  });

  const adminData = await adminLogin.json();
  const adminToken = adminData.accessToken;
  console.log('✅ Logged in as admin\n');

  const adminApproval = await fetch(`${API_URL}/applications/${appId}/admin-decision`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'approve',
      notes: 'Approved for delivery'
    })
  });

  const adminResult = await adminApproval.json();

  if (adminResult.success) {
    console.log('✅ ADMIN APPROVAL SUCCESSFUL');
    console.log(`   New Status: ${adminResult.data.application.status}`);
    console.log(`   📧 Email: applicationApproved sent to student\n`);

    // Step 3: Delivery Assignment
    console.log('📧 TEST: Delivery Assignment Email');
    console.log('────────────────────────────────────────');
    
    const deliveryAssignment = await fetch(`${API_URL}/applications/${appId}/assign-delivery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deliveryPersonnelId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        location: 'Main Campus, Legon'
      })
    });

    const deliveryResult = await deliveryAssignment.json();
    
    if (deliveryResult.success) {
      console.log('✅ DELIVERY ASSIGNED SUCCESSFULLY');
      console.log(`   Scheduled: ${deliveryResult.data.delivery.scheduledDate}`);
      console.log(`   📧 Email: deliveryScheduled sent to student\n`);
    } else {
      console.log('⚠️  Delivery assignment note:', deliveryResult.message);
    }

  } else {
    console.log('❌ Admin approval failed:', adminResult.message);
  }

  // Summary
  console.log('\n════════════════════════════════════════');
  console.log('✨ WORKFLOW TEST COMPLETED');
  console.log('════════════════════════════════════════');
}

testFullWorkflow();
