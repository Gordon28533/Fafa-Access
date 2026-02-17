import { pool } from './connection.js';
import fs from 'fs/promises';
import path from 'path';

async function initializeDatabase() {
  try {
    console.log('⏳ Initializing database schema...');
    
    // Read migration files in order
    const migrationsDir = './drizzle/migrations';
    const files = [
      '0000_woozy_harry_osborn.sql',
      '0001_misty_donald_blake.sql',
      '0002_student_profile_settings.sql',
      '0003_student_profile_academic.sql',
      '0004_elite_union_jack.sql',
    ];
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`  Running ${file}...`);
      
      const sql = await fs.readFile(filePath, 'utf-8');
      
      // Split by statement-breakpoint and filter out empty statements
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (error) {
          // Ignore errors for now (like constraint already exists)
          const err = error as Error;
          if (!err.message.includes('already exists')) {
            console.error(`    Error in ${file}:`, err.message.substring(0, 100));
          }
        }
      }
    }
    
    console.log('✅ Database schema initialized');
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', (error as Error).message);
    process.exit(1);
  }
}

initializeDatabase();
