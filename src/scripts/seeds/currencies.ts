import { getDb } from './_db';
import { currencies } from '../../db/schema';

export async function seedCurrencies() {
  const db = getDb();
  const currencyData = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', priorityOrder: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', priorityOrder: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', priorityOrder: 3 },
  ];
  await db.insert(currencies).values(currencyData).onConflictDoNothing();
  console.log('Seeded currencies');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCurrencies().catch((e) => { console.error(e); process.exit(1); });
}
