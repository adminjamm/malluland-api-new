import { seedUserStates } from './userStates';
import { seedCatalogActivities } from './catalogActivities';
import { seedCatalogTraits } from './catalogTraits';
import { seedCatalogActors } from './catalogActors';
import { seedCatalogActresses } from './catalogActresses';
import { importActorsFromJson } from './importActorsFromJson';
import { seedCurrencies } from './currencies';
import { seedBlockAndReport } from './blockAndReport';
import { seedAppSettings } from './appSettings';
import { seedUsers } from './users';

async function main() {
  await seedUserStates();
  await seedCatalogActivities();
  await seedCatalogTraits();
  // Prefer importing from the provided JSON if present; fallback to small defaults
  try {
    await importActorsFromJson();
  } catch (e) {
    console.warn('Importing actors from JSON failed; falling back to static seeds. Error:', (e as Error).message);
    await seedCatalogActors();
    await seedCatalogActresses();
  }
  await seedCurrencies();
  await seedBlockAndReport();
  await seedAppSettings();
  await seedUsers();

  // Populate DOBs for existing users (18-55)
  try {
    const { seedUsersDob } = await import('./usersDob');
    await seedUsersDob();
  } catch (e) {
    console.warn('[seed:usersDob] Skipping DOB seeding:', (e as Error).message);
  }

  // Seed user locations so People API works without explicit lat/lng
  try {
    const { seedUserLocation } = await import('./userLocation');
    await seedUserLocation();
  } catch (e) {
    console.warn('[seed:user_location] Skipping user location seeding:', (e as Error).message);
  }

  // User photos (avatars and gallery)
  try {
    const { seedUserPhotos } = await import('./userPhotos');
    await seedUserPhotos();
  } catch (e) {
    console.warn('[seed:user_photos] Skipping user photos seeding:', (e as Error).message);
  }

  // Airports from CSV (optional)
  try {
    const { seedAirportsFromCsv } = await import('./airports');
    await seedAirportsFromCsv();
  } catch (e) {
    console.warn('[seed:airports] Skipping airports seeding:', (e as Error).message);
  }

  // New: seed meetups, requests, attendees
  const { run: runMeetups } = await import('./meetups');
  await runMeetups();
  const { run: runMeetupRequests } = await import('./meetupRequests');
  await runMeetupRequests();
  const { run: runMeetupAttendees } = await import('./meetupAttendees');
  await runMeetupAttendees();

  // Seed chat requests (idempotent)
  try {
    const { run: runChatRequests } = await import('./chatRequests');
    await runChatRequests();
  } catch (e) {
    console.warn('[seed:chat_requests] Skipping chat requests seeding:', (e as Error).message);
  }

  // Seed bookmarks (idempotent)
  try {
    const { run: runBookmarks } = await import('./bookmarks');
    await runBookmarks();
  } catch (e) {
    console.warn('[seed:bookmarks] Skipping bookmarks seeding:', (e as Error).message);
  }

  console.log('Seed all completed');
}

main().catch((e) => { console.error(e); process.exit(1); });
