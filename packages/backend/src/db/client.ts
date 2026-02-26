import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { getEnv } from '../env';

let db: ReturnType<typeof createDb>;

function createDb() {
  const env = getEnv();
  const sqlite = new Database(env.DATABASE_URL);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  return drizzle(sqlite, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

export type AppDatabase = ReturnType<typeof getDb>;
