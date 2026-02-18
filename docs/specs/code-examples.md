# Code Examples: Drizzle schemas, FTS5 migration, Hono routes

このファイルは実装を素早く始められるように、Drizzle スキーマ、FTS5 マイグレーション SQL、Hono のルート例、セッション参照ミドルウェア、孤立ファイル GC SQL のサンプルをまとめます。

## 1) Drizzle: `note_locks` スキーマ

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const noteLocks = sqliteTable('note_locks', {
    id: text('id').primaryKey(), // ULID
    noteId: text('note_id')
        .notNull()
        .references(() => notes.id, { onDelete: 'cascade' }),
    lockToken: text('lock_token').notNull().unique(),
    ownerId: text('owner_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});
```

運用: ロックは短期 TTL（例: 300s）。`POST /api/notes/:id/lock` で生成、`PATCH /api/notes/:id/lock` で同一トークンのリフレッシュ、`DELETE /.../lock` で解除。

## 2) FTS5 マイグレーション SQL（サンプル）

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid',
  tokenize='trigram'
);

CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content_markdown);
END;
CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
END;
CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content_markdown);
END;
```

注意: `VACUUM` 等で `rowid` が変わり得る点に注意。FTS と notes の整合性を保つため、マイグレーション・再構築手順を必ず用意してください。

## 3) Hono: Lock エンドポイント例

```typescript
// packages/backend/src/routes/locks.ts
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/client';
import { noteLocks } from '../db/schema';
import { ulid } from '../utils/ulid';

const app = new Hono();

// Acquire lock
app.post('/:id/lock', async (c) => {
    const user = c.get('user');
    if (!user)
        return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);
    const noteId = c.req.param('id');

    // Check existing lock
    const existing = await db
        .select()
        .from(noteLocks)
        .where(eq(noteLocks.noteId, noteId))
        .get();
    if (existing && existing.expiresAt > Date.now()) {
        return c.json(
            { success: false, error: { code: 'CONFLICT', message: 'Locked' } },
            409,
        );
    }

    const lockToken = uuidv4();
    const lockId = ulid();
    const expiresAt = Math.floor(Date.now() / 1000) + 300; // 300s

    await db
        .insert(noteLocks)
        .values({ id: lockId, noteId, lockToken, ownerId: user.id, expiresAt });

    return c.json({
        success: true,
        data: {
            lockToken,
            owner: { id: user.id, username: user.username },
            expiresAt,
        },
    });
});

// Refresh lock
app.patch('/:id/lock', async (c) => {
    const user = c.get('user');
    if (!user)
        return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);
    const noteId = c.req.param('id');
    const { lockToken } = await c.req.json();

    const lock = await db
        .select()
        .from(noteLocks)
        .where(eq(noteLocks.noteId, noteId))
        .get();
    if (!lock || lock.lockToken !== lockToken)
        return c.json({ success: false, error: { code: 'CONFLICT' } }, 409);

    const newExpiresAt = Math.floor(Date.now() / 1000) + 300;
    await db
        .update(noteLocks)
        .set({ expiresAt: newExpiresAt })
        .where(eq(noteLocks.id, lock.id));
    return c.json({ success: true, data: { expiresAt: newExpiresAt } });
});

// Release lock
app.delete('/:id/lock', async (c) => {
    const user = c.get('user');
    if (!user)
        return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);
    const noteId = c.req.param('id');
    const { lockToken } = await c.req.json();

    const lock = await db
        .select()
        .from(noteLocks)
        .where(eq(noteLocks.noteId, noteId))
        .get();
    if (!lock || lock.lockToken !== lockToken)
        return c.json({ success: false, error: { code: 'FORBIDDEN' } }, 403);

    await db.delete(noteLocks).where(eq(noteLocks.id, lock.id));
    return c.json({ success: true });
});

export default app;
```

（注）上記はサンプルであり、`eq` のインポートや `db` クライアントの例はプロジェクトの実装に合わせて補完してください。

## 4) セッション参照ミドルウェア例（Cookie → sessions.lookup）

```typescript
// packages/backend/src/middleware/session.ts
import { Context, Next } from 'hono';

export const sessionMiddleware = async (c: Context, next: Next) => {
    const token = c.req.cookie('session_id'); // spec uses session token stored in cookie
    if (token) {
        const user = await getUserFromSession(token); // implement lookup by sessions.token
        if (user) c.set('user', user);
    }
    await next();
};
```

## 5) 孤立ファイル GC: サンプル SQL

```sql
-- delete files with no note association older than ORPHAN_TTL_DAYS
DELETE FROM files
WHERE note_id IS NULL
  AND uploaded_at < (strftime('%s','now') - (COALESCE(:ORPHAN_TTL_DAYS, 7) * 86400));
```

簡易 Node スクリプトは `implementation_detail.md` の cron 指定（daily）で実行することを推奨します。
