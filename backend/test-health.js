import http from 'http';
import process from 'process';

function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 3000,
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

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

testHealth()
  .then((result) => {
    console.log('✅ Server is responsive');
    console.log(`Status: ${result.status}`);
    console.log(`Body: ${result.body}`);
  })
  .catch((err) => {
    console.error('❌ Server is not responsive:', err.message);
    process.exit(1);
  });
