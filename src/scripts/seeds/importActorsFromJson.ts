import { readFileSync } from 'fs';
import path from 'path';
import { getDb } from './_db';
import { catalogActors, catalogActresses } from '../../db/schema';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-()\.]/g, '') // keep word chars, space, -, (), .
    .replace(/[().]/g, '') // remove parentheses and dots
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type RawItem = {
  id: number;
  name: string;
  category: 'Actor' | 'Actress' | string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  original_url?: string;
  use_original_url?: boolean;
};

type RawFile = {
  'select * from actors': RawItem[];
};

export async function importActorsFromJson(jsonPath?: string) {
  const db = getDb();
  const filePath = jsonPath
    ? path.resolve(jsonPath)
    : path.resolve(process.cwd(), 'actors_202508121525.json');

  const raw = readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw) as RawFile;
  const items = data['select * from actors'] || [];

  // Fetch existing slugs and max IDs to ensure idempotency
  const existingActors = await db.select({ id: catalogActors.id, slug: catalogActors.slug }).from(catalogActors);
  const existingActresses = await db.select({ id: catalogActresses.id, slug: catalogActresses.slug }).from(catalogActresses);

  const existingActorSlugs = new Set(existingActors.map((r) => r.slug || ''));
  const existingActressSlugs = new Set(existingActresses.map((r) => r.slug || ''));
  const currentMaxActorId = existingActors.reduce((m, r) => Math.max(m, r.id ?? 0), 0);
  const currentMaxActressId = existingActresses.reduce((m, r) => Math.max(m, r.id ?? 0), 0);

  // Deduplicate by slug within the file and vs existing records
  const seenActorSlugs = new Set<string>();
  const seenActressSlugs = new Set<string>();

  const actors: { name: string; slug: string; isActive: boolean; imageUrl?: string; originalUrl?: string }[] = [];
  const actresses: { name: string; slug: string; isActive: boolean; imageUrl?: string; originalUrl?: string }[] = [];

  for (const it of items) {
    if (!it.name) continue;
    const slug = slugify(it.name);
    const isActress = (it.category || '').toLowerCase() === 'actress';

    if (isActress) {
      if (existingActressSlugs.has(slug) || seenActressSlugs.has(slug)) continue;
      seenActressSlugs.add(slug);
      actresses.push({ name: it.name, slug, isActive: true, imageUrl: it.image_url, originalUrl: it.original_url });
    } else {
      if (existingActorSlugs.has(slug) || seenActorSlugs.has(slug)) continue;
      seenActorSlugs.add(slug);
      actors.push({ name: it.name, slug, isActive: true, imageUrl: it.image_url, originalUrl: it.original_url });
    }
  }

  // Assign sequential IDs continuing from current max
  const actorRows = actors.map((a, idx) => ({ id: currentMaxActorId + idx + 1, ...a }));
  const actressRows = actresses.map((a, idx) => ({ id: currentMaxActressId + idx + 1, ...a }));

  if (actorRows.length > 0) {
    await db.insert(catalogActors).values(actorRows).onConflictDoNothing();
  }
  if (actressRows.length > 0) {
    await db.insert(catalogActresses).values(actressRows).onConflictDoNothing();
  }

  console.log(`Imported ${actorRows.length} actors and ${actressRows.length} actresses from ${path.basename(filePath)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importActorsFromJson(process.argv[2]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
