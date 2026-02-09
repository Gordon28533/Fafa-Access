import http from 'http';

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email,
      password
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('Testing login credentials...\n');

  const credentials = [
    { email: 'admin@laptopapp.com', password: 'admin123', role: 'Admin' },
    { email: 'src@ug.edu.gh', password: 'src123', role: 'SRC' },
    { email: 'student@ug.edu.gh', password: 'student123', role: 'Student' },
    { email: 'delivery@laptopapp.com', password: 'delivery123', role: 'Delivery' }
  ];

  for (const cred of credentials) {
    try {
      const result = await testLogin(cred.email, cred.password);
      if (result.statusCode === 200 && result.data.success) {
        console.log(`✅ ${cred.role} Login: SUCCESS`);
        console.log(`   Email: ${cred.email}`);
        console.log(`   Token received: ${result.data.accessToken ? 'Yes' : 'No'}`);
      } else {
        console.log(`❌ ${cred.role} Login: FAILED`);
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Error: ${result.data.error || JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${cred.role} Login: ERROR - ${error.message}`);
    }
    console.log();
  }
}

runTests();
