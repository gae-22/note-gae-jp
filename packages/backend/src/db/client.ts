import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Use process.cwd() for reliable path resolution in both
// source (tsx) and bundled (tsup -> dist/index.js) contexts.
// When run via pnpm, cwd is always packages/backend/
const dbPath =
    process.env.DB_PATH || path.resolve(process.cwd(), '../../data/data.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

export const sqlite: DatabaseType = new Database(dbPath);

// Spec: database-design.md §1.1 — WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');
// Spec: database-design.md §1.1 — Enable FK constraints
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
