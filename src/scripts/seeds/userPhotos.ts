import { getDb } from './_db';
import { userPhotos, users } from '../../db/schema';
import { randomUUID, createHash } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';

function hashToInt(input: string): number {
  const h = createHash('sha256').update(input).digest();
  // Use first 4 bytes as unsigned int
  return h.readUInt32BE(0);
}

function photoUrl(seed: string, w = 600, h = 800): string {
  // Deterministic random image with seed
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export async function seedUserPhotos() {
  const db = getDb();

  // Load all users deterministically
  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.id));

  if (allUsers.length === 0) {
    console.warn('[seed:user_photos] No users found. Skipping.');
    return;
  }

  const now = new Date();

  let totalInserted = 0;

  for (const u of allUsers) {
    // Fetch existing photos for this user to avoid duplicates
    const existing = await db
      .select({ imageType: userPhotos.imageType, position: userPhotos.position, originalUrl: userPhotos.originalUrl })
      .from(userPhotos)
      .where(eq(userPhotos.userId, u.id as any));

    const existingKey = new Set(existing.map((e: any) => `${e.imageType}|${e.position}`));
    const existingUrls = new Set(existing.map((e: any) => e.originalUrl));

    // Always ensure one avatar at position 0
    const avatarSeed = `${u.id}:avatar`;
    const avatarUrl = photoUrl(avatarSeed, 256, 256);
    const avatar: any = {
      id: randomUUID(),
      userId: u.id,
      originalUrl: avatarUrl,
      optimizedUrl: null,
      krakenId: null,
      krakenResponse: null,
      imageType: 'avatar',
      position: 0,
      isActive: true,
      optimizationStatus: 'pending',
      optimizationAttempts: 0,
      optimizedAt: null,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const toInsert: any[] = [];
    if (!existingKey.has('avatar|0') && !existingUrls.has(avatarUrl)) {
      toInsert.push(avatar);
    }

    // Number of photos per user: 0..9, deterministic but pseudo-random per user
    const count = hashToInt(`${u.id}:photo-count`) % 10; // 0-9

    for (let i = 1; i <= count; i++) {
      const seed = `${u.id}:photo:${i}`;
      const url = photoUrl(seed, 1080, 1440);
      const key = `photo|${i}`;
      if (existingKey.has(key) || existingUrls.has(url)) continue;
      toInsert.push({
        id: randomUUID(),
        userId: u.id,
        originalUrl: url,
        optimizedUrl: null,
        krakenId: null,
        krakenResponse: null,
        imageType: 'photo',
        position: i,
        isActive: true,
        optimizationStatus: 'pending',
        optimizationAttempts: 0,
        optimizedAt: null,
        deactivatedAt: null,
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    if (toInsert.length) {
      await db.insert(userPhotos).values(toInsert);
      totalInserted += toInsert.length;
      // Optional per-user log
      // console.log(`[seed:user_photos] ${u.id}: inserted ${toInsert.length}`);
    }
  }

  console.log(`[seed:user_photos] Completed. Inserted ${totalInserted} rows.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUserPhotos().catch((e) => { console.error(e); process.exit(1); });
}
