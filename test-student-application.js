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
  console.log('🧪 Testing Student Application Submission and SRC Dashboard Visibility\n');

  try {
    // 1. Login as STUDENT
    console.log('1️⃣ Logging in as STUDENT...');
    let response = await authenticatedFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'student@ug.edu.gh',
        password: 'student123',
      }),
    });
    
    authToken = response.accessToken;
    const studentUser = response.user;
    console.log(`   ✅ Logged in as: ${studentUser.fullName} (${studentUser.role})\n`);

    // 2. Get student profile to check if student profile exists
    console.log('2️⃣ Checking student profile...');
    try {
      response = await authenticatedFetch('/api/student/profile');
      console.log(`   ✅ Student profile found:`, response.data || response);
    } catch (err) {
      console.log(`   ⚠️  Student profile check: ${err.message}`);
    }

    // 3. Create a new application
    console.log('\n3️⃣ Creating a new laptop application...');
    response = await authenticatedFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        level: '200',
        course: 'Computer Science',
        address: 'Accra, Ghana',
        phoneNumber: '+233200000000',
        ghanaCardNumber: 'GHA-000000000-0',
        ghanaCardFrontHash: 'hash_front_001',
        ghanaCardBackHash: 'hash_back_001',
        selfieHash: 'hash_selfie_001',
        admissionLetterRef: 'UG/CS/2022/001'
      }),
    });

    const applicationId = response.data?.id || response.id;
    console.log(`   ✅ Application created with ID: ${applicationId}`);
    console.log(`   📋 Reference: ${response.data?.reference || response.reference}`);
    console.log(`   ⏰ Submitted: ${response.data?.createdAt || response.createdAt}\n`);

    // 4. Get student's own applications
    console.log('4️⃣ Fetching student applications...');
    response = await authenticatedFetch('/api/applications');
    console.log(`   ✅ Found ${response.data?.applications?.length || response.length || 0} application(s) for student`);
    if (response.data?.applications) {
      response.data.applications.forEach(app => {
        console.log(`      - App ${app.id}: ${app.status}`);
      });
    }

    // 5. Logout and login as SRC
    console.log('\n5️⃣ Logging in as SRC officer...');
    authToken = null;
    response = await authenticatedFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'src@ug.edu.gh',
        password: 'src123',
      }),
    });

    authToken = response.accessToken;
    const srcUser = response.user;
    console.log(`   ✅ Logged in as: ${srcUser.fullName} (${srcUser.role})\n`);

    // 6. Get SRC pending applications
    console.log('6️⃣ Fetching SRC pending applications...');
    response = await authenticatedFetch('/api/applications/src/pending');
    console.log(`   ✅ Found ${response.data?.applications?.length || response.length || 0} pending application(s) for SRC`);
    
    if (response.data?.applications) {
      response.data.applications.forEach(item => {
        const app = item.application || item;
        const studentName = item.user?.fullName || item.student?.fullName || 'Unknown';
        console.log(`      - App ${app.id}: ${app.status} from ${studentName}`);
      });
    }

    // 7. Verify the created application is visible
    console.log('\n7️⃣ Verifying newly created application is in SRC pending list...');
    if (response.data?.applications) {
      const foundApp = response.data.applications.find(item => {
        const app = item.application || item;
        return app.id === applicationId || app.id.toString() === applicationId?.toString();
      });
      
      if (foundApp) {
        console.log(`   ✅ Student application IS VISIBLE on SRC dashboard`);
        const app = foundApp.application || foundApp;
        console.log(`      Status: ${app.status}`);
        console.log(`      Created: ${app.createdAt}`);
      } else {
        console.log(`   ❌ Student application NOT FOUND on SRC dashboard`);
        console.log(`      Looking for ID: ${applicationId}`);
      }
    }

    console.log('\n✨ All tests completed!\n');
  } catch (err) {
    console.error('\n💥 Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
