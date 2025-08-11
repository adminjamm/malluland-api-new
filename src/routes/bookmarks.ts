import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { BookmarksService } from '../services/bookmarks.service';

export const bookmarksRouter = new Hono();

bookmarksRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional() })),
  async (c) => {
    const { page = '1' } = c.req.valid('query');
    const svc = Container.get(BookmarksService);
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const data = await svc.getBookmarks(userId, Number(page));
    return c.json({ page: Number(page), pageSize: 20, data });
  }
);

