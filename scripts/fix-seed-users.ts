import { db } from '../src/db/connection';
import { users } from '../src/db/schema';
import { inArray } from 'drizzle-orm';

async function fixUsers() {
  console.log('🔧 Fixing seeded users...');
  
  try {
    const testEmails = ['admin@laptopapp.com', 'src@ug.edu.gh', 'student@ug.edu.gh'];
    
    const updated = await db.update(users)
      .set({
        status: 'ACTIVE',
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        updatedAt: new Date(),
      })
      .where(inArray(users.email, testEmails))
      .returning();
    
    console.log(`✅ Updated ${updated.length} users to ACTIVE status`);
    updated.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
    });
  } catch (error) {
    console.error('❌ Failed to fix users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixUsers();
