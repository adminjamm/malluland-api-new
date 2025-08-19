import { Service, Container } from "typedi";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  users,
  userPhotos,
  userSelfie,
  userInterests,
  userTraits,
  userFavoriteActors,
  userFavoriteActresses,
  socialLinks,
  userFavoritesText,
  userSettings,
  userLocation,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { AirportsRepository } from "./airports.repository";

export type Db = NodePgDatabase;

@Service()
export class UsersRepository {
  private get db(): Db {
    return Container.get("db");
  }

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
  async addPhoto(
    userId: string,
    photo: {
      originalUrl: string;
      imageType: string;
      position: number;
      optimizedUrl?: string | null;
    }
  ) {
    const row = {
      userId,
      originalUrl: photo.originalUrl,
      optimizedUrl: photo.optimizedUrl ?? null,
      imageType: photo.imageType,
      position: photo.position,
    };
    await this.db.insert(userPhotos).values(row);
    return row;
  }
  async addPhotos(
    userId: string,
    photos: {
      originalUrl: string;
      imageType: string;
      position: number;
      optimizedUrl?: string | null;
    }[]
  ) {
    const rows = photos.map((photo) => ({
      userId,
      originalUrl: photo.originalUrl,
      optimizedUrl: photo.optimizedUrl ?? null,
      imageType: photo.imageType,
      position: photo.position,
    }));
    if (rows.length > 0) {
      await this.db
        .delete(userPhotos)
        .where(
          and(eq(userPhotos.userId, userId), eq(userPhotos.imageType, "photo"))
        );
    }
    await this.db.insert(userPhotos).values(rows);
    return rows;
  }
  listPhotos(userId: string, type?: string) {
    return this.db
      .select({
        id: userPhotos.id,
        originalUrl: userPhotos.originalUrl,
        optimizedUrl: userPhotos.optimizedUrl,
        imageType: userPhotos.imageType,
        position: userPhotos.position,
        isActive: userPhotos.isActive,
        createdAt: userPhotos.createdAt,
      })
      .from(userPhotos)
      .where(
        type
          ? and(eq(userPhotos.userId, userId), eq(userPhotos.imageType, type))
          : eq(userPhotos.userId, userId)
      )
      .orderBy(userPhotos.position);
  }

  // Selfies
  async addSelfie(
    userId: string,
    selfieUrl: string,
    status: string = "pending"
  ) {
    const row = {
      userId,
      selfieUrl,
      status,
    };
    await this.db.insert(userSelfie).values(row);
    return row;
  }
  listSelfies(userId: string) {
    return this.db
      .select()
      .from(userSelfie)
      .where(eq(userSelfie.userId, userId));
  }

  // Interests
  async replaceInterests(userId: string, interestIds: number[]) {
    // simple replace strategy
    if (interestIds.length) {
      // delete existing
      await this.db
        .delete(userInterests)
        .where(eq(userInterests.userId, userId));
      // insert
      const rows = interestIds.map((id, idx) => ({
        userId,
        interestId: id,
        position: idx + 1,
      }));
      await this.db.insert(userInterests).values(rows);
    }
  }
  listInterests(userId: string) {
    return this.db
      .select()
      .from(userInterests)
      .where(eq(userInterests.userId, userId))
      .orderBy(userInterests.position);
  }

  // Traits
  async replaceTraits(userId: string, traitIds: number[]) {
    if (traitIds.length) {
      await this.db.delete(userTraits).where(eq(userTraits.userId, userId));
      const rows = traitIds.map((id, idx) => ({
        userId,
        traitId: id,
        position: idx + 1,
      }));
      await this.db.insert(userTraits).values(rows);
    }
  }
  listTraits(userId: string) {
    return this.db
      .select()
      .from(userTraits)
      .where(eq(userTraits.userId, userId))
      .orderBy(userTraits.position);
  }

  // Favorite actors
  async replaceFavoriteActors(userId: string, actorIds: number[]) {
    if (actorIds.length) {
      await this.db
        .delete(userFavoriteActors)
        .where(eq(userFavoriteActors.userId, userId));
      const rows = actorIds.map((id, idx) => ({
        userId,
        actorId: id,
        position: idx + 1,
      }));
      await this.db.insert(userFavoriteActors).values(rows);
    }
  }
  listFavoriteActors(userId: string) {
    return this.db
      .select()
      .from(userFavoriteActors)
      .where(eq(userFavoriteActors.userId, userId))
      .orderBy(userFavoriteActors.position);
  }

  // Favorite actresses
  async replaceFavoriteActresses(userId: string, actressIds: number[]) {
    if (actressIds.length) {
      await this.db
        .delete(userFavoriteActresses)
        .where(eq(userFavoriteActresses.userId, userId));
      const rows = actressIds.map((id, idx) => ({
        userId,
        actressId: id,
        position: idx + 1,
      }));
      await this.db.insert(userFavoriteActresses).values(rows);
    }
  }
  listFavoriteActresses(userId: string) {
    return this.db
      .select()
      .from(userFavoriteActresses)
      .where(eq(userFavoriteActresses.userId, userId))
      .orderBy(userFavoriteActresses.position);
  }

  // Social links
  async replaceSocialLinks(
    userId: string,
    links: { platform: string; handle: string; show_profile: boolean }[]
  ) {
    if (links.length) {
      // delete and insert new set
      await this.db.delete(socialLinks).where(eq(socialLinks.userId, userId));
      const now = new Date();
      const rows = links.map(
        (l) =>
          ({
            userId,
            platform: l.platform,
            handle: l.handle,
            show_profile: l.show_profile,
            createdAt: now,
            updatedAt: now,
          } as any)
      );
      await this.db.insert(socialLinks).values(rows);
    }
  }
  listSocialLinks(userId: string) {
    return this.db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.userId, userId));
  }
  async replaceUserFavoritesText(
    userId: string,
    category: string,
    values: string[]
  ) {
    const limited = (values ?? []).slice(0, 5);
    // Replace strategy: delete all for category and insert up to 5
    await this.db
      .delete(userFavoritesText)
      .where(
        and(
          eq(userFavoritesText.userId, userId),
          eq(userFavoritesText.category, category)
        )
      );
    if (limited.length === 0) return [];
    const rows = limited.map((val, idx) => ({
      userId,
      category,
      textValue: val,
      position: idx + 1,
    }));
    await this.db.insert(userFavoritesText).values(rows);
    return rows;
  }

  async addUserFavoriteText(userId: string, category: string, value: string) {
    // Count existing to enforce max 5 and determine next position
    const existing = await this.db
      .select({ position: userFavoritesText.position })
      .from(userFavoritesText)
      .where(
        and(
          eq(userFavoritesText.userId, userId),
          eq(userFavoritesText.category, category)
        )
      )
      .orderBy(userFavoritesText.position);
    if (existing.length >= 5) {
      throw new Error("Maximum of 5 favorites allowed per category");
    }
    const nextPos = (existing[existing.length - 1]?.position ?? 0) + 1;
    const row = {
      userId,
      category,
      textValue: value,
      position: nextPos,
    };
    await this.db.insert(userFavoritesText).values(row);
    return row;
  }

  async listUserFavorites(userId: string, category?: string) {
    let conditions = [eq(userFavoritesText.userId, userId)];

    if (category) {
      conditions.push(eq(userFavoritesText.category, category));
    }

    return await this.db
      .select()
      .from(userFavoritesText)
      .where(and(...conditions))
      .orderBy(userFavoritesText.position);
  }

  // User location
  async getUserLocation(userId: string) {
    const rows = await this.db
      .select()
      .from(userLocation)
      .where(eq(userLocation.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertUserLocation(
    userId: string,
    data: Partial<{
      lat: number | null;
      lng: number | null;
      closestAirportCode: string | null;
    }>
  ) {
    const existing = await this.getUserLocation(userId);
    const now = new Date();

    // Determine coordinates to use for nearest-airport lookup
    const lat = data.lat ?? existing?.lat ?? null;
    const lng = data.lng ?? existing?.lng ?? null;

    // Auto-compute closestAirportCode if not explicitly provided
    let closestAirportCode: string | null | undefined = data.closestAirportCode;
    if (
      closestAirportCode === undefined &&
      typeof lat === "number" &&
      typeof lng === "number"
    ) {
      try {
        const airportsRepo = Container.get(AirportsRepository);
        const nearest = await airportsRepo.findNearestIata(lat, lng);
        closestAirportCode = nearest?.iata ?? null;
      } catch (e) {
        // On failure, do not block the upsert; leave closestAirportCode as null/undefined
        closestAirportCode = closestAirportCode ?? null;
      }
    }

    if (existing) {
      await this.db
        .update(userLocation)
        .set({
          lat: data.lat ?? existing.lat ?? null,
          lng: data.lng ?? existing.lng ?? null,
          closestAirportCode:
            closestAirportCode ?? existing.closestAirportCode ?? null,
          updatedAt: now,
        } as any)
        .where(eq(userLocation.userId, userId));
    } else {
      await this.db.insert(userLocation).values({
        userId,
        lat: lat ?? null,
        lng: lng ?? null,
        closestAirportCode: closestAirportCode ?? null,
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    return this.getUserLocation(userId);
  }

  // User settings
  async getUserSettings(userId: string) {
    const rows = await this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertUserSettings(
    userId: string,
    data: Partial<{ chatAudience: string | null; pushEnabled: boolean | null }>
  ) {
    const existing = await this.getUserSettings(userId);
    const now = new Date();
    if (existing) {
      await this.db
        .update(userSettings)
        .set({ ...data, updatedAt: now } as any)
        .where(eq(userSettings.userId, userId));
    } else {
      await this.db.insert(userSettings).values({
        userId,
        chatAudience: data.chatAudience ?? null,
        pushEnabled: data.pushEnabled ?? null,
        createdAt: now,
        updatedAt: now,
      } as any);
    }
    const fresh = await this.getUserSettings(userId);
    return fresh;
  }
}
