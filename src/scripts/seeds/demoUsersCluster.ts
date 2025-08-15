import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../infra/db';
import { users as usersTable, userLocation } from '../../db/schema';

function within30kmAroundKochi(n: number): Array<{ lat: number; lng: number }> {
  const center = { lat: 9.9312, lng: 76.2673 }; // Kochi
  const latDelta = 30 / 111.32; // ~0.269
  const lngDelta = 30 / (111.32 * Math.cos((center.lat * Math.PI) / 180)); // ~0.273
  const out: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < n; i++) {
    // random point within rectangle, good enough for seed data
    const lat = center.lat + (Math.random() * 2 - 1) * (latDelta * 0.9);
    const lng = center.lng + (Math.random() * 2 - 1) * (lngDelta * 0.9);
    out.push({ lat, lng });
  }
  return out;
}

const firstNamesMale = ['Arjun', 'Vivek', 'Rahul', 'Nikhil', 'Kiran', 'Rohit', 'Akhil', 'Vishnu', 'Sandeep', 'Anand'];
const firstNamesFemale = ['Anita', 'Meera', 'Nisha', 'Divya', 'Sneha', 'Riya', 'Lakshmi', 'Neha', 'Pooja', 'Sara'];
const lastNames = ['Menon', 'Nair', 'Pillai', 'Varma', 'Panicker', 'Kurian', 'Joseph', 'Thomas', 'Mathew', 'Nambiar'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  const count = 30;
  const coords = within30kmAroundKochi(count);
  const now = new Date();

  // Build 30 users, alternating gender and states
  const demoUsers = Array.from({ length: count }).map((_, i) => {
    const isFemale = i % 2 === 0; // mix
    const gender = isFemale ? 'female' : 'male';
    const name = `${isFemale ? pick(firstNamesFemale) : pick(firstNamesMale)} ${pick(lastNames)}`;
    const userState = i % 3 === 0 ? 'approved_paid' : 'approved_free';
    const email = `demo${i + 1}@example.com`;
    return {
      id: randomUUID(),
      email,
      name,
      gender,
      city: 'Kochi',
      state: 'Kerala',
      country: 'IN',
      userState,
      refid: Math.random().toString(36).slice(2, 8).toUpperCase(),
      company: 'Demo Co',
      position: 'Member',
      bio: 'Hello from Malluland! I enjoy meetups and making new friends.',
      createdAt: now,
      updatedAt: now,
    } as typeof usersTable.$inferInsert;
  });

  // De-duplicate by email
  const existing = await db.select({ email: usersTable.email, id: usersTable.id }).from(usersTable);
  const existingByEmail = new Map(existing.map((u: any) => [u.email, u.id]));
  const toInsert = demoUsers.filter((u) => !existingByEmail.has(u.email));

  if (toInsert.length) {
    await db.insert(usersTable).values(toInsert);
    console.log(`[seed:demo-users] Inserted ${toInsert.length} users.`);
  } else {
    console.log('[seed:demo-users] No new users to insert.');
  }

  // Ensure locations for the 30 demo users (use inserted ones plus any existing matches by email)
  const usersInserted = toInsert.length ? toInsert : demoUsers.map((u) => ({ ...u, id: existingByEmail.get(u.email) } as any));

  // Build a map email->coord
  const emailToCoord = new Map(demoUsers.map((u, i) => [u.email, coords[i]]));

  // Load existing user_location
  const locRows = await db.select({ userId: userLocation.userId }).from(userLocation);
  const hasLoc = new Set(locRows.map((r: any) => r.userId));

  const locToInsert: Array<typeof userLocation.$inferInsert> = [];
  for (const u of usersInserted) {
    const uid = (u as any).id;
    if (!uid) continue;
    if (hasLoc.has(uid)) continue;
    const coord = emailToCoord.get((u as any).email) ?? coords[0];
    locToInsert.push({ userId: uid, lat: coord.lat, lng: coord.lng, createdAt: now, updatedAt: now } as any);
  }

  if (locToInsert.length) {
    await db.insert(userLocation).values(locToInsert);
    console.log(`[seed:demo-users] Inserted ${locToInsert.length} user_location rows.`);
  } else {
    console.log('[seed:demo-users] No new user_location rows to insert.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
