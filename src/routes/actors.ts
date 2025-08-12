import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { ActorsService } from '../services/actors.service';

export const actorsRouter = new Hono();

actorsRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional() })),
  async (c) => {
    const { page = '1' } = c.req.valid('query');
    const svc = Container.get(ActorsService);
    const data = await svc.getActors(Number(page));
    return c.json({ page: Number(page), pageSize: 20, data });
  }
);
