import { Hono } from "hono";
import { adminAuthorize } from "../../middleware/adminAuth";
import { db } from "../../db";
import { users, userPhotos } from "../../db/schema";
import { sql } from "drizzle-orm";

export const adminStatsRouter = new Hono();

adminStatsRouter.use("*", adminAuthorize);

adminStatsRouter.get("/", async (c) => {
  const usersCountRows = await db
    .select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
    .from(users);
  const usersCount = usersCountRows[0]?.count ?? 0;

  const pendingAvatarsRows = await db
    .select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
    .from(userPhotos)
    .where(sql`${userPhotos.imageType} = 'avatar' AND ${userPhotos.status} = 'pending'`);
  const pendingAvatars = pendingAvatarsRows[0]?.count ?? 0;

  return c.json({ data: { usersCount, pendingAvatars } });
});
