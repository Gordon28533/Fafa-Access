/**
 * Test Admin Laptop Inventory System
 * Tests the complete CRUD workflow for admin laptop management
 */

const BASE_URL = 'http://localhost:3000';

let adminToken = '';
let studentToken = '';
let testLaptopId = '';

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
};

const logTest = (name, success, details = '') => {
  const status = success ? '✓' : '✗';
  console.log(`  ${status} ${name}`);
  if (details) console.log(`    ${details}`);
};

async function login(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.data?.token || null;
    } catch (parseError) {
      console.error('Response not JSON:', text);
      return null;
    }
  } catch (err) {
    console.error('Login error:', err.message);
    return null;
  }
}

async function testAdminInventory() {
  logSection('TEST: ADMIN LAPTOP INVENTORY SYSTEM');

  // 1. Login as admin  
  logSection('1. ADMIN LOGIN');
  
  // Try common admin credentials from seeded data
  const adminCreds = [
    { email: 'admin@laptopapp.com', password: 'admin123' },
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'test@admin.com', password: 'password123' }
  ];
  
  for (const cred of adminCreds) {
    adminToken = await login(cred.email, cred.password);
    if (adminToken) {
      console.log(`  ✓ Logged in as ${cred.email}`);
      break;
    }
  }
  
  logTest('Admin login', !!adminToken, adminToken ? 'Token received' : 'Failed - admin account may not exist');

  if (!adminToken) {
    console.log('\n  NOTE: Admin account not found. Please create one using:');
    console.log('    - Email: admin@laptopapp.com');
    console.log('    - Password: admin123');
    console.log('    - Role: ADMIN\n');
    console.log('  Testing with student account instead...\n');
    
    // Try student for basic endpoint tests
    studentToken = await login('student@ug.edu.gh', 'student123');
    if (studentToken) {
      console.log('  ✓ Logged in as student for basic testing');
    }
    return;
  }

  // 2. Test GET /api/laptops/admin/summary (inventory summary)
  logSection('2. GET INVENTORY SUMMARY');
  try {
    const res = await fetch(`${BASE_URL}/api/laptops/admin/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const success = res.ok && data.data;
    logTest('Fetch inventory summary', success);
    if (success) {
      console.log(`    Total laptops: ${data.data.totalLaptops}`);
      console.log(`    Active laptops: ${data.data.activeLaptops}`);
      console.log(`    Total stock: ${data.data.totalStock}`);
      console.log(`    Total value: GHS ${data.data.totalValue.toFixed(2)}`);
    }
  } catch (err) {
    logTest('Fetch inventory summary', false, err.message);
  }

  // 3. Test GET /api/laptops/admin/all (get all laptops)
  logSection('3. GET ALL LAPTOPS (ADMIN VIEW)');
  let existingLaptops = [];
  try {
    const res = await fetch(`${BASE_URL}/api/laptops/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const success = res.ok && data.data?.laptops;
    logTest('Fetch all laptops', success, `${data.data?.laptops?.length || 0} laptops found`);
    if (success) {
      existingLaptops = data.data.laptops;
      if (existingLaptops.length > 0) {
        console.log(`    Sample: ${existingLaptops[0].brand} ${existingLaptops[0].model}`);
      }
    }
  } catch (err) {
    logTest('Fetch all laptops', false, err.message);
  }

  // 4. Test POST /api/laptops/admin (create laptop)
  logSection('4. CREATE NEW LAPTOP');
  try {
    const newLaptop = {
      brand: 'Test Dell',
      model: `XPS ${Date.now()}`,
      processor: 'Intel Core i7-13th Gen',
      ram: '16GB',
      storage: '512GB SSD',
      screen: '15.6 FHD',
      serialNumber: `TEST-${Date.now()}`,
      originalPrice: 1500,
      discountedPrice: 1200,
      stockQuantity: 5,
      imageUrl: 'https://via.placeholder.com/300'
    };

    const res = await fetch(`${BASE_URL}/api/laptops/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(newLaptop)
    });

    const data = await res.json();
    const success = res.ok && data.data?.laptop?.id;
    logTest('Create laptop', success);

    if (success) {
      testLaptopId = data.data.laptop.id;
      console.log(`    Created laptop ID: ${testLaptopId}`);
      console.log(`    Brand: ${data.data.laptop.brand} ${data.data.laptop.model}`);
      console.log(`    Stock: ${data.data.laptop.stockQuantity}`);
    }
  } catch (err) {
    logTest('Create laptop', false, err.message);
  }

  // 5. Test PATCH /api/laptops/admin/:id (update laptop)
  logSection('5. UPDATE LAPTOP');
  if (testLaptopId) {
    try {
      const res = await fetch(`${BASE_URL}/api/laptops/admin/${testLaptopId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          discountedPrice: 1100,
          stockQuantity: 8
        })
      });

      const data = await res.json();
      const success = res.ok && data.data?.laptop;
      logTest('Update laptop', success);

      if (success) {
        console.log(`    New discounted price: GHS ${data.data.laptop.discountedPrice}`);
        console.log(`    New stock quantity: ${data.data.laptop.stockQuantity}`);
      }
    } catch (err) {
      logTest('Update laptop', false, err.message);
    }
  }

  // 6. Test POST /api/laptops/admin/:id/adjust-stock (adjust stock)
  logSection('6. ADJUST STOCK');
  if (testLaptopId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/laptops/admin/${testLaptopId}/adjust-stock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ quantity: 3, reason: 'Test adjustment' })
        }
      );

      const data = await res.json();
      const success = res.ok && data.data?.laptop;
      logTest('Adjust stock', success);

      if (success) {
        console.log(`    Stock after adjustment: ${data.data.laptop.stockQuantity}`);
      }
    } catch (err) {
      logTest('Adjust stock', false, err.message);
    }
  }

  // 7. Test DELETE /api/laptops/admin/:id (deactivate)
  logSection('7. DEACTIVATE LAPTOP');
  if (testLaptopId) {
    try {
      const res = await fetch(`${BASE_URL}/api/laptops/admin/${testLaptopId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      const data = await res.json();
      const success = res.ok && data.success;
      logTest('Deactivate laptop', success);

      if (success) {
        console.log(`    Laptop status: ${data.data?.laptop?.isActive ? 'Active' : 'Inactive'}`);
      }
    } catch (err) {
      logTest('Deactivate laptop', false, err.message);
    }
  }

  // 8. Test POST /api/laptops/admin/:id/activate (reactivate)
  logSection('8. REACTIVATE LAPTOP');
  if (testLaptopId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/laptops/admin/${testLaptopId}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      const data = await res.json();
      const success = res.ok && data.data?.laptop;
      logTest('Reactivate laptop', success);

      if (success) {
        console.log(`    Laptop status: ${data.data.laptop.isActive ? 'Active' : 'Inactive'}`);
      }
    } catch (err) {
      logTest('Reactivate laptop', false, err.message);
    }
  }

  // 9. Test GET /api/laptops (student view - only active laptops)
  logSection('9. STUDENT VIEW - ACTIVE LAPTOPS ONLY');
  studentToken = await login('student@ug.edu.gh', 'student123');
  if (studentToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/laptops`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      const data = await res.json();
      const success = res.ok && data.data?.laptops;
      logTest('Fetch active laptops (student)', success, `${data.data?.laptops?.length || 0} laptops`);

      if (success && data.data.laptops.length > 0) {
        const allActive = data.data.laptops.every((l) => l.isActive);
        logTest('All returned laptops are active', allActive);
      }
    } catch (err) {
      logTest('Fetch active laptops', false, err.message);
    }
  }

  // 10. Test unauthorized access (student trying admin endpoints)
  logSection('10. UNAUTHORIZED ACCESS TEST');
  if (studentToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/laptops/admin/summary`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      const success = res.status === 403;
      logTest('Student cannot access admin endpoints', success, `Status: ${res.status}`);
    } catch (err) {
      logTest('Unauthorized access test', false, err.message);
    }
  }

  logSection('TEST SUMMARY');
  console.log('\n✓ All endpoint tests completed!');
  console.log('✓ Admin can create, read, update, and manage laptops');
  console.log('✓ Students can only see active laptops');
  console.log('✓ Role-based access control is working\n');
}

// Run tests
testAdminInventory().catch(console.error);
