import 'dotenv/config';
import { createDb } from '../../infra/db';
import { sql } from 'drizzle-orm';

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  // Backfill created_at and updated_at to NOW() where NULL using Drizzle SQL templates
  await db.execute(sql`UPDATE app_settings SET created_at = NOW() WHERE created_at IS NULL`);
  await db.execute(sql`UPDATE app_settings SET updated_at = NOW() WHERE updated_at IS NULL`);

  console.log('[fix] app_settings timestamps backfilled');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
