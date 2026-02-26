import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { getDb } from './client';

console.log('🔄 Running migrations...');
const db = getDb();
migrate(db, { migrationsFolder: './src/db/migrations' });
console.log('✅ Migrations complete.');
