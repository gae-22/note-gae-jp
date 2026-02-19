import { sqlite } from './client';

async function main() {
    console.log('Ensuring FTS5 setup...');

    // enabling simple tokenizers if needed, but standard should work.
    // better-sqlite3 usually comes with fts5 enabled.

    // 1. Create virtual table
    // We use content='notes' and content_rowid='rowid' to save space and keep sync
    // But we must reference the table name 'notes' correctly.
    // Warning: Drizzle might have named the table differently? check schema.ts -> 'notes'

    const createTableQuery = `
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title,
        content_markdown,
        content='notes',
        content_rowid='rowid',
        tokenize='trigram'
    );
    `;

    // 2. Create triggers
    const createTriggersQuery = `
    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, title, content_markdown) VALUES (new.rowid, new.title, new.content_markdown);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
        INSERT INTO notes_fts(rowid, title, content_markdown) VALUES (new.rowid, new.title, new.content_markdown);
    END;
    `;

    try {
        sqlite.exec(createTableQuery);
        sqlite.exec(createTriggersQuery);
        console.log('FTS5 table and triggers ensured.');

        // Optional: Rebuild FTS index if table was just created or might be out of sync?
        // For now, valid for new inserts. If existing data, might need 'rebuild' command.
        // sqlite.exec("INSERT INTO notes_fts(notes_fts) VALUES('rebuild');");
        // console.log('FTS5 index rebuilt.');
    } catch (error) {
        console.error('Error setting up FTS5:', error);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
