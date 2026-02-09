import process from 'process';

const BASE_URL = 'http://localhost:3000';

let authToken = null;

// Helper to make authenticated requests
async function authenticatedFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ ${options.method || 'GET'} ${endpoint}:`, response.status, data);
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

async function runTests() {
  console.log('🧪 Testing Document Review Endpoint with Application Reference\n');

  try {
    // 1. Login as ADMIN
    console.log('1️⃣ Logging in as ADMIN...');
    let response = await authenticatedFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@laptopapp.com',
        password: 'admin123',
      }),
    });
    
    authToken = response.accessToken;
    const adminUser = response.user;
    console.log(`   ✅ Logged in as: ${adminUser.fullName || 'Admin'} (${adminUser.role})\n`);

    // 2. Get an application reference to test with
    console.log('2️⃣ Fetching applications to get a reference...');
    response = await authenticatedFetch('/api/applications/admin/all');
    const applications = response.data?.applications || [];
    
    let appReference, appId;
    
    if (applications.length === 0) {
      console.log('   ⚠️  No applications found. Using hardcoded reference for test.');
      appReference = 'APP-2024-0012';
      appId = null;
    } else {
      appReference = applications[0].reference || `APP-2024-${String(applications[0].id).slice(0, 4)}`;
      appId = applications[0].id;
      console.log(`   ✅ Found application: ${appReference}`);
    }

    // 3. Test with application reference
    console.log(`\n3️⃣ Testing endpoint with application reference: ${appReference}`);
    try {
      response = await authenticatedFetch(`/api/documents/review/${appReference}`, {
        method: 'GET',
      });
      console.log(`   ✅ Success! Got response:`, response);
      console.log(`      Message: ${response.message}`);
      console.log(`      Documents: ${response.data?.documents?.length || 0} found`);
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
    }

    // 4. Test with application ID if we have one
    if (appId) {
      console.log(`\n4️⃣ Testing endpoint with application ID: ${appId}`);
      try {
        response = await authenticatedFetch(`/api/documents/review/${appId}`, {
          method: 'GET',
        });
        console.log(`   ✅ Success! Got response:`, response);
        console.log(`      Message: ${response.message}`);
        console.log(`      Documents: ${response.data?.documents?.length || 0} found`);
      } catch (err) {
        console.log(`   ❌ Failed: ${err.message}`);
      }
    }

    console.log('\n✨ All tests completed!\n');
  } catch (err) {
    console.error('\n💥 Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
