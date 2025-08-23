import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { admins } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export async function adminAuthorize(c: Context, next: Next) {
  try {
    const auth = c.req.header("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; email?: string };

    const rows = await db.select().from(admins).where(eq(admins.id, decoded.adminId)).limit(1);
    const admin = rows[0];
    if (!admin || admin.isDeleted) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("admin", admin);
    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized" }, 401);
  }
}
