import { getDb } from './_db';
import { userStates } from '../../db/schema';
import { randomUUID } from 'node:crypto';

export async function seedUserStates() {
  const db = getDb();
  const data = [
    'applicant',
    'approved_free',
    'approved_paid',
    'disapproved',
    'deactivated',
    'banned',
    'shadow_banned',
  ].map((name) => ({ id: randomUUID(), name }));
  await db.insert(userStates).values(data).onConflictDoNothing();
  console.log('Seeded user_states');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUserStates().catch((e) => { console.error(e); process.exit(1); });
}
