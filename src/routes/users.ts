import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { UsersService } from '../services/users.service';

export const usersRouter = new Hono();

const svc = () => Container.get(UsersService);

// Users
usersRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await svc().getUser(id);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

usersRouter.put(
  '/:id',
  zValidator('json', z.object({
    name: z.string().optional(),
    gender: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    company: z.string().max(50).optional(),
    position: z.string().max(50).optional(),
    bio: z.string().max(150).optional(),
  })),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const updated = await svc().updateUser(id, body);
    return c.json(updated);
  }
);

// Photos
usersRouter.post(
  '/:id/photos',
  zValidator('json', z.object({
    originalUrl: z.string().url(),
    optimizedUrl: z.string().url().nullable().optional(),
    imageType: z.string(),
    position: z.number().int().nonnegative(),
  })),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const row = await svc().addPhoto(id, data);
    return c.json(row, 201);
  }
);
usersRouter.get('/:id/photos', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listPhotos(id);
  return c.json(rows);
});

// Selfies
usersRouter.post(
  '/:id/selfies',
  zValidator('json', z.object({ selfieUrl: z.string().url(), status: z.string().optional() })),
  async (c) => {
    const id = c.req.param('id');
    const { selfieUrl } = c.req.valid('json');
    const row = await svc().addSelfie(id, selfieUrl);
    return c.json(row, 201);
  }
);
usersRouter.get('/:id/selfies', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listSelfies(id);
  return c.json(rows);
});

// Interests
usersRouter.post(
  '/:id/interests',
  zValidator('json', z.object({ interestIds: z.array(z.number().int()).min(1) })),
  async (c) => {
    const id = c.req.param('id');
    const { interestIds } = c.req.valid('json');
    await svc().replaceInterests(id, interestIds);
    const rows = await svc().listInterests(id);
    return c.json(rows, 201);
  }
);
usersRouter.get('/:id/interests', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listInterests(id);
  return c.json(rows);
});

// Traits
usersRouter.post(
  '/:id/traits',
  zValidator('json', z.object({ traitIds: z.array(z.number().int()).min(1) })),
  async (c) => {
    const id = c.req.param('id');
    const { traitIds } = c.req.valid('json');
    await svc().replaceTraits(id, traitIds);
    const rows = await svc().listTraits(id);
    return c.json(rows, 201);
  }
);
usersRouter.get('/:id/traits', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listTraits(id);
  return c.json(rows);
});

// Favorite actors
usersRouter.post(
  '/:id/favorite-actors',
  zValidator('json', z.object({ actorIds: z.array(z.number().int()).min(1) })),
  async (c) => {
    const id = c.req.param('id');
    const { actorIds } = c.req.valid('json');
    await svc().replaceFavoriteActors(id, actorIds);
    const rows = await svc().listFavoriteActors(id);
    return c.json(rows, 201);
  }
);
usersRouter.get('/:id/favorite-actors', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listFavoriteActors(id);
  return c.json(rows);
});

// Favorite actresses
usersRouter.post(
  '/:id/favorite-actresses',
  zValidator('json', z.object({ actressIds: z.array(z.number().int()).min(1) })),
  async (c) => {
    const id = c.req.param('id');
    const { actressIds } = c.req.valid('json');
    await svc().replaceFavoriteActresses(id, actressIds);
    const rows = await svc().listFavoriteActresses(id);
    return c.json(rows, 201);
  }
);
usersRouter.get('/:id/favorite-actresses', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listFavoriteActresses(id);
  return c.json(rows);
});

// Social links
usersRouter.post(
  '/:id/social-links',
  zValidator('json', z.object({ links: z.array(z.object({ platform: z.string(), handle: z.string() })) })),
  async (c) => {
    const id = c.req.param('id');
    const { links } = c.req.valid('json');
    await svc().replaceSocialLinks(id, links);
    const rows = await svc().listSocialLinks(id);
    return c.json(rows, 201);
  }
);
usersRouter.get('/:id/social-links', async (c) => {
  const id = c.req.param('id');
  const rows = await svc().listSocialLinks(id);
  return c.json(rows);
});
