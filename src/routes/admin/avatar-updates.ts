import { Hono } from "hono";
import { adminAuthorize } from "../../middleware/adminAuth";
import { db } from "../../db";
import { userPhotos } from "../../db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const adminAvatarUpdatesRouter = new Hono();

adminAvatarUpdatesRouter.use("*", adminAuthorize);

// List pending avatar updates
adminAvatarUpdatesRouter.get("/", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const size = Number(c.req.query("pageSize") ?? 10);
  const offset = (page - 1) * size;

  const rows = await db
    .select()
    .from(userPhotos)
    .where(and(eq(userPhotos.imageType, "avatar"), eq(userPhotos.status, "pending")))
    .orderBy(desc(userPhotos.createdAt))
    .limit(size)
    .offset(offset);

  return c.json({ data: rows, metadata: { page, size, count: rows.length } });
});

// Approve avatars
adminAvatarUpdatesRouter.post(
  "/approve",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    const now = new Date();
    await db.update(userPhotos).set({ status: "approved", updatedAt: now }).where(inArray(userPhotos.id, ids));
    return c.json({ data: { updatedIds: ids } });
  }
);

// Reject avatars
adminAvatarUpdatesRouter.post(
  "/reject",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    const now = new Date();
    await db.update(userPhotos).set({ status: "rejected", updatedAt: now }).where(inArray(userPhotos.id, ids));
    return c.json({ data: { updatedIds: ids } });
  }
);
