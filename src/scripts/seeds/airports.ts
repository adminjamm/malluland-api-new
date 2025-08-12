import 'dotenv/config';
import { createDb } from '../../infra/db';
import { airports } from '../../db/schema';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';

function resolveCsvPath(): string {
  const p = process.env.AIRPORTS_CSV || 'IATA ICAO Codes.csv';
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

// Minimal CSV row parser handling quotes and commas
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { // escaped quote
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toKey(iata?: string | null, icao?: string | null): string {
  return `${(iata || '').toUpperCase()}|${(icao || '').toUpperCase()}`;
}

function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeRow(row: Record<string, string>) {
  const nm: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    nm[normalizeKey(k)] = v;
  }
  return nm;
}

function pickNormalized(nm: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) {
    const nk = normalizeKey(k);
    const v = nm[nk];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

// Fallback fuzzy picker: find the first column whose normalized key contains
// any of the provided tokens (e.g., 'airport', 'aerodrome')
function pickFuzzyByTokens(nm: Record<string, string>, tokens: string[]): string | undefined {
  const entries = Object.entries(nm);
  for (const [k, v] of entries) {
    const has = tokens.some(t => k.includes(t));
    if (has && v !== undefined && v !== '') return v;
  }
  return undefined;
}

export async function seedAirportsFromCsv() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  const csvPath = resolveCsvPath();
  try { await fs.access(csvPath); } catch {
    console.warn(`[seed:airports] CSV not found at ${csvPath}. Set AIRPORTS_CSV to override.`);
    return;
  }

  const content = await fs.readFile(csvPath, 'utf8');
  // Handle potential BOM and trim trailing whitespace-only lines
  const sanitized = content.replace(/^\uFEFF/, '');
  const lines = sanitized.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    console.warn('[seed:airports] CSV has no data rows. Skipping.');
    return;
  }

  const header = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = cols[j] ?? '';
    }
    rows.push(obj);
  }

  // Load existing to avoid duplicates and to backfill missing fields
  const existing = await db
    .select({ id: airports.id, iata: airports.iata, icao: airports.icao, airportName: airports.airportName, countryCode: airports.countryCode, regionName: airports.regionName, lat: airports.lat, lng: airports.lng })
    .from(airports);
  const existingByKey = new Map(existing.map((r: any) => [toKey(r.iata, r.icao), r]));
  const existingKeys = new Set(existing.map((r: any) => toKey(r.iata, r.icao)));

  // Map header variations
  const now = new Date();
  const toAirport = (r: Record<string, string>) => {
    const nm = normalizeRow(r);
    const iata = pickNormalized(nm, ['IATA', 'iata', 'IATA Code', 'Iata Code', 'Iata', 'Iata code']);
    const icao = pickNormalized(nm, ['ICAO', 'icao', 'ICAO Code', 'Icao Code', 'Icao', 'Icao code']);
    // Explicitly prioritize the 'Airport' column name; if missing, fuzzy match any header containing 'airport' or 'aerodrome'
    const name =
      pickNormalized(nm, ['Airport', 'Airport Name', 'Name', 'airport_name', 'airportName'])
      ?? pickFuzzyByTokens(nm, ['airport', 'aerodrome', 'airfield']);
    const country = pickNormalized(nm, ['Country Code', 'Country', 'country_code', 'countryCode']);
    const region = pickNormalized(nm, ['Region Name', 'Region', 'region_name', 'regionName', 'State', 'Province']);
    const latStr = pickNormalized(nm, ['Latitude', 'lat', 'LAT', 'latitude']);
    const lngStr = pickNormalized(nm, ['Longitude', 'lng', 'LNG', 'lon', 'LONG', 'longitude']);

    const lat = latStr ? Number(latStr) : undefined;
    const lng = lngStr ? Number(lngStr) : undefined;

    return {
      id: randomUUID(),
      iata: iata ?? null,
      icao: icao ?? null,
      airportName: name ?? null,
      countryCode: country ?? null,
      regionName: region ?? null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      createdAt: now,
      updatedAt: now,
    } as any;
  };

  const toInsert: any[] = [];
  const toUpdate: { id: string, set: any }[] = [];
  for (const r of rows) {
    const a = toAirport(r);
    const key = toKey(a.iata, a.icao);
    if (!a.iata && !a.icao) continue; // skip rows with no codes
    const existingRow = existingByKey.get(key);
    if (!existingRow) {
      existingKeys.add(key);
      toInsert.push(a);
    } else {
      // Backfill any missing fields
      const set: any = {};
      if ((!existingRow.airportName || existingRow.airportName === '') && a.airportName) set.airportName = a.airportName;
      if ((!existingRow.countryCode || existingRow.countryCode === '') && a.countryCode) set.countryCode = a.countryCode;
      if ((!existingRow.regionName || existingRow.regionName === '') && a.regionName) set.regionName = a.regionName;
      if ((existingRow.lat === null || existingRow.lat === undefined) && a.lat !== null && a.lat !== undefined) set.lat = a.lat;
      if ((existingRow.lng === null || existingRow.lng === undefined) && a.lng !== null && a.lng !== undefined) set.lng = a.lng;
      if (Object.keys(set).length) {
        set.updatedAt = new Date();
        toUpdate.push({ id: existingRow.id, set });
      }
    }
  }

  const batchSize = 1000;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    if (batch.length) {
      await db.insert(airports).values(batch);
      inserted += batch.length;
      console.log(`[seed:airports] Inserted batch ${i / batchSize + 1} (${batch.length} rows)`);
    }
  }

  let updated = 0;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    for (const u of batch) {
      await db.update(airports).set(u.set).where(eq(airports.id, u.id as any));
      updated++;
    }
  }

  console.log(`[seed:airports] Completed. Inserted ${inserted} airports. Updated ${updated} airports.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedAirportsFromCsv().catch((e) => { console.error(e); process.exit(1); });
}

