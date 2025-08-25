import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { adminAuthorize } from "../../middleware/adminAuth";
import { db } from "../../db";
import { users } from "../../db/schema";
import { and, desc, eq, ilike, or, inArray } from "drizzle-orm";

export const adminMembersRouter = new Hono();

adminMembersRouter.use("*", adminAuthorize);

// List members with optional filters
adminMembersRouter.get("/", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const size = Number(c.req.query("pageSize") ?? 10);
  const qGender = c.req.query("gender");
  const qSearch = c.req.query("q");
  const offset = (page - 1) * size;

  const where = [] as any[];
  if (qGender && qGender !== "all") where.push(eq(users.gender, qGender));
  if (qSearch) {
    where.push(
      or(
        ilike(users.name, `%${qSearch}%`),
        ilike(users.email, `%${qSearch}%`),
        ilike(users.city, `%${qSearch}%`)
      )
    );
  }

  const rows = await db
    .select()
    .from(users)
    .where(where.length ? (and as any)(...where) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(size)
    .offset(offset);

  return c.json({ data: rows, metadata: { page, size, count: rows.length } });
});

// Approve profile: mark onboarding complete
adminMembersRouter.post(
  "/approve",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    const res = await db
      .update(users)
      .set({ isProfileOnboardingCompleted: true, updatedAt: new Date() })
      .where(and(eq(users.isProfileOnboardingCompleted, false), inArray(users.id, ids)));
    return c.json({ data: { updated: (res as any).rowCount ?? undefined } });
  }
);

// Disapprove profile: mark onboarding incomplete
adminMembersRouter.post(
  "/disapprove",
  zValidator("json", z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (c) => {
    const { ids } = c.req.valid("json");
    const res = await db
      .update(users)
      .set({ isProfileOnboardingCompleted: false, updatedAt: new Date() })
      .where(inArray(users.id, ids));
    return c.json({ data: { updated: (res as any).rowCount ?? undefined } });
  }
);
