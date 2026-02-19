# アーキテクチャ設計書

概要: システム全体の構成、レイヤー分離、運用・デプロイ方針を示す設計書です。設計上の重要決定とその理由を明記し、実装チームが一貫して構築できるようにしています。

推奨読者: アーキテクト、バックエンド・インフラ担当、リード開発者。

重要ポイント:

- モノリシックな可搬性: SQLite + ローカルストレージでまずは簡潔に運用。
- 将来的移行パス（Postgres/S3/Redis）を明確化。
- デプロイ手順とマイグレーション運用方針を明示。

## 1. プロジェクト概要

### 1.1 プロダクト名

**2026 Markdown Note Application**

### 1.2 プロダクトコンセプト

NotionライクなMarkdownベースの個人用メモ帳アプリケーション。管理者はリッチなMarkdownエディタを用いて、テキスト、画像、動画、各種ファイルを一元管理できる。「単一ユーザー（管理者）＋ 閲覧者」という構成を取り、メモごとの柔軟な公開設定（公開・非公開・期限付きリンク共有）によって、個人のナレッジベース兼情報発信ツールとして機能する。

**コアバリュー:**

- **Simple & Fast:** 2026年のモダンスタックを採用し、SQLiteによる高速なレスポンスと、React 19による最適なレンダリングを実現する
- **Local First Feel:** 複雑なクラウド構成を避け、可搬性の高いSQLiteとファイルシステムベースの構成とする
- **Secure Sharing:** 特定の相手への期限付き共有など、実用的なセキュリティ機能を備える

### 1.3 ユーザーロール

| ロール     | 説明                                         | 権限                                 |
| ---------- | -------------------------------------------- | ------------------------------------ |
| **管理者** | システム唯一の所有者                         | 全メモのCRUD、アップロード、公開設定 |
| **閲覧者** | 認証なしでアクセスするユーザー（匿名訪問者） | 公開メモの閲覧、共有リンク経由の閲覧 |

---

## 2. システムアーキテクチャ

### 2.1 アーキテクチャ概要図

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌───────────────────────────────────────────┐  │
│  │  React 19 SPA (Vite)                      │  │
│  │  ├─ TanStack Router (Routing)             │  │
│  │  ├─ TanStack Query (Server State)         │  │
│  │  ├─ Nuqs (URL State)                      │  │
│  │  ├─ React Hook Form + Zod (Forms)         │  │
│  │  ├─ Tailwind CSS v4 + shadcn/ui (UI)      │  │
│  │  └─ Tiptap/Novel (Markdown Editor)        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS (Hono RPC Client)
                  ▼
┌─────────────────────────────────────────────────┐
│              Node.js Server                      │
│  ┌───────────────────────────────────────────┐  │
│  │  Hono Framework                           │  │
│  │  ├─ RPC Routes (/api/*)                   │  │
│  │  ├─ Auth Middleware (Session)             │  │
│  │  ├─ CSRF Protection                       │  │
│  │  ├─ Static File Serving (/uploads)        │  │
│  │  └─ Zod Validation                        │  │
│  └───────────────────────────────────────────┘  │
│                    │                             │
│                    ▼                             │
│  ┌────────────────────────┐  ┌───────────────┐  │
│  │   Drizzle ORM          │  │  File System  │  │
│  │   (Query Builder)      │  │  (uploads/)   │  │
│  └────────┬───────────────┘  └───────────────┘  │
└───────────┼─────────────────────────────────────┘
            ▼
┌─────────────────────┐
│   SQLite Database   │
│   (data.db)         │
└─────────────────────┘
```

### 2.2 レイヤー構成

#### 2.2.1 Presentation Layer (Frontend)

| 要素             | 技術スタック               | 責務                               |
| ---------------- | -------------------------- | ---------------------------------- |
| UI Components    | shadcn/ui, Tailwind CSS v4 | 再利用可能なUIパーツ               |
| Pages/Routes     | TanStack Router            | ルーティング、ページコンポーネント |
| State Management | TanStack Query, Nuqs       | サーバー状態、URL状態              |
| Form Handling    | React Hook Form + Zod      | フォームバリデーション、送信       |
| Markdown Editor  | Tiptap/Novel               | リッチテキスト編集                 |
| API Client       | Hono RPC Client            | 型安全なAPI通信                    |

#### 2.2.2 Application Layer (Backend - Hono)

| 要素           | 技術スタック                   | 責務                               |
| -------------- | ------------------------------ | ---------------------------------- |
| HTTP Routing   | Hono Router                    | エンドポイント定義、リクエスト受付 |
| RPC Handler    | Hono RPC Mode                  | 型安全なリクエスト/レスポンス処理  |
| Authentication | Session-based (Cookie)         | ログイン状態管理、権限チェック     |
| Validation     | Zod Schemas                    | リクエストパラメータ検証           |
| Business Logic | Service Layer (Pure Functions) | ドメインロジック、データ操作       |
| File Upload    | Hono Multipart Parser          | ファイルアップロード処理           |

#### 2.2.3 Data Layer (Database & Storage)

| 要素             | 技術スタック     | 責務                           |
| ---------------- | ---------------- | ------------------------------ |
| ORM              | Drizzle ORM      | 型安全なクエリビルダー         |
| Database         | SQLite           | データ永続化                   |
| Full-Text Search | SQLite FTS5      | メモの全文検索                 |
| File Storage     | Local Filesystem | アップロードファイルの物理保存 |
| Migration        | Drizzle Kit      | スキーマバージョン管理         |

---

## 3. 技術スタック詳細

### 3.1 開発環境・ツール

| カテゴリ         | 技術                | バージョン  | 用途               |
| ---------------- | ------------------- | ----------- | ------------------ |
| Package Manager  | pnpm                | latest      | 高速な依存関係管理 |
| Runtime          | Node.js             | LTS (v24.x) | サーバー実行環境   |
| Language         | TypeScript          | 5.x         | 型安全なコード記述 |
| Build Tool       | Vite                | 6.x         | 高速ビルド・HMR    |
| Linter/Formatter | Biome               | latest      | コード品質・整形   |
| Pre-commit       | Husky + lint-staged | latest      | コミット前チェック |

### 3.2 フロントエンド技術スタック

| カテゴリ        | 技術               | 選定理由                                       |
| --------------- | ------------------ | ---------------------------------------------- |
| Framework       | React 19           | 最新のReact Compiler、Server Components対応    |
| Bundler         | Vite               | 高速なHMR、最適化されたプロダクションビルド    |
| Router          | TanStack Router    | 型安全、Code Splitting、Loaders対応            |
| Server State    | TanStack Query v5+ | キャッシング、楽観的更新、自動再取得           |
| URL State       | Nuqs               | 型安全なURL Search Params管理                  |
| Styling         | Tailwind CSS v4    | ユーティリティファースト、小さいバンドルサイズ |
| UI Components   | shadcn/ui          | カスタマイズ可能、コピー&ペーストで使用        |
| Icons           | Lucide React       | 一貫性のあるアイコンセット                     |
| Form Handling   | React Hook Form    | 非制御コンポーネント、高パフォーマンス         |
| Validation      | Zod                | TypeScript連携、スキーマ駆動開発               |
| Markdown Editor | Tiptap / Novel     | 拡張可能、モダンなWYSIWYG                      |
| Date Handling   | date-fns           | 軽量、ツリーシェイク可能                       |

### 3.3 バックエンド技術スタック

| カテゴリ           | 技術                    | 選定理由                                     |
| ------------------ | ----------------------- | -------------------------------------------- |
| Framework          | Hono                    | 高速、軽量、Edge対応、TypeScript完全サポート |
| RPC Client         | hono/client             | エンドツーエンド型安全性                     |
| Validation         | Zod                     | フロントエンドとスキーマ共有可能             |
| Password Hashing   | Argon2id (argon2)       | OWASP推奨のハッシュアルゴリズム              |
| Session Management | Hono Session Middleware | HttpOnly Cookie、SameSite設定                |
| CSRF Protection    | Hono CSRF Middleware    | トークンベースのCSRF対策                     |
| File Upload        | Hono Multipart          | マルチパートフォームデータ処理               |

### 3.4 データベース・ストレージ

| カテゴリ         | 技術             | 選定理由                             |
| ---------------- | ---------------- | ------------------------------------ |
| Database         | SQLite           | ゼロコンフィグ、ファイルベース、軽量 |
| ORM              | Drizzle ORM      | 型安全、軽量、マイグレーション対応   |
| Full-Text Search | SQLite FTS5      | SQLite組み込み、高速全文検索         |
| File Storage     | Local Filesystem | シンプル、可搬性高い                 |
| Migration Tool   | Drizzle Kit      | スキーマからマイグレーション自動生成 |

### 3.5 Offline Strategy (PWA)

- **Service Worker:** `vite-plugin-pwa` を使用してアプリシェル（HTML/CSS/JS/Fonts）をキャッシュ。
- **Runtime Caching:**
    - `GET /api/notes`: `NetworkFirst` 戦略（可能なら最新、ダメならキャッシュ）。
    - 画像 (`/uploads/...`): `CacheFirst` 戦略（不変コンテンツとして扱う）。
- **Offline Mutation:**
    - 編集中のデータは `IndexedDB` に保存し、オンライン復帰時にバックグラウンド同期（Sync）を行う。

---

### 4. プロジェクト構成

### 4.1 ディレクトリ構成 (Monorepo 構成)

本プロジェクトでは、型安全性と将来の拡張性を担保するため **Monorepo (packages/)** 構成を**必須**とします。

```
note-gae-jp/
├── packages/
│   ├── frontend/              # React SPA (Vite)
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── backend/               # Hono API Server
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                # 共有型定義・スキーマ (Zod / types)
│       ├── src/
│       └── package.json
│
├── docs/                      # 設計書・ドキュメント
├── data/                      # SQLite データベース (data.db)
├── uploads/                   # アップロードファイル
├── pnpm-workspace.yaml        # workspace 管理
├── package.json               # 全体スクリプト / dev convenience
└── README.md
```

**選定理由:**

- **型安全性の最大化:** `shared` パッケージにより、API リクエスト/レスポンスの型 (`Zod` schema/Types) をフロントエンドとバックエンドで共有し、不整合をコンパイル時に検出できます。
- **責務の分離:** フロントエンドとバックエンドの依存関係を明確に分離し、個別のテストやビルドを容易にします。

```
packages/frontend/src/
├── app/                       # ルートコンポーネント
│   ├── routes/                # TanStack Router routes
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Home page (Public notes list)
│   │   ├── login.tsx          # Login page
│   │   ├── admin/             # Admin routes (protected)
│   │   │   ├── _layout.tsx    # Admin layout
│   │   │   ├── index.tsx      # Dashboard
│   │   │   ├── notes/
│   │   │   │   ├── index.tsx  # Notes list
│   │   │   │   ├── new.tsx    # Create note
│   │   │   │   └── $id.tsx    # Edit note
│   │   │   └── settings.tsx
│   │   ├── notes/
│   │   │   └── $id.tsx        # Public note view
│   │   └── shared/
│   │       └── $token.tsx     # Shared note view
│   └── router.tsx             # Router configuration
│
├── components/                # 共有UIコンポーネント
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── ...
│   └── layout/                # レイアウトコンポーネント
│       ├── header.tsx
│       ├── footer.tsx
│       └── sidebar.tsx
│
├── features/                  # 機能別モジュール
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── logout-button.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-login.ts
│   │   │   └── use-logout.ts
│   │   ├── api/
│   │   │   └── auth-api.ts
│   │   └── schemas.ts
│   │
│   ├── notes/
│   │   ├── components/
│   │   │   ├── note-card.tsx
│   │   │   ├── note-list.tsx
│   │   │   ├── note-filters.tsx
│   │   │   └── note-search.tsx
│   │   ├── hooks/
│   │   │   ├── use-notes.ts
│   │   │   ├── use-note.ts
│   │   │   ├── use-create-note.ts
│   │   │   ├── use-update-note.ts
│   │   │   └── use-delete-note.ts
│   │   ├── api/
│   │   │   └── notes-api.ts
│   │   └── schemas.ts
│   │
│   ├── editor/
│   │   ├── components/
│   │   │   ├── markdown-editor.tsx
│   │   │   ├── editor-toolbar.tsx
│   │   │   ├── editor-bubble-menu.tsx
│   │   │   └── file-upload-button.tsx
│   │   ├── extensions/
│   │   │   ├── image-upload.ts
│   │   │   └── file-embed.ts
│   │   └── utils/
│   │       └── editor-config.ts
│   │
│   └── sharing/
│       ├── components/
│       │   ├── share-dialog.tsx
│       │   ├── share-link-display.tsx
│       │   └── visibility-selector.tsx
│       ├── hooks/
│       │   └── use-generate-share-link.ts
│       └── utils/
│           └── share-url-builder.ts
│
├── lib/                       # ユーティリティ・設定
│   ├── api-client.ts          # Hono RPC Client初期化
│   ├── query-client.ts        # TanStack Query設定
│   ├── utils.ts               # cn() 等のヘルパー
│   └── constants.ts           # アプリケーション定数
│
├── main.tsx                   # エントリーポイント
├── index.css                  # Tailwind imports
└── vite-env.d.ts
```

### 4.3 バックエンド ディレクトリ構成

```
packages/backend/src/
├── app.ts                     # Hono アプリケーション初期化
├── index.ts                   # サーバーエントリーポイント
│
├── routes/                    # ルート定義
│   ├── index.ts               # ルート統合
│   ├── auth.ts                # 認証関連ルート
│   ├── notes.ts               # メモ関連ルート
│   └── upload.ts              # アップロード関連ルート
│
├── middleware/                # ミドルウェア
│   ├── auth.ts                # 認証チェック
│   ├── session.ts             # セッション管理
│   ├── csrf.ts                # CSRF保護
│   └── error-handler.ts       # エラーハンドリング
│
├── services/                  # ビジネスロジック（純粋関数）
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── verify-password.ts
│   │   └── hash-password.ts
│   ├── notes/
│   │   ├── create-note.ts
│   │   ├── update-note.ts
│   │   ├── delete-note.ts
│   │   ├── get-note.ts
│   │   ├── list-notes.ts
│   │   └── search-notes.ts
│   ├── sharing/
│   │   ├── generate-share-token.ts
│   │   ├── validate-share-token.ts
│   │   └── check-share-expiry.ts
│   └── uploads/
│       ├── save-file.ts
│       ├── validate-file.ts
│       └── delete-file.ts
│
├── db/                        # データベース関連
│   ├── schema.ts              # Drizzle Schema定義
│   ├── migrations/            # マイグレーションファイル
│   ├── client.ts              # DB接続クライアント
│   └── seed.ts                # 初期データ投入
│
├── validators/                # Zodスキーマ（または@shared使用）
│   ├── auth.ts
│   ├── notes.ts
│   └── upload.ts
│
└── utils/                     # ユーティリティ
    ├── ulid.ts                # ULID生成
    ├── env.ts                 # 環境変数管理
    └── constants.ts
```

---

## 5. データフロー

### 5.1 認証フロー

```
1. ユーザーがログインフォームに入力
   ↓
2. Frontend: React Hook Form でバリデーション (Zod)
   ↓
3. Frontend: Hono RPC Client 経由で POST /api/auth/login
   ↓
4. Backend: Zodでリクエストボディ検証
   ↓
5. Backend: Service Layer でパスワードハッシュ照合
   ↓
6. Backend: セッション作成、HttpOnly Cookie に保存
   ↓
7. Backend: レスポンス返却 (200 OK + Set-Cookie)
   ↓
8. Frontend: TanStack Query でユーザー情報キャッシュ
   ↓
9. Frontend: 管理画面へリダイレクト
```

### 5.2 メモ作成フロー

```
1. 管理者がエディタでメモを作成
   ↓
2. Frontend: Tiptap エディタから Markdown 取得
   ↓
3. Frontend: React Hook Form + Zod でバリデーション
   ↓
4. Frontend: useMutation (TanStack Query) で POST /api/notes
   ↓
5. Backend: 認証ミドルウェアでセッション確認
   ↓
6. Backend: Zod でリクエストボディ検証
   ↓
7. Backend: Service Layer でメモ作成、DB保存 (Drizzle)
   ↓
8. Backend: 作成されたメモを返却
   ↓
9. Frontend: queryClient.invalidateQueries でリスト更新
   ↓
10. Frontend: 成功通知表示、メモ一覧へリダイレクト
```

### 5.3 ファイルアップロードフロー

```
1. ユーザーがファイルをドラッグ＆ドロップ
   ↓
2. Frontend: File オブジェクト取得、MIME/サイズ検証
   ↓
3. Frontend: FormData 作成、POST /api/upload
   ↓
4. Backend: 認証ミドルウェアでセッション確認
   ↓
5. Backend: Hono Multipart Parser でファイル取得
   ↓
6. Backend: Service Layer でファイル検証（MIME, 拡張子, サイズ）
   ↓
7. Backend: ULID生成、uploads/ に保存
   ↓
8. Backend: files テーブルにメタデータ保存
   ↓
9. Backend: { url, id, filename } を返却
   ↓
10. Frontend: エディタにファイル埋め込みコード挿入
```

### 5.4 共有リンク生成フロー

```
1. 管理者がメモの共有設定ダイアログを開く
   ↓
2. Frontend: Visibility を "shared" に変更
   ↓
3. Frontend: 有効期限を選択（1日/7日/30日/無期限）
   ↓
4. Frontend: PATCH /api/notes/:id で更新
   ↓
5. Backend: 認証ミドルウェアでセッション確認
   ↓
6. Backend: Service Layer で UUID (v4) 生成
   ↓
7. Backend: share_token, share_expires_at を更新
   ↓
8. Backend: 更新されたメモを返却
   ↓
9. Frontend: 共有URLを生成して表示
   ↓
10. ユーザーがURLをコピーして共有
```

---

## 6. デプロイメント戦略

### 6.1 推奨デプロイ環境

| 環境 | フロントエンド       | バックエンド         | データベース        |
| ---- | -------------------- | -------------------- | ------------------- |
| 開発 | Vite Dev Server      | Node.js + tsx        | SQLite (local)      |
| 本番 | Static Files (Nginx) | Node.js (PM2/Docker) | SQLite (persistent) |

### 6.2 ビルド・デプロイ手順

#### 開発環境

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter backend db:migrate

# Seed initial admin user
pnpm --filter backend db:seed

# Start backend dev server
pnpm --filter backend dev

# Start frontend dev server
pnpm --filter frontend dev
```

#### 本番環境

```bash
# Build frontend
pnpm --filter frontend build

# Build backend
pnpm --filter backend build

# Run migrations
NODE_ENV=production pnpm --filter backend db:migrate

# Start production server
NODE_ENV=production pm2 start packages/backend/dist/index.js
```

### 6.3 マイグレーション運用方針

- **本番適用:** デプロイ前に手動で `db:migrate` を実行。`drizzle-kit push` は使用しない。
- **ロールバック:** マイグレーションファイルにロールバックSQLを用意するか、別途ダウンマイグレーションスクリプトを管理する。
- **自動適用:** アプリ起動時の自動マイグレーションは開発環境のみ。本番ではデプロイパイプラインで明示的に実行。

### 6.4 CI/CD（推奨構成）

- **GitHub Actions** によるビルド・テスト・Lint の自動実行
- 本番デプロイ: マージ時または手動トリガーで、ビルド → マイグレーション → デプロイ を順次実行

### 6.5 環境変数

必須の環境変数一覧。詳細は [implementation_detail.md](./implementation_detail.md#3-環境変数) を参照。

| 変数名           | 必須       | 説明                                         |
| ---------------- | ---------- | -------------------------------------------- |
| `NODE_ENV`       | Yes        | `development` / `production`                 |
| `SESSION_SECRET` | Yes        | セッション暗号化用（32文字以上推奨）         |
| `DATABASE_PATH`  | No         | SQLite DBパス（デフォルト: `data/data.db`）  |
| `UPLOADS_DIR`    | No         | アップロード保存先（デフォルト: `uploads/`） |
| `FRONTEND_URL`   | Yes (本番) | CSRF検証用のフロントエンドURL                |

---

## 7. パフォーマンス目標

| 指標                     | 目標値        |
| ------------------------ | ------------- |
| First Contentful Paint   | < 1.0s        |
| Largest Contentful Paint | < 2.5s        |
| Time to Interactive      | < 3.0s        |
| API レスポンスタイム     | < 100ms (p95) |
| メモ一覧表示（100件）    | < 50ms        |
| 全文検索（FTS5）         | < 200ms       |
| ファイルアップロード     | < 1s (10MB)   |

---

## 8. スケーラビリティ考察

本アプリケーションは「個人用」を前提としているため、垂直スケーリングで十分対応可能。

### 8.1 想定データ規模

- メモ数: 〜10,000件
- ファイル: 〜5GB
- 同時アクセス: 〜10リクエスト/秒

### 8.2 将来的な拡張性

もしマルチユーザー対応が必要になった場合の移行パス:

1. PostgreSQL への移行（Drizzle ORM が対応）
2. S3互換ストレージへのファイル移行
3. Redis によるセッション管理
4. Horizontal Scaling (Load Balancer)

---

## 9. 参考資料

- [React 19 Documentation](https://react.dev/)
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Tiptap Documentation](https://tiptap.dev/)

---

## 10. Observability, Health & Maintenance

### 10.1 Observability

- **Metrics:** アプリケーションは Prometheus 互換のメトリクスをエクスポート可能にする（例: `/metrics`）。収集対象: HTTP レイテンシ（p50/p95/p99）、エラーレート、GC、メモリ/CPU 使用率、DB クエリレイテンシ。
- **Tracing:** 必要に応じて OpenTelemetry を導入し、重要なリクエストの分散トレーシングを行う。
- **Logging:** 構造化ログ（JSON）を出力し、レベルは `debug`/`info`/`warn`/`error` を使用。Sentry は例外監視用に導入する。

### 10.2 Health Checks

- **Liveness:** `/healthz` — プロセス生存確認（単純応答）。
- **Readiness:** `/readyz` — DB 接続・ストレージへの書き込み検証を含む（デプロイ時のトラフィック切り替えに利用）。

### 10.3 Backups & Maintenance

- **SQLite バックアップ:** 定期的に `data/data.db` のファイルコピーを取り、外部ストレージ（S3/外部ボリューム）へ保存するスケジュールを設定（例: 毎日深夜、7世代保持）。
- **Integrity Check:** バックアップ取得時に `PRAGMA integrity_check;` を実行し、障害検出を自動化する。
- **Vacuum:** 定期的に `VACUUM` を実行してファイルサイズを最適化する（低負荷時間帯に実行）。
