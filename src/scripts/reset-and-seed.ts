import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { createDb } from '../infra/db';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  // Truncate in a single statement; RESTART IDENTITY resets sequences; CASCADE handles FKs
  await db.execute(sql`TRUNCATE TABLE
    user_bookmarks,
    user_favorites_text,
    user_favorite_actresses,
    user_favorite_actors,
    user_traits,
    user_interests,
    user_selfie,
    user_photos,
    app_settings,
    block_and_report,
    currencies,
    catalog_actresses,
    catalog_actors,
    catalog_traits,
    catalog_activities,
    users
    RESTART IDENTITY CASCADE`);

  // After truncation, call the main seed script
  const { default: runSeed } = await import('./seeds/seed-all');
  if (typeof runSeed === 'function') {
    await runSeed();
  } else {
    // If seed.ts doesn't default export a function, just import it to execute its top-level main()
    await import('./seeds/seed-all');
  }

  console.log('Reset and seed complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

