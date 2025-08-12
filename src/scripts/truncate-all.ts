import 'dotenv/config';
import { createDb } from '../infra/db';
import { sql } from 'drizzle-orm';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  // Fetch all public tables except drizzle internal tables
  const result: any = await db.execute(sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('drizzle_migrations')
  `);

  // Handle both { rows } and direct array depending on driver
  const rows: { tablename: string }[] = Array.isArray((result as any).rows) ? (result as any).rows : (result as any);
  const tables = rows.map(r => r.tablename).filter(Boolean);

  if (!tables.length) {
    console.log('[db:truncate-all] No tables found to truncate.');
    return;
  }

  const qualified = tables.map(t => `"public"."${t}"`).join(', ');
  const stmt = `TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE;`;

  await db.execute(sql.raw(stmt));
  console.log(`[db:truncate-all] Truncated tables: ${tables.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
