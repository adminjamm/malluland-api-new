import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db";
import { admins } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const adminAuthRouter = new Hono();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

adminAuthRouter.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const rows = await db
      .select()
      .from(admins)
      .where(and(eq(admins.email, email.toLowerCase()), eq(admins.isDeleted, false)))
      .limit(1);
    const admin = rows[0];
    if (!admin) return c.json({ error: "Invalid credentials" }, 401);

    if (admin.password) {
      const ok = await bcrypt.compare(password, admin.password);
      if (!ok) return c.json({ error: "Invalid credentials" }, 401);
    } else {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = jwt.sign({ adminId: admin.id, email: admin.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return c.json({
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          role: admin.role,
        },
      },
    });
  }
);
