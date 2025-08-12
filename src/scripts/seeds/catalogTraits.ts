import { getDb } from './_db';
import { catalogTraits } from '../../db/schema';

export async function seedCatalogTraits() {
  const db = getDb();
  const input = [
    { name: 'Analytical', slug: 'analytical' },
    { name: 'Supportive', slug: 'supportive' },
    { name: 'Proactive', slug: 'proactive' },
    { name: 'Sociable', slug: 'sociable' },
    { name: 'Responsible', slug: 'responsible' },
    { name: 'Tolerant', slug: 'tolerant' },
    { name: 'Punctual', slug: 'punctual' },
    { name: 'Empathetic', slug: 'empathetic' },
    { name: 'Independent', slug: 'independent' },
    { name: 'Leader', slug: 'leader' },
    { name: 'Curious', slug: 'curious' },
    { name: 'Motivated', slug: 'motivated' },
    { name: 'Wise', slug: 'wise' },
    { name: 'Adaptable', slug: 'adaptable' },
    { name: 'Friendly', slug: 'friendly' },
    { name: 'Kind', slug: 'kind' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'Disciplined', slug: 'disciplined' },
    { name: 'Sensitive', slug: 'sensitive' },
    { name: 'Humility', slug: 'humility' },
    { name: 'Approachable', slug: 'approachable' },
    { name: 'Resilient', slug: 'resilient' },
    { name: 'Confident', slug: 'confident' },
    { name: 'Courteous', slug: 'courteous' },
    { name: 'Cheerful', slug: 'cheerful' },
    { name: 'Practical', slug: 'practical' },
    { name: 'Patient', slug: 'patient' },
    { name: 'Stubborn', slug: 'stubborn' },
    { name: 'Grateful', slug: 'grateful' },
    { name: 'Resourceful', slug: 'resourceful' },
    { name: 'Charismatic', slug: 'charismatic' },
    { name: 'Generous', slug: 'generous' },
    { name: 'Diligent', slug: 'diligent' },
    { name: 'Knowledgeable', slug: 'knowledgeable' },
    { name: 'Openness', slug: 'openness' },
    { name: 'Talkative', slug: 'talkative' },
    { name: 'Organised', slug: 'organised' },
  ];
  const traits = input.map((t, idx) => ({ id: idx + 1, name: t.name, slug: t.slug, isActive: true }));
  await db.insert(catalogTraits).values(traits).onConflictDoNothing();
  console.log('Seeded catalog_traits');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCatalogTraits().catch((e) => { console.error(e); process.exit(1); });
}
