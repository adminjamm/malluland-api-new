import { getDb } from './_db';
import { appSettings } from '../../db/schema';
import { randomUUID } from 'node:crypto';

export async function seedAppSettings() {
  const db = getDb();
  const now = new Date();
  await db
    .insert(appSettings)
    .values({ id: randomUUID(), key: 'badge_cap', value: '25', createdAt: now, updatedAt: now })
    .onConflictDoNothing();
  console.log('Seeded app_settings');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedAppSettings().catch((e) => { console.error(e); process.exit(1); });
}
