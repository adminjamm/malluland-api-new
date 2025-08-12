import 'dotenv/config';
import { createDb } from '../../infra/db';
import { meetups, users as usersTable, catalogActivities } from '../../db/schema';
import { randomUUID } from 'node:crypto';
import { asc } from 'drizzle-orm';

export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  // Load some users to act as hosts
  const hosts = await db.select({ id: usersTable.id, name: usersTable.name, city: usersTable.city }).from(usersTable).orderBy(asc(usersTable.id));
  if (hosts.length === 0) {
    console.warn('[seed:meetups] No users found to host meetups. Skipping.');
    return;
  }

  // Load available activities
  const acts = await db.select({ id: catalogActivities.id, name: catalogActivities.name }).from(catalogActivities);
  if (acts.length === 0) {
    console.warn('[seed:meetups] No catalog activities found. Skipping.');
    return;
  }

  const now = new Date();
  // Deterministic planning: for idempotency, pick 1 activity per host based on a hash of hostId
  function hashId(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }
  const planned = hosts.map((host) => {
    const idx = hashId(host.id) % acts.length;
    const activity = acts[idx];
    // Next day at 10:00 local time for stability; still fine if time differs since name de-dupes
    const starts = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ends = new Date(starts.getTime() + 2 * 60 * 60 * 1000);
    const name = `${activity.name} with ${host.name?.split(' ')[0] ?? 'Host'}`.slice(0, 30);
    const city = host.city ?? 'Kochi';
    return {
      id: randomUUID(),
      hostId: host.id,
      name,
      activityId: activity.id,
      guests: 3,
      whoPays: 'host',
      currencyCode: 'INR',
      feeAmount: '0.00' as any,
      locationText: `${city} center`,
      description: `Join for a ${activity.name?.toLowerCase()} in ${city}.`,
      startsAt: starts,
      endsAt: ends,
      mapUrl: null,
      createdAt: now,
      updatedAt: now,
      meetupStatus: 'active',
      lat: null,
      lng: null,
      city,
      state: 'Kerala',
      country: 'IN',
    } as any;
  });

  // De-duplicate against existing by (hostId + name)
  // Using startsAt in the key caused duplicates if timestamps changed between runs.
  const existing = await db.select({ hostId: meetups.hostId, name: meetups.name }).from(meetups);
  const existingKeys = new Set(existing.map((m: any) => `${m.hostId}|${m.name}`));
  const meetupsToInsert = planned.filter((m) => !existingKeys.has(`${m.hostId}|${m.name}`));

  if (meetupsToInsert.length) {
    await db.insert(meetups).values(meetupsToInsert);
    console.log(`[seed:meetups] Inserted ${meetupsToInsert.length} meetups.`);
  }
}

// If executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

