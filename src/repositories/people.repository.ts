import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

export type Db = NodePgDatabase;

export type Gender = 'male' | 'female' | string;

export type Center = { lat: number; lng: number };

export type PersonRow = {
  id: string;
  name: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  dob: Date | null;
  company: string | null;
  position: string | null;
  bio: string | null;
  approval_at: Date | null;
  distance_km: number | null;
  avatar_url: string | null;
};

@Service()
export class PeopleRepository {
  private get db(): Db {
    return Container.get('db');
  }

  async getViewerCenter(userId: string): Promise<Center | null> {
    // Fetch the latest lat/lng for the user from user_location.
    // Although user_id is modeled as PK (single row), we still order by updated_at DESC for safety.
    const rows = await this.db.execute(
      sql`SELECT lat, lng FROM user_location WHERE user_id = ${userId} ORDER BY updated_at DESC NULLS LAST LIMIT 1`
    );
    const r: any = Array.isArray(rows) ? (rows as any)[0] : (rows as any).rows?.[0];
    if (!r) return null;
    return { lat: Number(r.lat), lng: Number(r.lng) };
  }

  // Fetch a gender bucket, ordered by approval_at desc, filtered within 30km and not blocked.
  async fetchGenderBucket(params: {
    viewerId: string;
    gender?: Gender; // if omitted, no gender filter
    center: Center;
    limit: number;
    offset: number;
    maxDistanceKm?: number;
    ageMin?: number;
    ageMax?: number;
    interestIds?: number[];
  }): Promise<PersonRow[]> {
    const { viewerId, gender, center, limit, offset, maxDistanceKm = 30, ageMin, ageMax, interestIds } = params;

    // Bounding box deltas based on radius
    const latDelta = maxDistanceKm / 111.32;
    const lngDelta = maxDistanceKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));

    const query = sql`
      WITH latest_approval AS (
        SELECT al.user_id, MAX(al.created_at) AS approval_at
        FROM admin_logs al
        WHERE al.action_type IN ('profile_approved', 'user_state:approved_free', 'user_state:approved_paid')
        GROUP BY al.user_id
      )
      SELECT u.id,
             u.name,
             u.gender,
             u.city,
             u.state,
             u.country,
             u.dob,
             u.company,
             u.position,
             u.bio,
             la.approval_at,
             (6371 * acos(
               cos(radians(${center.lat})) * cos(radians(ul.lat)) *
               cos(radians(ul.lng) - radians(${center.lng})) +
               sin(radians(${center.lat})) * sin(radians(ul.lat))
             ))::double precision AS distance_km,
             COALESCE(avatar.optimized_url, avatar.original_url) AS avatar_url
      FROM users u
      INNER JOIN user_location ul ON ul.user_id = u.id
      LEFT JOIN latest_approval la ON la.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT up.optimized_url, up.original_url
        FROM user_photos up
        WHERE up.user_id = u.id AND up.image_type = 'avatar' AND up.is_active = true
        ORDER BY up.position ASC
        LIMIT 1
      ) avatar ON true
      WHERE u.id <> ${viewerId}
        AND u.user_state IN ('approved_free', 'approved_paid')
        ${gender ? sql`AND u.gender = ${gender}` : sql``}
        AND ul.lat BETWEEN ${center.lat - latDelta} AND ${center.lat + latDelta}
        AND ul.lng BETWEEN ${center.lng - lngDelta} AND ${center.lng + lngDelta}
        AND NOT EXISTS (
          SELECT 1 FROM blocked_user bu
          WHERE (bu.user_id = ${viewerId} AND bu.blocked_user_id = u.id)
             OR (bu.user_id = u.id AND bu.blocked_user_id = ${viewerId})
        )
        ${interestIds && interestIds.length ? sql`AND EXISTS (SELECT 1 FROM user_interests ui WHERE ui.user_id = u.id AND ui.interest_id IN (${sql.join(interestIds.map((id) => sql`${id}`), sql`, `)}))` : sql``}
        ${typeof ageMin === 'number' ? sql`AND (DATE_PART('year', AGE(CURRENT_DATE, u.dob)) >= ${ageMin})` : sql``}
        ${typeof ageMax === 'number' ? sql`AND (DATE_PART('year', AGE(CURRENT_DATE, u.dob)) <= ${ageMax})` : sql``}
        AND (6371 * acos(
               cos(radians(${center.lat})) * cos(radians(ul.lat)) *
               cos(radians(ul.lng) - radians(${center.lng})) +
               sin(radians(${center.lat})) * sin(radians(ul.lat))
             )) <= ${maxDistanceKm}
      ORDER BY la.approval_at DESC NULLS LAST, u.updated_at DESC NULLS LAST, u.id
      LIMIT ${limit} OFFSET ${offset}
    `;

    const res = await this.db.execute(query);
    const rows: any[] = Array.isArray(res) ? (res as any) : (res as any).rows;
    return rows as PersonRow[];
  }
}

