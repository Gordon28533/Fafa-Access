/**
 * Test User Setup Script
 * Creates test users for all roles to facilitate manual testing
 * 
 * SECURITY NOTE: Test user passwords are defined in this script (lines 17-42)
 * but are NOT logged to console to prevent clear-text password exposure.
 * 
 * To view test credentials: Check the testUsers array in this file's source code.
 * Default test password for all users: TestPass123!
 */

import process from 'process';
import bcrypt from 'bcrypt';
import { db } from './src/db/connection.ts';
import { users } from './src/db/schema/users.ts';
import { eq } from 'drizzle-orm';

async function setupTestUsers() {
  console.log('🔧 Setting up test users...\n');

  try {
    // Test credentials
    const testUsers = [
      {
        email: 'student@test.com',
        password: 'TestPass123!',
        role: 'STUDENT',
        fullName: 'Test Student'
      },
      {
        email: 'src@test.com',
        password: 'TestPass123!',
        role: 'SRC',
        fullName: 'Test SRC Officer'
      },
      {
        email: 'admin@test.com',
        password: 'TestPass123!',
        role: 'ADMIN',
        fullName: 'Test Admin'
      },
      {
        email: 'delivery@test.com',
        password: 'TestPass123!',
        role: 'DELIVERY',
        fullName: 'Test Delivery Staff'
      }
    ];

    for (const testUser of testUsers) {
      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  ${testUser.role}: ${testUser.email} (already exists)`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(testUser.password, 10);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: testUser.email,
          passwordHash: hashedPassword,
          role: testUser.role,
          fullName: testUser.fullName,
          emailVerified: true,
          status: 'ACTIVE'
        })
        .returning();

      console.log(`✅ ${testUser.role}: ${testUser.email}`);
      console.log(`   Password: ********** (see source code for test credentials)`);
      console.log(`   ID: ${newUser.id}\n`);
    }

    console.log('\n✨ Test users created successfully!\n');
    console.log('Login with these test accounts:\n');
    console.log('Note: All test users have the same password (see source code for credentials)\n');
    testUsers.forEach(u => {
      console.log(`${u.role.padEnd(10)} | Email: ${u.email.padEnd(20)} | Password: **********`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    process.exit(1);
  }
}

setupTestUsers();
