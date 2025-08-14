import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

export type Db = NodePgDatabase;

export type ChatRoomListItem = {
  id: string;
  type: 'DM' | 'meetup';
  meetup_id: string | null;
  unread_count: number | null;
  last_message_id: string | null;
  last_message_kind: string | null;
  last_message_body: string | null;
  last_message_at: Date | null;
  participant_user_ids: string[];
};

@Service()
export class ChatsRepository {
  private get db(): Db { return Container.get('db'); }

  async listRoomsForUser(userId: string, limit: number, offset: number): Promise<ChatRoomListItem[]> {
    // Use a single SQL to fetch rooms where the user participates, latest message, unread count, and participant ids
    const q = sql`
      SELECT
        r.id,
        r.type::text AS type,
        r.meetup_id,
        p.unread_count,
        lm.last_message_id,
        lm.last_message_kind,
        lm.last_message_body,
        lm.last_message_at,
        COALESCE(pr.participant_user_ids, ARRAY[]::uuid[]) AS participant_user_ids
      FROM chat_rooms r
      INNER JOIN chat_room_participants p
        ON p.chat_room_id = r.id AND p.user_id = ${userId}
      LEFT JOIN LATERAL (
        SELECT m.id AS last_message_id, m.kind AS last_message_kind, m.body AS last_message_body, m.created_at AS last_message_at
        FROM chat_messages m
        WHERE m.chat_id = r.id
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
      ) lm ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pp.user_id) AS participant_user_ids
        FROM chat_room_participants pp
        WHERE pp.chat_room_id = r.id
      ) pr ON TRUE
      ORDER BY COALESCE(lm.last_message_at, r.updated_at) DESC, r.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const res = await this.db.execute(q);
    const rows = (Array.isArray(res) ? (res as any) : (res as any).rows) as any[];
    // Normalize types and ensure participant_user_ids is string[]
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      meetup_id: r.meetup_id ?? null,
      unread_count: r.unread_count ?? 0,
      last_message_id: r.last_message_id ?? null,
      last_message_kind: r.last_message_kind ?? null,
      last_message_body: r.last_message_body ?? null,
      last_message_at: r.last_message_at ?? null,
      participant_user_ids: (r.participant_user_ids || []).map((x: any) => String(x)),
    }));
  }
}
