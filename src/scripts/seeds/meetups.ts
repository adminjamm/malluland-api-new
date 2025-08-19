import 'dotenv/config';
import { createDb } from '../../infra/db';
import { meetups, users as usersTable, catalogActivities } from '../../db/schema';
import { randomUUID } from 'node:crypto';
import { asc } from 'drizzle-orm';

function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const diffToMon = (day + 6) % 7; // days since Monday
  date.setHours(10, 0, 0, 0); // default 10:00
  date.setDate(date.getDate() - diffToMon);
  return date;
}
function addDays(d: Date, days: number): Date { const x = new Date(d); x.setDate(x.getDate() + days); return x; }
function withTime(d: Date, h: number, m: number): Date { const x = new Date(d); x.setHours(h, m, 0, 0); return x; }
function safeDate(d: Date | undefined | null, fallback: Date): Date {
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
  return fallback;
}

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
  // Deterministic planning helpers
  function hashId(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }

  const weekMon = startOfWeek(now); // Monday 10:00 this week
  const sat = withTime(addDays(weekMon, 5), 11, 0); // Saturday 11:00
  const sun = withTime(addDays(weekMon, 6), 17, 0); // Sunday 17:00

  const nextWeekMon = addDays(weekMon, 7);
  const nextWeekSlots = [withTime(addDays(nextWeekMon, 1), 18, 30), withTime(addDays(nextWeekMon, 3), 8, 0)]; // Tue eve, Thu morning

  const weekAfterMon = addDays(weekMon, 14);
  const weekAfterSlots = [withTime(addDays(weekAfterMon, 2), 19, 0), withTime(addDays(weekAfterMon, 4), 9, 30)]; // Wed eve, Fri morning

  // Build 3-4 meetups per host: this week (weekday), this weekend, and two in the next 2 weeks
  const planned = hosts.flatMap((host) => {
    const city = host.city ?? 'Kochi';
    const h = hashId(host.id);
    const activity = acts[h % acts.length];
    const altActivity = acts[(h + 7) % acts.length];

    // This week weekday (Mon-Fri) choose based on hash; ensure future date within this Mon-Fri
    let weekdayOffset = (h % 5); // 0..4 = Mon..Fri
    let weekdayDate = addDays(weekMon, weekdayOffset);
    // If today is already past the chosen day/time, bump to next valid weekday within this week if possible, else keep original
    if (weekdayDate < now) {
      const diff = Math.min(4, Math.max(0, Math.floor((now.getTime() - weekMon.getTime()) / (24*60*60*1000))));
      weekdayOffset = Math.min(4, diff);
      weekdayDate = addDays(weekMon, weekdayOffset);
    }
    const weekdayStart = withTime(weekdayDate, 18, 0); // 6pm
    const weekdayEnd = new Date(weekdayStart.getTime() + 2 * 60 * 60 * 1000);

    // This weekend: choose Sat or Sun by hash
    const weekendStartRaw = (h % 2 === 0 ? sat : sun);
    const weekendStart = safeDate(weekendStartRaw, withTime(addDays(weekMon, 6), 17, 0));
    const weekendEnd = new Date(weekendStart.getTime() + 2 * 60 * 60 * 1000);

    // Next two weeks: pick two slots deterministically
    const nextWeekStart = safeDate(nextWeekSlots[h % nextWeekSlots.length], withTime(addDays(nextWeekMon, 2), 18, 30));
    const nextWeekEnd = new Date(nextWeekStart.getTime() + 2 * 60 * 60 * 1000);
    const weekAfterStart = safeDate(weekAfterSlots[(h >> 3) % weekAfterSlots.length], withTime(addDays(weekAfterMon, 3), 19, 0));
    const weekAfterEnd = new Date(weekAfterStart.getTime() + 2 * 60 * 60 * 1000);

    // Names: keep under 35, include slot label for idempotent uniqueness per host
    const firstName = host.name?.split(' ')[0] ?? 'Host';
    const base1 = `${activity.name} with ${firstName}`.slice(0, 28);
    const base2 = `${altActivity.name} with ${firstName}`.slice(0, 28);

    const items = [
      { label: 'Weekday', startsAt: weekdayStart, endsAt: weekdayEnd, activity },
      { label: (weekendStart.getDay() === 6 ? 'Saturday' : 'Sunday'), startsAt: weekendStart, endsAt: weekendEnd, activity: altActivity },
      { label: 'Next Week', startsAt: nextWeekStart, endsAt: nextWeekEnd, activity },
      { label: 'Week+2', startsAt: weekAfterStart, endsAt: weekAfterEnd, activity: altActivity },
    ];

    return items.map((it, i) => {
      const act = it.activity;
      const name = `${(i % 2 === 0 ? base1 : base2)} - ${it.label}`.slice(0, 35);
      return {
        id: randomUUID(),
        hostId: host.id,
        name,
        activityId: act.id,
        guests: 3 + (h % 3),
        whoPays: 'host',
        currencyCode: 'INR',
        feeAmount: '0.00' as any,
        locationText: `${city} center`,
        description: `Join for a ${act.name?.toLowerCase()} in ${city}.`,
        startsAt: it.startsAt,
        endsAt: it.endsAt,
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
  });

  // De-duplicate against existing by (hostId + name)
  const existing = await db.select({ hostId: meetups.hostId, name: meetups.name }).from(meetups);
  const existingKeys = new Set(existing.map((m: any) => `${m.hostId}|${m.name}`));
  const meetupsToInsert = planned.filter((m) => !existingKeys.has(`${m.hostId}|${m.name}`));

  if (meetupsToInsert.length) {
    await db.insert(meetups).values(meetupsToInsert);
    console.log(`[seed:meetups] Inserted ${meetupsToInsert.length} meetups.`);
  } else {
    console.log('[seed:meetups] Nothing to insert (already up to date).');
  }
}

// If executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

