import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { RequestsService } from '../services/requests.service';

export const requestsRouter = new Hono();

requestsRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional(), filter: z.enum(['all', 'meetups', 'chats']).default('all') })),
  async (c) => {
    try {
      const { page = '1', filter } = c.req.valid('query');
      const userId = c.req.header('x-user-id');
      if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
      const items = await Container.get(RequestsService).list({ userId, filter, page: Number(page) });
      return c.json({ page: Number(page), pageSize: 21, items });
    } catch (e) {
      console.error('[GET /requests] Error:', e);
      return c.json({ error: (e as Error).message }, 500);
    }
  }
);

// Chat requests CRUD
requestsRouter.post('/chats', zValidator('json', z.object({ toUserId: z.string().uuid(), message: z.string().max(500) })), async (c) => {
  try {
    const fromUserId = c.req.header('x-user-id');
    if (!fromUserId) return c.json({ error: 'x-user-id header required' }, 400);
    const { toUserId, message } = c.req.valid('json');
    const rows = await Container.get(RequestsService).createChatRequest(fromUserId, toUserId, message);
    return c.json(rows[0], 201);
  } catch (e) {
    console.error('[POST /requests/chats] Error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

requestsRouter.get('/chats/sent', zValidator('query', z.object({ page: z.string().optional() })), async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const { page = '1' } = c.req.valid('query');
    const rows = await Container.get(RequestsService).listChatSent(userId, Number(page));
    return c.json({ page: Number(page), pageSize: 21, items: rows });
  } catch (e) {
    console.error('[GET /requests/chats/sent] Error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// Chat request actions
requestsRouter.post('/chats/:id/accept', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const rows = await Container.get(RequestsService).judgeChat(id, userId, 'accept');
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(rows[0]);
  } catch (e) { 
    console.error('[POST /requests/chats/:id/accept] Error:', e);
    return c.json({ error: (e as Error).message }, 400); }
});

requestsRouter.post('/chats/:id/decline', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const rows = await Container.get(RequestsService).judgeChat(id, userId, 'decline');
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(rows[0]);
  } catch (e) { 
    console.error('[POST /requests/chats/:id/decline] Error:', e);
    return c.json({ error: (e as Error).message }, 400); }
});

requestsRouter.post('/chats/:id/archive', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const rows = await Container.get(RequestsService).judgeChat(id, userId, 'archive');
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(rows[0]);
  } catch (e) { 
    console.error('[POST /requests/chats/:id/archive] Error:', e);
    return c.json({ error: (e as Error).message }, 400); }
});
