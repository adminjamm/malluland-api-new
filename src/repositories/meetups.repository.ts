import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { meetups, users as usersTable, meetupRequests, meetupAttendees } from '../db/schema';
import { and, asc, between, desc, eq, gt, gte, lt, lte, ne } from 'drizzle-orm';

export type Db = NodePgDatabase;

export type TimeRange = { start?: Date; end?: Date };

@Service()
export class MeetupsRepository {
  private get db(): Db {
    return Container.get('db');
  }

  listInRange({ range, limit, offset, onlyActive = true, city, activityId, excludeHostId }: { range: TimeRange; limit: number; offset: number; onlyActive?: boolean; city?: string; activityId?: number; excludeHostId?: string }) {
    const where: any[] = [];
    if (onlyActive) where.push(eq(meetups.meetupStatus, 'active'));
    if (range.start && range.end) where.push(between(meetups.startsAt, range.start, range.end));
    else if (range.start) where.push(gt(meetups.startsAt, range.start));
    else if (range.end) where.push(lt(meetups.startsAt, range.end));
    if (city) where.push(eq(meetups.city, city));
    if (activityId) where.push(eq(meetups.activityId, activityId));
    if (excludeHostId) where.push(ne(meetups.hostId, excludeHostId));

    return this.db
      .select({
        id: meetups.id,
        name: meetups.name,
        startsAt: meetups.startsAt,
        endsAt: meetups.endsAt,
        city: meetups.city,
        state: meetups.state,
        country: meetups.country,
        activityId: meetups.activityId,
        whoPays: meetups.whoPays,
        feeAmount: meetups.feeAmount,
        guests: meetups.guests,
        hostId: meetups.hostId,
        hostName: usersTable.name,
      })
      .from(meetups)
      .innerJoin(usersTable, eq(usersTable.id, meetups.hostId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(asc(meetups.startsAt), asc(meetups.id))
      .limit(limit)
      .offset(offset);
  }

  listByHost({ hostId, includePast, now, limit, offset }: { hostId: string; includePast?: boolean; now: Date; limit: number; offset: number }) {
    const where: any[] = [eq(meetups.hostId, hostId), ne(meetups.meetupStatus, 'deleted')];
    if (!includePast) where.push(gt(meetups.startsAt, now));
    return this.db
      .select()
      .from(meetups)
      .where(and(...where))
      .orderBy(asc(meetups.startsAt))
      .limit(limit)
      .offset(offset);
  }

  create(hostId: string, data: Omit<typeof meetups.$inferInsert, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>) {
    const row = { ...(data as any), hostId, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date(), meetupStatus: 'active' } as any;
    return this.db.insert(meetups).values(row).returning();
  }

  update(id: string, hostId: string, data: Partial<typeof meetups.$inferInsert>) {
    return this.db.update(meetups).set({ ...(data as any), updatedAt: new Date() } as any).where(and(eq(meetups.id, id), eq(meetups.hostId, hostId))).returning();
  }

  softDelete(id: string, hostId: string) {
    return this.db.update(meetups).set({ meetupStatus: 'deleted', updatedAt: new Date() } as any).where(and(eq(meetups.id, id), eq(meetups.hostId, hostId))).returning();
  }

  getById(id: string) {
    return this.db.select().from(meetups).where(eq(meetups.id, id)).limit(1);
  }

  listAttendees(meetupId: string) {
    return this.db.select().from(meetupAttendees).where(eq(meetupAttendees.meetupId, meetupId));
  }

  getRequestById(id: string) {
    return this.db.select().from(meetupRequests).where(eq(meetupRequests.id, id)).limit(1);
  }

  async hasExistingRequest(meetupId: string, senderUserId: string) {
    const rows = await this.db.select({ id: meetupRequests.id }).from(meetupRequests).where(and(eq(meetupRequests.meetupId, meetupId), eq(meetupRequests.senderUserId, senderUserId))).limit(1);
    return rows.length > 0;
  }

  insertRequest(row: typeof meetupRequests.$inferInsert) {
    return this.db.insert(meetupRequests).values(row).returning();
  }

  countRequestsInWindow(senderUserId: string, start: Date, end: Date) {
    // Drizzle COUNT workaround: select count(*) via sql or fetch rows and length. Keep simple by selecting minimal columns.
    return this.db
      .select({ id: meetupRequests.id })
      .from(meetupRequests)
      .where(and(eq(meetupRequests.senderUserId, senderUserId), gte(meetupRequests.createdAt, start), lte(meetupRequests.createdAt, end)));
  }

  approveRequest(id: string) {
    return this.db.update(meetupRequests).set({ status: 'accepted', updatedAt: new Date() } as any).where(eq(meetupRequests.id, id)).returning();
  }

  declineRequest(id: string) {
    return this.db.update(meetupRequests).set({ status: 'declined', updatedAt: new Date() } as any).where(eq(meetupRequests.id, id)).returning();
  }

  addAttendee(meetupId: string, senderUserId: string) {
    const row = { id: crypto.randomUUID(), meetupId, senderUserId, chatRoomId: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() } as any;
    return this.db.insert(meetupAttendees).values(row).returning();
  }

  addAttendeeWithChatRoomId(meetupId: string, senderUserId: string, chatRoomId: string) {
    const row = { id: crypto.randomUUID(), meetupId, senderUserId, chatRoomId, createdAt: new Date(), updatedAt: new Date() } as any;
    return this.db.insert(meetupAttendees).values(row).returning();
  }

  listSentRequests(userId: string, limit: number, offset: number) {
    return this.db.select().from(meetupRequests).where(eq(meetupRequests.senderUserId, userId)).orderBy(desc(meetupRequests.createdAt)).limit(limit).offset(offset);
  }

  listReceivedRequests(hostId: string, limit: number, offset: number) {
    // join meetup_requests with meetups to filter by host
    return this.db
      .select({
        id: meetupRequests.id,
        meetupId: meetupRequests.meetupId,
        senderUserId: meetupRequests.senderUserId,
        message: meetupRequests.message,
        status: meetupRequests.status,
        createdAt: meetupRequests.createdAt,
        updatedAt: meetupRequests.updatedAt,
      })
      .from(meetupRequests)
      .innerJoin(meetups, eq(meetups.id, meetupRequests.meetupId))
      .where(eq(meetups.hostId, hostId))
      .orderBy(desc(meetupRequests.createdAt))
      .limit(limit)
      .offset(offset);
  }
}

