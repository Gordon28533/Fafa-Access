/**
 * Complete Test Environment Setup
 * Creates users, profiles, laptops, and runs email trigger tests
 */

import { db } from './src/db/connection.js';
import { studentProfiles, laptops } from './src/db/schema/index.js';
import { eq } from 'drizzle-orm';

const testUserIds: Record<string, string> = {
  student: 'ea18a203-71c3-4201-a5cf-e6dac6f9d49e',
  src: 'e2f13fa9-bb6c-479c-9648-19a4346ad8be',
  admin: '64ce8366-a68f-4c60-9364-1c00a2505543',
  delivery: '53a0d48b-d8bc-42da-ad6f-5c9c249ce7ab'
};

async function setupCompleteTestEnvironment() {
  console.log('🔧 Setting up complete test environment...\n');

  try {
    // 1. Get or create a university
    console.log('🏫 Checking for university...');
    const { universities } = await import('./src/db/schema/index.js');
    
    let university = await db.select().from(universities).limit(1);
    
    if (university.length === 0) {
      console.log('Creating test university...');
      university = await db
        .insert(universities)
        .values({
          name: 'Test University',
          commissionRate: 50
        })
        .returning();
    }
    
    const universityId = university[0].id;
    console.log(`✅ Using university: ${university[0].name} (${universityId})\n`);

    // 2. Create Student Profile
    console.log('📝 Creating student profile...');
    
    await db
      .insert(studentProfiles)
      .values({
        userId: testUserIds.student,
        universityId: universityId,
        fullName: 'Test Student',
        ghanaCardRef: 'GHA-123456789-0',
        phoneNumber: '0241234567',
        address: 'Test Address, Accra, Ghana',
        level: 'LEVEL_100',
        course: 'BSc Computer Science'
      })
      .onConflictDoUpdate({
        target: studentProfiles.userId,
        set: {
          fullName: 'Test Student',
          ghanaCardRef: 'GHA-123456789-0',
          phoneNumber: '0241234567',
          address: 'Test Address, Accra, Ghana',
          level: 'LEVEL_100',
          course: 'BSc Computer Science'
        }
      })
      .returning();

    console.log(`✅ Student profile created/updated for user ${testUserIds.student}\n`);

    // 3. Verify laptops exist
    console.log('💻 Checking laptop inventory...');
    const existingLaptops = await db
      .select()
      .from(laptops)
      .where(eq(laptops.isActive, true))
      .limit(1);

    if (existingLaptops.length === 0) {
      console.log('⚠️  No laptops found - run seed-test-data.ts first');
      process.exit(1);
    }

    console.log(`✅ Found ${existingLaptops.length} active laptop(s)\n`);

    console.log('════════════════════════════════════════════════════════');
    console.log('✨ Test environment setup complete!\n');
    console.log('Test User Credentials:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('STUDENT  | Email: student@test.com  | Password: TestPass123!');
    console.log('         | Has profile: ✅ (Index: TEST2024001)');
    console.log('');
    console.log('SRC      | Email: src@test.com      | Password: TestPass123!');
    console.log('ADMIN    | Email: admin@test.com    | Password: TestPass123!');
    console.log('DELIVERY | Email: delivery@test.com | Password: TestPass123!');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log('🚀 Ready to run: node test-email-triggers.js\n');

  } catch (error) {
    console.error('❌ Setup failed:', (error as Error).message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setupCompleteTestEnvironment();
