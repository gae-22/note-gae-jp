# Markdown Note Application

> **Modern Markdown-based Note-taking Application with Rich Editor and Flexible Sharing**

NotionライクなMarkdownベースの個人用メモ帳アプリケーション。管理者はリッチなMarkdownエディタを用いて、テキスト、画像、動画、各種ファイルを一元管理できる。

---

## 📋 目次

- [プロジェクト概要](#プロジェクト概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [プロジェクト構成](#プロジェクト構成)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [ビルド・デプロイ](#ビルドデプロイ)
- [ドキュメント](#ドキュメント)
- [ライセンス](#ライセンス)

---

## プロジェクト概要

### コンセプト

本アプリケーションは **「単一ユーザー（管理者）＋ 閲覧者」** という構成を取り、メモごとの柔軟な公開設定（公開・非公開・期限付きリンク共有）によって、個人のナレッジベース兼情報発信ツールとして機能する。

### デザイン原則

| 原則               | 説明                                                             |
| ------------------ | ---------------------------------------------------------------- |
| **Simple & Fast**  | 2026年のモダンスタックを採用し、SQLiteとReact 19による高速な動作 |
| **Local First**    | SQLiteとファイルシステムベースの構成で、可搬性とシンプルさを実現 |
| **Secure Sharing** | 期限付き共有リンクなど、実用的なセキュリティ機能を備える         |
| **KISS & YAGNI**   | シンプルな実装を優先し、必要になってから機能を追加               |

---

## 主な機能

### ✍️ リッチMarkdownエディタ

- **Tiptap/Novel** ベースのWYSIWYGエディタ
- リアルタイムMarkdownプレビュー
- シンタックスハイライト
- ドラッグ&ドロップによるファイルアップロード

### 📁 ファイル管理

- **対応フォーマット:**
    - 画像: WebP, PNG, JPG, GIF
    - 動画: MP4, WebM
    - ドキュメント: PDF
    - コード: JS, PY, SH, etc.
- ファイルは `uploads/` ディレクトリに保存
- Markdown内に自動埋め込み

### 🔍 全文検索

- **SQLite FTS5** による高速全文検索
- タイトル・本文の同時検索
- 部分一致・ワイルドカード対応

### 🔒 公開範囲設定

| モード                  | 閲覧権限           | 検索可否   | 備考                        |
| ----------------------- | ------------------ | ---------- | --------------------------- |
| **Private (非公開)**    | 管理者のみ         | 管理者のみ | デフォルト設定              |
| **Public (公開)**       | 全員               | 全員       | 誰でも閲覧・検索可能        |
| **Shared (リンク共有)** | リンクを知る人のみ | 不可       | UUIDベースの推測不可能なURL |

### ⏰ 期限付き共有

- **期限設定:** 1日、7日、30日、無期限
- 期限切れリンクは自動的にアクセス不可
- 共有リンクのワンクリック無効化

---

## 技術スタック

### フロントエンド

| カテゴリ             | 技術                         |
| -------------------- | ---------------------------- |
| **Framework**        | React 19 + Vite 6.x          |
| **Language**         | TypeScript 5.x (Strict Mode) |
| **Routing**          | TanStack Router              |
| **State Management** | TanStack Query v5+           |
| **Styling**          | Tailwind CSS v4              |
| **UI Components**    | shadcn/ui + Lucide React     |
| **Forms**            | React Hook Form + Zod        |
| **Editor**           | Tiptap / Novel               |

### バックエンド

| カテゴリ             | 技術                            |
| -------------------- | ------------------------------- |
| **Framework**        | Hono (RPC Mode)                 |
| **Language**         | TypeScript 5.x                  |
| **Validation**       | Zod                             |
| **Database**         | SQLite + Drizzle ORM            |
| **Authentication**   | Session-based (HttpOnly Cookie) |
| **Password Hashing** | bcrypt (cost factor: 10)        |

### 開発ツール

| カテゴリ             | 技術                |
| -------------------- | ------------------- |
| **Package Manager**  | pnpm (Monorepo)     |
| **Linter/Formatter** | Biome               |
| **Testing**          | Vitest + Playwright |
| **Type Safety**      | Hono RPC Client     |

---

## プロジェクト構成

### Monorepo ディレクトリ構造

```
note-gae-jp/
├── packages/
│   ├── frontend/           # React SPA
│   │   ├── src/
│   │   │   ├── features/   # Feature-based colocation
│   │   │   │   ├── auth/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── types.ts
│   │   │   │   ├── notes/
│   │   │   │   └── upload/
│   │   │   ├── components/  # Shared components
│   │   │   ├── hooks/       # Shared hooks
│   │   │   ├── lib/         # API client, utils
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── backend/            # Hono API Server
│   │   ├── src/
│   │   │   ├── routes/     # API routes
│   │   │   │   ├── auth.ts
│   │   │   │   ├── notes.ts
│   │   │   │   └── upload.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts       # Drizzle schema
│   │   │   │   └── migrations/     # SQLite migrations
│   │   │   ├── middleware/ # Auth, CORS, etc.
│   │   │   ├── services/   # Business logic
│   │   │   └── index.ts
│   │   ├── uploads/        # File storage
│   │   ├── data.db         # SQLite database
│   │   └── package.json
│   │
│   └── shared/             # Shared types (optional)
│       └── types.ts
│
├── docs/
│   └── specs/              # 設計書・仕様書
│       ├── spec.md                     # オリジナル仕様書
│       ├── architecture.md             # アーキテクチャ設計
│       ├── database-design.md          # データベース設計
│       ├── api-design.md               # API設計
│       ├── frontend-design.md          # フロントエンド設計
│       ├── security.md                 # セキュリティ設計
│       ├── development-guidelines.md   # 開発ガイドライン
│       └── features/
│           ├── auth.md                 # 認証機能詳細設計
│           ├── notes.md                # メモ管理機能詳細設計
│           └── upload.md               # ファイルアップロード詳細設計
│
├── pnpm-workspace.yaml
├── package.json
├── biome.json
├── tsconfig.json
└── README.md
```

---

## セットアップ

### 前提条件

- **Node.js:** v20.x 以降（LTS推奨）
- **pnpm:** v9.x 以降

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/note-gae-jp.git
cd note-gae-jp

# 依存関係をインストール
pnpm install
```

### 環境変数の設定

**Backend (`packages/backend/.env`):**

```env
# Database
DATABASE_URL=./data.db

# Session Secret (ランダムな文字列を設定)
SESSION_SECRET=your-secret-key-here

# Environment
NODE_ENV=development

# CORS (フロントエンドのURL)
FRONTEND_URL=http://localhost:5173
```

**Frontend (`packages/frontend/.env`):**

```env
# API Base URL
VITE_API_URL=http://localhost:3000/api
```

### データベースの初期化

```bash
# マイグレーションを実行
pnpm --filter @note-app/backend db:migrate

# 初期データ（管理者アカウント）を作成
pnpm --filter @note-app/backend db:seed
```

**デフォルト管理者アカウント:**

- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ **本番環境では必ずパスワードを変更してください**

---

## 開発

### 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時起動
pnpm dev
```

または個別に起動:

```bash
# フロントエンド (http://localhost:5173)
pnpm --filter @note-app/frontend dev

# バックエンド (http://localhost:3000)
pnpm --filter @note-app/backend dev
```

### Lint & Format

```bash
# Lint + Format (Biome)
pnpm format

# Lint のみ
pnpm lint
```

### テスト

```bash
# 単体テスト (Vitest)
pnpm test

# カバレッジ確認
pnpm test:coverage

# E2Eテスト (Playwright)
pnpm test:e2e
```

---

## ビルド・デプロイ

### 本番ビルド

```bash
# フロントエンド + バックエンドをビルド
pnpm build
```

### 本番環境の起動

```bash
# バックエンドを起動
pnpm --filter @note-app/backend start

# フロントエンドは静的ファイルとしてHonoから配信
```

**Honoの静的ファイル配信設定:**

```typescript
import { serveStatic } from '@hono/node-server/serve-static';

app.use('/assets/*', serveStatic({ root: './dist/frontend' }));
app.get('*', serveStatic({ path: './dist/frontend/index.html' }));
```

---

## ドキュメント

詳細な設計書・仕様書は [docs/specs/](./docs/specs/) ディレクトリに格納されています。

### 📚 設計書一覧

| ドキュメント                                                        | 説明                                         |
| ------------------------------------------------------------------- | -------------------------------------------- |
| [spec.md](./docs/specs/spec.md)                                     | オリジナル仕様書（基本設計）                 |
| [architecture.md](./docs/specs/architecture.md)                     | システムアーキテクチャ、技術スタック         |
| [database-design.md](./docs/specs/database-design.md)               | データベーススキーマ、ER図、マイグレーション |
| [api-design.md](./docs/specs/api-design.md)                         | API仕様（Hono RPC）、エンドポイント一覧      |
| [frontend-design.md](./docs/specs/frontend-design.md)               | フロントエンド設計、コンポーネント構成       |
| [security.md](./docs/specs/security.md)                             | セキュリティ設計（XSS/CSRF/認証）            |
| [development-guidelines.md](./docs/specs/development-guidelines.md) | コーディング規約、Gitワークフロー            |
| [features/auth.md](./docs/specs/features/auth.md)                   | 認証機能の詳細実装（関数レベル）             |
| [features/notes.md](./docs/specs/features/notes.md)                 | メモ管理機能の詳細実装（CRUD/検索）          |
| [features/upload.md](./docs/specs/features/upload.md)               | ファイルアップロード機能の詳細実装           |

---

## 開発ガイドライン

### デザイン原則

1. **KISS (Keep It Simple, Stupid):** シンプルな実装を優先
2. **YAGNI (You Aren't Gonna Need It):** 必要になってから実装
3. **DRY (Don't Repeat Yourself):** 重複コードは関数化

### コーディング規約

- **TypeScript Strict Mode** を有効化
- **Biome** によるLint/Format
- **Zod** によるバリデーション
- **Drizzle ORM** のみ使用（生SQL禁止）
- **Hono RPC** によるAPI呼び出し（Fetch API直接使用禁止）

### テスト戦略

- **単体テスト:** Vitest
- **E2Eテスト:** Playwright
- **目標カバレッジ:** 80%以上

詳細は [development-guidelines.md](./docs/specs/development-guidelines.md) を参照。

---

## セキュリティ

本アプリケーションは以下のセキュリティ対策を実装しています:

- ✅ **XSS対策:** Reactデフォルトエスケープ、CSP設定
- ✅ **CSRF対策:** SameSite Cookie、CSRFトークン
- ✅ **SQLインジェクション対策:** Drizzle ORMによるパラメータ化クエリ
- ✅ **認証:** bcryptによるパスワードハッシュ化、セッション管理
- ✅ **ファイルアップロード:** MIMEタイプ検証、パストラバーサル対策
- ✅ **レート制限:** ブルートフォース攻撃対策

詳細は [security.md](./docs/specs/security.md) を参照。

---

## トラブルシューティング

### データベースマイグレーションが失敗する

```bash
# マイグレーションファイルを再生成
pnpm --filter @note-app/backend db:generate

# マイグレーションを強制実行
pnpm --filter @note-app/backend db:push
```

### ポートが既に使用されている

```bash
# プロセスを確認
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# プロセスを終了
kill -9 <PID>
```

### pnpm install が失敗する

```bash
# キャッシュをクリア
pnpm store prune

# node_modules を削除して再インストール
rm -rf node_modules packages/*/node_modules
pnpm install
```

---

## ライセンス

MIT License

---

## 貢献

Pull Requestsは歓迎します。大きな変更を加える場合は、まずIssueを作成して変更内容を議論してください。

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

---

## 問い合わせ

質問や提案がある場合は、GitHubのIssueにて受け付けています。

---

**Built with ❤️ using React 19, Hono, and SQLite**
