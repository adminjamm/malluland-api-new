import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Container } from "typedi";
import { ChatsService } from "../services/chats.service";
import { authorize } from "../middleware/auth";

export const chatsRouter = new Hono();

chatsRouter.get(
  "/rooms",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "query",
    z.object({ page: z.coerce.number().int().positive().default(1) })
  ),
  async (c) => {
    const { page } = c.req.valid("query");
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "x-user-id header required" }, 400);
    const { items, total, pageSize } = await Container.get(
      ChatsService
    ).listRooms(userId, page);
    return c.json({ page, pageSize, total, items });
  }
);

// V2 room details by id
chatsRouter.get(
  "/v2/rooms/:id",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "x-user-id header required" }, 400);
    const id = c.req.param("id");
    const item = await Container.get(ChatsService).getRoomV2WithParticipants(
      id
    );
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  }
);

// Send a chat message to a room
chatsRouter.post(
  "/rooms/:id/send",
  authorize({ bypassOnboardingCheck: true }),
  zValidator("json", z.object({ text: z.string().min(1) })),
  async (c) => {
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "x-user-id header required" }, 400);
    const chatId = c.req.param("id");
    const { text } = c.req.valid("json");
    try {
      const payload = await Container.get(ChatsService).sendMessage(
        chatId,
        userId,
        text
      );
      return c.json(payload, 201);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  }
);

// V2 rooms list with additional filters and joins
chatsRouter.get(
  "/v2/rooms",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "query",
    z.object({
      page: z.coerce.number().int().positive().default(1),
      size: z.coerce.number().int().positive().max(100).default(10),
      status: z.string().optional(),
    })
  ),
  async (c) => {
    const { page, size, status } = c.req.valid("query");
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "x-user-id header required" }, 400);
    const { items, total } = await Container.get(ChatsService).listRoomsV2(
      userId,
      status,
      page,
      size
    );
    return c.json({
      data: items,
      metadata: { count: total, page, size },
    });
  }
);

chatsRouter.post(
  "/rooms/:id/toggle-archive",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "x-user-id header required" }, 400);
    const chatId = c.req.param("id");

    const result = await Container.get(ChatsService).archiveChatRoom(
      userId,
      chatId
    );
    if (!result || !result.rows) return c.json({ error: "Not found" }, 404);

    return c.json({
      message: "Successful",
    });
  }
);

chatsRouter.get(
  "/rooms/archived/total",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "x-user-id header required" }, 400);
    const { data } = await Container.get(ChatsService).ArchivedListTotal(
      userId
    );
    return c.json({ data });
  }
);
