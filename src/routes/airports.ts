import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { AirportsRepository } from '../repositories/airports.repository';

export const airportsRouter = new Hono();

const querySchema = z.object({
  lat: z.coerce.number().refine((v) => v >= -90 && v <= 90, 'lat must be between -90 and 90'),
  lng: z.coerce.number().refine((v) => v >= -180 && v <= 180, 'lng must be between -180 and 180'),
});

airportsRouter.get('/nearest', zValidator('query', querySchema), async (c) => {
  const { lat, lng } = c.req.valid('query');
  const repo = Container.get(AirportsRepository);
  const nearest = await repo.findNearestIata(lat, lng);
  if (!nearest) return c.json({ error: 'No nearby airports found' }, 404);
  return c.json({ data: nearest });
});

