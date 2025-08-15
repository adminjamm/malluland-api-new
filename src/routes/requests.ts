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
    const { page = '1', filter } = c.req.valid('query');
    const userId = c.req.header('x-user-id');
    console.log('requestsRouter.get', { page, filter, userId });
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const items = await Container.get(RequestsService).list({ userId, filter, page: Number(page) });
    return c.json({ page: Number(page), pageSize: 21, items });
  }
);

// Chat request actions
requestsRouter.post('/chats/:id/accept', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const rows = await Container.get(RequestsService).judgeChat(id, userId, 'accept');
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(rows[0]);
  } catch (e) { return c.json({ error: (e as Error).message }, 400); }
});

requestsRouter.post('/chats/:id/decline', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const rows = await Container.get(RequestsService).judgeChat(id, userId, 'decline');
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(rows[0]);
  } catch (e) { return c.json({ error: (e as Error).message }, 400); }
});

requestsRouter.post('/chats/:id/archive', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const rows = await Container.get(RequestsService).judgeChat(id, userId, 'archive');
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(rows[0]);
  } catch (e) { return c.json({ error: (e as Error).message }, 400); }
});
