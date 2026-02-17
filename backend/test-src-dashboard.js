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
  console.log('🧪 Testing SRC Dashboard Visibility of Applications\n');

  try {
    // 1. Login as STUDENT to verify what applications they have
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
    console.log(`   ✅ Logged in as: ${studentUser.fullName || 'Student'} (${studentUser.role})\n`);

    // 2. Get student's own applications
    console.log('2️⃣ Fetching student applications...');
    response = await authenticatedFetch('/api/applications/my');
    const studentApplications = response.data?.applications || response;
    console.log(`   ✅ Found ${Array.isArray(studentApplications) ? studentApplications.length : 0} application(s) for student`);
    if (Array.isArray(studentApplications)) {
      studentApplications.forEach((app, idx) => {
        console.log(`      ${idx + 1}. App ID: ${app.id}, Status: ${app.status}, Created: ${app.createdAt}`);
      });
    }

    // 3. Logout and login as SRC
    console.log('\n3️⃣ Logging in as SRC officer...');
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
    console.log(`   ✅ Logged in as: ${srcUser.fullName || 'SRC Officer'} (${srcUser.role})\n`);

    // 4. Get SRC pending applications
    console.log('4️⃣ Fetching SRC pending applications...');
    console.log('   Calling: GET /api/applications/src/pending');
    response = await authenticatedFetch('/api/applications/src/pending');
    console.log('   Response:', JSON.stringify(response, null, 2));

    const srcApplications = response.data?.applications || response;
    console.log(`   ✅ Found ${Array.isArray(srcApplications) ? srcApplications.length : 0} pending application(s) for SRC`);
    
    if (Array.isArray(srcApplications)) {
      srcApplications.forEach((item, idx) => {
        const app = item.application || item;
        const studentName = item.user?.fullName || item.student?.fullName || 'Unknown';
        console.log(`      ${idx + 1}. App ID: ${app.id}, Status: ${app.status}, Student: ${studentName}, Created: ${app.createdAt}`);
      });
      
      // 5. Verify the student's application is in the SRC pending list
      console.log('\n5️⃣ Verification:');
      if (studentApplications && Array.isArray(studentApplications) && studentApplications.length > 0) {
        const studentAppId = studentApplications[0].id;
        const foundInSRC = srcApplications.some(item => {
          const app = item.application || item;
          return app.id === studentAppId;
        });
        
        if (foundInSRC) {
          console.log(`   ✅ Student application IS VISIBLE on SRC dashboard`);
        } else {
          console.log(`   ❌ Student application NOT FOUND on SRC dashboard`);
          console.log(`      Student app ID: ${studentAppId}`);
          console.log(`      SRC applications found:`, srcApplications.map(item => (item.application || item).id));
        }
      }
    }

    console.log('\n✨ All tests completed!\n');
  } catch (err) {
    console.error('\n💥 Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
