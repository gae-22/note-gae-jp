# API設計書

## 1. API概要

### 1.1 基本情報

| 項目           | 値                                      |
| -------------- | --------------------------------------- |
| Base URL       | `/api`                                  |
| Protocol       | HTTP/HTTPS                              |
| Data Format    | JSON                                    |
| Authentication | Session-based (HttpOnly Cookie)         |
| CORS           | Same-Origin (本番環境), Localhost (Dev) |
| API Style      | Hono RPC (Type-safe)                    |

### 1.2 設計方針

- **型安全性:** Hono RPC により、フロントエンドとバックエンドで型を共有
- **バリデーション:** 全てのリクエストをZodスキーマで検証
- **エラーハンドリング:** 統一されたエラーレスポンス形式
- **CSRF対策:** POSTリクエストにはCSRFトークン必須
- **認可:** ミドルウェアによる権限チェック

---

## 2. 共通仕様

### 2.1 エラーレスポンス形式

全てのエラーレスポンスは以下の形式で返却される。

```typescript
type ErrorResponse = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};
```

#### エラーコード一覧

| HTTP Status | Error Code              | 説明                     |
| ----------- | ----------------------- | ------------------------ |
| 400         | `VALIDATION_ERROR`      | リクエストパラメータ不正 |
| 401         | `UNAUTHORIZED`          | 認証が必要               |
| 403         | `FORBIDDEN`             | アクセス権限なし         |
| 404         | `NOT_FOUND`             | リソースが存在しない     |
| 409         | `CONFLICT`              | リソースの競合（重複等） |
| 413         | `PAYLOAD_TOO_LARGE`     | ファイルサイズ超過       |
| 429         | `RATE_LIMIT_EXCEEDED`   | レート制限超過           |
| 500         | `INTERNAL_SERVER_ERROR` | サーバー内部エラー       |

#### エラーレスポンス例

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid request parameters",
        "details": {
            "title": "Title is required",
            "content": "Content must be at least 1 character"
        }
    }
}
```

### 2.2 成功レスポンス形式

```typescript
type SuccessResponse<T> = {
    success: true;
    data: T;
};
```

### 2.3 ページネーション

```typescript
type PaginatedResponse<T> = {
    success: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
```

---

## 3. 認証API (`/api/auth`)

### 3.1 ログイン

**Endpoint:** `POST /api/auth/login`

**説明:** 管理者ログイン

**Request Body:**

```typescript
{
    username: string; // 3-50文字
    password: string; // 8-100文字
}
```

**Zod Schema:**

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

**Response Success (200):**

```typescript
{
    success: true;
    data: {
        user: {
            id: string;
            username: string;
        }
    }
}

// + Set-Cookie: session_token=...; HttpOnly; SameSite=Lax; Max-Age=604800
```

**Response Error:**

| Status | Code                  | 説明                                     |
| ------ | --------------------- | ---------------------------------------- |
| 400    | `VALIDATION_ERROR`    | 入力値不正                               |
| 401    | `INVALID_CREDENTIALS` | ユーザー名またはパスワードが間違っている |
| 429    | `RATE_LIMIT_EXCEEDED` | ログイン試行回数超過                     |

**実装例 (Hono):**

```typescript
// packages/backend/src/routes/auth.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '../validators/auth';
import { loginUser } from '../services/auth/login';

export const authRoutes = new Hono();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
    const { username, password } = c.req.valid('json');

    const result = await loginUser({ username, password });

    if (!result.success) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password',
                },
            },
            401,
        );
    }

    // セッション作成
    c.header(
        'Set-Cookie',
        `session_token=${result.sessionToken}; HttpOnly; SameSite=Lax; Max-Age=604800; Path=/`,
    );

    return c.json({
        success: true,
        data: {
            user: result.user,
        },
    });
});
```

---

### 3.2 ログアウト

**Endpoint:** `POST /api/auth/logout`

**説明:** セッション破棄

**Authentication:** Required (Admin)

**Request Body:** なし

**Response Success (200):**

```json
{
    "success": true,
    "data": null
}
```

**実装例:**

```typescript
authRoutes.post('/logout', authMiddleware, async (c) => {
    const sessionToken = getCookie(c, 'session_token');

    if (sessionToken) {
        await deleteSession(sessionToken);
    }

    // Cookie削除
    c.header(
        'Set-Cookie',
        'session_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/',
    );

    return c.json({
        success: true,
        data: null,
    });
});
```

---

### 3.3 現在のユーザー取得

**Endpoint:** `GET /api/auth/me`

**説明:** ログイン中のユーザー情報取得

**Authentication:** Optional

**Response Success (200):**

```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      username: string;
    } | null
  }
}
```

**実装例:**

```typescript
authRoutes.get('/me', async (c) => {
    const sessionToken = getCookie(c, 'session_token');

    if (!sessionToken) {
        return c.json({
            success: true,
            data: { user: null },
        });
    }

    const user = await getUserFromSession(sessionToken);

    return c.json({
        success: true,
        data: { user },
    });
});
```

---

## 4. メモAPI (`/api/notes`)

### 4.1 メモ一覧取得

**Endpoint:** `GET /api/notes`

**説明:** メモ一覧を取得（権限に応じてフィルタリング）

**Authentication:** Optional

**Query Parameters:**

```typescript
{
  q?: string;         // 検索クエリ（FTS5）
  page?: number;      // ページ番号（デフォルト: 1）
  limit?: number;     // 1ページあたりの件数（デフォルト: 20, 最大: 100）
  sort?: 'updated' | 'created' | 'title';  // ソート順（デフォルト: 'updated'）
}
```

**Zod Schema:**

```typescript
export const listNotesQuerySchema = z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['updated', 'created', 'title']).default('updated'),
});

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
```

**Response Success (200):**

```typescript
{
    success: true;
    data: Array<{
        id: string;
        title: string;
        content: string; // 先頭200文字のpreview
        visibility: 'private' | 'public' | 'shared';
        createdAt: number; // Unix timestamp
        updatedAt: number;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}
```

**権限別フィルタリング:**

| ユーザー | 表示対象                           |
| -------- | ---------------------------------- |
| 管理者   | 全メモ                             |
| ゲスト   | `visibility = 'public'` のメモのみ |

**実装例:**

```typescript
// packages/backend/src/routes/notes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { listNotesQuerySchema } from '../validators/notes';
import { listNotes } from '../services/notes/list-notes';
import { optionalAuthMiddleware } from '../middleware/auth';

export const notesRoutes = new Hono();

notesRoutes.get(
    '/',
    optionalAuthMiddleware,
    zValidator('query', listNotesQuerySchema),
    async (c) => {
        const query = c.req.valid('query');
        const user = c.get('user'); // undefined or User object

        const result = await listNotes({
            ...query,
            isAdmin: !!user,
        });

        return c.json({
            success: true,
            data: result.notes,
            pagination: result.pagination,
        });
    },
);
```

---

### 4.2 メモ詳細取得

**Endpoint:** `GET /api/notes/:id`

**説明:** 特定メモの詳細を取得

**Authentication:** Optional

**Path Parameters:**

```typescript
{
    id: string; // Note ULID
}
```

**Response Success (200):**

```typescript
{
    success: true;
    data: {
        id: string;
        title: string;
        content: string; // Full Markdown
        visibility: 'private' | 'public' | 'shared';
        shareToken: string | null;
        shareExpiresAt: number | null;
        createdAt: number;
        updatedAt: number;
    }
}
```

**Response Error:**

| Status | Code        | 説明                   |
| ------ | ----------- | ---------------------- |
| 403    | `FORBIDDEN` | 非公開メモへのアクセス |
| 404    | `NOT_FOUND` | メモが存在しない       |

**権限チェック:**

```typescript
const canAccessNote = (note: Note, user?: User): boolean => {
    // 管理者は全アクセス可
    if (user) return true;

    // 公開メモはアクセス可
    if (note.visibility === 'public') return true;

    // それ以外は拒否
    return false;
};
```

**実装例:**

```typescript
notesRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');

    const note = await getNoteById(id);

    if (!note) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Note not found',
                },
            },
            404,
        );
    }

    if (!canAccessNote(note, user)) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied',
                },
            },
            403,
        );
    }

    return c.json({
        success: true,
        data: note,
    });
});
```

---

### 4.3 メモ作成

**Endpoint:** `POST /api/notes`

**説明:** 新しいメモを作成

**Authentication:** Required (Admin)

**Request Body:**

```typescript
{
  title: string;          // 1-200文字
  content: string;        // 0-1,000,000文字
  visibility?: 'private' | 'public' | 'shared';  // デフォルト: 'private'
}
```

**Zod Schema:**

```typescript
export const createNoteSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().max(1_000_000),
    visibility: z.enum(['private', 'public', 'shared']).default('private'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
```

**Response Success (201):**

```typescript
{
    success: true;
    data: {
        id: string;
        title: string;
        content: string;
        visibility: 'private' | 'public' | 'shared';
        shareToken: string | null;
        shareExpiresAt: number | null;
        createdAt: number;
        updatedAt: number;
    }
}
```

**実装例:**

```typescript
notesRoutes.post(
    '/',
    authMiddleware, // Admin only
    zValidator('json', createNoteSchema),
    async (c) => {
        const input = c.req.valid('json');

        const note = await createNote(input);

        return c.json(
            {
                success: true,
                data: note,
            },
            201,
        );
    },
);
```

---

### 4.4 メモ更新

**Endpoint:** `PATCH /api/notes/:id`

**説明:** 既存メモを更新

**Authentication:** Required (Admin)

**Path Parameters:**

```typescript
{
    id: string; // Note ULID
}
```

**Request Body:**

```typescript
{
  title?: string;
  content?: string;
  visibility?: 'private' | 'public' | 'shared';
  shareExpiresAt?: number | null;  // Unix timestamp or null (unlimited)
}
```

**Zod Schema:**

```typescript
export const updateNoteSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().max(1_000_000).optional(),
    visibility: z.enum(['private', 'public', 'shared']).optional(),
    shareExpiresAt: z.number().int().positive().nullable().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
```

**Response Success (200):**

```typescript
{
    success: true;
    data: {
        id: string;
        title: string;
        content: string;
        visibility: 'private' | 'public' | 'shared';
        shareToken: string | null;
        shareExpiresAt: number | null;
        createdAt: number;
        updatedAt: number;
    }
}
```

**ビジネスロジック:**

- `visibility` を `'shared'` に変更した場合、自動的に `shareToken` (UUID v4) を生成
- `visibility` を `'shared'` 以外に変更した場合、`shareToken` と `shareExpiresAt` をクリア
- `updatedAt` を現在時刻に更新

**実装例:**

```typescript
notesRoutes.patch(
    '/:id',
    authMiddleware,
    zValidator('json', updateNoteSchema),
    async (c) => {
        const id = c.req.param('id');
        const input = c.req.valid('json');

        const note = await updateNote(id, input);

        if (!note) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Note not found',
                    },
                },
                404,
            );
        }

        return c.json({
            success: true,
            data: note,
        });
    },
);
```

---

### 4.5 メモ削除

**Endpoint:** `DELETE /api/notes/:id`

**説明:** メモを削除（論理削除ではなく物理削除）

**Authentication:** Required (Admin)

**Path Parameters:**

```typescript
{
    id: string;
}
```

**Response Success (200):**

```json
{
    "success": true,
    "data": null
}
```

**Response Error:**

| Status | Code        | 説明             |
| ------ | ----------- | ---------------- |
| 404    | `NOT_FOUND` | メモが存在しない |

**実装例:**

```typescript
notesRoutes.delete('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');

    const deleted = await deleteNote(id);

    if (!deleted) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Note not found',
                },
            },
            404,
        );
    }

    return c.json({
        success: true,
        data: null,
    });
});
```

---

### 4.6 共有リンク経由でメモ取得

**Endpoint:** `GET /api/notes/shared/:shareToken`

**説明:** 共有トークンでメモを取得

**Authentication:** Not Required

**Path Parameters:**

```typescript
{
    shareToken: string; // UUID v4
}
```

**Response Success (200):**

```typescript
{
    success: true;
    data: {
        id: string;
        title: string;
        content: string;
        createdAt: number;
        updatedAt: number;
        // visibility, shareToken, shareExpiresAt は返却しない（セキュリティ）
    }
}
```

**Response Error:**

| Status | Code        | 説明                           |
| ------ | ----------- | ------------------------------ |
| 404    | `NOT_FOUND` | トークンが無効、または期限切れ |

**検証ロジック:**

```typescript
const validateShareToken = async (token: string): Promise<Note | null> => {
    const note = await db
        .select()
        .from(notes)
        .where(
            and(
                eq(notes.shareToken, token),
                eq(notes.visibility, 'shared'),
                or(
                    isNull(notes.shareExpiresAt),
                    gt(notes.shareExpiresAt, new Date()),
                ),
            ),
        )
        .get();

    return note;
};
```

**実装例:**

```typescript
notesRoutes.get('/shared/:shareToken', async (c) => {
    const shareToken = c.req.param('shareToken');

    const note = await validateShareToken(shareToken);

    if (!note) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Shared link not found or expired',
                },
            },
            404,
        );
    }

    // 公開情報のみ返す
    return c.json({
        success: true,
        data: {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        },
    });
});
```

---

## 5. ファイルアップロードAPI (`/api/upload`)

### 5.1 ファイルアップロード

**Endpoint:** `POST /api/upload`

**説明:** ファイルをアップロード（画像、動画、PDF等）

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body:**

```typescript
FormData {
  file: File;
}
```

**許可されるファイルタイプ:**

| カテゴリ | MIME Type                                            | 拡張子                          | 最大サイズ |
| -------- | ---------------------------------------------------- | ------------------------------- | ---------- |
| 画像     | `image/png`, `image/jpeg`, `image/gif`, `image/webp` | `.png`, `.jpg`, `.gif`, `.webp` | 10MB       |
| 動画     | `video/mp4`, `video/webm`                            | `.mp4`, `.webm`                 | 100MB      |
| PDF      | `application/pdf`                                    | `.pdf`                          | 20MB       |
| テキスト | `text/plain`, `application/json`                     | `.txt`, `.json`, `.md`          | 5MB        |
| コード   | Custom validation                                    | `.js`, `.py`, `.sh`, etc.       | 5MB        |

**Response Success (200):**

```typescript
{
    success: true;
    data: {
        id: string; // File ULID
        url: string; // 公開URL (例: /uploads/2026/02/xxx.png)
        filename: string; // サーバー保存ファイル名
        originalFilename: string;
        mimeType: string;
        size: number; // bytes
    }
}
```

**Response Error:**

| Status | Code                | 説明                       |
| ------ | ------------------- | -------------------------- |
| 400    | `VALIDATION_ERROR`  | ファイルが添付されていない |
| 413    | `PAYLOAD_TOO_LARGE` | ファイルサイズ超過         |
| 415    | `UNSUPPORTED_MEDIA` | 許可されていないファイル型 |

**バリデーションロジック:**

```typescript
import { extname } from 'path';

const ALLOWED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/json',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const validateFile = (file: File): void => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error('Unsupported file type');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds limit');
    }

    // 拡張子チェック（二重拡張子攻撃対策）
    const ext = extname(file.name).toLowerCase();
    const validExtensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.webp',
        '.mp4',
        '.webm',
        '.pdf',
        '.txt',
        '.json',
        '.md',
    ];

    if (!validExtensions.includes(ext)) {
        throw new Error('Invalid file extension');
    }
};
```

**実装例:**

```typescript
// packages/backend/src/routes/upload.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { saveFile } from '../services/uploads/save-file';
import { validateFile } from '../services/uploads/validate-file';

export const uploadRoutes = new Hono();

uploadRoutes.post('/', authMiddleware, async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'No file uploaded',
                },
            },
            400,
        );
    }

    try {
        validateFile(file);
    } catch (error) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNSUPPORTED_MEDIA',
                    message: error.message,
                },
            },
            415,
        );
    }

    const savedFile = await saveFile(file);

    return c.json({
        success: true,
        data: {
            id: savedFile.id,
            url: savedFile.url,
            filename: savedFile.filename,
            originalFilename: savedFile.originalFilename,
            mimeType: savedFile.mimeType,
            size: savedFile.size,
        },
    });
});
```

**ファイル保存処理:**

```typescript
// packages/backend/src/services/uploads/save-file.ts
import { ulid } from 'ulid';
import { join, extname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { db } from '../../db/client';
import { files } from '../../db/schema';

export const saveFile = async (file: File) => {
    const id = ulid();
    const ext = extname(file.name);
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const filename = `${id}${ext}`;
    const relativePath = `uploads/${year}/${month}/${filename}`;
    const absolutePath = join(process.cwd(), relativePath);

    // ディレクトリ作成（存在しなければ）
    await mkdir(join(process.cwd(), `uploads/${year}/${month}`), {
        recursive: true,
    });

    // ファイル書き込み
    const buffer = await file.arrayBuffer();
    await writeFile(absolutePath, Buffer.from(buffer));

    // DB保存
    const fileRecord = {
        id,
        filename,
        originalFilename: file.name,
        path: relativePath,
        mimeType: file.type,
        size: file.size,
        noteId: null,
        uploadedAt: new Date(),
    };

    await db.insert(files).values(fileRecord);

    return {
        ...fileRecord,
        url: `/${relativePath}`,
    };
};
```

---

## 6. 静的ファイル配信

**Endpoint:** `GET /uploads/*`

**説明:** アップロードされたファイルを配信

**Authentication:** Not Required

**Hono Static Middleware:**

```typescript
// packages/backend/src/app.ts
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

// 静的ファイル配信
app.use(
    '/uploads/*',
    serveStatic({
        root: './',
        onNotFound: (path, c) => {
            return c.json({ error: 'File not found' }, 404);
        },
    }),
);
```

**セキュリティ考慮:**

- **Directory Traversal 対策:** Hono の `serveStatic` がパス検証を行う
- **実行権限:** `uploads/` ディレクトリには実行権限を付与しない
- **Content-Type:** 正しいMIMEタイプを返却（XSS対策）

---

## 7. Hono RPC 型定義

### 7.1 APIクライアント生成

```typescript
// packages/frontend/src/lib/api-client.ts
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/app';

export const apiClient = hc<AppType>('/api', {
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include', // Cookie送信
});
```

### 7.2 フロントエンドでの使用例

```typescript
// packages/frontend/src/features/notes/hooks/use-notes.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useNotes = (query?: string) => {
    return useQuery({
        queryKey: ['notes', query],
        queryFn: async () => {
            const response = await apiClient.notes.$get({
                query: { q: query, page: '1', limit: '20' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }

            return await response.json();
        },
    });
};
```

---

## 8. ミドルウェア実装

### 8.1 認証ミドルウェア

```typescript
// packages/backend/src/middleware/auth.ts
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getUserFromSession } from '../services/auth/get-user-from-session';

export const authMiddleware = async (c: Context, next: Next) => {
    const sessionToken = getCookie(c, 'session_token');

    if (!sessionToken) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            },
            401,
        );
    }

    const user = await getUserFromSession(sessionToken);

    if (!user) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired session',
                },
            },
            401,
        );
    }

    c.set('user', user);
    await next();
};
```

### 8.2 オプショナル認証ミドルウェア

```typescript
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
    const sessionToken = getCookie(c, 'session_token');

    if (sessionToken) {
        const user = await getUserFromSession(sessionToken);
        if (user) {
            c.set('user', user);
        }
    }

    await next();
};
```

### 8.3 CSRF保護ミドルウェア

```typescript
// packages/backend/src/middleware/csrf.ts
import { csrf } from 'hono/csrf';

export const csrfMiddleware = csrf({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
});
```

### 8.4 エラーハンドリングミドルウェア

```typescript
// packages/backend/src/middleware/error-handler.ts
import type { Context, Next } from 'hono';
import { ZodError } from 'zod';

export const errorHandler = async (c: Context, next: Next) => {
    try {
        await next();
    } catch (error) {
        console.error('Error:', error);

        if (error instanceof ZodError) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request parameters',
                        details: error.errors,
                    },
                },
                400,
            );
        }

        return c.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred',
                },
            },
            500,
        );
    }
};
```

---

## 9. レート制限

### 9.1 ログインエンドポイント制限

```typescript
import { rateLimiter } from 'hono-rate-limiter';

const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    max: 5, // 最大5回
    standardHeaders: 'draft-7',
    keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
});

authRoutes.post('/login', loginLimiter /* ... */);
```

### 9.2 アップロードエンドポイント制限

```typescript
const uploadLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1分
    max: 10, // 最大10回
});

uploadRoutes.post('/', uploadLimiter, authMiddleware /* ... */);
```

---

## 10. API テスト例

### 10.1 ログインテスト

```typescript
// packages/backend/src/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest';
import { testClient } from 'hono/testing';
import { app } from '../app';

describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
        const res = await testClient(app).auth.login.$post({
            json: {
                username: 'admin',
                password: 'ChangeMe123!',
            },
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.user.username).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
        const res = await testClient(app).auth.login.$post({
            json: {
                username: 'admin',
                password: 'wrong-password',
            },
        });

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });
});
```

---

## 11. 参考資料

- [Hono Documentation](https://hono.dev/)
- [Zod Documentation](https://zod.dev/)
- [TanStack Query - Data Fetching](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
