import { pool } from './connection.js';

async function dropAllTables() {
  try {
    console.log('Dropping all tables...');
    
    // Get all tables
    const result = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = result.rows.map(r => r.tablename);
    console.log('Tables found:', tables);
    
    if (tables.length > 0) {
      // Drop all tables with CASCADE
      const dropSQL = tables.map(t => `DROP TABLE IF EXISTS "${t}" CASCADE`).join('; ');
      await pool.query(dropSQL);
      console.log('✅ All tables dropped');
    }
    
    // Drop all types
    const typeResult = await pool.query(`
      SELECT typname FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `);
    
    const types = typeResult.rows.map(r => r.typname);
    if (types.length > 0) {
      for (const type of types) {
        await pool.query(`DROP TYPE IF EXISTS "${type}" CASCADE`);
      }
      console.log('✅ All types dropped');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

dropAllTables();
