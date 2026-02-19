import { env } from './env';
import { serve } from '@hono/node-server';
import { app } from './app';
import { sqlite } from './db/client';

export type { AppType } from './app';

// Ensure FTS5 virtual table and triggers are set up (Spec: database-design.md §6)
const ensureFtsQueries = [
    `CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title,
        content_markdown,
        content='notes',
        content_rowid='rowid',
        tokenize='trigram'
    )`,
    `CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, title, content_markdown) VALUES (new.rowid, new.title, new.content_markdown);
    END`,
    `CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
    END`,
    `CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
        INSERT INTO notes_fts(rowid, title, content_markdown) VALUES (new.rowid, new.title, new.content_markdown);
    END`,
];

for (const q of ensureFtsQueries) {
    try {
        sqlite.exec(q);
    } catch {
        // Ignore 'already exists' errors; log others in dev
    }
}

console.log(`Server is running on port ${env.PORT} [${env.NODE_ENV}]`);

serve({
    fetch: app.fetch,
    port: env.PORT,
});
