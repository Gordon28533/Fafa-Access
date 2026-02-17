// Simple test - login as admin and try to apply
const email = 'admin@laptopapp.com';
const password = 'admin123';

// First login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
  .then(r => r.json())
  .then(result => {
    console.log('Login response:', result.message || result.error);
    if (result.accessToken) {
      console.log('Token received');
      
      // Try to create application
      fetch('http://localhost:3000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.accessToken}`
        },
        body: JSON.stringify({
          name: 'Test Admin',
          level: '300',
          course: 'Test',
          address: 'Test',
          phoneNumber: '+233123456789',
          ghanaCardNumber: 'GHA-123456789-0',
          ghanaCardFrontHash: 'hash-front',
          ghanaCardBackHash: 'hash-back',
          selfieHash: 'hash-selfie',
          admissionLetterRef: 'ref'
        })
      })
        .then(r => r.json())
        .then(appResult => {
          if (appResult.errors && appResult.errors.includes('Only students can apply for laptops')) {
            console.log('✅ PASS: Admin correctly blocked from applying');
          } else if (appResult.message === 'Unauthorized') {
            console.log('✅ PASS: Admin correctly blocked (Unauthorized)');
          } else {
            console.log('❌ FAIL: Admin was able to apply:', appResult.message || appResult.error);
          }
        })
    }
  })
  .catch(e => console.log('Error:', e.message));
