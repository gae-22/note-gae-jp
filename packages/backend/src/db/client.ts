import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath =
    process.env.DB_PATH || path.resolve(__dirname, '../../../../note.db');

// Ensure directory exists
const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

export const sqlite: DatabaseType = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
