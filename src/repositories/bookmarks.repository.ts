import { Service, Container } from "typedi";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { bookmarks, userPhotos, users as usersTable } from "../db/schema";
import { and, eq, desc, inArray, sql } from "drizzle-orm";

export type Db = NodePgDatabase;

@Service()
export class BookmarksRepository {
  private get db(): Db {
    return Container.get("db");
  }

  async list(
    userId: string,
    { limit, offset }: { limit: number; offset: number }
  ) {
    const rows = await this.db
      .select({
        id: bookmarks.id,
        bookmarkedUserId: bookmarks.bookmarkedUserId,
        createdAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) return [] as Array<{ id: string; user: any }>;

    const ids = rows.map((r) => r.bookmarkedUserId);

    // Fetch user data
    const users = await this.db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        city: usersTable.city,
        state: usersTable.state,
        country: usersTable.country,
        gender: usersTable.gender,
        dob: usersTable.dob,
        bio: usersTable.bio,
      })
      .from(usersTable)
      .where(inArray(usersTable.id, ids));

    // Fetch avatar photos (latest avatar for each user)
    const avatars = await this.db
      .select({
        userId: userPhotos.userId,
        avatarUrl: userPhotos.optimizedUrl,
        originalUrl: userPhotos.originalUrl,
      })
      .from(userPhotos)
      .where(
        and(
          inArray(userPhotos.userId, ids),
          eq(userPhotos.imageType, "avatar"),
          eq(userPhotos.isActive, true)
        )
      )
      .orderBy(desc(userPhotos.createdAt));

    // Create maps for efficient lookup
    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const avatarMap = new Map();

    // Get the latest avatar for each user (since we ordered by createdAt desc)
    avatars.forEach((avatar: any) => {
      if (!avatarMap.has(avatar.userId)) {
        avatarMap.set(avatar.userId, {
          avatarUrl: avatar.avatarUrl || avatar.originalUrl,
          originalUrl: avatar.originalUrl,
        });
      }
    });

    return rows.map((r) => {
      const user = userMap.get(r.bookmarkedUserId);
      const avatar = avatarMap.get(r.bookmarkedUserId);

      return {
        id: r.id,
        user: {
          ...user,
          avatarUrl: avatar?.avatarUrl || null,
          originalUrl: avatar?.originalUrl || null,
        },
      };
    });
  }

  async countForUser(userId: string) {
    const res = await this.db
      .select({ count: sql`count(*)`.as("count") })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
    const c = (res as any)[0]?.count ?? 0;
    return typeof c === "number" ? c : Number(c);
  }

  async exists(userId: string, bookmarkedUserId: string) {
    const rows = await this.db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.bookmarkedUserId, bookmarkedUserId)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async add(userId: string, bookmarkedUserId: string) {
    const row = {
      id: crypto.randomUUID(),
      userId,
      bookmarkedUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    return this.db.insert(bookmarks).values(row).returning();
  }

  async remove(userId: string, bookmarkedUserId: string) {
    // Hard delete bookmark for the pair
    return this.db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.bookmarkedUserId, bookmarkedUserId)
        )
      )
      .returning();
  }
}
