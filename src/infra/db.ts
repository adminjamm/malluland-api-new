import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export function createDb(databaseUrl?: string) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new Pool({ connectionString: databaseUrl, max: 10 });
  const db = drizzle(pool);
  return db;
}

