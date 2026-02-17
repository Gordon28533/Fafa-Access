import http from 'http';

function loginAndTest(email, password, role) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ email, password });
    
    const loginReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const loginResult = JSON.parse(body);
          
          if (res.statusCode === 200 && loginResult.accessToken) {
            console.log(`✅ ${role} logged in successfully`);
            
            // Now try to create an application
            const appData = JSON.stringify({
              name: `Test ${role}`,
              level: '300',
              course: 'Test Course',
              address: 'Test Address',
              phoneNumber: '+233123456789',
              ghanaCardNumber: 'GHA-123456789-0',
              ghanaCardFrontHash: 'hash-front',
              ghanaCardBackHash: 'hash-back',
              selfieHash: 'hash-selfie',
              admissionLetterRef: 'test-ref'
            });
            
            const appReq = http.request({
              hostname: 'localhost',
              port: 3000,
              path: '/api/applications',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': appData.length,
                'Authorization': `Bearer ${loginResult.accessToken}`
              }
            }, (res) => {
              let appBody = '';
              res.on('data', chunk => appBody += chunk);
              res.on('end', () => {
                try {
                  const appResult = JSON.parse(appBody);
                  if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log(`   ❌ ERROR: ${role} was able to apply (should be blocked)`);
                  } else if (res.statusCode === 403) {
                    console.log(`   ✅ ${role} correctly blocked from applying`);
                  } else {
                    console.log(`   ⚠️  Unexpected response: ${res.statusCode} - ${appResult.message}`);
                  }
                } catch (e) {
                  console.log(`   ⚠️  Parse error: ${appBody}`);
                }
                resolve();
              });
            });
            
            appReq.on('error', () => {
              console.log(`   ⚠️  Request error`);
              resolve();
            });
            appReq.write(appData);
            appReq.end();
          } else {
            console.log(`❌ ${role} login failed`);
            resolve();
          }
        } catch (e) {
          console.log(`❌ ${role} parse error`);
          resolve();
        }
      });
    });
    
    loginReq.on('error', () => {
      console.log(`❌ ${role} connection error`);
      resolve();
    });
    loginReq.write(loginData);
    loginReq.end();
  });
}

async function runTests() {
  console.log('Testing role-based application restrictions...\n');
  
  // Test non-student roles
  await loginAndTest('admin@laptopapp.com', 'admin123', 'Admin');
  await loginAndTest('src@ug.edu.gh', 'src123', 'SRC');
  await loginAndTest('delivery@laptopapp.com', 'delivery123', 'Delivery');
  
  // Test student role (should work if student profile exists)
  console.log('\nNote: Student test may fail if student profile not created');
  await loginAndTest('student@ug.edu.gh', 'student123', 'Student');
  
  console.log('\n✅ Role restriction tests complete');
}

runTests();
