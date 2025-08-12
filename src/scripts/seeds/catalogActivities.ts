import { getDb } from './_db';
import { catalogActivities } from '../../db/schema';

export async function seedCatalogActivities() {
  const db = getDb();
  const input = [
    { name: 'Breakfast', slug: 'breakfast' },
    { name: 'Brunch', slug: 'brunch' },
    { name: 'Lunch', slug: 'lunch' },
    { name: 'Dinner', slug: 'dinner' },
    { name: 'Coffee', slug: 'coffee' },
    { name: 'Picnic', slug: 'picnic' },
    { name: 'Barbecue', slug: 'barbecue' },
    { name: 'Board Games', slug: 'board-games' },
    { name: 'House Party', slug: 'house-party' },
    { name: 'Potluck', slug: 'potluck' },
    { name: 'Bike Ride', slug: 'bike-ride' },
    { name: 'Movie', slug: 'movie' },
    { name: 'Road Trip', slug: 'road-trip' },
    { name: 'Karaoke', slug: 'karaoke' },
    { name: 'Concert', slug: 'concert' },
    { name: 'Party', slug: 'party' },
    { name: 'Live Music', slug: 'live-music' },
    { name: 'Art', slug: 'art' },
    { name: 'Volunteer', slug: 'volunteer' },
    { name: 'Cooking', slug: 'cooking' },
    { name: 'Health', slug: 'health' },
    { name: 'Themed Party', slug: 'themed-party' },
    { name: 'Book', slug: 'book' },
    { name: 'Gaming', slug: 'gaming' },
    { name: 'Shopping', slug: 'shopping' },
    { name: 'Nature', slug: 'nature' },
    { name: 'Standup', slug: 'standup' },
    { name: 'Sightseeing', slug: 'sightseeing' },
    { name: 'Pet Meeting', slug: 'pet-meeting' },
    { name: 'Outdoor', slug: 'outdoor-events' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Workshops', slug: 'workshops' },
    { name: 'Camping', slug: 'camping' },
  ];
  const activities = input.map((a, idx) => ({ id: idx + 1, name: a.name, slug: a.slug, isActive: true }));
  await db.insert(catalogActivities).values(activities).onConflictDoNothing();
  console.log('Seeded catalog_activities');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCatalogActivities().catch((e) => { console.error(e); process.exit(1); });
}
