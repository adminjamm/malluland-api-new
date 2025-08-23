import 'dotenv/config';
import { createDb } from '../../infra/db';
import { users as usersTable, chatRequests } from '../../db/schema';
import { asc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  // Load some users to act as senders/receivers
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .orderBy(asc(usersTable.id));

  if (users.length < 2) {
    console.warn('[seed:chat_requests] Need at least 2 users. Skipping.');
    return;
  }

  const now = new Date();
  const planned: typeof chatRequests.$inferInsert[] = [] as any;

  // Simple ring: each user sends a chat request to the next user
  for (let i = 0; i < users.length; i++) {
    const from = users[i];
    const to = users[(i + 1) % users.length];
    if (from.id === to.id) continue;

    planned.push({
      id: randomUUID(),
      fromUserId: from.id,
      toUserId: to.id,
      message: `Hi ${to.name ?? 'there'}! Let's connect.`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    } as any);
  }

  if (!planned.length) {
    console.log('[seed:chat_requests] Nothing to insert.');
    return;
  }

  // Idempotency: avoid duplicates by (from_user_id, to_user_id, status='pending')
  // Fetch existing pairs
  const existingRes: any = await db.execute(
    // language=sql
    `SELECT from_user_id, to_user_id, status FROM chat_requests`
  );
  const existing = new Set(
    (Array.isArray(existingRes) ? existingRes : existingRes.rows).map(
      (r: any) => `${r.from_user_id}|${r.to_user_id}|${r.status}`
    )
  );

  const toInsert = planned.filter(
    (p: any) => !existing.has(`${p.fromUserId}|${p.toUserId}|${p.status}`)
  );

  if (toInsert.length) {
    await db.insert(chatRequests).values(toInsert);
    console.log(`[seed:chat_requests] Inserted ${toInsert.length} chat requests.`);
  } else {
    console.log('[seed:chat_requests] Nothing to insert (already up to date).');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

