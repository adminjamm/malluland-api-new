import { getDb } from './_db';
import { users } from '../../db/schema';
import { asc, eq, isNull } from 'drizzle-orm';

function randomDobBetween(minAge: number, maxAge: number): Date {
  const now = new Date();
  const minBirth = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
  const maxBirth = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
  const span = maxBirth.getTime() - minBirth.getTime();
  const offset = Math.floor(Math.random() * span);
  const d = new Date(minBirth.getTime() + offset);
  // Normalize to a safe date component to avoid month-end edge cases
  d.setHours(0,0,0,0);
  return d;
}

export async function seedUsersDob(minAge = 18, maxAge = 55) {
  const db = getDb();
  // Fetch users missing dob
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.dob))
    .orderBy(asc(users.id));

  if (!rows.length) {
    console.log('[seed:usersDob] No users without dob');
    return;
  }

  const now = new Date();
  const updates: { id: string; dob: Date; updatedAt: Date }[] = rows.map((r) => ({
    id: r.id,
    dob: randomDobBetween(minAge, maxAge),
    updatedAt: now,
  }));

  // Perform updates one by one to keep it simple and compatible
  for (const u of updates) {
    await db.update(users)
      .set({ dob: u.dob as any, updatedAt: u.updatedAt as any })
      .where(eq(users.id, u.id));
  }

  console.log(`[seed:usersDob] Updated DOB for ${updates.length} users`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsersDob().catch((e) => { console.error(e); process.exit(1); });
}

