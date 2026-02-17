# データベース設計書 (Database Design Specification)

本ドキュメントは、`note-gae-jp` プロジェクトにおけるデータベース設計を**厳密に**定義する。
開発者は本仕様書に完全に準拠し、勝手な解釈による実装を行ってはならない。

## 1. データベース概要

### 1.1 基本情報

| 項目             | 値                        | 備考                                           |
| :--------------- | :------------------------ | :--------------------------------------------- |
| **DBMS**         | SQLite 3.x                | `better-sqlite3` ドライバー使用                |
| **ORM**          | Drizzle ORM               | スキーマ駆動開発                               |
| **ファイルパス** | `data/data.db`            | 本番環境では永続化ボリュームに配置             |
| **文字コード**   | UTF-8                     |                                                |
| **Journal Mode** | WAL (Write-Ahead Logging) | 並行性向上のため必須                           |
| **Foreign Keys** | ON                        | `PRAGMA foreign_keys = ON;` を接続時に必ず実行 |

### 1.2 設計方針 (Strict Policies)

1.  **ID生成:** 全ての主キーはアプリケーション側で **ULID** を生成して格納する。DB側の `AUTOINCREMENT` は使用しない。
2.  **時刻扱い:**
    - カラム型: `integer` (Unix Timestamp, 秒精度)
    - Drizzle定義: `mode: 'timestamp'` (JavaScript `Date` オブジェクトとして扱う)
    - 保存値: UTC とする。
3.  **NULL制約:** `nullable` と明記されたカラム以外は全て `NOT NULL` とする。
4.  **物理削除:** データは原則として**物理削除**する（論理削除フラグ `is_deleted` は使用しない）。
5.  **インデックス:** クエリパターンに基づき、必要な箇所にのみインデックスを貼る。過剰なインデックスは避ける。

---

## 2. テーブル定義 (Schema Definitions)

### 2.1 users テーブル

管理者アカウント情報を格納する。シングルテナントであっても拡張性を考慮しテーブル化する。

```typescript
// packages/backend/src/db/schema.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
    /**
     * ユーザーID (ULID)
     * 例: 01ARZ3NDEKTSV4RRFFQ69G5FAV
     */
    id: text('id').primaryKey(),

    /**
     * ログインID
     * 英数字および一部記号のみ許容。
     */
    username: text('username').notNull().unique(),

    /**
     * パスワードハッシュ
     * アルゴリズム: Argon2id (v13)
     * 設定: memory=64MB, time=3, parallelism=4 (推奨)
     * 平文保存は厳禁。
     */
    passwordHash: text('password_hash').notNull(),

    /**
     * 作成日時
     */
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});
```

### 2.2 notes テーブル

メモの本体および設定を管理する。

```typescript
import {
    sqliteTable,
    text,
    integer,
    index,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable(
    'notes',
    {
        id: text('id').primaryKey(),

        title: text('title').notNull(),

        /**
         * 本文 (Markdown)
         * - 空文字許容
         * - 最大長: SQLite限界まで（実質無制限）
         */
        content: text('content').notNull().default(''),

        /**
         * カバー画像 URL
         * - 内部パス (/uploads/...) または 外部URL
         */
        coverImage: text('cover_image'),

        /**
         * アイコン
         * - Emoji 1文字 または 画像URL
         */
        icon: text('icon'),

        /**
         * 公開設定
         * - private: 自分のみ
         * - public: インターネット公開
         * - shared: リンクを知っている人のみ
         */
        visibility: text('visibility', {
            enum: ['private', 'public', 'shared'],
        })
            .notNull()
            .default('private'),

        /**
         * 共有トークン (UUID v4)
         * - visibility = 'shared' の場合のみ有効
         * - 推測不可能なランダム文字列
         */
        shareToken: text('share_token'),

        /**
         * 共有リンク有効期限
         * - この時刻「未満」であればアクセス可能 (current < expiresAt)
         * - NULLの場合は無期限
         */
        shareExpiresAt: integer('share_expires_at', { mode: 'timestamp' }),

        createdAt: integer('created_at', { mode: 'timestamp' })
            .notNull()
            .default(sql`(unixepoch())`),

        updatedAt: integer('updated_at', { mode: 'timestamp' })
            .notNull()
            .default(sql`(unixepoch())`),
    },
    (table) => ({
        // 公開範囲でのフィルタリング用
        visibilityIdx: index('idx_notes_visibility').on(table.visibility),
        // 更新順ソート用
        updatedAtIdx: index('idx_notes_updated_at').on(table.updatedAt),
        // 共有トークン検索用 (高速化必須)
        shareTokenIdx: uniqueIndex('idx_notes_share_token').on(
            table.shareToken,
        ),
    }),
);
```

### 2.3 files テーブル

アップロードされたファイルのメタデータを管理する。
**注意**: レコード削除時の物理ファイル削除方針については、「4. データ整合性・削除方針」を参照。

```typescript
export const files = sqliteTable('files', {
    id: text('id').primaryKey(),

    /**
     * サーバー保存ファイル名
     * 形式: `<ULID>.<ext>` (例: 01H... .png)
     * これによりファイル名の衝突を完全に回避する。
     */
    filename: text('filename').notNull(),

    /**
     * アップロード時の元ファイル名
     * 表示・ダウンロード用。
     */
    originalFilename: text('original_filename').notNull(),

    /**
     * 保存パス (相対パス)
     * 形式: `uploads/YYYY/MM/<filename>`
     * 一意制約あり。
     */
    path: text('path').notNull().unique(),

    /**
     * MIMEタイプ (image/png, application/pdf 等)
     */
    mimeType: text('mime_type').notNull(),

    /**
     * ファイルサイズ (bytes)
     */
    size: integer('size').notNull(),

    /**
     * 関連メモID
     * - NULL可 (未割り当てファイル用)
     * - ON DELETE SET NULL (メモが消えてもファイルメタデータは残す)
     */
    noteId: text('note_id').references(() => notes.id, {
        onDelete: 'set null',
    }),

    uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});
```

### 2.4 sessions テーブル

認証セッション管理用。

```typescript
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),

    /**
     * ユーザーID
     * ON DELETE CASCADE (ユーザー削除でセッションも消える)
     */
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    /**
     * セッショントークン
     * - UUID v4 または 32byte以上のランダム文字列(Hex)
     */
    token: text('token').notNull().unique(),

    /**
     * 有効期限
     * - 作成から7日間 (固定)
     */
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),

    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});
```

---

## 3. リレーション定義 (Relations)

Drizzle ORM レベルでのリレーション定義。

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));

export const notesRelations = relations(notes, ({ many }) => ({
    files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
    note: one(notes, {
        fields: [files.noteId],
        references: [notes.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));
```

---

## 4. データ整合性・削除方針

ファイルの整合性を保つため、以下のルールを厳守する。

### 4.1 メモ削除時の挙動

1.  **DBレコード:** `notes` テーブルから物理削除 (`DELETE FROM notes WHERE id = ?`)。
2.  **関連ファイル (Files):** `files.noteId` は外部キー制約 `ON DELETE SET NULL` により `NULL` に更新される。
    - **理由:** 誤ってメモを削除した場合でも、アップロードした画像等のアセットが即座に消えないようにするため（安全策）。
3.  **ファイル実体:** 上記の通り、レコードが残るため**削除しない**。
4.  **孤立ファイルの掃除:**
    - 別途、管理画面から「孤立ファイル（`noteId IS NULL`）の一覧・一括削除」を行う機能を提供する。
    - あるいは、バッチ処理で `uploadedAt` が一定期間以上前の孤立ファイルを削除する。

---

## 5. マイグレーション運用 (Migration Workflow)

Drizzle Kit を使用したスキーマ管理フロー。

1.  **スキーマ変更:** `src/db/schema.ts` を編集。
2.  **マイグレーション生成:**
    ```bash
    pnpm drizzle-kit generate
    ```
    `drizzle/migrations/` 配下にSQLファイルが生成される。
3.  **マイグレーション適用:**
    アプリ起動時に自動適用、あるいは手動コマンドで適用。
    ```bash
    pnpm drizzle-kit migrate
    ```

---

## 6. Full-Text Search (FTS5)

SQLite FTS5 を利用した検索機能の実装方針。

**重要:** `notes` の主キーは ULID (TEXT) だが、FTS5 の `content_rowid` は **integer** 必須のため、SQLite の暗黙的 `rowid` を使用する。

```sql
-- マイグレーションSQL (手動追加)
-- content_rowid='rowid' で notes の暗黙的 rowid と紐付け
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid',
  tokenize='trigram' -- 日本語検索のためにtrigram推奨
);

-- トリガー (Notesテーブルとの同期)
-- new.rowid / old.rowid は notes の暗黙的 integer rowid
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;
CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
END;
CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid) VALUES ('delete', old.rowid);
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;
```

**実装メモ:**

- Drizzle ORM は FTS5 をネイティブサポートしていないため、検索時は `sql` タグを用いた Raw Query を使用する。
- 検索クエリ例（`notes` と JOIN して ULID のメモ一覧を取得）:
    ```typescript
    const rows = await db.all(
        sql`SELECT n.* FROM notes n INNER JOIN notes_fts ON n.rowid = notes_fts.rowid WHERE notes_fts MATCH ${query}`,
    );
    ```
