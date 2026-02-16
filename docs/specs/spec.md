# 基本設計書・仕様書 (2026 Markdown Note Application)

## 1. プロジェクト概要

本プロジェクトは、NotionライクなMarkdownベースの個人用メモ帳アプリケーションである。
管理者はリッチなMarkdownエディタを用いて、テキスト、画像、動画、各種ファイルを一元管理できる。
「単一ユーザー（管理者）＋ 閲覧者」という構成を取り、メモごとの柔軟な公開設定（公開・非公開・期限付きリンク共有）によって、個人のナレッジベース兼情報発信ツールとして機能する。

### 1.1 プロダクトコンセプト

- **Simple & Fast:** 2026年のモダンスタックを採用し、SQLiteによる高速なレスポンスと、React 19による最適なレンダリングを実現する。
- **Local First Feel:** 複雑なクラウド構成を避け、可搬性の高いSQLiteとファイルシステムベースの構成とする。
- **Secure Sharing:** 特定の相手への期限付き共有など、実用的なセキュリティ機能を備える。

---

## 2. 技術スタック・アーキテクチャ

### 2.1 開発環境・ツール

- **Package Manager:** pnpm (monorepo 構成推奨)
- **Runtime:** Node.js (LTS)
- **Language:** TypeScript 5.x (Strict Mode)

### 2.2 フロントエンド (SPA)

- **Framework:** React 19 + Vite
- **State Management (Server):** TanStack Query v5+
- **State Management (URL/Local):** Nuqs (URL Search Params)
- **Router:** TanStack Router または React Router v7
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Markdown Editor:** Tiptap / Novel based implementation

### 2.3 バックエンド (API)

- **Framework:** Hono (RPC Mode via `hono/client`)
- **Validation:** Zod
- **File Handling:** Hono Multipart Body Parser

### 2.4 データベース・ストレージ

- **Database:** SQLite
- **ORM:** Drizzle ORM
- **Storage:** Local Filesystem (uploads/) serving via Hono Static Middleware

---

## 3. 機能要件詳細

### 3.1 ユーザー管理・認証

- **システム形態:** シングルテナント（管理者1名のみ）。
- **管理者認証:**
- ID/Passwordによるログイン。
- セッションベース（HttpOnly Cookie）の認証管理。
- ※初回起動時にSeedスクリプトにて管理者アカウントを作成する（サインアップ画面は作成しない: YAGNI）。

### 3.2 メモ管理 (CRUD)

- **作成・編集:**
- Markdown形式での記述。
- リアルタイムプレビューまたはWYSIWYGライクな編集体験。

- **ファイルアップロード:**
- エディタ内へのドラッグ＆ドロップ、またはアップロードボタンによるファイル添付。
- 対象: 画像(WebP/PNG/JPG/GIF), 動画(MP4/WebM), PDF, スクリプトファイル(JS/PY/SH等)。
- ファイルはサーバー上の `uploads` ディレクトリに保存し、Markdown内にリンク/埋め込みコードを挿入。

- **検索:**
- タイトルおよび本文の全文検索。
- SQLite FTS5 (Full-Text Search) を利用。

### 3.3 公開範囲・共有設定 (Visibility)

各メモは以下の3つのステータスを持つ。

| ステータス              | 閲覧権限           | 検索可否   | 備考                                    |
| ----------------------- | ------------------ | ---------- | --------------------------------------- |
| **Private (非公開)**    | 管理者のみ         | 管理者のみ | デフォルト設定                          |
| **Public (公開)**       | 全員               | 全員       | 誰でも閲覧・検索可能                    |
| **Shared (リンク共有)** | リンクを知る人のみ | 不可       | `share_token` をURLに含む場合のみ閲覧可 |

- **リンク共有の期限設定:**
- 設定値: `1日`, `7日`, `30日`, `無期限`
- DBには `share_expires_at` (Timestamp) として保存。
- 期限切れのリンクにアクセスした場合、404または403エラーを返す。

---

## 4. データモデル設計 (Drizzle ORM Schema)

### 4.1 Users Table (`users`)

管理者情報を管理する。

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(), // ULID or UUID
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### 4.2 Notes Table (`notes`)

メモ本体および公開設定を管理する。

```typescript
export const notes = sqliteTable('notes', {
    id: text('id').primaryKey(), // ULID
    title: text('title').notNull(),
    content: text('content').notNull(), // Markdown Content

    // Visibility Configuration
    visibility: text('visibility', { enum: ['private', 'public', 'shared'] })
        .notNull()
        .default('private'),

    // Link Sharing Specifics
    shareToken: text('share_token').unique(), // UUID for shared link
    shareExpiresAt: integer('share_expires_at', { mode: 'timestamp' }), // null = unlimited

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

### 4.3 Files Table (`files`)

アップロードされたファイルのメタデータを管理する（物理ファイルはDiskに保存）。

```typescript
export const files = sqliteTable('files', {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(), // Original name
    path: text('path').notNull(), // Server file path
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
});
```

---

## 5. API・通信設計 (Hono RPC)

`hono/client` を利用し、型安全なRPC通信を行う。

### 5.1 Route Structure

- **Base URL:** `/api`
- **Auth Middleware:**
- 全ルートに対し、アクセス権限チェックを行う。
- `GET` リクエストは `visibility` ロジックに基づいてフィルタリング。

### 5.2 API Definition (Zod Schemas)

#### Auth

- `POST /api/auth/login`: `{ username, password }` -> `200 OK (Set-Cookie)`
- `POST /api/auth/logout`: -> `200 OK`
- `GET /api/auth/me`: -> `{ user: { id, username } | null }`

#### Notes

- `GET /api/notes`:
- **Query:** `{ q?: string, page?: number }` (Zod verified)
- **Logic:**
- 管理者: 全てのノートを検索可能。
- ゲスト: `visibility = 'public'` のノートのみ検索可能。

- `GET /api/notes/:id`:
- **Logic:**
- 管理者: アクセス可。
- ゲスト: `visibility = 'public'` ならアクセス可。

- `GET /api/notes/shared/:shareToken`:
- **Logic:**
- `shareToken` が一致 かつ `shareExpiresAt` が未来(またはnull)の場合のみノートを返す。

- `POST /api/notes`: (Admin Only) `{ title, content, visibility, ... }`
- `PATCH /api/notes/:id`: (Admin Only) `{ title?, content?, visibility?, shareExpiresAt? }`
- `DELETE /api/notes/:id`: (Admin Only)

#### Upload

- `POST /api/upload`: (Admin Only)
- **Body:** `FormData { file: File }`
- **Response:** `{ url: string, id: string }`

---

## 6. フロントエンド設計

### 6.1 ディレクトリ構造 (Feature-based Colocation)

```text
src/
├── app/                  # Route components (TanStack Router / Pages)
├── components/           # Shared UI components (shadcn/ui)
│   ├── ui/               # Button, Input, Dialog, etc.
│   └── layout/           # Header, Sidebar
├── features/             # Feature specific modules
│   ├── auth/             # Login forms, Auth hooks
│   ├── editor/           # Markdown editor logic, Toolbar
│   ├── notes/            # Note list, Note detail, filtering
│   │   ├── components/
│   │   ├── hooks/        # useNotes, useNote (Query)
│   │   └── schemas.ts    # Zod schemas for forms
│   └── settings/         # Config UI
├── lib/                  # Utilities
│   ├── api-client.ts     # Hono RPC Client setup
│   ├── utils.ts          # cn() helper etc.
│   └── query-client.ts   # TanStack Query config
└── main.tsx

```

### 6.2 状態管理戦略

1. **Server State:** `TanStack Query`

- `useQuery`: データの取得。`staleTime` を適切に設定。
- `useMutation`: 作成・更新・削除。`onSuccess` で `queryClient.invalidateQueries` を実行。

2. **URL State:** `Nuqs`

- 検索ワード (`?q=...`)
- ソート順 (`?sort=...`)
- モーダルの開閉状態（必要であれば）

3. **Form State:** `React Hook Form`

- 非制御コンポーネントとして管理し、レンダリングパフォーマンスを維持。
- `zodResolver` でスキーマバリデーションを適用。

### 6.3 UI/UX詳細

- **Loading UI:** React `Suspense` と Skeleton Screen (shadcn/ui) を使用。
- **Editor:**
- ツールバーは選択時にフローティング表示（Notionライク）。
- 画像のアップロード中はプレースホルダーを表示し、完了後にURL置換。

- **Responsive:** Tailwindの `md:`, `lg:` プレフィックスを活用し、モバイルとデスクトップ両対応。

---

## 7. 開発・運用ルール (Engineering Guidelines)

本プロジェクトでは以下のルールを厳格に適用する。

### 7.1 General Principles

1. **KISS & YAGNI:** 過度な抽象化クラスや「将来使うかもしれない」機能の実装を禁止する。
2. **Single Responsibility:** 1ファイル1機能を徹底する。巨大なファイルは分割ではなく、責務の切り出しで解決する。
3. **Colocation:** `NoteCard` コンポーネントで使う独自の型定義やヘルパーは、`components/` ではなく `features/notes/components/NoteCard/` 配下に置く。

### 7.2 TypeScript & Code Quality

1. **Strict Mode:** `tsconfig.json` の `strict: true` 必須。
2. **No Any:** `any` 型の使用はビルドエラーとする。
3. **SSOT:** 型定義はZod Schemaから `z.infer` で生成する。手動の `interface` 定義は極力避ける。
4. **Named Exports:** コンポーネントは `export const` で定義する。

### 7.3 Frontend Specifics (React 19)

1. **No Manual Memoization:** `useMemo`, `useCallback` の使用を原則禁止する（React Compilerへの信頼）。
2. **No useEffect for Data:** データフェッチは必ず `TanStack Query` を使用する。`useEffect` 内での `fetch` は禁止。
3. **Components:** shadcn/ui をベースにし、スタイルの上書きは `cn()` ユーティリティと Tailwind クラスで行う。CSS Modules等は使用しない。

### 7.4 Backend Specifics (Hono)

1. **RPC Only:** APIエンドポイントのURL（文字列）をフロントエンドコードにハードコードすることを禁止する。必ず `client.api.notes.$get()` の形式で呼び出す。
2. **Controller-Service Separation:** ルートハンドラ(`app.get(...)`)には、リクエストのパースとレスポンスの返却のみ記述する。ビジネスロジックは純粋関数として別ファイル（Service層）に切り出す。
3. **Transaction:** DBへの書き込みが複数発生する場合は必ず `db.transaction()` を使用する。

### 7.5 Database & Migration

1. **No Raw SQL:** 特殊な集計を除き、Drizzle ORMのクエリビルダーを使用する。
2. **Migration:** スキーマ変更は `drizzle-kit generate` および `drizzle-kit migrate` を通じて行う。

---

## 8. セキュリティ設計

1. **XSS対策:**

- Reactのデフォルトのエスケープに加え、Markdownレンダリング時にサニタイズ処理（`rehype-sanitize` 等）を挟む。

2. **CSRF対策:**

- HonoのCSRFミドルウェアを使用。
- SameSite Cookie属性を `Lax` または `Strict` に設定。

3. **アクセス制御:**

- リンク共有機能では、UUID (v4) を使用し、推測不可能なトークンを発行する。
- 期限切れトークンへのアクセスはサーバーサイドで厳密にブロックする。

4. **ファイルアップロード:**

- 拡張子とMIMEタイプのダブルチェックを行う。
- 実行可能ファイルがサーバー側で誤って実行されないよう、保存ディレクトリの実行権限を剥奪する。
