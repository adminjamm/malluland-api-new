import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { ChatsService } from '../services/chats.service';
import { authorize } from '../middleware/auth';

export const chatsRouter = new Hono();

chatsRouter.get(
  '/rooms',
  authorize({ bypassOnboardingCheck: true }),
  zValidator('query', z.object({ page: z.coerce.number().int().positive().default(1) })),
  async (c) => {
    const { page } = c.req.valid('query');
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const items = await Container.get(ChatsService).listRooms(userId, page);
    return c.json({ page, pageSize: 20, items });
  }
);

// V2 room details by id
chatsRouter.get(
  '/v2/rooms/:id',
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const id = c.req.param('id');
    const item = await Container.get(ChatsService).getRoomV2(id);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  }
);

// V2 rooms list with additional filters and joins
chatsRouter.get(
  '/v2/rooms',
  authorize({ bypassOnboardingCheck: true }),
  zValidator('query', z.object({ page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().positive().max(100).default(10) })),
  async (c) => {
    const { page, pageSize } = c.req.valid('query');
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const limit = pageSize;
    const items = await Container.get(ChatsService).listRoomsV2(userId, page, limit);
    return c.json({ page, pageSize: limit, items });
  }
);
