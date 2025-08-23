import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { createDb } from '../../infra/db';

// Backfill user_selfie rows for all users who don't yet have one, with status 'new'.
export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url) as any;

  console.log('[seed:user_selfie] Populating for users without a selfie (status = "new")...');

  const result: any = await db.execute(sql`
    INSERT INTO user_selfie (user_id, status)
    SELECT u.id, 'new'
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM user_selfie s WHERE s.user_id = u.id
    )
    RETURNING user_id;
  `);

  const rows = (result?.rows ?? result ?? []) as Array<{ user_id: string }>; // postgres-js vs node-postgres
  const inserted = Array.isArray(rows) ? rows.length : 0;
  console.log(`[seed:user_selfie] Inserted ${inserted} row(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
