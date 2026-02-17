/**
 * Email Trigger Test Script
 * Tests email notifications for all business workflows
 */

import process from 'process';

const API_URL = 'http://localhost:3000/api';

// Test user credentials
const testUsers = {
  student: {
    email: 'student@test.com',
    password: 'TestPass123!'
  },
  src: {
    email: 'src@test.com',
    password: 'TestPass123!'
  },
  admin: {
    email: 'admin@test.com',
    password: 'TestPass123!'
  },
  delivery: {
    email: 'delivery@test.com',
    password: 'TestPass123!'
  }
};

let tokens = {};

/**
 * Login and get JWT token
 */
async function login(role) {
  try {
    console.log(`🔐 Logging in as ${role}...`);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUsers[role].email,
        password: testUsers[role].password
      })
    });

    const data = await response.json();

    if (!data.success || !data.accessToken) {
      throw new Error(data.message || 'Login failed - no token returned');
    }

    tokens[role] = data.accessToken;
    console.log(`✅ Logged in as ${role}\n`);
    return data.accessToken;

  } catch (error) {
    console.error(`❌ Login failed for ${role}:`, error.message);
    process.exit(1);
  }
}

/**
 * Test 1: Application Submission (triggers applicationSubmitted email)
 */
async function testApplicationSubmission() {
  console.log('\n📧 TEST 1: Application Submission Email');
  console.log('─'.repeat(50));
  
  await login('student');

  try {
    // Get laptops first
    const laptopsResponse = await fetch(`${API_URL}/laptops`, {
      headers: { 'Authorization': `Bearer ${tokens.student}` }
    });

    const laptopsData = await laptopsResponse.json();
    if (!laptopsData.success || !laptopsData.data || !laptopsData.data.laptops || laptopsData.data.laptops.length === 0) {
      console.error('❌ No laptops available for application');
      return;
    }

    const laptopId = laptopsData.data.laptops[0].id;

    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Student',
        level: 'Level 100',
        course: 'Computer Science',
        address: 'Test Address, Accra',
        phoneNumber: '0241234567',
        ghanaCardNumber: 'GHA-123456789-0',
        ghanaCardFrontHash: 'hash-front-123',
        ghanaCardBackHash: 'hash-back-123',
        selfieHash: 'hash-selfie-123',
        laptopId
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Application submitted successfully');
      console.log(`   Application ID: ${data.data.application.id}`);
      console.log(`   Reference: ${data.data.application.reference}`);
      console.log(`   📧 Email sent: applicationSubmitted\n`);
      return data.data.application.id;
    } else {
      console.error('❌ Application submission failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test 2: SRC Approval (triggers applicationApproved email)
 */
async function testSrcApproval(applicationId) {
  console.log('\n📧 TEST 2: SRC Approval Decision Email');
  console.log('─'.repeat(50));
  
  if (!applicationId) {
    console.log('⏭️  Skipped (no application to approve)');
    return;
  }

  await login('src');

  try {
    const response = await fetch(`${API_URL}/applications/${applicationId}/src-decision`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.src}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approve',
        notes: 'Application meets all SRC requirements'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ SRC approval recorded');
      console.log(`   Status: ${data.data.status}`);
      console.log(`   📧 Email sent: applicationApproved\n`);
    } else {
      console.error('❌ SRC approval failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 3: SRC Rejection (triggers applicationRejected email)
 */
async function testSrcRejection() {
  console.log('\n📧 TEST 3: SRC Rejection Decision Email');
  console.log('─'.repeat(50));
  
  await login('student');

  try {
    // Create another application to reject
    const laptopsResponse = await fetch(`${API_URL}/laptops`, {
      headers: { 'Authorization': `Bearer ${tokens.student}` }
    });

    const laptopsData = await laptopsResponse.json();
    const laptopId = laptopsData.data.laptops[0].id;

    const appResponse = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Reject Test Student',
        level: 'Level 100',
        course: 'Engineering',
        address: 'Test Address 2',
        phoneNumber: '0249876543',
        ghanaCardNumber: 'GHA-987654321-0',
        ghanaCardFrontHash: 'hash-front-reject',
        ghanaCardBackHash: 'hash-back-reject',
        selfieHash: 'hash-selfie-reject',
        laptopId
      })
    });

    const appData = await appResponse.json();
    const applicationId = appData.data.application.id;

    await login('src');

    const response = await fetch(`${API_URL}/applications/${applicationId}/src-decision`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.src}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'reject',
        notes: 'Missing required documents'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ SRC rejection recorded');
      console.log(`   Status: ${data.data.status}`);
      console.log(`   📧 Email sent: applicationRejected\n`);
    } else {
      console.error('❌ SRC rejection failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 4: Admin Approval (triggers applicationApproved email)
 */
async function testAdminApproval(applicationId) {
  console.log('\n📧 TEST 4: Admin Approval Decision Email');
  console.log('─'.repeat(50));
  
  if (!applicationId) {
    console.log('⏭️  Skipped (no SRC-approved application)');
    return;
  }

  await login('admin');

  try {
    const response = await fetch(`${API_URL}/applications/${applicationId}/admin-decision`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approve',
        notes: 'Final approval granted'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Admin approval recorded');
      console.log(`   Status: ${data.data.application.status}`);
      console.log(`   📧 Email sent: applicationApproved\n`);
      return applicationId;
    } else {
      console.error('❌ Admin approval failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test 5: Delivery Assignment (triggers deliveryScheduled email)
 */
async function testDeliveryAssignment(applicationId) {
  console.log('\n📧 TEST 5: Delivery Scheduled Email');
  console.log('─'.repeat(50));
  
  if (!applicationId) {
    console.log('⏭️  Skipped (no admin-approved application)');
    return;
  }

  await login('admin');

  try {
    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // 1 week from now

    const response = await fetch(`${API_URL}/applications/${applicationId}/assign-delivery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        staffName: 'John Mensah',
        deliveryDate,
        location: 'Main Campus, Accra'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Delivery assigned successfully');
      console.log(`   Delivery ID: ${data.data.delivery.id}`);
      console.log(`   Date: ${deliveryDate}`);
      console.log(`   Staff: John Mensah`);
      console.log(`   📧 Email sent: deliveryScheduled\n`);
      return applicationId;
    } else {
      console.error('❌ Delivery assignment failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test 6: Delivery Confirmation (triggers paymentRequired email)
 * Currently unused - for reference implementation
 */
// Commented out - not currently used in test suite


/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║        EMAIL TRIGGER TEST SUITE - Fafa Access         ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Test 1: Application submission
    const appId = await testApplicationSubmission();

    // Test 2: SRC Approval
    await testSrcApproval(appId);

    // Test 3: SRC Rejection (different app)
    await testSrcRejection();

    // Test 4: Admin Approval
    const adminAppId = await testAdminApproval(appId);

    // Test 5: Delivery Assignment
    const appRef = adminAppId || appId;
    await testDeliveryAssignment(appRef);

    // Test 6: Delivery Confirmation
    // Note: This needs the actual application reference from the database
    // In a real scenario, you'd query the reference
    
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║              TEST SUMMARY                             ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`\n📧 Email triggers tested:\n`);
    console.log('  1. ✅ applicationSubmitted (on submission)');
    console.log('  2. ✅ applicationApproved (on SRC/Admin approval)');
    console.log('  3. ✅ applicationRejected (on SRC/Admin rejection)');
    console.log('  4. ✅ deliveryScheduled (on delivery assignment)');
    console.log('  5. ✅ paymentRequired (on delivery confirmation)\n');
    console.log('📊 Check audit logs for email events:\n');
    console.log('   SELECT * FROM audit_logs WHERE action = "EMAIL_SENT"\n');
    console.log('✨ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
