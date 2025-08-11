import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { MeetupsService } from '../services/meetups.service';

export const meetupsRouter = new Hono();

meetupsRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional() })),
  async (c) => {
    const { page = '1' } = c.req.valid('query');
    const svc = Container.get(MeetupsService);
    const now = Date.now();
    const data = await svc.getUpcoming(Number(page), now);
    return c.json({ page: Number(page), pageSize: 20, data });
  }
);

