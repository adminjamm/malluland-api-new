import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../infra/db';
import { users as usersTable, bookmarks } from '../../db/schema';

// Seed bookmarks into bookmarks table with idempotency (no duplicate userId/bookmarkedUserId pairs)
export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  // Load approved users as candidates
  const users = await db
    .select({ id: usersTable.id, state: usersTable.userState })
    .from(usersTable);

  const approved = users.filter((u: any) => u.state === 'approved_free' || u.state === 'approved_paid');
  if (approved.length < 2) {
    console.warn('[seed:bookmarks] Not enough approved users to create bookmarks.');
    return;
  }

  // Build deterministic bookmarks: for each user i, bookmark the next k users in a ring
  const K = Math.min(3, Math.max(1, Math.floor(approved.length / 3))); // cap at 3
  const planned: Array<{ userId: string; bookmarkedUserId: string }> = [];
  for (let i = 0; i < approved.length; i++) {
    for (let j = 1; j <= K; j++) {
      const target = approved[(i + j) % approved.length];
      const source = approved[i];
      if (source.id !== target.id) {
        planned.push({ userId: source.id, bookmarkedUserId: target.id });
      }
    }
  }

  // Fetch existing pairs from bookmarks to ensure idempotency
  const existing = await db
    .select({ userId: bookmarks.userId, bookmarkedUserId: bookmarks.bookmarkedUserId })
    .from(bookmarks);
  const existingSet = new Set(existing.map(r => `${r.userId}|${r.bookmarkedUserId}`));

  const now = new Date();
  const toInsert = planned
    .filter(p => !existingSet.has(`${p.userId}|${p.bookmarkedUserId}`))
    .map(p => ({ id: randomUUID(), userId: p.userId, bookmarkedUserId: p.bookmarkedUserId, createdAt: now, updatedAt: now }));

  if (toInsert.length === 0) {
    console.log('[seed:bookmarks] No new bookmarks to insert.');
    return;
  }

  await db.insert(bookmarks).values(toInsert);
  console.log(`[seed:bookmarks] Inserted ${toInsert.length} bookmarks.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
