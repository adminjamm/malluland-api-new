import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { S3Helper } from '../helpers/s3.helper';

export const storageRouter = new Hono();

const s3 = () => Container.get(S3Helper);

// Generate a pre-signed PUT URL
storageRouter.post(
  '/presign/put',
  zValidator(
    'json',
    z.object({
      key: z.string().optional(),
      contentType: z.string().optional(),
      expiresInSeconds: z.number().int().positive().max(7 * 24 * 60 * 60).optional(), // up to 7 days
      acl: z.enum(['private', 'public-read']).optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid('json');
    const result = await s3().presignPut(body);
    return c.json(result);
  }
);

// Generate a pre-signed GET URL
storageRouter.post(
  '/presign/get',
  zValidator(
    'json',
    z.object({
      key: z.string(),
      expiresInSeconds: z.number().int().positive().max(7 * 24 * 60 * 60).optional(),
      responseContentType: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid('json');
    const result = await s3().presignGet(body);
    return c.json(result);
  }
);

