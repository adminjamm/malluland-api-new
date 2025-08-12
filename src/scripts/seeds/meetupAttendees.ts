import 'dotenv/config';
import { createDb } from '../../infra/db';
import { meetupAttendees, meetups, users as usersTable } from '../../db/schema';
import { randomUUID } from 'node:crypto';

export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  const existingMeetups = await db.select({ id: meetups.id, hostId: meetups.hostId }).from(meetups);
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);

  if (existingMeetups.length === 0 || allUsers.length === 0) {
    console.warn('[seed:meetup_attendees] No meetups or users found. Skipping.');
    return;
  }

  const attendeesPlanned: any[] = [];
  for (const m of existingMeetups) {
    // pick up to 2 attendees different from host
    const candidates = allUsers.filter((u) => u.id !== m.hostId);
    for (let i = 0; i < Math.min(2, candidates.length); i++) {
      attendeesPlanned.push({
        id: randomUUID(),
        meetupId: m.id,
        senderUserId: candidates[(i + Math.floor(Math.random() * candidates.length)) % candidates.length].id,
        chatRoomId: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // De-duplicate by (meetupId + senderUserId)
  const existing = await db.select({ meetupId: meetupAttendees.meetupId, senderUserId: meetupAttendees.senderUserId }).from(meetupAttendees);
  const existingKeys = new Set(existing.map((r: any) => `${r.meetupId}|${r.senderUserId}`));
  const attendees = attendeesPlanned.filter((a) => !existingKeys.has(`${a.meetupId}|${a.senderUserId}`));

  if (attendees.length) {
    await db.insert(meetupAttendees).values(attendees);
    console.log(`[seed:meetup_attendees] Inserted ${attendees.length} attendees.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

