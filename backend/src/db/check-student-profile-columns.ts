import { db } from './connection.ts';
import { sql } from 'drizzle-orm';

async function main() {
  // Query information_schema for columns in student_profiles
  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'student_profiles'
    ORDER BY column_name
  `);

  const columns = result.rows.map((r: { column_name: string }) => r.column_name);
  const expected = ['level', 'course', 'profile_photo_url'];
  const missing = expected.filter((c) => !columns.includes(c));

  console.log('[Schema Check] student_profiles columns:', columns);

  if (missing.length) {
    console.error('[Schema Check] Missing expected columns:', missing);
    process.exit(1);
  } else {
    console.log('[Schema Check] All expected columns present.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[Schema Check] Error:', err);
  process.exit(1);
});
