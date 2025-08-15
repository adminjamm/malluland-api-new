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
  meetup?: {
    id: string;
    name: string | null;
    description: string | null;
    starts_at: Date | null;
    ends_at: Date | null;
    city: string | null;
    state: string | null;
    country: string | null;
    activity_id: number | null;
    who_pays: string | null;
    fee_amount: string | null;
    guests: number | null;
    host_id: string | null;
  } | null;
  host?: {
    id: string;
    name: string | null;
  } | null;
};

@Service()
export class ChatsRepository {
  private get db(): Db { return Container.get('db'); }

  async listRoomsForUser(userId: string, limit: number, offset: number): Promise<ChatRoomListItem[]> {
    // Use a single SQL to fetch rooms where the user participates, latest message, unread count, participant ids,
    // plus meetup and host details for meetup-type rooms.
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
        COALESCE(pr.participant_user_ids, ARRAY[]::uuid[]) AS participant_user_ids,
        m.id AS meetup__id,
        m.name AS meetup__name,
        m.description AS meetup__description,
        m.starts_at AS meetup__starts_at,
        m.ends_at AS meetup__ends_at,
        m.city AS meetup__city,
        m.state AS meetup__state,
        m.country AS meetup__country,
        m.activity_id AS meetup__activity_id,
        m.who_pays AS meetup__who_pays,
        m.fee_amount AS meetup__fee_amount,
        m.guests AS meetup__guests,
        m.host_id AS meetup__host_id,
        u.id AS host__id,
        u.name AS host__name
      FROM chat_rooms r
      INNER JOIN chat_room_participants p
        ON p.chat_room_id = r.id AND p.user_id = ${userId}
      LEFT JOIN LATERAL (
        SELECT m2.id AS last_message_id, m2.kind AS last_message_kind, m2.body AS last_message_body, m2.created_at AS last_message_at
        FROM chat_messages m2
        WHERE m2.chat_id = r.id
        ORDER BY m2.created_at DESC, m2.id DESC
        LIMIT 1
      ) lm ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pp.user_id) AS participant_user_ids
        FROM chat_room_participants pp
        WHERE pp.chat_room_id = r.id
      ) pr ON TRUE
      LEFT JOIN meetups m ON m.id = r.meetup_id
      LEFT JOIN users u ON u.id = m.host_id
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
      meetup: r.meetup__id
        ? {
            id: String(r.meetup__id),
            name: r.meetup__name ?? null,
            description: r.meetup__description ?? null,
            starts_at: r.meetup__starts_at ?? null,
            ends_at: r.meetup__ends_at ?? null,
            city: r.meetup__city ?? null,
            state: r.meetup__state ?? null,
            country: r.meetup__country ?? null,
            activity_id: r.meetup__activity_id ?? null,
            who_pays: r.meetup__who_pays ?? null,
            fee_amount: r.meetup__fee_amount != null ? String(r.meetup__fee_amount) : null,
            guests: r.meetup__guests ?? null,
            host_id: r.meetup__host_id ?? null,
          }
        : null,
      host: r.host__id ? { id: String(r.host__id), name: r.host__name ?? null } : null,
    }));
  }
}
