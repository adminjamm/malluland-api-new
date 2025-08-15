import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { PeopleService } from '../services/people.service';

export const peopleRouter = new Hono();

peopleRouter.get(
  '/',
  zValidator('query', z.object({
    page: z.string().optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
    gender: z.enum(['all', 'male', 'female', 'other']).optional(),
    ageMin: z.string().optional(),
    ageMax: z.string().optional(),
    interests: z.string().optional(), // comma-separated ids
    radiusKm: z.string().optional(),
    under15: z.string().optional(), // if 'true', overrides radius to 15
  })),
  async (c) => {
    const { page = '1', lat, lng, gender = 'all', ageMin, ageMax, interests, radiusKm, under15 } = c.req.valid('query');
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const svc = Container.get(PeopleService);
    const center = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;
    const maxDistanceKm = under15 === 'true' ? 15 : (radiusKm ? Number(radiusKm) : undefined);
    const interestIds = interests ? interests.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)) : undefined;
    const age = {
      min: ageMin ? Number(ageMin) : undefined,
      max: ageMax ? Number(ageMax) : undefined,
    };
    try {
      const { items } = await svc.getPeople({
        viewerId: userId,
        page: Number(page),
        center,
        gender,
        ageMin: age.min,
        ageMax: age.max,
        interestIds,
        maxDistanceKm,
      });
      return c.json({ page: Number(page), pageSize: 20, items });
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  }
);

