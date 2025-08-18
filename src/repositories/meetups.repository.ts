import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { meetups, users as usersTable, meetupRequests, meetupAttendees } from '../db/schema';
import { and, asc, between, desc, eq, gt, gte, lt, lte, ne, sql } from 'drizzle-orm';

export type Db = NodePgDatabase;

export type TimeRange = { start?: Date; end?: Date };

@Service()
export class MeetupsRepository {
  private get db(): Db {
    return Container.get('db');
  }

  listInRange({ range, limit, offset, onlyActive = true, city, activityId, excludeHostId, requestUserId }: { range: TimeRange; limit: number; offset: number; onlyActive?: boolean; city?: string; activityId?: number; excludeHostId?: string; requestUserId?: string }) {
    // Use raw SQL to support LEFT JOIN LATERAL for host avatar selection
    const whereClauses: any[] = [];
    const startIso = range.start ? range.start.toISOString() : undefined;
    const endIso = range.end ? range.end.toISOString() : undefined;
    if (onlyActive) whereClauses.push(sql`m.meetup_status = 'active'`);
    if (startIso && endIso) whereClauses.push(sql`m.starts_at BETWEEN ${startIso}::timestamptz AND ${endIso}::timestamptz`);
    else if (startIso) whereClauses.push(sql`m.starts_at > ${startIso}::timestamptz`);
    else if (endIso) whereClauses.push(sql`m.starts_at < ${endIso}::timestamptz`);
    if (city) whereClauses.push(sql`m.city = ${city}`);
    if (activityId) whereClauses.push(sql`m.activity_id = ${activityId}`);
    if (excludeHostId) whereClauses.push(sql`m.host_id <> ${excludeHostId}`);

    const whereSql = whereClauses.length ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}` : sql``;

    // Compute isRequested expression safely (avoid untyped NULL params)
    const isRequestedExpr = requestUserId
      ? sql`EXISTS (SELECT 1 FROM meetup_requests mr WHERE mr.meetup_id = m.id AND mr.sender_user_id = ${requestUserId}::uuid)`
      : sql`false`;

    const query = sql`
      SELECT
        m.id,
        m.name,
        m.starts_at AS "startsAt",
        m.ends_at AS "endsAt",
        m.city,
        m.state,
        m.country,
        m.activity_id AS "activityId",
        m.who_pays AS "whoPays",
        m.fee_amount AS "feeAmount",
        m.guests,
        m.host_id AS "hostId",
        u.name AS "hostName",
        m.location_text AS "locationText",
        m.description,
        COALESCE(avatar.optimized_url, avatar.original_url) AS "hostAvatar",
        ${isRequestedExpr} AS "isRequested"
      FROM meetups m
      INNER JOIN users u ON u.id = m.host_id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = u.id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC
        LIMIT 1
      ) avatar ON true
      ${whereSql}
      ORDER BY m.starts_at ASC, m.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return this.db.execute(query) as any;
  }

  listByHost({ hostId, includePast, now, limit, offset }: { hostId: string; includePast?: boolean; now: Date; limit: number; offset: number }) {
    // Include host avatar in the response as well for consistency
    const nowIso = now.toISOString();
    const timeClause = includePast ? sql`` : sql`AND m.starts_at > ${nowIso}::timestamptz`;
    const query = sql`
      SELECT
        m.id,
        m.name,
        m.starts_at AS "startsAt",
        m.ends_at AS "endsAt",
        m.city,
        m.state,
        m.country,
        m.activity_id AS "activityId",
        m.who_pays AS "whoPays",
        m.fee_amount AS "feeAmount",
        m.guests,
        m.host_id AS "hostId",
        m.location_text AS "locationText",
        m.description,
        m.map_url AS "mapUrl",
        m.meetup_status AS "meetupStatus",
        u.name AS "hostName",
        COALESCE(avatar.optimized_url, avatar.original_url) AS "hostAvatar"
      FROM meetups m
      INNER JOIN users u ON u.id = m.host_id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = u.id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC
        LIMIT 1
      ) avatar ON true
      WHERE m.host_id = ${hostId} AND m.meetup_status <> 'deleted' ${timeClause}
      ORDER BY m.starts_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return this.db.execute(query) as any;
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
    console.log("Inserting meetup request", row);
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

