# ファイルアップロード機能詳細設計書

## 1. ファイルアップロード機能概要

Markdownエディタから画像・動画・PDF等のファイルをアップロードし、サーバー上に保存してメモに埋め込む機能。

### 1.1 サポートファイルタイプ

| カテゴリ | MIMEタイプ                                           | 拡張子                                   | 最大サイズ |
| -------- | ---------------------------------------------------- | ---------------------------------------- | ---------- |
| 画像     | `image/png`, `image/jpeg`, `image/gif`, `image/webp` | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | 10MB       |
| 動画     | `video/mp4`, `video/webm`                            | `.mp4`, `.webm`                          | 100MB      |
| PDF      | `application/pdf`                                    | `.pdf`                                   | 20MB       |
| テキスト | `text/plain`, `text/markdown`, `application/json`    | `.txt`, `.md`, `.json`                   | 5MB        |
| コード   | （拡張子ベース）                                     | `.js`, `.ts`, `.py`, `.sh`               | 5MB        |

---

## 2. バックエンド実装

### 2.1 ファイルバリデーション

#### validateFile()

**ファイル:** `packages/backend/src/services/uploads/validate-file.ts`

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
    'text/markdown',
    'application/json',
]);

const ALLOWED_EXTENSIONS = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.mp4',
    '.webm',
    '.pdf',
    '.txt',
    '.md',
    '.json',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.sh',
    '.bash',
]);

const MAX_FILE_SIZES: Record<string, number> = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    'application/pdf': 20 * 1024 * 1024, // 20MB
    text: 5 * 1024 * 1024, // 5MB
    default: 5 * 1024 * 1024, // 5MB
};

/**
 * アップロードファイルをバリデーションする
 *
 * @param file - アップロードされたファイル
 * @throws Error - バリデーションエラー
 */
export const validateFile = (file: File): void => {
    // MIMEタイプチェック
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(
            `Unsupported file type: ${file.type}. ` +
                `Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
        );
    }

    // 拡張子チェック（二重拡張子攻撃対策）
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error(
            `Invalid file extension: ${ext}. ` +
                `Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
        );
    }

    // ファイルサイズチェック
    const maxSize = getMaxFileSize(file.type);
    if (file.size > maxSize) {
        throw new Error(
            `File size exceeds limit. ` +
                `Maximum allowed: ${formatBytes(maxSize)}, actual: ${formatBytes(file.size)}`,
        );
    }

    // ファイル名の長さチェック
    if (file.name.length > 255) {
        throw new Error('Filename is too long (max: 255 characters)');
    }
};

/**
 * MIMEタイプに応じた最大ファイルサイズを取得
 */
const getMaxFileSize = (mimeType: string): number => {
    const category = mimeType.split('/')[0];
    return (
        MAX_FILE_SIZES[mimeType] ||
        MAX_FILE_SIZES[category] ||
        MAX_FILE_SIZES.default
    );
};

/**
 * バイト数を人間が読みやすい形式に変換
 */
const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
```

**テストケース:**

```typescript
import { describe, it, expect } from 'vitest';
import { validateFile } from './validate-file';

describe('validateFile', () => {
    it('should accept valid PNG file', () => {
        const file = new File(['content'], 'test.png', { type: 'image/png' });
        expect(() => validateFile(file)).not.toThrow();
    });

    it('should reject unsupported MIME type', () => {
        const file = new File(['content'], 'test.exe', {
            type: 'application/x-msdownload',
        });
        expect(() => validateFile(file)).toThrow('Unsupported file type');
    });

    it('should reject file exceeding size limit', () => {
        const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
        const file = new File([largeContent], 'large.png', {
            type: 'image/png',
        });
        expect(() => validateFile(file)).toThrow('File size exceeds limit');
    });
});
```

---

### 2.2 ファイル保存

#### saveFile()

**ファイル:** `packages/backend/src/services/uploads/save-file.ts`

```typescript
import { ulid } from 'ulid';
import { join, extname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { db } from '../../db/client';
import { files } from '../../db/schema';

type SaveFileResult = {
  id: string;
  url: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
};

/**
 * ファイルをディスクに保存し、DBに記録する
 *
 * @param file - アップロードされたファイル
 * @param noteId - 関連するメモID（オプション）
 * @returns 保存されたファイル情報
 */
export const saveFile = async (
  file: File,
  noteId?: string
): Promise<SaveFileResult> => {
  const id = ulid();
  const ext = extname(file.name);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // ファイル名: {ULID}{拡張子}
  const filename = `${id}${ext}`;

  // 保存パス: uploads/YYYY/MM/{filename}
  const relativePath = `uploads/${year}/${month}/${filename}`;
  const absolutePath = join(process.cwd(), relativePath);

  // ディレクトリ作成（存在しない場合）
  const dir = join(process.cwd(), `uploads/${year}/${month}`);
  await mkdir(dir, { recursive: true });

  // ファイル書き込み
  const buffer = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(buffer));

  // DB保存  const fileRecord = {
    id,
    filename,
    originalFilename: file.name,
    path: relativePath,
    mimeType: file.type,
    size: file.size,
    noteId: noteId || null,
    uploadedAt: now,
  };

  await db.insert(files).values(fileRecord);

  return {
    id,
    url: `/${relativePath}`,
    filename,
    originalFilename: file.name,
    mimeType: file.type,
    size: file.size,
  };
};
```

**処理フロー:**

```
1. ULID生成（ファイルID）
   ↓
2. 保存パス決定（uploads/YYYY/MM/ULID.ext）
   ↓
3. ディレクトリ作成（再帰的）
   ↓
4. ファイル書き込み
   ↓
5. files テーブルにメタデータ保存
   ↓
6. ファイル情報を返却（URLを含む）
```

---

### 2.3 ファイル削除

#### deleteFile()

**ファイル:** `packages/backend/src/services/uploads/delete-file.ts`

```typescript
import { unlink } from 'fs/promises';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { files } from '../../db/schema';

/**
 * ファイルを削除する（ディスクとDBの両方）
 *
 * @param id - ファイルID
 * @returns 削除成功したかどうか
 */
export const deleteFile = async (id: string): Promise<boolean> => {
    const file = await db.select().from(files).where(eq(files.id, id)).get();

    if (!file) {
        return false;
    }

    // 物理ファイル削除
    try {
        await unlink(file.path);
    } catch (error) {
        console.error(`Failed to delete file from disk: ${file.path}`, error);
        // ファイルが既に削除されている可能性があるため、続行
    }

    // DB削除
    await db.delete(files).where(eq(files.id, id));

    return true;
};
```

---

### 2.4 ルートハンドラ

**ファイル:** `packages/backend/src/routes/upload.ts`

```typescript
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { validateFile } from '../services/uploads/validate-file';
import { saveFile } from '../services/uploads/save-file';

export const uploadRoutes = new Hono();

// POST /api/upload
uploadRoutes.post('/', authMiddleware, async (c) => {
    try {
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

        // バリデーション
        try {
            validateFile(file);
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.message,
                    },
                },
                400,
            );
        }

        // ファイル保存
        const savedFile = await saveFile(file);

        return c.json({
            success: true,
            data: savedFile,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return c.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to upload file',
                },
            },
            500,
        );
    }
});
```

---

### 2.5 静的ファイル配信

**ファイル:** `packages/backend/src/app.ts`

```typescript
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import { uploadRoutes } from './routes/upload';

const app = new Hono();

// 静的ファイル配信（アップロードファイル）
app.use(
    '/uploads/*',
    serveStatic({
        root: './',
        onNotFound: (path, c) => {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'File not found',
                    },
                },
                404,
            );
        },
    }),
);

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/upload', uploadRoutes);

export default app;
```

---

## 3. フロントエンド実装

### 3.1 Custom Hooks

#### useUploadFile()

**ファイル:** `packages/frontend/src/features/upload/hooks/use-upload-file.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

/**
 * ファイルアップロードを行う
 */
export const useUploadFile = () => {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const res = await apiClient.upload.$post({
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error.message);
            }

            return await res.json();
        },
        onError: (error) => {
            toast({
                title: 'Upload Failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

---

### 3.2 UIコンポーネント

#### FileUploadButton

**ファイル:** `packages/frontend/src/features/editor/components/file-upload-button.tsx`

```typescript
import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadFile } from '@/features/upload/hooks/use-upload-file';

type FileUploadButtonProps = {
  editor: Editor;
};

export function FileUploadButton({ editor }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadFile, isPending } = useUploadFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadFile(file, {
      onSuccess: (data) => {
        const { url, mimeType, originalFilename } = data.data;

        // 画像の場合は<img>タグで挿入
        if (mimeType.startsWith('image/')) {
          editor
            .chain()
            .focus()
            .setImage({ src: url, alt: originalFilename })
            .run();
        } else {
          // その他はMarkdownリンクで挿入
          editor
            .chain()
            .focus()
            .insertContent(`[${originalFilename}](${url})`)
            .run();
        }

        // Input をリセット
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      },
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.txt,.md,.json,.js,.ts,.py,.sh"
      />
    </>
  );
}
```

---

#### ドラッグ＆ドロップ対応

**ファイル:** `packages/frontend/src/features/editor/extensions/image-upload.ts`

```typescript
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

type UploadFn = (file: File) => Promise<{ url: string }>;

/**
 * Tiptap Image Upload Extension
 * ドラッグ＆ドロップでのファイルアップロード対応
 */
export const createImageUploadPlugin = (uploadFn: UploadFn) => {
    return new Plugin({
        key: new PluginKey('imageUpload'),

        props: {
            handleDOMEvents: {
                drop: (view: EditorView, event: DragEvent) => {
                    event.preventDefault();

                    const files = event.dataTransfer?.files;
                    if (!files || files.length === 0) return false;

                    const file = files[0];

                    // 画像ファイルのみ対応
                    if (!file.type.startsWith('image/')) {
                        return false;
                    }

                    // アップロード処理
                    uploadFn(file).then(({ url }) => {
                        const { schema } = view.state;
                        const node = schema.nodes.image.create({ src: url });

                        const transaction = view.state.tr.insert(
                            view.state.selection.from,
                            node,
                        );

                        view.dispatch(transaction);
                    });

                    return true;
                },

                paste: (view: EditorView, event: ClipboardEvent) => {
                    const files = event.clipboardData?.files;
                    if (!files || files.length === 0) return false;

                    const file = files[0];

                    if (!file.type.startsWith('image/')) {
                        return false;
                    }

                    event.preventDefault();

                    uploadFn(file).then(({ url }) => {
                        const { schema } = view.state;
                        const node = schema.nodes.image.create({ src: url });

                        const transaction =
                            view.state.tr.replaceSelectionWith(node);
                        view.dispatch(transaction);
                    });

                    return true;
                },
            },
        },
    });
};
```

**使用例:**

```typescript
// packages/frontend/src/features/editor/utils/editor-config.ts
import { useEditor } from '@tiptap/react';
import { createImageUploadPlugin } from '../extensions/image-upload';
import { useUploadFile } from '@/features/upload/hooks/use-upload-file';

export const useCustomEditor = (content: string) => {
    const { mutateAsync: uploadFile } = useUploadFile();

    const uploadFn = async (file: File) => {
        const result = await uploadFile(file);
        return { url: result.data.url };
    };

    return useEditor({
        extensions: [
            // ... other extensions
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose max-w-none',
            },
        },
        onCreate: ({ editor }) => {
            editor.registerPlugin(createImageUploadPlugin(uploadFn));
        },
    });
};
```

---

## 4. セキュリティ考慮事項

### 4.1 ファイルアップロード攻撃対策

#### 1. MIMEタイプ検証

```typescript
// サーバーサイドで必ずMIMEタイプを再検証
const actualMimeType = await detectMimeType(buffer);
if (actualMimeType !== file.type) {
    throw new Error('MIME type mismatch');
}
```

#### 2. ファイル名サニタイゼーション

```typescript
import { basename } from 'path';

const sanitizeFilename = (filename: string): string => {
    // パストラバーサル対策
    const safe = basename(filename);

    // 危険な文字を除去
    return safe.replace(/[^a-zA-Z0-9._-]/g, '_');
};
```

#### 3. 実行権限の剥奪

```bash
# uploads/ ディレクトリには実行権限を付与しない
chmod -R 644 uploads/
chmod 755 uploads/ uploads/2026/ uploads/2026/02/
```

#### 4. Content-Disposition ヘッダー

```typescript
// ダウンロード時に Content-Disposition を設定
app.get('/uploads/*', async (c) => {
    // ...
    c.header('Content-Disposition', 'attachment');
    return c.body(fileBuffer);
});
```

---

### 4.2 ディレクトリトラバーサル対策

```typescript
import { resolve, normalize } from 'path';

const isPathSafe = (requestedPath: string): boolean => {
    const uploadsDir = resolve(process.cwd(), 'uploads');
    const fullPath = resolve(uploadsDir, requestedPath);

    // uploads/ 配下かチェック
    return fullPath.startsWith(uploadsDir);
};
```

---

## 5. パフォーマンス最適化

### 5.1 画像リサイズ（将来的な拡張）

```typescript
import sharp from 'sharp';

export const resizeImage = async (buffer: Buffer): Promise<Buffer> => {
    return await sharp(buffer)
        .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
};
```

### 5.2 プログレッシブアップロード

```typescript
// フロントエンドでアップロード進捗表示
const uploadWithProgress = async (
    file: File,
    onProgress: (percent: number) => void,
) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent);
        }
    });

    // ...
};
```

---

## 6. テスト

### 6.1 バックエンドテスト

```typescript
import { describe, it, expect } from 'vitest';
import { testClient } from 'hono/testing';
import { app } from '../../app';

describe('POST /api/upload', () => {
    it('should upload valid image file', async () => {
        const client = testClient(app);

        const formData = new FormData();
        const file = new File(['fake image content'], 'test.png', {
            type: 'image/png',
        });
        formData.append('file', file);

        const res = await client.upload.$post({
            body: formData,
        });

        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.url).toContain('/uploads/');
        expect(data.data.mimeType).toBe('image/png');
    });

    it('should reject unsupported file type', async () => {
        const client = testClient(app);

        const formData = new FormData();
        const file = new File(['content'], 'malware.exe', {
            type: 'application/x-msdownload',
        });
        formData.append('file', file);

        const res = await client.upload.$post({
            body: formData,
        });

        expect(res.status).toBe(400);

        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
    });
});
```

---

## 7. 参考資料

- [OWASP - Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [Hono - File Upload](https://hono.dev/helpers/file-upload)
- [Sharp - Image Processing](https://sharp.pixelplumbing.com/)
- [MDN - FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
