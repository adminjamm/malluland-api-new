import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { catalogActors } from '../db/schema';

export type Db = NodePgDatabase;

@Service()
export class ActorsRepository {
  private get db(): Db {
    return Container.get('db');
  }

  async list({ limit, offset }: { limit: number; offset: number }) {
    const db = this.db as any;
    if (typeof db?.select !== 'function') {
      throw new Error('Database not initialized correctly in Container: expected Drizzle instance with select()');
    }
    return db
      .select()
      .from(catalogActors)
      .orderBy(catalogActors.name)
      .limit(limit)
      .offset(offset);
  }
}
