import http from 'http';
import process from 'process';

let attempts = 0;
const maxAttempts = 10;

function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function retryTest() {
  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Attempt ${attempts}/${maxAttempts}...`);
      const result = await testHealth();
      console.log('\n✅ Server is responsive');
      console.log(`Status: ${result.status}`);
      console.log(`Body: ${result.body}`);
      process.exit(0);
    } catch (err) {
      if (attempts < maxAttempts) {
        console.log(`  Retry in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.error('❌ Server is not responsive after ' + maxAttempts + ' attempts');
  process.exit(1);
}

retryTest();
