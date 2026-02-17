# API設計書 (API Design Specification)

本ドキュメントは、`note-gae-jp` の API 仕様およびバックエンドのビジネスロジックを**厳密に**定義する。
Hono (RPC Mode) を採用し、フロントエンド・バックエンド間で型安全な通信を実現する。

---

## 1. API 共通仕様

### 1.1 基本方針

- **Framework:** Hono (v4.x)
- **Protocol:** HTTP/1.1 or HTTP/2
- **Data Format:** JSON (Content-Type: application/json)
    - ※ ファイルアップロードのみ `multipart/form-data`
- **Authentication:** HttpOnly Cookie (`session_id`)
    - SameSite: Lax
    - Secure: True (Production), False (Development)
    - Path: /
- **Error Handling:** 統一されたエラーレスポンス形式を使用
- **Validation:** Zod による厳格なバリデーション (Request/Response)

### 1.2 レスポンスフォーマット

全ての API レスポンスは、成功時と失敗時で以下の形式に統一する。

#### 成功時 (Success Response)

```json
{
  "success": true,
  "data": { ... } // エンドポイント固有のデータ
}
```

#### 失敗時 (Error Response)

```json
{
    "success": false,
    "error": {
        "code": "BAD_REQUEST", // エラーコード (String)
        "message": "Invalid input data" // 開発者向けメッセージ (User UI表示用ではない)
    }
}
```

### 1.3 エラーコード定義 (Strict Mapping)

| コード                  | HTTP Status | 説明                                                       |
| :---------------------- | :---------- | :--------------------------------------------------------- |
| `BAD_REQUEST`           | 400         | バリデーションエラー、不正なパラメータ                     |
| `UNAUTHORIZED`          | 401         | 未認証、セッション期限切れ、クッキー不備                   |
| `FORBIDDEN`             | 403         | 権限不足 (他人のPrivateメモへのアクセス等)                 |
| `NOT_FOUND`             | 404         | リソースが存在しない、またはアクセス権がなく隠蔽されている |
| `METHOD_NOT_ALLOWED`    | 405         | 許可されていないHTTPメソッド                               |
| `CONFLICT`              | 409         | データの整合性エラー (一意制約違反など)                    |
| `PAYLOAD_TOO_LARGE`     | 413         | アップロードファイルサイズ超過                             |
| `RATE_LIMIT_EXCEEDED`   | 429         | レート制限超過                                             |
| `INTERNAL_SERVER_ERROR` | 500         | 予期せぬサーバーエラー                                     |

---

## 2. バリデーションスキーマ (Zod Schemas)

**配置場所:** `packages/backend/src/validators/`
これらのスキーマは `packages/shared` (または同等の共有領域) からエクスポートされ、フロントエンドでも再利用される。

### 2.1 共通スキーマ

```typescript
import { z } from 'zod';

// ULID形式
export const ulidSchema = z
    .string()
    .length(26)
    .regex(/^[0-9A-Z]+$/);

// UUID形式
export const uuidSchema = z.string().uuid();

// ページネーション
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 2.2 認証関連 (`auth.ts`)

```typescript
export const loginSchema = z.object({
    username: z.string().min(1).max(50), // 空文字不可
    password: z.string().min(1).max(100),
});

export const userResponseSchema = z.object({
    id: ulidSchema,
    username: z.string(),
    createdAt: z.date(),
});
```

### 2.3 メモ関連 (`notes.ts`)

```typescript
// 共有有効期限オプション（visibility='shared' 時に使用）
export const shareDurationSchema = z.enum(['1d', '7d', '30d', 'unlimited']);

// メモ作成
export const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().default(''), // Markdown content
    coverImage: z.string().url().max(1000).optional().nullable(),
    icon: z.string().max(10).optional().nullable(), // Emoji or short text
    visibility: z.enum(['private', 'public', 'shared']).default('private'),
    shareDuration: shareDurationSchema.optional(), // visibility='shared' 時のみ有効
});

// メモ更新（共有設定を含む）
export const updateNoteSchema = createNoteSchema.partial().extend({
    shareDuration: shareDurationSchema.optional(), // 指定時のみ share_token, share_expires_at を再生成
});

// メモ一覧検索クエリ
export const listNotesQuerySchema = paginationSchema.extend({
    q: z.string().optional(), // 検索キーワード
    visibility: z.enum(['private', 'public', 'shared']).optional(),
});

// メモレスポンス
export const noteResponseSchema = z.object({
    id: ulidSchema,
    title: z.string(),
    content: z.string(),
    coverImage: z.string().nullable(),
    icon: z.string().nullable(),
    visibility: z.enum(['private', 'public', 'shared']),
    shareToken: z.string().uuid().nullable(),
    shareExpiresAt: z.date().nullable(), // Date object in response
    createdAt: z.date(),
    updatedAt: z.date(),
});

// メモ一覧レスポンス（ページネーション付き）
export const listNotesResponseSchema = z.object({
    items: z.array(noteResponseSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    hasNext: z.boolean(),
});
```

### 2.4 ファイルアップロード (`files.ts`)

request body は `FormData` であるため、Zod スキーマではなく `hono/body-limit` 等で制御するが、レスポンス型は定義する。

```typescript
export const uploadResponseSchema = z.object({
    id: ulidSchema,
    url: z.string().url(), // アクセス用URL (/uploads/...)
    filename: z.string(),
    originalFilename: z.string(),
    mimeType: z.string(),
    size: z.number(),
});
```

---

## 3. サービス層ロジック (Service Logic)

### 3.1 AuthService (`auth.service.ts`)

- **Password Hashing:** `Argon2id` を使用する。
    - 推奨ライブラリ: `argon2` (npm)
- **Session Duration:** 7日間 (Sliding Expiration: アクセスのたびに延長は**しない**。セキュリティ重視のため絶対期限とする)。

#### `login(username, password)`

1. `users` テーブル検索。
2. `argon2.verify(hash, password)` 実行。
3. 成功時:
    - Session ID (UUID v4) 生成。
    - `expiresAt = Now + 7 days`。
    - `sessions` テーブルに INSERT。
    - Cookie `session_id` をセット。
4. 失敗時: `UNAUTHORIZED`。

### 3.2 NoteService (`note.service.ts`)

#### `list(params, currentUser)`

- **権限ロジック (Strict):**
    - `currentUser` が**非null** (ログイン済): 全てのメモ (`private`, `public`, `shared`) を検索対象とする。ただし `params.visibility` が指定された場合はそれに従う。
    - `currentUser` が**null** (ゲスト): 自動的に `visibility = 'public'` の条件を強制付与する。`params.visibility` で `private` を指定しても無視（またはエラー）とし、絶対に見せない。

#### `getByShareToken(token)`

- **有効期限ロジック:**
    - `WHERE share_token = ?`
    - `AND visibility = 'shared'`
    - `AND (share_expires_at IS NULL OR share_expires_at > NOW())`
    - これら全てを満たさない場合は `NOT_FOUND` または `Gone`。

#### `create(input, currentUser)` / `update(id, input, currentUser)`

- **共有設定の処理:**
    - `visibility = 'shared'` かつ `shareDuration` が指定された場合:
        - `shareDuration` に応じて `share_expires_at` を算出: `1d`→+1日, `7d`→+7日, `30d`→+30日, `unlimited`→NULL
        - 新規 UUID v4 を `share_token` に設定
    - `visibility` を `private` または `public` に変更する場合: `share_token`, `share_expires_at` を NULL にクリア

#### `list(params, currentUser)` レスポンス形式

- 戻り値は `{ items: Note[], total: number, page: number, limit: number, hasNext: boolean }` 形式とする。

### 3.3 FileService (`file.service.ts`)

#### `upload(file, currentUser)`

- **権限:** ログインユーザーのみ実行可能。
- **制約:**
    - Max Size: 10MB
    - Allowed Types: `image/*`, `application/pdf`
- **保存プロセス:**
    1. ULID を生成 -> `fileId`。
    2. 拡張子を抽出。
    3. 保存ディレクトリ決定: `uploads/YYYY/MM/` (今日の日付)。ディレクトリがなければ作成。
    4. ファイル名決定: `<fileId>.<ext>`。
    5. ファイル書き込み。
    6. `files` テーブルにメタデータ INSERT（`noteId` は常に NULL。紐付けはメモ保存時に実施）。
    7. URL (`/uploads/YYYY/MM/<filename>`) を返却。

#### ファイルとメモの紐付け (files.noteId)

- **アップロード時:** `noteId` は省略可能。新規メモ作成時は存在しないため NULL で登録。
- **メモ保存時 (NoteService.create / update):** 本文 (`content`) に含まれる `/uploads/` のURL を抽出し、該当する `files` レコードの `noteId` を更新する。既存メモ編集時も同様に再紐付けを行う。
- **メモ削除時:** `files.noteId` は `ON DELETE SET NULL` により自動で NULL になる（物理ファイルは残存）。

---

## 4. API ルート定義 (Hono Routes)

### 4.1 エンドポイント一覧

| Method   | Path                 | Auth | Service           | Description                                   |
| :------- | :------------------- | :--- | :---------------- | :-------------------------------------------- |
| `POST`   | `/api/auth/login`    | -    | `Auth.login`      | ログイン                                      |
| `POST`   | `/api/auth/logout`   | User | `Auth.logout`     | ログアウト (Cookie削除)                       |
| `GET`    | `/api/auth/me`       | -    | `Auth.me`         | 現在のユーザー情報を取得 (未ログインならnull) |
| `GET`    | `/api/notes`         | Opt  | `Note.list`       | メモ一覧取得                                  |
| `POST`   | `/api/notes`         | User | `Note.create`     | メモ作成                                      |
| `GET`    | `/api/notes/:id`     | Opt  | `Note.get`        | メモ詳細取得                                  |
| `PATCH`  | `/api/notes/:id`     | User | `Note.update`     | メモ更新                                      |
| `DELETE` | `/api/notes/:id`     | User | `Note.delete`     | メモ削除                                      |
| `GET`    | `/api/shared/:token` | -    | `Note.getByToken` | 共有メモ取得                                  |
| `POST`   | `/api/upload`        | User | `File.upload`     | ファイルアップロード (Multipart)              |

### 4.2 Hono 実装例 (Upload)

```typescript
// packages/backend/src/routes/upload.ts

import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { FileService } from '../services/file.service';

const app = new Hono();

app.post(
    '/',
    bodyLimit({
        maxSize: 10 * 1024 * 1024, // 10MB
        onError: (c) =>
            c.json(
                { success: false, error: { code: 'PAYLOAD_TOO_LARGE' } },
                413,
            ),
    }),
    async (c) => {
        const user = c.get('user');
        if (!user)
            return c.json(
                { success: false, error: { code: 'UNAUTHORIZED' } },
                401,
            );

        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file || !(file instanceof File)) {
            return c.json(
                {
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
                },
                400,
            );
        }

        const result = await FileService.upload(file, user);
        return c.json({ success: true, data: result });
    },
);
```

---

## 5. セキュリティ対策 (Security Implementation)

### 5.1 CSRF対策

Hono の `csrf` ミドルウェアを全てのミューテーション（POST, PATCH, DELETE）ルートに適用する。
JSON API であっても、Cookie認証を利用するため必須。

### 5.2 レート制限 (Rate Limiting)

全ドキュメントで統一。詳細は [security.md](./security.md) を参照。

- ログイン: 5 req / 15 min (IPベース) … ブルートフォース対策
- ファイルアップロード: 10 req / 1 min (Userベース) … 大量アップロードによるDoS防止
- メモ一覧取得: 60 req / 1 min … DoS対策

### 5.3 セキュリティヘッダー

Hono の `secureHeaders` ミドルウェアを使用。
特に `Content-Security-Policy` は、アップロードした画像 (`/uploads/...`) を表示できるように適切に設定する。

```
default-src 'self';
img-src 'self' data: blob:;
style-src 'self' 'unsafe-inline';
```
