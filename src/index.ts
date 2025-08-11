import 'reflect-metadata';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { Container } from 'typedi';
import { peopleRouter } from './routes/people';
import { meetupsRouter } from './routes/meetups';
import { bookmarksRouter } from './routes/bookmarks';
import { createDb } from './infra/db';

const app = new Hono();
app.use('*', logger());

// Dependencies
const db = createDb(process.env.DATABASE_URL);
Container.set('db', db);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/people', peopleRouter);
app.route('/meetups', meetupsRouter);
app.route('/bookmarks', bookmarksRouter);

const port = Number(process.env.PORT || 8787);
console.log(`Server listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

