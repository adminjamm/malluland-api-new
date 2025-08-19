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
    const { items } = await this.listRoomsForUserWithTotal(userId, limit, offset);
    return items;
  }

  async listRoomsForUserWithTotal(userId: string, limit: number, offset: number): Promise<{ items: ChatRoomListItem[]; total: number }> {
    // Total count with same base filters (exclude joins and ordering)
    const countQ = sql`
      SELECT COUNT(*)::bigint AS total
      FROM chat_rooms r
      INNER JOIN chat_room_participants p
        ON p.chat_room_id = r.id AND p.user_id = ${userId}
    `;
    const countRes: any = await this.db.execute(countQ);
    const total = Number((Array.isArray(countRes) ? countRes[0].total : countRes.rows[0].total) || 0);

    // Paged query with joins
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
    const items: ChatRoomListItem[] = rows.map((r) => ({
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

    return { items, total };
  }

  async listRoomsV2WithTotal(userId: string, limit: number, offset: number): Promise<{ items: any[]; total: number }> {
    // total count (no offset/limit)
    const countQ = sql`
      WITH filtered_chatrooms AS (
        SELECT cr.*
        FROM chat_rooms cr 
        WHERE 
          cr.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM chat_room_participants crp 
            WHERE crp.chat_room_id = cr.id
              AND crp.user_id = ${userId}
              AND crp.status = 'active'
          )
          AND (
            SELECT COUNT(*) FROM chat_room_participants crp 
            WHERE crp.chat_room_id = cr.id
          ) > 1
          AND (
            cr.type != 'DM'
            OR NOT EXISTS (
              SELECT 1 
              FROM chat_room_participants crp1 
              JOIN chat_room_participants crp2 ON 
                crp1.chat_room_id = crp2.chat_room_id 
                AND crp1.user_id != crp2.user_id 
              JOIN blocked_user bu ON 
                (bu.user_id = crp1.user_id AND bu.blocked_user_id = crp2.user_id)
                OR 
                (bu.user_id = crp2.user_id AND bu.blocked_user_id = crp1.user_id)
              WHERE crp1.chat_room_id = cr.id
            )
          )
      )
      SELECT COUNT(*)::bigint AS total FROM filtered_chatrooms
    `;
    const countRes: any = await this.db.execute(countQ);
    const total = Number((Array.isArray(countRes) ? countRes[0]?.total : countRes.rows?.[0]?.total) || 0);

    // items with offset/limit
    const itemsQ = sql`
      WITH filtered_chatrooms AS (
        SELECT cr.*
        FROM chat_rooms cr 
        WHERE 
          cr.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM chat_room_participants crp 
            WHERE crp.chat_room_id = cr.id
              AND crp.user_id = ${userId}
              AND crp.status = 'active'
          )
          AND (
            SELECT COUNT(*) FROM chat_room_participants crp 
            WHERE crp.chat_room_id = cr.id
          ) > 1
          AND (
            cr.type != 'DM'
            OR NOT EXISTS (
              SELECT 1 
              FROM chat_room_participants crp1 
              JOIN chat_room_participants crp2 ON 
                crp1.chat_room_id = crp2.chat_room_id 
                AND crp1.user_id != crp2.user_id 
              JOIN blocked_user bu ON 
                (bu.user_id = crp1.user_id AND bu.blocked_user_id = crp2.user_id)
                OR 
                (bu.user_id = crp2.user_id AND bu.blocked_user_id = crp1.user_id)
              WHERE crp1.chat_room_id = cr.id
            )
          )
        ORDER BY cr.created_at DESC
        OFFSET ${offset}
        LIMIT ${limit}
      )
      SELECT 
        c.id AS id,
        c.type::text AS type,
        c.meetup_id,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        dmr_requestor.name as requestor_name,
        dmr_requestor.id as requestor_id,
        dm_creator.name as dm_creator_name,
        dm_creator.id as dm_creator_id,
        m.id AS meetup_id,
        m.host_id AS meetup_host_id,
        m.name AS meetup_name,
        m.description AS meetup_description,
        m.starts_at AS meetup_starts_at,
        m.ends_at AS meetup_ends_at,
        m.city AS meetup_city,
        m.state AS meetup_state,
        m.country AS meetup_country,
        m.meetup_status AS meetup_status,
        m.guests AS meetup_guests,
        m.activity_id AS meetup_activity_id,
        m.who_pays AS meetup_who_pays,
        m.fee_amount AS meetup_fee_amount,
        meetup_creator.name as meetup_creator_name,
        meetup_creator.id as meetup_creator_id,
        COALESCE(m_avatar.optimized_url, m_avatar.original_url) AS meetup_creator_avatar,
        COALESCE(dmr_avatar.optimized_url, dmr_avatar.original_url) AS dm_requestor_avatar,
        COALESCE(dmc_avatar.optimized_url, dmc_avatar.original_url) AS dm_creator_avatar
      FROM filtered_chatrooms c
      LEFT JOIN chat_requests chr ON c.id = chr.chat_room_id
      LEFT JOIN users dmr_requestor ON chr.from_user_id = dmr_requestor.id
      LEFT JOIN users dm_creator ON chr.to_user_id = dm_creator.id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = chr.from_user_id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC, up.created_at DESC
        LIMIT 1
      ) dmr_avatar ON TRUE
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = chr.to_user_id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC, up.created_at DESC
        LIMIT 1
      ) dmc_avatar ON TRUE
      LEFT JOIN meetups m ON c.id = m.chat_room_id
      LEFT JOIN users meetup_creator ON m.host_id = meetup_creator.id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = m.host_id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC, up.created_at DESC
        LIMIT 1
      ) m_avatar ON TRUE
    `;
    const itemsRes = await this.db.execute(itemsQ);
    const items = (Array.isArray(itemsRes) ? (itemsRes as any) : (itemsRes as any).rows) as any[];

    return { items, total };
  }

  // Backward-compatible wrapper in case any callers still use listRoomsV2 directly
  async listRoomsV2(userId: string, limit: number, offset: number): Promise<any[]> {
    const { items } = await this.listRoomsV2WithTotal(userId, limit, offset);
    return items;
  }

  async listParticipants(chatId: string): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null }>> {
    const q = sql`
      SELECT 
        p.user_id AS user_id,
        u.name AS name,
        COALESCE(up.optimized_url, up.original_url) AS avatar_url
      FROM chat_room_participants p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN LATERAL (
        SELECT ph.optimized_url, ph.original_url
        FROM user_photos ph
        WHERE ph.user_id = p.user_id AND ph.image_type = 'avatar' AND ph.is_active = true
        ORDER BY ph.position ASC, ph.created_at DESC
        LIMIT 1
      ) up ON TRUE
      WHERE p.chat_room_id = ${chatId} AND p.status = 'active'
    `;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return (rows || []).map((r: any) => ({ userId: String(r.user_id), name: r.name ?? null, avatarUrl: r.avatar_url ?? null }));
  }

  async getRoomDetailsV2(id: string): Promise<any | null> {
    const q = sql`
      SELECT 
        cr.id AS id,
        cr.type::text AS type,
        cr.meetup_id,
        cr.created_at,
        cr.updated_at,
        cr.deleted_at,
        dmr_requestor.name as requestor_name,
        dm_creator.name as dm_creator_name,
        m.id AS meetup_id,
        m.host_id AS meetup_host_id,
        m.name AS meetup_name,
        m.description AS meetup_description,
        m.starts_at AS meetup_starts_at,
        m.ends_at AS meetup_ends_at,
        m.city AS meetup_city,
        m.state AS meetup_state,
        m.country AS meetup_country,
        m.meetup_status AS meetup_status,
        m.guests AS meetup_guests,
        m.activity_id AS meetup_activity_id,
        m.who_pays AS meetup_who_pays,
        m.fee_amount AS meetup_fee_amount,
        meetup_creator.name as meetup_creator_name,
        COALESCE(m_avatar.optimized_url, m_avatar.original_url) AS meetup_creator_avatar,
        COALESCE(dmr_avatar.optimized_url, dmr_avatar.original_url) AS dm_requestor_avatar,
        COALESCE(dmc_avatar.optimized_url, dmc_avatar.original_url) AS dm_creator_avatar
      FROM chat_rooms cr
      LEFT JOIN chat_requests chr ON cr.id = chr.chat_room_id
      LEFT JOIN users dmr_requestor ON chr.from_user_id = dmr_requestor.id
      LEFT JOIN users dm_creator ON chr.to_user_id = dm_creator.id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = chr.from_user_id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC
        LIMIT 1
      ) dmr_avatar ON TRUE
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = chr.to_user_id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC
        LIMIT 1
      ) dmc_avatar ON TRUE
      LEFT JOIN meetups m ON cr.id = m.chat_room_id
      LEFT JOIN users meetup_creator ON m.host_id = meetup_creator.id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = m.host_id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC
        LIMIT 1
      ) m_avatar ON TRUE
      WHERE cr.id = ${id}
      LIMIT 1
    `;
    const res: any = await this.db.execute(q);
    const rows = Array.isArray(res) ? res : res.rows;
    return rows && rows.length ? rows[0] : null;
  }
}
