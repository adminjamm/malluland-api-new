import { Hono } from "hono";
import { adminAuthRouter } from "./auth";
import { adminLogsRouter } from "./logs";
import { adminMembersRouter } from "./members";
import { adminAvatarUpdatesRouter } from "./avatar-updates";
import { adminStatsRouter } from "./stats";
import { adminApplicationsRouter } from "./applications";

export const adminRouter = new Hono();

// Public
adminRouter.route("/auth", adminAuthRouter);

// Protected
adminRouter.route("/logs", adminLogsRouter);
adminRouter.route("/members", adminMembersRouter);
adminRouter.route("/avatar-updates", adminAvatarUpdatesRouter);
adminRouter.route("/applications", adminApplicationsRouter);
adminRouter.route("/stats", adminStatsRouter);
