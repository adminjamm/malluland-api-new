import { getDb } from './_db';
import { catalogActresses } from '../../db/schema';

export async function seedCatalogActresses() {
  const db = getDb();
  const actresses = [
    { id: 1, name: 'Manju Warrier', slug: 'manju-warrier', isActive: true },
    { id: 2, name: 'Parvathy Thiruvothu', slug: 'parvathy-thiruvothu', isActive: true },
  ];
  await db.insert(catalogActresses).values(actresses).onConflictDoNothing();
  console.log('Seeded catalog_actresses');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCatalogActresses().catch((e) => { console.error(e); process.exit(1); });
}
