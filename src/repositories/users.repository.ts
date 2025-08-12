import { Service, Inject } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, userImages, userSelfie, userInterests, userTraits, userFavoriteActors, userFavoriteActresses, socialLinks } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export type Db = NodePgDatabase;

@Service()
export class UsersRepository {
  constructor(@Inject('db') private readonly db: Db) {}

  // Users
  getById(id: string) {
    return this.db.select().from(users).where(eq(users.id, id)).limit(1);
  }

  async updateById(id: string, data: Partial<typeof users.$inferInsert>) {
    await this.db.update(users).set(data).where(eq(users.id, id));
    const [row] = await this.getById(id);
    return row;
  }

  // Photos
  async addPhoto(userId: string, photo: { originalUrl: string; imageType: string; position: number; optimizedUrl?: string | null }) {
    const row = { id: randomUUID(), userId, originalUrl: photo.originalUrl, optimizedUrl: photo.optimizedUrl ?? null, imageType: photo.imageType, position: photo.position };
    await this.db.insert(userImages).values(row);
    return row;
  }
  listPhotos(userId: string) {
    return this.db.select().from(userImages).where(eq(userImages.userId, userId)).orderBy(userImages.position);
  }

  // Selfies
  async addSelfie(userId: string, selfieUrl: string, status: string = 'pending') {
    const row = { id: randomUUID(), userId, selfieUrl, status, createdAt: new Date(), updatedAt: new Date() } as any;
    await this.db.insert(userSelfie).values(row);
    return row;
  }
  listSelfies(userId: string) {
    return this.db.select().from(userSelfie).where(eq(userSelfie.userId, userId));
  }

  // Interests
  async replaceInterests(userId: string, interestIds: number[]) {
    // simple replace strategy
    // delete existing
    await this.db.delete(userInterests).where(eq(userInterests.userId, userId));
    // insert
    if (interestIds.length) {
      const rows = interestIds.map((id, idx) => ({ userId, interestId: id, position: idx + 1 }));
      await this.db.insert(userInterests).values(rows);
    }
  }
  listInterests(userId: string) {
    return this.db.select().from(userInterests).where(eq(userInterests.userId, userId)).orderBy(userInterests.position);
  }

  // Traits
  async replaceTraits(userId: string, traitIds: number[]) {
    await this.db.delete(userTraits).where(eq(userTraits.userId, userId));
    if (traitIds.length) {
      const rows = traitIds.map((id, idx) => ({ userId, traitId: id, position: idx + 1 }));
      await this.db.insert(userTraits).values(rows);
    }
  }
  listTraits(userId: string) {
    return this.db.select().from(userTraits).where(eq(userTraits.userId, userId)).orderBy(userTraits.position);
  }

  // Favorite actors
  async replaceFavoriteActors(userId: string, actorIds: number[]) {
    await this.db.delete(userFavoriteActors).where(eq(userFavoriteActors.userId, userId));
    if (actorIds.length) {
      const rows = actorIds.map((id, idx) => ({ userId, actorId: id, position: idx + 1 }));
      await this.db.insert(userFavoriteActors).values(rows);
    }
  }
  listFavoriteActors(userId: string) {
    return this.db.select().from(userFavoriteActors).where(eq(userFavoriteActors.userId, userId)).orderBy(userFavoriteActors.position);
  }

  // Favorite actresses
  async replaceFavoriteActresses(userId: string, actressIds: number[]) {
    await this.db.delete(userFavoriteActresses).where(eq(userFavoriteActresses.userId, userId));
    if (actressIds.length) {
      const rows = actressIds.map((id, idx) => ({ userId, actressId: id, position: idx + 1 }));
      await this.db.insert(userFavoriteActresses).values(rows);
    }
  }
  listFavoriteActresses(userId: string) {
    return this.db.select().from(userFavoriteActresses).where(eq(userFavoriteActresses.userId, userId)).orderBy(userFavoriteActresses.position);
  }

  // Social links
  async replaceSocialLinks(userId: string, links: { platform: string; handle: string }[]) {
    // delete and insert new set
    await this.db.delete(socialLinks).where(eq(socialLinks.userId, userId));
    if (links.length) {
      const now = new Date();
      const rows = links.map((l) => ({ id: randomUUID(), userId, platform: l.platform, handle: l.handle, createdAt: now, updatedAt: now } as any));
      await this.db.insert(socialLinks).values(rows);
    }
  }
  listSocialLinks(userId: string) {
    return this.db.select().from(socialLinks).where(eq(socialLinks.userId, userId));
  }
}
