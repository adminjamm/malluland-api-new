import { getDb } from './_db';
import { blockAndReport } from '../../db/schema';
import { randomUUID } from 'node:crypto';

export async function seedBlockAndReport() {
  const db = getDb();
  const reportOptions = [
    { id: randomUUID(), optionText: 'Spam or Scam', displayOrder: 1, isActive: true },
    { id: randomUUID(), optionText: 'Harassment or Hate', displayOrder: 2, isActive: true },
    { id: randomUUID(), optionText: 'Inappropriate Content', displayOrder: 3, isActive: true },
    { id: randomUUID(), optionText: 'Fake Profile', displayOrder: 4, isActive: true },
    { id: randomUUID(), optionText: 'Other', displayOrder: 5, isActive: true },
  ];
  await db.insert(blockAndReport).values(reportOptions).onConflictDoNothing();
  console.log('Seeded block_and_report');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedBlockAndReport().catch((e) => { console.error(e); process.exit(1); });
}
