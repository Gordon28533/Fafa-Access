// Quick SRC Approval Flow Test
const API_URL = 'http://localhost:3000/api';

async function testSrcApproval() {
  // 1. Login as SRC
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'src@test.com',
      password: 'TestPass123!'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.accessToken;

  console.log('✅ Logged in as SRC\n');

  // 2. Approve the application
  const approvalResponse = await fetch(`${API_URL}/applications/e342f13e-c7f2-4b28-a007-12eef6ebd3c1/src-decision`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'approve',
      notes: 'All documents verified successfully'
    })
  });

  const approvalData = await approvalResponse.json();

  if (approvalData.success) {
    console.log('✅ SRC APPROVAL SUCCESSFUL');
    console.log(`   Application: ${approvalData.data.application.reference}`);
    console.log(`   New Status: ${approvalData.data.application.status}`);
    console.log(`   📧 Email notification sent to student`);
  } else {
    console.log('❌ Approval failed:', approvalData.message);
  }
}

testSrcApproval();
