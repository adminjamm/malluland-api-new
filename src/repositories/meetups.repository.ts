import { Service, Inject } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { jamms } from '../db/schema';
import { desc, eq, and, gt } from 'drizzle-orm';

export type Db = NodePgDatabase;

@Service()
export class MeetupsRepository {
  constructor(@Inject('db') private readonly db: Db) {}

  async listUpcoming({ limit, offset, now }: { limit: number; offset: number; now: number }) {
    return this.db
      .select()
      .from(jamms)
      .where(and(eq(jamms.status, 'active'), gt(jamms.fromTimestamp, now)))
      .orderBy(desc(jamms.fromTimestamp))
      .limit(limit)
      .offset(offset);
  }
}

