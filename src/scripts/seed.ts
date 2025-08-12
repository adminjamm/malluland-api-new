import 'dotenv/config';
import { createDb } from '../infra/db';
import { 
  catalogActivities,
  catalogTraits,
  catalogActors,
  catalogActresses,
  currencies,
  blockAndReport,
  userStates,
  appSettings,
  users,
} from '../db/schema';
import { randomUUID } from 'node:crypto';

function sixCharRefId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const db = createDb(databaseUrl);

  // Seed user_states
  const userStatesData = [
    'pending',
    'approved',
    'approved',
    'disapproved',
    'deactivated',
    'banned',
    'shadow_banned',
  ].map((name) => ({ id: randomUUID(), name }));
  await db
    .insert(userStates)
    .values(userStatesData)
    .onConflictDoNothing();

  // Seed catalog_activities (examples)
  const activities = [
    { id: 1, name: 'Coffee', slug: 'coffee', isActive: true },
    { id: 2, name: 'Dinner', slug: 'dinner', isActive: true },
    { id: 3, name: 'Movie', slug: 'movie', isActive: true },
    { id: 4, name: 'Road Trip', slug: 'road-trip', isActive: true },
    { id: 5, name: 'Board Games', slug: 'board-games', isActive: true },
  ];
  await db.insert(catalogActivities).values(activities).onConflictDoNothing();

  // Seed catalog_traits (examples)
  const traits = [
    { id: 1, name: 'Friendly', slug: 'friendly', isActive: true },
    { id: 2, name: 'Adventurous', slug: 'adventurous', isActive: true },
    { id: 3, name: 'Creative', slug: 'creative', isActive: true },
    { id: 4, name: 'Ambitious', slug: 'ambitious', isActive: true },
    { id: 5, name: 'Empathetic', slug: 'empathetic', isActive: true },
  ];
  await db.insert(catalogTraits).values(traits).onConflictDoNothing();

  // Seed catalog_actors (minimal examples)
  const actors = [
    { id: 1, name: 'Mohanlal', slug: 'mohanlal', isActive: true },
    { id: 2, name: 'Mammootty', slug: 'mammootty', isActive: true },
  ];
  await db.insert(catalogActors).values(actors).onConflictDoNothing();

  // Seed catalog_actresses (minimal examples)
  const actresses = [
    { id: 1, name: 'Manju Warrier', slug: 'manju-warrier', isActive: true },
    { id: 2, name: 'Parvathy Thiruvothu', slug: 'parvathy-thiruvothu', isActive: true },
  ];
  await db.insert(catalogActresses).values(actresses).onConflictDoNothing();

  // Seed currencies (subset)
  const currencyData = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', priorityOrder: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', priorityOrder: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', priorityOrder: 3 },
  ];
  await db.insert(currencies).values(currencyData).onConflictDoNothing();

  // Seed block_and_report options
  const reportOptions = [
    { id: randomUUID(), optionText: 'Spam or Scam', displayOrder: 1, isActive: true },
    { id: randomUUID(), optionText: 'Harassment or Hate', displayOrder: 2, isActive: true },
    { id: randomUUID(), optionText: 'Inappropriate Content', displayOrder: 3, isActive: true },
    { id: randomUUID(), optionText: 'Fake Profile', displayOrder: 4, isActive: true },
    { id: randomUUID(), optionText: 'Other', displayOrder: 5, isActive: true },
  ];
  await db.insert(blockAndReport).values(reportOptions).onConflictDoNothing();

  // Seed app_settings baseline
  await db
    .insert(appSettings)
    .values({ id: randomUUID(), key: 'badge_cap', value: '25' })
    .onConflictDoNothing();

  // Seed users (minimal examples)
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
  await db.insert(users).values(demoUsers).onConflictDoNothing();

  console.log('Seed completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
