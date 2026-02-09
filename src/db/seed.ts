import { db } from './connection';
import { 
  universities, 
  users, 
  srcOfficers, 
  studentProfiles,
  universityWallets,
  srcCommissionConfigs 
} from './schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Check if seed already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@laptopapp.com')).limit(1);
    if (existingAdmin.length > 0) {
      console.log('✅ Database already seeded!');
      console.log('\nDefault Accounts:');
      console.log('Admin: admin@laptopapp.com / admin123');
      console.log('SRC: src@ug.edu.gh / src123');
      console.log('Student: student@ug.edu.gh / student123');
      console.log('Delivery: delivery@laptopapp.com / delivery123');
      return;
    }

    // Create Universities
    console.log('Creating universities...');
    const [uni1, uni2, uni3] = await db.insert(universities)
      .values([
        { name: 'University of Ghana', commissionRate: 0.05 },
        { name: 'Kwame Nkrumah University of Science and Technology', commissionRate: 0.05 },
        { name: 'University of Cape Coast', commissionRate: 0.05 },
      ])
      .returning();

    // Create Admin User
    console.log('Creating admin user...');
    await db.insert(users)
      .values({
        email: 'admin@laptopapp.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      })
      .returning();

    // Create SRC User and Officer
    console.log('Creating SRC users...');
    const [srcUser1] = await db.insert(users)
      .values({
        email: 'src@ug.edu.gh',
        passwordHash: await bcrypt.hash('src123', 10),
        role: 'SRC',
        status: 'ACTIVE',
        emailVerified: true,
      })
      .returning();

    await db.insert(srcOfficers)
      .values({
        userId: srcUser1.id,
        universityId: uni1!.id,
        position: 'SRC President',
      });

    // Create Student User and Profile
    console.log('Creating student users...');
    const [studentUser1] = await db.insert(users)
      .values({
        email: 'student@ug.edu.gh',
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerified: true,
      })
      .returning();

    await db.insert(studentProfiles)
      .values({
        userId: studentUser1.id,
        universityId: uni1!.id,
        fullName: 'John Doe',
        ghanaCardRef: 'GHA-000000000-0',
        phoneNumber: '+233200000000',
        address: 'Accra, Ghana',
      });

    // Create Delivery User
    console.log('Creating delivery user...');
    await db.insert(users)
      .values({
        email: 'delivery@laptopapp.com',
        passwordHash: await bcrypt.hash('delivery123', 10),
        role: 'DELIVERY',
        status: 'ACTIVE',
        emailVerified: true,
      })
      .returning();

    // Create University Wallets
    console.log('Creating university wallets...');
    await db.insert(universityWallets)
      .values([
        { universityId: uni1!.id },
        { universityId: uni2!.id },
        { universityId: uni3!.id },
      ]);

    // Create Commission Configs
    console.log('Creating commission configs...');
    await db.insert(srcCommissionConfigs)
      .values([
        { universityId: uni1!.id, commissionRate: 0.05 },
        { universityId: uni2!.id, commissionRate: 0.05 },
        { universityId: uni3!.id, commissionRate: 0.05 },
      ]);

    console.log('✅ Database seeded successfully!');
    console.log('\nDefault Accounts:');
    console.log('Admin: admin@laptopapp.com / admin123');
    console.log('SRC: src@ug.edu.gh / src123');
    console.log('Student: student@ug.edu.gh / student123');
    console.log('Delivery: delivery@laptopapp.com / delivery123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
