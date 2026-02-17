/**
 * Test Script: Admin Laptop Inventory System
 * Tests the complete admin laptop management flow
 */

const BASE_URL = 'http://localhost:3000';

// Admin test credentials
const ADMIN_EMAIL = 'admin@laptopapp.com';
const ADMIN_PASSWORD = 'Admin@123456';

let adminToken = null;
let laptopId = null;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function request(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    },
    ...(data && { body: JSON.stringify(data) }),
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('Admin Laptop Inventory System - Test Suite', 'blue');
  log('========================================\n', 'blue');

  // 1. Login as Admin
  log('1. Testing Admin Login...', 'yellow');
  const loginResult = await request('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (!loginResult.success) {
    log(`✗ Login failed: ${loginResult.error}`, 'red');
    return;
  }

  adminToken = loginResult.data.data.accessToken;
  log(`✓ Admin login successful. Token: ${adminToken.substring(0, 20)}...`, 'green');

  // 2. Get Active Laptops (Student view)
  log('\n2. Testing GET /api/laptops (Student view)...', 'yellow');
  const activeLaptopsResult = await request('GET', '/api/laptops');
  if (!activeLaptopsResult.success) {
    log(`✗ Failed to fetch active laptops: ${activeLaptopsResult.error}`, 'red');
  } else {
    const count = activeLaptopsResult.data.data?.laptops?.length || 0;
    log(`✓ Retrieved ${count} active laptops`, 'green');
  }

  // 3. Get All Laptops (Admin view)
  log('\n3. Testing GET /api/laptops/admin/all (Admin view)...', 'yellow');
  const allLaptopsResult = await request('GET', '/api/laptops/admin/all');
  if (!allLaptopsResult.success) {
    log(`✗ Failed to fetch all laptops: ${allLaptopsResult.error}`, 'red');
  } else {
    const count = allLaptopsResult.data.data?.laptops?.length || 0;
    log(`✓ Retrieved ${count} total laptops (including inactive)`, 'green');
  }

  // 4. Get Inventory Summary
  log('\n4. Testing GET /api/laptops/admin/summary (Inventory stats)...', 'yellow');
  const summaryResult = await request('GET', '/api/laptops/admin/summary');
  if (!summaryResult.success) {
    log(`✗ Failed to fetch summary: ${summaryResult.error}`, 'red');
  } else {
    const summary = summaryResult.data.data;
    log(`✓ Inventory Summary:`, 'green');
    log(`  - Total Laptops: ${summary.totalLaptops}`, 'green');
    log(`  - Active: ${summary.activeLaptops}`, 'green');
    log(`  - Total Stock: ${summary.totalStock}`, 'green');
    log(`  - Total Value: GHS ${summary.totalValue.toFixed(2)}`, 'green');
  }

  // 5. Create New Laptop
  log('\n5. Testing POST /api/laptops/admin (Create laptop)...', 'yellow');
  const createLaptopData = {
    brand: 'Test Dell',
    model: 'XPS 15 Test',
    processor: 'Intel Core i7-12700H',
    ram: '16GB DDR5',
    storage: '512GB NVMe SSD',
    screen: '15.6" 4K OLED',
    serialNumber: `TEST-${Date.now()}`,
    originalPrice: 2499.99,
    discountedPrice: 1999.99,
    stockQuantity: 5,
    imageUrl: 'https://via.placeholder.com/300x200?text=Dell+XPS',
  };

  const createResult = await request('POST', '/api/laptops/admin', createLaptopData);
  if (!createResult.success) {
    log(`✗ Failed to create laptop: ${createResult.error}`, 'red');
  } else {
    laptopId = createResult.data.data.id;
    log(`✓ Laptop created successfully. ID: ${laptopId}`, 'green');
  }

  // 6. Update Laptop
  if (laptopId) {
    log('\n6. Testing PATCH /api/laptops/admin/:id (Update laptop)...', 'yellow');
    const updateData = {
      ram: '32GB DDR5',
      discountedPrice: 1799.99,
      stockQuantity: 3,
    };

    const updateResult = await request(
      'PATCH',
      `/api/laptops/admin/${laptopId}`,
      updateData
    );
    if (!updateResult.success) {
      log(`✗ Failed to update laptop: ${updateResult.error}`, 'red');
    } else {
      log(`✓ Laptop updated successfully`, 'green');
    }
  }

  // 7. Adjust Stock
  if (laptopId) {
    log('\n7. Testing POST /api/laptops/admin/:id/adjust-stock (Adjust stock)...', 'yellow');
    const adjustData = {
      quantity: -1,
      reason: 'Sold 1 unit',
    };

    const adjustResult = await request(
      'POST',
      `/api/laptops/admin/${laptopId}/adjust-stock`,
      adjustData
    );
    if (!adjustResult.success) {
      log(`✗ Failed to adjust stock: ${adjustResult.error}`, 'red');
    } else {
      log(`✓ Stock adjusted successfully`, 'green');
    }
  }

  // 8. Deactivate Laptop
  if (laptopId) {
    log('\n8. Testing DELETE /api/laptops/admin/:id (Deactivate laptop)...', 'yellow');
    const deactivateResult = await request('DELETE', `/api/laptops/admin/${laptopId}`);
    if (!deactivateResult.success) {
      log(`✗ Failed to deactivate laptop: ${deactivateResult.error}`, 'red');
    } else {
      log(`✓ Laptop deactivated successfully`, 'green');
    }
  }

  // 9. Reactivate Laptop
  if (laptopId) {
    log('\n9. Testing POST /api/laptops/admin/:id/activate (Reactivate laptop)...', 'yellow');
    const activateResult = await request('POST', `/api/laptops/admin/${laptopId}/activate`);
    if (!activateResult.success) {
      log(`✗ Failed to activate laptop: ${activateResult.error}`, 'red');
    } else {
      log(`✓ Laptop reactivated successfully`, 'green');
    }
  }

  // 10. Verify Final Inventory
  log('\n10. Final Verification - GET /api/laptops/admin/summary...', 'yellow');
  const finalSummaryResult = await request('GET', '/api/laptops/admin/summary');
  if (!finalSummaryResult.success) {
    log(`✗ Failed to fetch final summary: ${finalSummaryResult.error}`, 'red');
  } else {
    const summary = finalSummaryResult.data.data;
    log(`✓ Final Inventory Summary:`, 'green');
    log(`  - Total Laptops: ${summary.totalLaptops}`, 'green');
    log(`  - Active: ${summary.activeLaptops}`, 'green');
    log(`  - Total Stock: ${summary.totalStock}`, 'green');
    log(`  - Total Value: GHS ${summary.totalValue.toFixed(2)}`, 'green');
  }

  log('\n========================================', 'blue');
  log('Test Suite Complete!', 'blue');
  log('========================================\n', 'blue');
}

// Run tests
runTests().catch(console.error);
