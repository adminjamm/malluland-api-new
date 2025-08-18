import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { MeetupsService } from '../services/meetups.service';

export const meetupsRouter = new Hono();

const svc = () => Container.get(MeetupsService);

// Discovery
meetupsRouter.get(
  '/',
  zValidator('query', z.object({
    page: z.string().optional(),
    filter: z.enum(['upcoming', 'this-week', 'this-weekend']).optional(),
    city: z.string().optional(),
    activityId: z.string().optional(),
  })),
  async (c) => {
    const { page = '1', filter = 'upcoming', city, activityId } = c.req.valid('query');
    const userId = c.req.header('x-user-id') || undefined;
    const items = await svc().getDiscovery({ filter, page: Number(page), city, activityId: activityId ? Number(activityId) : undefined, excludeHostId: userId, requestUserId: userId });
    return c.json({ page: Number(page), pageSize: 20, items });
  }
);

// My meetups (hosted by me)
meetupsRouter.get(
  '/me',
  zValidator('query', z.object({ page: z.string().optional(), includePast: z.string().optional() })),
  async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const { page = '1', includePast } = c.req.valid('query');
    const items = await svc().getMyMeetups({ userId, page: Number(page), includePast: includePast === 'true' });
    return c.json({ page: Number(page), pageSize: 20, items });
  }
);

// Create
meetupsRouter.post(
  '/',
  zValidator('json', z.object({
    name: z.string().max(35),
    activityId: z.number().int(),
    guests: z.number().int().min(1).max(7),
    whoPays: z.string(),
    currencyCode: z.string(),
    feeAmount: z.string(),
    locationText: z.string().max(100),
    description: z.string().max(150),
    startsAt: z.string(),
    endsAt: z.string(),
    mapUrl: z.string().url().nullable().optional(),
    city: z.string(), state: z.string(), country: z.string(),
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  })),
  async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const body = c.req.valid('json');
    const row = await svc().createMeetup(userId, { ...body, startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt) });
    return c.json(row[0], 201);
  }
);

// Update
meetupsRouter.patch(
  '/:id',
  zValidator('json', z.object({
    name: z.string().min(10).max(35).optional(),
    activityId: z.number().int().optional(),
    guests: z.number().int().min(1).max(7).optional(),
    whoPays: z.string().optional(),
    currencyCode: z.string().optional(),
    feeAmount: z.string().optional(),
    locationText: z.string().max(100).optional(),
    description: z.string().min(35).max(150).optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    mapUrl: z.string().url().nullable().optional(),
    city: z.string().optional(), state: z.string().optional(), country: z.string().optional(),
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  })),
  async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const payload: any = { ...body };
    if (payload.startsAt) payload.startsAt = new Date(payload.startsAt);
    if (payload.endsAt) payload.endsAt = new Date(payload.endsAt);
    const row = await svc().updateMeetup(id, userId, payload);
    if (!row.length) return c.json({ error: 'Not found' }, 404);
    return c.json(row[0]);
  }
);

// Soft delete
meetupsRouter.delete('/:id', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  const row = await svc().deleteMeetup(id, userId);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

// Attendees
meetupsRouter.get('/:id/attendees', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listAttendees(id);
  return c.json(rows);
});

// Send request to join
meetupsRouter.post(
  '/:id/requests',
  zValidator('json', z.object({ message: z.string().max(500) })),
  async (c) => {
    console.log("Request to join meetup");
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
    const id = c.req.param('id');
    console.log("Meetup ID:", id);
    try {
      const row = await svc().requestToJoin(id, userId, c.req.valid('json').message);
      return c.json(row[0], 201);
    } catch (e) {
      console.error("Error requesting to join meetup:", e);
      return c.json({ error: (e as Error).message }, 400);
    }
  }
);

// Sent requests
meetupsRouter.get('/me/requests/sent', zValidator('query', z.object({ page: z.string().optional() })), async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const { page = '1' } = c.req.valid('query');
  const rows = await svc().listSentRequests(userId, Number(page));
  return c.json({ page: Number(page), pageSize: 20, items: rows });
});

// Received requests
meetupsRouter.get('/me/requests/received', zValidator('query', z.object({ page: z.string().optional() })), async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const { page = '1' } = c.req.valid('query');
  const rows = await svc().listReceivedRequests(userId, Number(page));
  return c.json({ page: Number(page), pageSize: 20, items: rows });
});

// Approve/Decline a request
meetupsRouter.post('/requests/:id/approve', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const row = await svc().judgeRequest(id, userId, 'accept');
    return c.json(row[0]);
  } catch (e) {
    console.error('Error approving meetup request:', e);
    return c.json({ error: (e as Error).message }, 400);
  }
});

meetupsRouter.post('/requests/:id/decline', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'x-user-id header required' }, 400);
  const id = c.req.param('id');
  try {
    const row = await svc().judgeRequest(id, userId, 'decline');
    return c.json(row[0]);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

