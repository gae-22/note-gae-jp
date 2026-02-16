# メモ管理機能詳細設計書

## 1. メモ管理機能概要

メモの作成、読み取り、更新、削除（CRUD）および検索機能を提供する。

### 1.1 主要機能

| 機能         | 説明                                 |
| ------------ | ------------------------------------ |
| メモ一覧表示 | 権限に応じたメモ一覧の取得・表示     |
| メモ詳細表示 | 個別メモの完全なコンテンツ表示       |
| メモ作成     | Markdownエディタを使った新規メモ作成 |
| メモ更新     | 既存メモの編集・公開設定変更         |
| メモ削除     | メモの削除（関連ファイルも削除）     |
| 全文検索     | タイトル・本文のFTS5全文検索         |

---

## 2. バックエンド実装

### 2.1 メモ一覧取得

#### listNotes()

**ファイル:** `packages/backend/src/services/notes/list-notes.ts`

```typescript
import { db } from '../../db/client';
import { notes } from '../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

type ListNotesInput = {
    isAdmin: boolean;
    page?: number;
    limit?: number;
    sort?: 'updated' | 'created' | 'title';
};

type ListNotesResult = {
    notes: Array<{
        id: string;
        title: string;
        content: string; // 先頭200文字
        visibility: 'private' | 'public' | 'shared';
        createdAt: Date;
        updatedAt: Date;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

/**
 * メモ一覧を取得する
 *
 * @param input - フィルタ・ページネーション設定
 * @returns メモ一覧とページネーション情報
 */
export const listNotes = async (
    input: ListNotesInput,
): Promise<ListNotesResult> => {
    const { isAdmin, page = 1, limit = 20, sort = 'updated' } = input;

    // ソート順の決定
    let orderBy;
    switch (sort) {
        case 'created':
            orderBy = desc(notes.createdAt);
            break;
        case 'title':
            orderBy = notes.title;
            break;
        default:
            orderBy = desc(notes.updatedAt);
    }

    // WHERE条件
    const whereCondition = isAdmin ? undefined : eq(notes.visibility, 'public');

    // 総件数取得
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notes)
        .where(whereCondition);

    // メモ取得
    const results = await db
        .select({
            id: notes.id,
            title: notes.title,
            content: notes.content,
            visibility: notes.visibility,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
        })
        .from(notes)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit);

    // コンテンツを200文字に切り詰め
    const notesWithPreview = results.map((note) => ({
        ...note,
        content:
            note.content.substring(0, 200) +
            (note.content.length > 200 ? '...' : ''),
    }));

    return {
        notes: notesWithPreview,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
        },
    };
};
```

---

### 2.2 メモ詳細取得

#### getNoteById()

**ファイル:** `packages/backend/src/services/notes/get-note.ts`

```typescript
import { db } from '../../db/client';
import { notes } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * IDでメモを取得する
 *
 * @param id - メモID (ULID)
 * @returns メモオブジェクト（存在しない場合はnull）
 */
export const getNoteById = async (id: string) => {
    const note = await db.select().from(notes).where(eq(notes.id, id)).get();

    return note || null;
};
```

---

### 2.3 メモ作成

#### createNote()

**ファイル:** `packages/backend/src/services/notes/create-note.ts`

```typescript
import { ulid } from 'ulid';
import { db } from '../../db/client';
import { notes } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

type CreateNoteInput = {
    title: string;
    content: string;
    visibility?: 'private' | 'public' | 'shared';
};

/**
 * 新しいメモを作成する
 *
 * @param input - メモ作成データ
 * @returns 作成されたメモ
 */
export const createNote = async (input: CreateNoteInput) => {
    const { title, content, visibility = 'private' } = input;

    const id = ulid();
    const now = new Date();

    // visibilityがsharedの場合は共有トークン生成
    const shareToken = visibility === 'shared' ? uuidv4() : null;

    const newNote = {
        id,
        title,
        content,
        visibility,
        shareToken,
        shareExpiresAt: null,
        createdAt: now,
        updatedAt: now,
    };

    await db.insert(notes).values(newNote);

    return newNote;
};
```

**ビジネスロジック:**

1. ULID生成（一意なメモID）
2. visibility が `'shared'` の場合、UUID v4 でトークン生成
3. `createdAt`, `updatedAt` に現在時刻を設定
4. DBに挿入
5. 作成されたメモを返却

---

### 2.4 メモ更新

#### updateNote()

**ファイル:** `packages/backend/src/services/notes/update-note.ts`

```typescript
import { db } from '../../db/client';
import { notes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

type UpdateNoteInput = {
    title?: string;
    content?: string;
    visibility?: 'private' | 'public' | 'shared';
    shareExpiresAt?: number | null;
};

/**
 * メモを更新する
 *
 * @param id - メモID
 * @param input - 更新データ
 * @returns 更新されたメモ（存在しない場合はnull）
 */
export const updateNote = async (id: string, input: UpdateNoteInput) => {
    const existingNote = await db
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .get();

    if (!existingNote) {
        return null;
    }

    // 更新データの準備
    const updateData: any = {
        ...input,
        updatedAt: new Date(),
    };

    // visibilityの変更に伴うトークン処理
    if (input.visibility !== undefined) {
        if (input.visibility === 'shared' && !existingNote.shareToken) {
            // sharedに変更 & トークンが未設定 → 新規生成
            updateData.shareToken = uuidv4();
        } else if (input.visibility !== 'shared' && existingNote.shareToken) {
            // shared以外に変更 → トークンとexpiry削除
            updateData.shareToken = null;
            updateData.shareExpiresAt = null;
        }
    }

    // shareExpiresAtの型変換（number → Date）
    if (input.shareExpiresAt !== undefined) {
        updateData.shareExpiresAt = input.shareExpiresAt
            ? new Date(input.shareExpiresAt * 1000)
            : null;
    }

    await db.update(notes).set(updateData).where(eq(notes.id, id));

    // 更新後のメモを取得して返却
    const updatedNote = await db
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .get();

    return updatedNote;
};
```

**ビジネスロジック:**

1. 既存メモをID検索
2. 存在しない場合は `null` を返す
3. `visibility` が変更された場合:
    - `'shared'` に変更 → `shareToken` を新規生成
    - `'shared'` 以外に変更 → `shareToken` と `shareExpiresAt` をクリア
4. `updatedAt` を現在時刻に更新
5. DB更新
6. 更新後のメモを取得して返却

---

### 2.5 メモ削除

#### deleteNote()

**ファイル:** `packages/backend/src/services/notes/delete-note.ts`

```typescript
import { db } from '../../db/client';
import { notes, files } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';

/**
 * メモを削除する（関連ファイルも物理削除）
 *
 * @param id - メモID
 * @returns 削除成功したかどうか
 */
export const deleteNote = async (id: string): Promise<boolean> => {
    return await db.transaction(async (tx) => {
        // メモの存在確認
        const note = await tx
            .select()
            .from(notes)
            .where(eq(notes.id, id))
            .get();

        if (!note) {
            return false;
        }

        // 関連ファイル取得
        const relatedFiles = await tx
            .select()
            .from(files)
            .where(eq(files.noteId, id));

        // 物理ファイル削除
        for (const file of relatedFiles) {
            try {
                await unlink(file.path);
            } catch (error) {
                console.error(`Failed to delete file: ${file.path}`, error);
            }
        }

        // DBからファイル削除
        await tx.delete(files).where(eq(files.noteId, id));

        // メモ削除
        await tx.delete(notes).where(eq(notes.id, id));

        return true;
    });
};
```

**トランザクション構成:**

1. メモの存在確認
2. 関連ファイルを取得
3. 物理ファイルを削除（エラーがあってもログ出力のみで続行）
4. `files` テーブルからレコード削除
5. `notes` テーブルからメモ削除
6. コミット

---

### 2.6 全文検索

#### searchNotes()

**ファイル:** `packages/backend/src/services/notes/search-notes.ts`

```typescript
import { db } from '../../db/client';
import { sql } from 'drizzle-orm';

type SearchNotesInput = {
    query: string;
    isAdmin: boolean;
    page?: number;
    limit?: number;
};

/**
 * メモを全文検索する（SQLite FTS5使用）
 *
 * @param input - 検索クエリとページネーション
 * @returns 検索結果
 */
export const searchNotes = async (input: SearchNotesInput) => {
    const { query, isAdmin, page = 1, limit = 20 } = input;

    const visibilityFilter = isAdmin ? sql`` : sql`AND n.visibility = 'public'`;

    // FTS5検索クエリ
    const results = await db.all(sql`
    SELECT
      n.id,
      n.title,
      n.content,
      n.visibility,
      n.created_at AS createdAt,
      n.updated_at AS updatedAt,
      snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) AS titleSnippet,
      snippet(notes_fts, 2, '<mark>', '</mark>', '...', 64) AS contentSnippet
    FROM notes_fts
    INNER JOIN notes n ON notes_fts.id = n.id
    WHERE notes_fts MATCH ${query}
    ${visibilityFilter}
    ORDER BY rank
    LIMIT ${limit}
    OFFSET ${(page - 1) * limit}
  `);

    // 総件数取得
    const [{ count }] = await db.all(sql`
    SELECT COUNT(*) AS count
    FROM notes_fts
    INNER JOIN notes n ON notes_fts.id = n.id
    WHERE notes_fts MATCH ${query}
    ${visibilityFilter}
  `);

    return {
        notes: results,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
        },
    };
};
```

**FTS5検索クエリ構文:**

- `MATCH ${query}`: FTS5全文検索
- `snippet(...)`: 検索結果のハイライト表示用スニペット
- `rank`: 関連度スコア（低いほど関連性が高い）
- `ORDER BY rank`: 関連度順にソート

---

### 2.7 ルートハンドラ

**ファイル:** `packages/backend/src/routes/notes.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
    listNotesQuerySchema,
    createNoteSchema,
    updateNoteSchema,
} from '../validators/notes';
import { listNotes } from '../services/notes/list-notes';
import { getNoteById } from '../services/notes/get-note';
import { createNote } from '../services/notes/create-note';
import { updateNote } from '../services/notes/update-note';
import { deleteNote } from '../services/notes/delete-note';
import { searchNotes } from '../services/notes/search-notes';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const notesRoutes = new Hono();

// GET /api/notes - メモ一覧取得
notesRoutes.get(
    '/',
    optionalAuthMiddleware,
    zValidator('query', listNotesQuerySchema),
    async (c) => {
        const query = c.req.valid('query');
        const user = c.get('user');

        const result = query.q
            ? await searchNotes({
                  query: query.q,
                  isAdmin: !!user,
                  page: query.page,
                  limit: query.limit,
              })
            : await listNotes({
                  isAdmin: !!user,
                  page: query.page,
                  limit: query.limit,
                  sort: query.sort,
              });

        return c.json({
            success: true,
            data: result.notes,
            pagination: result.pagination,
        });
    },
);

// GET /api/notes/:id - メモ詳細取得
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

    // アクセス権限チェック
    const canAccess = user || note.visibility === 'public';

    if (!canAccess) {
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

// POST /api/notes - メモ作成
notesRoutes.post(
    '/',
    authMiddleware,
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

// PATCH /api/notes/:id - メモ更新
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

// DELETE /api/notes/:id - メモ削除
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

## 3. フロントエンド実装

### 3.1 Zodスキーマ

**ファイル:** `packages/frontend/src/features/notes/schemas.ts`

```typescript
import { z } from 'zod';

export const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().max(1_000_000, 'Content is too long'),
    visibility: z.enum(['private', 'public', 'shared']).default('private'),
});

export const updateNoteSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().max(1_000_000).optional(),
    visibility: z.enum(['private', 'public', 'shared']).optional(),
    shareExpiresAt: z.number().int().positive().nullable().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
```

---

### 3.2 Custom Hooks

#### useNotes()

```typescript
// packages/frontend/src/features/notes/hooks/use-notes.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type UseNotesOptions = {
    q?: string;
    page?: number;
    limit?: number;
};

export const useNotes = (options: UseNotesOptions = {}) => {
    const { q, page = 1, limit = 20 } = options;

    return useQuery({
        queryKey: ['notes', { q, page, limit }],
        queryFn: async () => {
            const res = await apiClient.notes.$get({
                query: {
                    q: q || '',
                    page: String(page),
                    limit: String(limit),
                },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch notes');
            }

            return await res.json();
        },
    });
};
```

---

#### useNote()

```typescript
// packages/frontend/src/features/notes/hooks/use-note.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useNote = (id: string) => {
    return useQuery({
        queryKey: ['notes', id],
        queryFn: async () => {
            const res = await apiClient.notes[':id'].$get({
                param: { id },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch note');
            }

            return await res.json();
        },
        enabled: !!id,
    });
};
```

---

#### useCreateNote()

```typescript
// packages/frontend/src/features/notes/hooks/use-create-note.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import type { CreateNoteInput } from '../schemas';

export const useCreateNote = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (input: CreateNoteInput) => {
            const res = await apiClient.notes.$post({
                json: input,
            });

            if (!res.ok) {
                throw new Error('Failed to create note');
            }

            return await res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });

            toast({
                title: 'Success',
                description: 'Note created successfully',
            });

            navigate({ to: `/admin/notes/${data.data.id}` });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

---

#### useUpdateNote()

```typescript
// packages/frontend/src/features/notes/hooks/use-update-note.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import type { UpdateNoteInput } from '../schemas';

export const useUpdateNote = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateNoteInput) => {
            const res = await apiClient.notes[':id'].$patch({
                param: { id },
                json: input,
            });

            if (!res.ok) {
                throw new Error('Failed to update note');
            }

            return await res.json();
        },
        onSuccess: (data) => {
            // 楽観的更新
            queryClient.setQueryData(['notes', id], data);
            queryClient.invalidateQueries({ queryKey: ['notes'] });

            toast({
                title: 'Success',
                description: 'Note updated successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

---

#### useDeleteNote()

```typescript
// packages/frontend/src/features/notes/hooks/use-delete-note.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

export const useDeleteNote = (id: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.notes[':id'].$delete({
                param: { id },
            });

            if (!res.ok) {
                throw new Error('Failed to delete note');
            }

            return await res.json();
        },
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: ['notes', id] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });

            toast({
                title: 'Success',
                description: 'Note deleted successfully',
            });

            navigate({ to: '/admin/notes' });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

---

### 3.3 UIコンポーネント

#### NoteEditForm

**ファイル:** `packages/frontend/src/features/notes/components/note-edit-form.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateNote } from '../hooks/use-update-note';
import { updateNoteSchema, type UpdateNoteInput } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MarkdownEditor } from '@/features/editor/components/markdown-editor';
import { VisibilitySelector } from '@/features/sharing/components/visibility-selector';

type NoteEditFormProps = {
  note: {
    id: string;
    title: string;
    content: string;
    visibility: 'private' | 'public' | 'shared';
  };
};

export function NoteEditForm({ note }: NoteEditFormProps) {
  const { mutate: updateNote, isPending } = useUpdateNote(note.id);

  const form = useForm<UpdateNoteInput>({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
      visibility: note.visibility,
    },
  });

  const onSubmit = (data: UpdateNoteInput) => {
    updateNote(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <FormControl>
                <VisibilitySelector
                  value={field.value || 'private'}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 4. 参考資料

- [Drizzle ORM - Queries](https://orm.drizzle.team/docs/select)
- [SQLite FTS5 Extension](https://www.sqlite.org/fts5.html)
- [TanStack Query - Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [React Hook Form Documentation](https://react-hook-form.com/)
