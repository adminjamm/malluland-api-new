import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { PeopleService } from '../services/people.service';

export const peopleRouter = new Hono();

peopleRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional(), lat: z.string().optional(), lng: z.string().optional() })),
  async (c) => {
    const { page = '1', lat, lng } = c.req.valid('query');
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const svc = Container.get(PeopleService);
    const center = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;
    try {
      const { items } = await svc.getPeople({ viewerId: userId, page: Number(page), center });
      return c.json({ page: Number(page), pageSize: 20, items });
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  }
);

