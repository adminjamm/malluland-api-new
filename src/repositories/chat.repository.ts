import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { chatRooms, chatRoomParticipants, chatMessages } from '../db/schema';
import { sql } from 'drizzle-orm';

export type Db = NodePgDatabase;

@Service()
export class ChatRepository {
  private get db(): Db {
    return Container.get('db');
  }

  createChatRoom({ id, type, meetupId }: { id: string; type: 'DM' | 'meetup'; meetupId?: string | null }) {
    const row = { id, type, meetupId: meetupId ?? null, createdAt: new Date(), updatedAt: new Date() } as any;
    return this.db.insert(chatRooms).values(row).returning();
  }

  addParticipants(roomId: string, userIds: string[]) {
    const now = new Date();
    const rows = userIds.map((uid) => ({
      chatRoomId: roomId,
      userId: uid,
      lastReadMessageId: null,
      unreadCount: 0,
      joinedAt: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })) as any[];
    return this.db.insert(chatRoomParticipants).values(rows).returning();
  }

  createTextMessage({ chatId, senderUserId, body }: { chatId: string; senderUserId: string; body: string }) {
    const now = new Date();
    const row = {
      chatId,
      senderUserId,
      kind: 'text',
      body,
      createdAt: now,
      updatedAt: now,
    } as any;
    return this.db.insert(chatMessages).values(row).returning();
  }

  async findMeetupRoomByParticipants(meetupId: string, userA: string, userB: string): Promise<{ id: string } | null> {
    const q = sql`SELECT cr.id
                  FROM chat_rooms cr
                  WHERE cr.meetup_id = ${meetupId}
                    AND EXISTS (SELECT 1 FROM chat_room_participants p1 WHERE p1.chat_room_id = cr.id AND p1.user_id = ${userA})
                    AND EXISTS (SELECT 1 FROM chat_room_participants p2 WHERE p2.chat_room_id = cr.id AND p2.user_id = ${userB})
                  ORDER BY cr.created_at ASC
                  LIMIT 1`;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return rows && rows.length ? { id: rows[0].id as string } : null;
  }

  async findMeetupRoomByMeetupId(meetupId: string): Promise<{ id: string } | null> {
    const q = sql`SELECT cr.id FROM chat_rooms cr WHERE cr.meetup_id = ${meetupId} ORDER BY cr.created_at ASC LIMIT 1`;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return rows && rows.length ? { id: rows[0].id as string } : null;
  }

  async findDmRoomByParticipants(userA: string, userB: string): Promise<{ id: string } | null> {
    // DM rooms are those with type = 'DM' and meetup_id IS NULL
    const q = sql`SELECT cr.id
                  FROM chat_rooms cr
                  WHERE cr.type = 'DM' AND cr.meetup_id IS NULL
                    AND EXISTS (SELECT 1 FROM chat_room_participants p1 WHERE p1.chat_room_id = cr.id AND p1.user_id = ${userA})
                    AND EXISTS (SELECT 1 FROM chat_room_participants p2 WHERE p2.chat_room_id = cr.id AND p2.user_id = ${userB})
                  ORDER BY cr.created_at ASC
                  LIMIT 1`;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return rows && rows.length ? { id: rows[0].id as string } : null;
  }

  async hasAnyMessages(chatId: string): Promise<boolean> {
    const q = sql`SELECT 1 FROM chat_messages WHERE chat_id = ${chatId} LIMIT 1`;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return !!(rows && rows.length);
  }

  async roomExists(chatId: string): Promise<boolean> {
    const q = sql`SELECT 1 FROM chat_rooms WHERE id = ${chatId} LIMIT 1`;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return !!(rows && rows.length);
  }

  async isActiveParticipant(chatId: string, userId: string): Promise<boolean> {
    const q = sql`SELECT 1 FROM chat_room_participants WHERE chat_room_id = ${chatId} AND user_id = ${userId} AND status = 'active' LIMIT 1`;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return !!(rows && rows.length);
  }
}
