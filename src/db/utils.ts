/**
 * Database Utilities
 * Helper functions for common database operations
 */

import { db } from './connection';
import { sql } from 'drizzle-orm';

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const result = await db.execute(sql`
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
  `);

  return result.rows;
}

/**
 * Get active database connections
 */
export async function getActiveConnections() {
  const result = await db.execute(sql`
    SELECT 
      count(*) as total,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle
    FROM pg_stat_activity
    WHERE datname = current_database()
  `);

  return result.rows[0];
}

/**
 * Vacuum database (maintenance)
 */
export async function vacuumDatabase() {
  try {
    await db.execute(sql`VACUUM ANALYZE`);
    console.log('Database vacuum completed successfully');
    return true;
  } catch (error) {
    console.error('Database vacuum failed:', error);
    return false;
  }
}

/**
 * Check for schema drift
 * Compares actual database schema with Drizzle schema
 */
export async function checkSchemaDrift() {
  // This would typically be done via drizzle-kit check
  // For runtime checks, we can query information_schema
  const result = await db.execute(sql`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  return result.rows;
}

/**
 * Generate unique reference number
 */
export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Batch insert with transaction
 */
export async function batchInsert<T extends Record<string, never>>(
  table: unknown,
  records: T[],
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await db.transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.insert(table as never).values(batch) as any);
    });
  }
}

/**
 * Get table row count
 */
export async function getTableCount(tableName: string): Promise<number> {
  const result = await db.execute(
    sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
  );
  return Number(result.rows[0]?.count || 0);
}

/**
 * Truncate table (dev only)
 */
export async function truncateTable(tableName: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot truncate tables in production');
  }
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableName} CASCADE`));
}

/**
 * Export table to JSON
 */
export async function exportTableToJson(tableName: string): Promise<unknown[]> {
  const result = await db.execute(sql.raw(`SELECT * FROM ${tableName}`));
  return result.rows;
}

/**
 * Database backup metadata
 */
export async function getBackupMetadata() {
  return {
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0],
    tables: await db.execute(sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `).then(r => r.rows.map(row => row.tablename)),
  };
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      ) as exists
    `);
    return !result.rows[0]?.exists;
  } catch {
    return true;
  }
}

/**
 * Get last migration timestamp
 */
export async function getLastMigrationTimestamp(): Promise<Date | null> {
  try {
    const result = await db.execute(sql`
      SELECT created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return (result.rows[0]?.created_at as Date | null) || null;
  } catch {
    return null;
  }
}
