import { Service, Container } from 'typedi';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { airports } from '../db/schema';
import { haversineKm } from '../utils/geo';
import { sql } from 'drizzle-orm';

@Service()
export class AirportsRepository {
  private get db(): NodePgDatabase { return Container.get('db'); }

  async listAllAirports(): Promise<Array<{ id: string; lat: number | null; lng: number | null; iata: string | null; airportName: string | null }>> {
    return this.db.select({ id: airports.id, lat: airports.lat, lng: airports.lng, iata: airports.iata, airportName: airports.airportName }).from(airports);
  }

  async findNearestIata(lat: number, lng: number): Promise<{ iata: string | null; airportName: string | null; distanceKm: number } | null> {
    // Use a coarse bounding box + squared-distance ordering in SQL to avoid scanning all rows.
    // Then compute exact haversine on a small candidate set client-side.
    const windowDeg = 2; // ~222km in latitude; adjust if needed

    // Select a small candidate set ordered by squared planar distance
    const candidates = await this.db
      .select({
        lat: airports.lat,
        lng: airports.lng,
        iata: airports.iata,
        airportName: airports.airportName,
      })
      .from(airports)
      .where(
        // lat/lng not null and within bounding box window
        sql`${airports.lat} IS NOT NULL AND ${airports.lng} IS NOT NULL
          AND abs(${airports.lat} - ${lat}) < ${windowDeg}
          AND abs(${airports.lng} - ${lng}) < ${windowDeg}`
      )
      .orderBy(sql`((${airports.lat} - ${lat})*(${airports.lat} - ${lat}) + (${airports.lng} - ${lng})*(${airports.lng} - ${lng})) ASC`)
      .limit(50);

    if (!candidates.length) {
      // Fallback: widen search window
      const wideDeg = 10;
      const fallback = await this.db
        .select({ lat: airports.lat, lng: airports.lng, iata: airports.iata, airportName: airports.airportName })
        .from(airports)
        .where(sql`${airports.lat} IS NOT NULL AND ${airports.lng} IS NOT NULL
          AND abs(${airports.lat} - ${lat}) < ${wideDeg}
          AND abs(${airports.lng} - ${lng}) < ${wideDeg}`)
        .orderBy(sql`((${airports.lat} - ${lat})*(${airports.lat} - ${lat}) + (${airports.lng} - ${lng})*(${airports.lng} - ${lng})) ASC`)
        .limit(50);
      if (!fallback.length) return null;
      return fallback
        .map((r) => ({
          iata: r.iata ?? null,
          airportName: r.airportName ?? null,
          distanceKm: haversineKm(lat, lng, r.lat!, r.lng!),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    }

    const best = candidates
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        iata: r.iata ?? null,
        airportName: r.airportName ?? null,
        distanceKm: haversineKm(lat, lng, r.lat!, r.lng!),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;

    return best ?? null;
  }
}
