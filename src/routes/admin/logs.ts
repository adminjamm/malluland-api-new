import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { adminAuthorize } from "../../middleware/adminAuth";
import { db } from "../../db";
import { adminLogsNew } from "../../db/schema";
import { and, desc, eq } from "drizzle-orm";

export const adminLogsRouter = new Hono();

adminLogsRouter.use("*", adminAuthorize);

adminLogsRouter.post(
  "/create",
  zValidator(
    "json",
    z.object({
      userId: z.string().uuid(),
      actionType: z.string(),
      cmsPage: z.string().optional(),
    })
  ),
  async (c) => {
    const admin = c.get("admin");
    const body = c.req.valid("json");

    const [row] = await db
      .insert(adminLogsNew)
      .values({
        userId: body.userId,
        adminId: null as any,
        actionType: body.actionType,
        cmsPage: body.cmsPage ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json({ data: row });
  }
);

adminLogsRouter.get("/list", async (c) => {
  const limit = Number(c.req.query("limit") ?? 50);
  const page = Number(c.req.query("page") ?? 1);
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(adminLogsNew)
    .orderBy(desc(adminLogsNew.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data: rows, metadata: { page, size: limit, count: rows.length } });
});

adminLogsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(adminLogsNew).where(eq(adminLogsNew.id, id)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ data: row });
});
