#!/usr/bin/env node

/**
 * Admin Analytics Endpoints Test
 * 
 * Tests all analytics endpoints with sample queries
 * Run: node test-admin-analytics.js
 */

const BASE_URL = 'http://localhost:3000/api/admin/analytics';

// Sample admin token (you'll need to replace with actual token)
let adminToken = null;

async function testAnalyticsEndpoints() {
  console.log('🔍 Testing Admin Analytics Endpoints\n');
  console.log('First, you need to login as an admin user.\n');

  // Test 1: Overview
  console.log('═'.repeat(60));
  console.log('Test 1: GET /api/admin/analytics/overview?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/overview?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        applications: {
          total: data.applications?.total,
          approvalRate: data.applications?.approvalRate,
        },
        payments: {
          total: data.payments?.total,
          completionRate: data.payments?.completionRate,
        },
        deliveries: {
          completionRate: data.deliveries?.completionRate,
        }
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 2: Trends
  console.log('═'.repeat(60));
  console.log('Test 2: GET /api/admin/analytics/trends?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/trends?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        dataPoints: data.data?.length,
        sampleData: data.data?.[0],
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 3: Review Times
  console.log('═'.repeat(60));
  console.log('Test 3: GET /api/admin/analytics/review-times?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/review-times?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        srcReview: {
          averageDays: data.srcReview?.averageDays,
          averageHours: data.srcReview?.averageHours,
          count: data.srcReview?.applicationsReviewed,
        },
        adminReview: {
          averageDays: data.adminReview?.averageDays,
          averageHours: data.adminReview?.averageHours,
          count: data.adminReview?.applicationsReviewed,
        }
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 4: Payment Analytics
  console.log('═'.repeat(60));
  console.log('Test 4: GET /api/admin/analytics/payments?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/payments?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        summary: {
          totalAmount: data.summary?.totalAmount,
          collected: data.summary?.collected,
          verified: data.summary?.verified,
        },
        trendPoints: data.trends?.length,
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 5: Delivery Analytics
  console.log('═'.repeat(60));
  console.log('Test 5: GET /api/admin/analytics/deliveries?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/deliveries?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        summary: {
          total: data.summary?.total,
          completed: data.summary?.completed,
          completionRate: data.summary?.completionRate,
        },
        trendPoints: data.trends?.length,
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 6: SRC Accountability
  console.log('═'.repeat(60));
  console.log('Test 6: GET /api/admin/analytics/src-accountability?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/src-accountability?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();

    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        summary: data.summary,
        sample: data.data?.[0],
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 7: University Performance
  console.log('═'.repeat(60));
  console.log('Test 7: GET /api/admin/analytics/universities?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/universities?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();

    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        summary: data.summary,
        topUniversity: data.data?.[0],
        totalUniversities: data.data?.length,
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 8: Underperforming Universities
  console.log('═'.repeat(60));
  console.log('Test 8: GET /api/admin/analytics/universities/underperforming?days=30');
  console.log('═'.repeat(60));
  try {
    const res = await fetch(`${BASE_URL}/universities/underperforming?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();

    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        summary: data.summary,
        sample: data.data?.[0],
        totalUnderperforming: data.data?.length,
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n');

  // Test 9: University Detail
  console.log('═'.repeat(60));
  console.log('Test 9: GET /api/admin/analytics/universities/:universityId?days=30');
  console.log('═'.repeat(60));
  console.log('Note: Replace UNIVERSITY_ID with a real ID to run this test.');
  try {
    const universityId = 'REPLACE_WITH_REAL_UUID';
    const res = await fetch(`${BASE_URL}/universities/${universityId}?days=30`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();

    if (res.ok) {
      console.log('✓ Status: 200 OK\n');
      console.log('Response Sample:');
      console.log(JSON.stringify({
        success: data.success,
        period: data.period,
        university: data.university,
        metrics: data.metrics,
        trendPoints: data.trends?.length,
      }, null, 2));
    } else {
      console.log(`✗ Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✓ Analytics Endpoint Tests Complete');
  console.log('═'.repeat(60));
}

// Instructions
console.log('\n📋 ADMIN ANALYTICS API ENDPOINTS TEST\n');
console.log('Before running this test, you need:');
console.log('1. Admin user account (email with @admin domain)');
console.log('2. Valid JWT token from /api/auth/login\n');
console.log('Update the adminToken variable with your token:\n');
console.log('Example Usage:');
console.log('  const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n');
console.log('Then run: node test-admin-analytics.js\n');

console.log('Waiting for manual token input...\n');
console.log('Manual Test Commands (curl):');
console.log('═'.repeat(60));
console.log('\n# Overview (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/overview?days=30\n');

console.log('# Trends (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/trends?days=30\n');

console.log('# Review Times (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/review-times?days=30\n');

console.log('# Payment Analytics (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/payments?days=30\n');

console.log('# Delivery Analytics (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/deliveries?days=30\n');

console.log('# SRC Accountability (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/src-accountability?days=30\n');

console.log('# Financial Analytics (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/financial?days=30\n');

console.log('# Delivery Performance & Risk Monitoring (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/delivery-performance?days=30\n');

console.log('# University Performance (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/universities?days=30\n');

console.log('# Underperforming Universities (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/universities/underperforming?days=30\n');

console.log('# University Detail (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  http://localhost:3000/api/admin/analytics/universities/REPLACE_WITH_REAL_UUID?days=30\n');

console.log('═'.repeat(60));
console.log('\n📊 EXPORT ENDPOINTS\n');
console.log('═'.repeat(60));

console.log('\n# Export Applications CSV');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  "http://localhost:3000/api/admin/export/applications/csv?startDate=2026-01-01&endDate=2026-02-09" \\');
console.log('  --output applications-report.csv\n');

console.log('# Export Payments CSV');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  "http://localhost:3000/api/admin/export/payments/csv?startDate=2026-01-01&endDate=2026-02-09" \\');
console.log('  --output payments-report.csv\n');

console.log('# Export Deliveries CSV');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  "http://localhost:3000/api/admin/export/deliveries/csv?startDate=2026-01-01&endDate=2026-02-09" \\');
console.log('  --output deliveries-report.csv\n');

console.log('# Export Analytics Summary JSON');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  "http://localhost:3000/api/admin/export/analytics/json?startDate=2026-01-01&endDate=2026-02-09" \\');
console.log('  --output analytics-summary.json\n');

console.log('# Export Comprehensive Report (HTML/PDF)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  "http://localhost:3000/api/admin/export/comprehensive/pdf?startDate=2026-01-01&endDate=2026-02-09" \\');
console.log('  --output comprehensive-report.html\n');

console.log('# Export with Filters (University + Status)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  "http://localhost:3000/api/admin/export/applications/csv?universityId=UUID&status=ADMIN_APPROVED" \\');
console.log('  --output filtered-applications.csv\n');

console.log('═'.repeat(60));
console.log('EXPORT ENDPOINTS (Admin Only)');
console.log('═'.repeat(60));

console.log('\n# Export Applications as CSV (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o applications.csv \\');
console.log('  "http://localhost:3000/api/admin/export/applications/csv?startDate=2026-01-09&endDate=2026-02-08"\n');

console.log('# Export Payments as CSV (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o payments.csv \\');
console.log('  "http://localhost:3000/api/admin/export/payments/csv?startDate=2026-01-09&endDate=2026-02-08"\n');

console.log('# Export Deliveries as CSV (last 30 days)');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o deliveries.csv \\');
console.log('  "http://localhost:3000/api/admin/export/deliveries/csv?startDate=2026-01-09&endDate=2026-02-08"\n');

console.log('# Export Analytics Summary as JSON');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o analytics.json \\');
console.log('  "http://localhost:3000/api/admin/export/analytics/json?startDate=2026-01-09&endDate=2026-02-08"\n');

console.log('# Export Comprehensive Report as PDF/HTML');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o comprehensive-report.html \\');
console.log('  "http://localhost:3000/api/admin/export/comprehensive/pdf?startDate=2026-01-09&endDate=2026-02-08"\n');

console.log('# Export with University Filter');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o filtered-applications.csv \\');
console.log('  "http://localhost:3000/api/admin/export/applications/csv?startDate=2026-01-09&endDate=2026-02-08&universityId=UNIVERSITY_UUID"\n');

console.log('# Export with Status Filter');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -o approved-applications.csv \\');
console.log('  "http://localhost:3000/api/admin/export/applications/csv?status=ADMIN_APPROVED&startDate=2026-01-09&endDate=2026-02-08"\n');

console.log('═'.repeat(60));

// Commented out - function serves as reference documentation
// testAnalyticsEndpoints();
