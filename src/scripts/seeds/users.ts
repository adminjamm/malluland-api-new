import { getDb } from './_db';
import { users } from '../../db/schema';
import { randomUUID } from 'node:crypto';

function sixCharRefId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function seedUsers() {
  const db = getDb();
  const demoUsers = [
    {
      id: randomUUID(),
      email: 'alice@example.com',
      name: 'Alice Thomas',
      gender: 'female',
      city: 'Kochi',
      state: 'Kerala',
      country: 'IN',
      userState: 'approved_free',
      refid: sixCharRefId(),
      company: 'Acme Co',
      position: 'Designer',
      bio: 'Design, coffee, and board games.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      email: 'bob@example.com',
      name: 'Bob Menon',
      gender: 'male',
      city: 'Thiruvananthapuram',
      state: 'Kerala',
      country: 'IN',
      userState: 'approved_paid',
      refid: sixCharRefId(),
      company: 'Globex',
      position: 'Engineer',
      bio: 'Movies, trekking, and food.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      email: 'carol@example.com',
      name: 'Carol Nair',
      gender: 'female',
      city: 'Kozhikode',
      state: 'Kerala',
      country: 'IN',
      userState: 'applicant',
      refid: sixCharRefId(),
      company: 'Innotech',
      position: 'Product Manager',
      bio: 'Coffee meetups and road trips.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // De-duplicate by email at application level (since there is no unique constraint)
  const existing = await db.select({ email: users.email }).from(users);
  const existingEmails = new Set(existing.map((u) => u.email));
  const toInsert = demoUsers.filter((u) => !existingEmails.has(u.email));
  if (toInsert.length) {
    await db.insert(users).values(toInsert);
  }
  console.log('Seeded users');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().catch((e) => { console.error(e); process.exit(1); });
}
