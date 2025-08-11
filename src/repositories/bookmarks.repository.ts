import { Service, Inject } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { userBookmarks, allUsers } from '../db/schema';
import { and, eq, desc, inArray } from 'drizzle-orm';

export type Db = NodePgDatabase;

@Service()
export class BookmarksRepository {
  constructor(@Inject('db') private readonly db: Db) {}

  async listActive(userId: string, { limit, offset }: { limit: number; offset: number }) {
    const rows = await this.db
      .select({
        bookmarkId: userBookmarks.id,
        bookmarkedUserId: userBookmarks.bookmarkedUserId,
      })
      .from(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.isActive, true)))
      .orderBy(desc(userBookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.bookmarkedUserId);
    const users = await this.db
      .select()
      .from(allUsers)
      .where(inArray(allUsers.id, ids));

    const map = new Map(users.map((u: any) => [u.id, u]));
    return rows.map((r) => ({ id: r.bookmarkId, user: map.get(r.bookmarkedUserId) }));
  }
}

