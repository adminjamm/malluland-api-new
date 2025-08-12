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
import { eq } from 'drizzle-orm';

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
    'approved_free',
    'approved_paid',
    'disapproved',
    'deactivated',
    'banned',
    'shadow_banned',
  ].map((name) => ({ id: randomUUID(), name }));
  const existingUserStates = await db.select({ name: userStates.name }).from(userStates);
  const existingUserStateNames = new Set(existingUserStates.map(s => s.name));
  const newUserStates = userStatesData.filter(s => !existingUserStateNames.has(s.name));
  if (newUserStates.length) {
    await db
      .insert(userStates)
      .values(newUserStates);
  }

  // Seed catalog_activities (examples)
  const activities = [
    { id: 1, name: 'Coffee', slug: 'coffee', isActive: true },
    { id: 2, name: 'Dinner', slug: 'dinner', isActive: true },
    { id: 3, name: 'Movie', slug: 'movie', isActive: true },
    { id: 4, name: 'Road Trip', slug: 'road-trip', isActive: true },
    { id: 5, name: 'Board Games', slug: 'board-games', isActive: true },
  ];
  // insert only those that don't exist (by id)
  const existingActivities = await db.select({ id: catalogActivities.id }).from(catalogActivities);
  const existingActivityIds = new Set(existingActivities.map(a => a.id));
  const newActivities = activities.filter(a => !existingActivityIds.has(a.id));
  if (newActivities.length) {
    await db.insert(catalogActivities).values(newActivities);
  }

  // Seed catalog_traits (examples)
  const traits = [
    { id: 1, name: 'Friendly', slug: 'friendly', isActive: true },
    { id: 2, name: 'Adventurous', slug: 'adventurous', isActive: true },
    { id: 3, name: 'Creative', slug: 'creative', isActive: true },
    { id: 4, name: 'Ambitious', slug: 'ambitious', isActive: true },
    { id: 5, name: 'Empathetic', slug: 'empathetic', isActive: true },
  ];
  const existingTraits = await db.select({ id: catalogTraits.id }).from(catalogTraits);
  const existingTraitIds = new Set(existingTraits.map(t => t.id));
  const newTraits = traits.filter(t => !existingTraitIds.has(t.id));
  if (newTraits.length) {
    await db.insert(catalogTraits).values(newTraits);
  }

  // Seed catalog_actors (minimal examples)
  const actors = [
    { id: 1, name: 'Mohanlal', slug: 'mohanlal', isActive: true },
    { id: 2, name: 'Mammootty', slug: 'mammootty', isActive: true },
  ];
  const existingActors = await db.select({ id: catalogActors.id }).from(catalogActors);
  const existingActorIds = new Set(existingActors.map(a => a.id));
  const newActors = actors.filter(a => !existingActorIds.has(a.id));
  if (newActors.length) {
    await db.insert(catalogActors).values(newActors);
  }

  // Seed catalog_actresses (minimal examples)
  const actresses = [
    { id: 1, name: 'Manju Warrier', slug: 'manju-warrier', isActive: true },
    { id: 2, name: 'Parvathy Thiruvothu', slug: 'parvathy-thiruvothu', isActive: true },
  ];
  const existingActresses = await db.select({ id: catalogActresses.id }).from(catalogActresses);
  const existingActressIds = new Set(existingActresses.map(a => a.id));
  const newActresses = actresses.filter(a => !existingActressIds.has(a.id));
  if (newActresses.length) {
    await db.insert(catalogActresses).values(newActresses);
  }

  // Seed currencies (subset)
  const currencyData = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', priorityOrder: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', priorityOrder: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', priorityOrder: 3 },
  ];
  const existingCurrencies = await db.select({ code: currencies.code }).from(currencies);
  const existingCurrencyCodes = new Set(existingCurrencies.map(c => c.code));
  const newCurrencies = currencyData.filter(c => !existingCurrencyCodes.has(c.code));
  if (newCurrencies.length) {
    await db.insert(currencies).values(newCurrencies);
  }

  // Seed block_and_report options
  const reportOptions = [
    { id: randomUUID(), optionText: 'Spam or Scam', displayOrder: 1, isActive: true },
    { id: randomUUID(), optionText: 'Harassment or Hate', displayOrder: 2, isActive: true },
    { id: randomUUID(), optionText: 'Inappropriate Content', displayOrder: 3, isActive: true },
    { id: randomUUID(), optionText: 'Fake Profile', displayOrder: 4, isActive: true },
    { id: randomUUID(), optionText: 'Other', displayOrder: 5, isActive: true },
  ];
  const existingOptions = await db.select({ optionText: blockAndReport.optionText }).from(blockAndReport);
  const existingOptionTexts = new Set(existingOptions.map(o => o.optionText));
  const newOptions = reportOptions.filter(o => !existingOptionTexts.has(o.optionText));
  if (newOptions.length) {
    await db.insert(blockAndReport).values(newOptions);
  }

  // Seed app_settings baseline
  const badgeCap = await db.select().from(appSettings).where(eq(appSettings.key, 'badge_cap')).limit(1) as any;
  if (!badgeCap.length) {
    await db
      .insert(appSettings)
      .values({ id: randomUUID(), key: 'badge_cap', value: '25' });
  }

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
  const existingUsers = await db.select({ email: users.email }).from(users);
  const existingEmails = new Set(existingUsers.map(u => u.email));
  const newUsers = demoUsers.filter(u => !existingEmails.has(u.email));
  if (newUsers.length) {
    await db.insert(users).values(newUsers);
  }

  console.log('Seed completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
