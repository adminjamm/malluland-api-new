import 'dotenv/config';
import { createDb } from '../../infra/db';
import { meetupRequests, meetups, users as usersTable } from '../../db/schema';
import { randomUUID } from 'node:crypto';

export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  const existingMeetups = await db.select({ id: meetups.id, hostId: meetups.hostId }).from(meetups);
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);

  if (existingMeetups.length === 0 || allUsers.length === 0) {
    console.warn('[seed:meetup_requests] No meetups or users found. Skipping.');
    return;
  }

  // Deterministic requester selection per meetup to keep idempotency
  function hashId(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }

  const planned: any[] = [];
  // Sort users for stable ordering
  const sortedUsers = [...allUsers].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const m of existingMeetups) {
    // choose one deterministic non-host user to request joining
    const candidates = sortedUsers.filter((u) => u.id !== m.hostId);
    if (candidates.length === 0) continue;
    const idx = hashId(m.id) % candidates.length;
    const requester = candidates[idx];
    planned.push({
      id: randomUUID(),
      meetupId: m.id,
      senderUserId: requester.id,
      message: 'Hey, would love to join!',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // De-duplicate by (meetupId + senderUserId)
  const existing = await db.select({ meetupId: meetupRequests.meetupId, senderUserId: meetupRequests.senderUserId }).from(meetupRequests);
  const existingKeys = new Set(existing.map((r: any) => `${r.meetupId}|${r.senderUserId}`));
  const reqs = planned.filter((r) => !existingKeys.has(`${r.meetupId}|${r.senderUserId}`));

  if (reqs.length) {
    await db.insert(meetupRequests).values(reqs);
    console.log(`[seed:meetup_requests] Inserted ${reqs.length} requests.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

