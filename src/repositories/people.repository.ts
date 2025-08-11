import { Service, Inject } from 'typedi';
import { eq, and, desc } from 'drizzle-orm';
import { allUsers } from '../db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type Db = NodePgDatabase;

@Service()
export class PeopleRepository {
  constructor(@Inject('db') private readonly db: Db) {}

  async listApprovedActive({ limit, offset }: { limit: number; offset: number }) {
    // Approved active members per spec
    return this.db
      .select()
      .from(allUsers)
      .where(and(eq(allUsers.status, 'approved'), eq(allUsers.state, 'active')))
      .orderBy(desc(allUsers.updatedAt))
      .limit(limit)
      .offset(offset);
  }
}

