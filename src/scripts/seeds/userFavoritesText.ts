import { getDb } from './_db';
import { userFavoritesText, users } from '../../db/schema';
import { asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// Seed default textual favorites for all users.
// Categories: musician | movie | game_sport | dish
// Idempotent: will not insert duplicates for an existing user's category/position or text.
export async function seedUserFavoritesText() {
  const db = getDb();

  // Get all users deterministically
  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.id));

  if (allUsers.length === 0) {
    console.warn('[seed:user_favorites_text] No users found. Skipping.');
    return;
  }

  const now = new Date();

  // Defaults per category with deterministic order
  const defaults: Record<string, string[]> = {
    movie: ['Drishyam', 'Premam', 'Kumbalangi Nights'],
    musician: ['A. R. Rahman', 'Ilaiyaraaja', 'KS Chithra'],
    game_sport: ['Cricket', 'Badminton', 'Football'],
    dish: ['Biriyani', 'Appam and Stew', 'Puttu and Kadala'],
  };

  let totalInserted = 0;

  for (const u of allUsers) {
    // Load existing favorites for this user
    const existing = await db
      .select({ category: userFavoritesText.category, position: userFavoritesText.position, textValue: userFavoritesText.textValue })
      .from(userFavoritesText)
      .where(eq(userFavoritesText.userId, u.id as any));

    const existingPosKey = new Set(existing.map((e: any) => `${e.category}|${e.position}`));
    const existingTextKey = new Set(existing.map((e: any) => `${e.category}|${(e.textValue ?? '').toLowerCase()}`));

    const toInsert: any[] = [];

    for (const [category, values] of Object.entries(defaults)) {
      values.forEach((text, idx) => {
        const posKey = `${category}|${idx}`;
        const textKey = `${category}|${text.toLowerCase()}`;
        if (existingPosKey.has(posKey) || existingTextKey.has(textKey)) return;
        toInsert.push({
          id: randomUUID(),
          userId: u.id,
          category,
          textValue: text,
          position: idx,
          createdAt: now,
        });
      });
    }

    if (toInsert.length) {
      await db.insert(userFavoritesText).values(toInsert);
      totalInserted += toInsert.length;
    }
  }

  console.log(`[seed:user_favorites_text] Completed. Inserted ${totalInserted} rows.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUserFavoritesText().catch((e) => { console.error(e); process.exit(1); });
}
