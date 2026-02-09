import process from 'process';
import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function seedTestDocuments() {
  try {
    console.log('Seeding test documents...');

    // Get the first application (APP-2024-0012)
    const app = await db.execute(sql`
      SELECT id FROM applications 
      WHERE reference = 'APP-2024-0012' 
      LIMIT 1
    `);

    if (!app.rows || app.rows.length === 0) {
      console.log('No application found with reference APP-2024-0012');
      return;
    }

    const applicationId = app.rows[0].id;
    console.log(`Found application: ${applicationId}`);

    // Check if documents already exist
    const existing = await db.execute(sql`
      SELECT COUNT(*) as count FROM document_references 
      WHERE application_id = ${applicationId}
    `);

    if (existing.rows && existing.rows[0].count > 0) {
      console.log('Documents already exist for this application');
      return;
    }

    // Insert placeholder documents
    const docTypes = [
      'GHANA_CARD_FRONT',
      'GHANA_CARD_BACK',
      'STUDENT_SELFIE',
      'ADMISSION_LETTER'
    ];

    for (const docType of docTypes) {
      const storageId = `applications/${applicationId}/${docType.toLowerCase()}/placeholder.jpg`;
      
      await db.execute(sql`
        INSERT INTO document_references (
          id, application_id, document_type, storage_id, file_hash, mime_type, uploaded_at
        ) VALUES (
          gen_random_uuid(),
          ${applicationId},
          ${docType},
          ${storageId},
          'placeholder-hash',
          'image/jpeg',
          NOW()
        )
      `);

      console.log(`✅ Created ${docType}`);
    }

    console.log('\n✅ Test documents seeded successfully!');
  } catch (error) {
    console.error('Error seeding documents:', error);
    process.exit(1);
  }
}

await seedTestDocuments();
