import { Database } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath =
    process.env.DATABASE_PATH ||
    path.resolve(__dirname, '../../../../data/data.db');

// Ensure directory exists
const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
