import 'dotenv/config';
import { createDb } from '../../infra/db';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  return createDb(url);
}
