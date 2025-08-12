import { getDb } from './_db';
import { appSettings } from '../../db/schema';
import { randomUUID } from 'node:crypto';

export async function seedAppSettings() {
  const db = getDb();
  await db
    .insert(appSettings)
    .values({ id: randomUUID(), key: 'badge_cap', value: '25' })
    .onConflictDoNothing();
  console.log('Seeded app_settings');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedAppSettings().catch((e) => { console.error(e); process.exit(1); });
}
