import { Hono } from "hono";
import { adminAuthorize } from "../../middleware/adminAuth";
import { db } from "../../db";
import { users, userSelfie } from "../../db/schema";
import { sql, inArray, and, eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const adminApplicationsRouter = new Hono();

adminApplicationsRouter.use("*", adminAuthorize);

// GET /admin/applications?page=&pageSize=&gender=
adminApplicationsRouter.get("/", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const pageSize = Number(c.req.query("pageSize") ?? 10);
  const gender = c.req.query("gender");
  const offset = (page - 1) * pageSize;

  // Count
  const countRows = await db
    .select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
    .from(users)
    .where(
      gender && gender !== "all"
        ? and(eq(users.isProfileOnboardingCompleted, false), eq(users.gender as any, gender))
        : eq(users.isProfileOnboardingCompleted, false)
    );
  const total = countRows[0]?.count ?? 0;

  // Items with selfie and last avatar via raw SQL for convenience
  const itemsQ = sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.gender,
      u.city,
      u.state,
      u.country,
      u.company,
      u.position,
      u.bio,
      u.dob,
      u.created_at,
      u.refid,
      s.status AS selfie_status,
      s.selfie_url AS selfie_url,
      dp.status AS avatar_status,
      dp.url AS avatar,
      dp.id AS avatar_photo_id,
      favs.fav_movies,
      favs.fav_musicians,
      favs.fav_games_sports,
      favs.fav_dishes
    FROM users u
    LEFT JOIN user_selfie s ON s.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT up.status, COALESCE(up.optimized_url, up.original_url) AS url, up.id
      FROM user_photos up
      WHERE up.user_id = u.id AND up.image_type = 'avatar'
      ORDER BY up.created_at DESC
      LIMIT 1
    ) dp ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        ARRAY_AGG(uf.text ORDER BY uf.position) FILTER (WHERE uf.category = 'movies')          AS fav_movies,
        ARRAY_AGG(uf.text ORDER BY uf.position) FILTER (WHERE uf.category = 'musician')       AS fav_musicians,
        ARRAY_AGG(uf.text ORDER BY uf.position) FILTER (WHERE uf.category = 'game_sport')     AS fav_sports,
        ARRAY_AGG(uf.text ORDER BY uf.position) FILTER (WHERE uf.category = 'dish')           AS fav_dishes
      FROM user_favorites_text uf
      WHERE uf.user_id = u.id
    ) favs ON TRUE
    WHERE u.user_state = 'pending'
    and s.status = 'new'
    and (dp.status is NULL or dp.status <> 'rejected')
    ${gender && gender !== 'all' ? sql`AND u.gender = ${gender}` : sql``}
    ORDER BY u.created_at ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `;
  const res: any = await db.execute(itemsQ as any);
  const rows = Array.isArray(res) ? res : res.rows;

  return c.json({
    data: {users: rows, page, pageSize, total, totalPages: Math.ceil(total / pageSize)},
    metadata: {  },
  });
});

// POST /admin/applications/approveProfiles { ids: uuid[] }
adminApplicationsRouter.post(
  "/approveProfiles",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    await db
      .update(users)
      .set({ isProfileOnboardingCompleted: true, updatedAt: new Date() })
      .where(inArray(users.id, ids));

    // Log entries (best-effort) into admin_logs with actionType 'approved' and cms_page 'applications'
    try {
      await db.execute(sql`INSERT INTO admin_logs (id, admin_id, user_id, action_type, cms_page, created_at, updated_at)
        SELECT gen_random_uuid(), NULL, x.user_id::uuid, 'approved', 'applications', NOW(), NOW()
        FROM UNNEST(${ids}::uuid[]) AS x(user_id)`);
    } catch (e) {
      console.error("[applications.approveProfiles] log failure", e);
    }

    return c.json({ ok: true });
  }
);

// POST /admin/applications/disapproveProfiles { ids: uuid[] }
adminApplicationsRouter.post(
  "/disapproveProfiles",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    await db
      .update(users)
      .set({ isProfileOnboardingCompleted: false, updatedAt: new Date() })
      .where(inArray(users.id, ids));

    try {
      await db.execute(sql`INSERT INTO admin_logs (id, admin_id, user_id, action_type, cms_page, created_at, updated_at)
        SELECT gen_random_uuid(), NULL, x.user_id::uuid, 'rejected', 'applications', NOW(), NOW()
        FROM UNNEST(${ids}::uuid[]) AS x(user_id)`);
    } catch (e) {
      console.error("[applications.disapproveProfiles] log failure", e);
    }

    return c.json({ ok: true });
  }
);

// POST /admin/applications/banUsers { ids: uuid[] }
adminApplicationsRouter.post(
  "/banUsers",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    await db
      .update(users)
      .set({ userState: 'banned', updatedAt: new Date() })
      .where(inArray(users.id, ids));

    try {
      await db.execute(sql`INSERT INTO admin_logs (id, admin_id, user_id, action_type, cms_page, created_at, updated_at)
        SELECT gen_random_uuid(), NULL, x.user_id::uuid, 'banned', 'applications', NOW(), NOW()
        FROM UNNEST(${ids}::uuid[]) AS x(user_id)`);
    } catch (e) {
      console.error("[applications.banUsers] log failure", e);
    }

    return c.json({ ok: true });
  }
);

// POST /admin/applications/selfieRejects { ids: uuid[] } -> reject selfie rows by id
adminApplicationsRouter.post(
  "/selfieRejects",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    await db
      .update(userSelfie)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(inArray(userSelfie.id as any, ids as any));

    // We could log by inferring user_ids, but keeping it simple: one log per selfie is extra joins.
    return c.json({ ok: true });
  }
);
