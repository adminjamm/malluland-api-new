import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { chatRequests } from '../db/schema';

export type Db = NodePgDatabase;

export type RequestItem = {
  kind: 'meetup' | 'chat';
  id: string;
  created_at: Date;
  status: string | null;
  // Common actor info
  sender_user_id?: string | null;
  sender_name?: string | null;
  // Meetup-specific
  meetup_id?: string | null;
  meetup_name?: string | null;
  // Chat-specific
  from_user_id?: string | null;
  to_user_id?: string | null;
  message?: string | null;
};

@Service()
export class RequestsRepository {
  private get db(): Db { return Container.get('db'); }

  async listMeetupReceived(userId: string, limit: number, offset: number): Promise<RequestItem[]> {
    const q = sql`
      SELECT 'meetup'::text AS kind,
             mr.id,
             mr.created_at,
             mr.status,
             mr.sender_user_id AS sender_user_id,
             u.name AS sender_name,
             m.id AS meetup_id,
             m.name AS meetup_name,
             NULL::uuid AS from_user_id,
             NULL::uuid AS to_user_id,
             mr.message
      FROM meetup_requests mr
      INNER JOIN meetups m ON m.id = mr.meetup_id
      INNER JOIN users u ON u.id = mr.sender_user_id
      WHERE m.host_id = ${userId}
      ORDER BY mr.created_at DESC, mr.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const res = await this.db.execute(q);
    return (Array.isArray(res) ? (res as any) : (res as any).rows) as RequestItem[];
  }

  async listChatReceived(userId: string, limit: number, offset: number): Promise<RequestItem[]> {
    const q = sql`
      SELECT 'chat'::text AS kind,
             cr.id,
             cr.created_at,
             cr.status,
             cr.from_user_id AS sender_user_id,
             u.name AS sender_name,
             NULL::uuid AS meetup_id,
             NULL::text AS meetup_name,
             cr.from_user_id,
             cr.to_user_id,
             cr.message
      FROM chat_requests cr
      INNER JOIN users u ON u.id = cr.from_user_id
      WHERE cr.to_user_id = ${userId}
      ORDER BY cr.created_at DESC, cr.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const res = await this.db.execute(q);
    return (Array.isArray(res) ? (res as any) : (res as any).rows) as RequestItem[];
  }

  async listChatSent(userId: string, limit: number, offset: number): Promise<RequestItem[]> {
    const q = sql`
      SELECT 'chat'::text AS kind,
             cr.id,
             cr.created_at,
             cr.status,
             cr.from_user_id AS sender_user_id,
             u.name AS sender_name,
             NULL::uuid AS meetup_id,
             NULL::text AS meetup_name,
             cr.from_user_id,
             cr.to_user_id,
             cr.message
      FROM chat_requests cr
      INNER JOIN users u ON u.id = cr.to_user_id
      WHERE cr.from_user_id = ${userId}
      ORDER BY cr.created_at DESC, cr.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const res = await this.db.execute(q);
    return (Array.isArray(res) ? (res as any) : (res as any).rows) as RequestItem[];
  }

  async createChatRequest(fromUserId: string, toUserId: string, message: string) {
    const now = new Date();
    const row = { id: crypto.randomUUID(), fromUserId, toUserId, message, status: 'pending', createdAt: now, updatedAt: now } as any;
    return this.db.insert(chatRequests).values(row).returning();
  }

  async setChatRequestRoom(id: string, chatRoomId: string) {
    const q = sql`UPDATE chat_requests SET chat_room_id = ${chatRoomId}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
    const res = await this.db.execute(q);
    const rows = Array.isArray(res) ? (res as any) : (res as any).rows;
    return rows as any[];
  }

  async listAllReceived(userId: string, limit: number, offset: number): Promise<RequestItem[]> {
    const q = sql`
      (
        SELECT 'meetup'::text AS kind,
               mr.id,
               mr.created_at,
               mr.status,
               mr.sender_user_id AS sender_user_id,
               u.name AS sender_name,
               m.id AS meetup_id,
               m.name AS meetup_name,
               NULL::uuid AS from_user_id,
               NULL::uuid AS to_user_id,
               mr.message
        FROM meetup_requests mr
        INNER JOIN meetups m ON m.id = mr.meetup_id
        INNER JOIN users u ON u.id = mr.sender_user_id
        WHERE m.host_id = ${userId}
      )
      UNION ALL
      (
        SELECT 'chat'::text AS kind,
               cr.id,
               cr.created_at,
               cr.status,
               cr.from_user_id AS sender_user_id,
               u.name AS sender_name,
               NULL::uuid AS meetup_id,
               NULL::text AS meetup_name,
               cr.from_user_id,
               cr.to_user_id,
               cr.message
        FROM chat_requests cr
        INNER JOIN users u ON u.id = cr.from_user_id
        WHERE cr.to_user_id = ${userId}
      )
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const res = await this.db.execute(q);
    return (Array.isArray(res) ? (res as any) : (res as any).rows) as RequestItem[];
  }

  getChatRequestById(id: string) {
    return this.db.execute(sql`SELECT * FROM chat_requests WHERE id = ${id} LIMIT 1`);
  }

  async judgeChatRequest(id: string, toUserId: string, action: 'accept' | 'decline' | 'archive') {
    const newStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'archived';
    const q = sql`UPDATE chat_requests SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id} AND to_user_id = ${toUserId} RETURNING *`;
    const res = await this.db.execute(q);
    const rows = Array.isArray(res) ? (res as any) : (res as any).rows;
    return rows as any[];
  }
}
