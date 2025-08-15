import { getDb } from './_db';
import { users as usersTable, userLocation } from '../../db/schema';

// Approximate coordinates for common Kerala cities
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Cochin: { lat: 9.9312, lng: 76.2673 },
  Ernakulam: { lat: 9.9816, lng: 76.2999 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Trivandrum: { lat: 8.5241, lng: 76.9366 },
  Kozhikode: { lat: 11.2588, lng: 75.7804 },
  Calicut: { lat: 11.2588, lng: 75.7804 },
  Thrissur: { lat: 10.5276, lng: 76.2144 },
  Kollam: { lat: 8.8932, lng: 76.6141 },
  Alappuzha: { lat: 9.4981, lng: 76.3388 },
};

function coordsFor(city?: string | null): { lat: number; lng: number } {
  if (!city) return CITY_COORDS['Kochi'];
  const key = city.trim();
  return CITY_COORDS[key] ?? CITY_COORDS['Kochi'];
}

export async function seedUserLocation() {
  const db = getDb();

  // Fetch all users and existing locations
  const users = await db.select({ id: usersTable.id, city: usersTable.city }).from(usersTable);
  const existing = await db.select({ userId: userLocation.userId }).from(userLocation);
  const existingSet = new Set(existing.map((r) => r.userId));

  const rowsToInsert = users
    .filter((u) => !existingSet.has(u.id))
    .map((u) => {
      const { lat, lng } = coordsFor(u.city as any);
      const now = new Date();
      return { userId: u.id, lat, lng, createdAt: now, updatedAt: now } as typeof userLocation.$inferInsert;
    });

  if (rowsToInsert.length === 0) {
    console.log('[seed:user_location] No new user locations to insert.');
    return;
  }

  await db.insert(userLocation).values(rowsToInsert);
  console.log(`[seed:user_location] Inserted ${rowsToInsert.length} user locations.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUserLocation().catch((e) => { console.error(e); process.exit(1); });
}
