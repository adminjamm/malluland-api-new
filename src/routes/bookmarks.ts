import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { BookmarksService } from '../services/bookmarks.service';

export const bookmarksRouter = new Hono();

// List bookmarks (20 per page)
bookmarksRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional() })),
  async (c) => {
    const { page = '1' } = c.req.valid('query');
    const svc = Container.get(BookmarksService);
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const items = await svc.getBookmarks(userId, Number(page));
    return c.json({ page: Number(page), pageSize: 20, items });
  }
);

// Add a bookmark
bookmarksRouter.post(
  '/',
  zValidator('json', z.object({ bookmarkedUserId: z.string().uuid() })),
  async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const { bookmarkedUserId } = c.req.valid('json');
    try {
      const result = await Container.get(BookmarksService).addBookmark(userId, bookmarkedUserId);
      return c.json(result, 201);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  }
);

// Remove a bookmark (unbookmark)
bookmarksRouter.delete(
  '/:bookmarkedUserId',
  async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const bookmarkedUserId = c.req.param('bookmarkedUserId');
    const result = await Container.get(BookmarksService).removeBookmark(userId, bookmarkedUserId);
    return c.json(result);
  }
);

