import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { PeopleService } from '../services/people.service';

export const peopleRouter = new Hono();

peopleRouter.get(
  '/',
  zValidator('query', z.object({ page: z.string().optional() })),
  async (c) => {
    const { page = '1' } = c.req.valid('query');
    const svc = Container.get(PeopleService);
    const data = await svc.getPeople(Number(page));
    return c.json({ page: Number(page), pageSize: 20, data });
  }
);

