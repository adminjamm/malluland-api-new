import { z } from "zod";
// import { notificationTypeEnum } from "./db/schema/notification";
import type { users } from "./db/schema";

// export const NotificationTabSchema = z.enum([
//   ...notificationTypeEnum.enumValues,
//   "all",
// ]);
// export type NotificationTab = z.infer<typeof NotificationTabSchema>;

export type Profile = typeof users.$inferSelect & {
  isDummyAccount: boolean;
};

export const JwtPayloadSchema = z.object({
  id: z.string(),
  name: z.union([z.string(), z.null()]).optional(),
  isDummyAccount: z.boolean(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
