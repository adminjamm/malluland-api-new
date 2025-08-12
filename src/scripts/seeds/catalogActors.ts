import { getDb } from './_db';
import { catalogActors } from '../../db/schema';

export async function seedCatalogActors() {
  const db = getDb();
  const actors = [
    { id: 1, name: 'Mohanlal', slug: 'mohanlal', isActive: true },
    { id: 2, name: 'Mammootty', slug: 'mammootty', isActive: true },
  ];
  await db.insert(catalogActors).values(actors).onConflictDoNothing();
  console.log('Seeded catalog_actors');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCatalogActors().catch((e) => { console.error(e); process.exit(1); });
}
