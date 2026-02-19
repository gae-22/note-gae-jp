import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client';
import path from 'path';

async function main() {
    console.log('Running migrations...');

    // This will run migrations on the database, skipping the ones already applied
    await migrate(db, {
        migrationsFolder: path.join(__dirname, 'migrations'),
    });

    console.log('Migrations completed!');
    sqlite.close();
}

main().catch((err) => {
    console.error('Migration failed!');
    console.error(err);
    process.exit(1);
});
