# note-gae-jp

> A high-performance, offline-first Markdown note-taking application built for the modern web.

[English](#english) | [日本語](#japanese)

<a id="english"></a>

## English

**note-gae-jp** is a personal knowledge base system designed for speed, simplicity, and strict type safety. It combines a rich block-based Markdown editor with a local-first architecture, allowing for seamless writing even without an internet connection.

### Key Features

#### Advanced Markdown Editor

- **Block-Based Editing:** Built on Tiptap/Novel for a Notion-like writing experience.
- **Real-time Preview:** Instant rendering of GitHub Flavored Markdown.
- **Media Handling:** Drag-and-drop support for images and files with automatic blurhash generation for zero layout shift.
- **Concurrency Control:** Built-in locking mechanism (`PATCH /lock`) allows for safe editing sessions with keep-alive support.

#### Offline-First Architecture

- **Local Persistence:** All edits are saved immediately to IndexedDB.
- **Background Sync:** A Service Worker ensures that changes are synchronized with the backend once connectivity is restored.
- **Optimistic UI:** Interface updates instantly, regardless of network latency.

#### Secure & Private

- **Flexible Sharing:** Create public, private, or shared notes.
- **Time-Limited Access:** Generate shared links with expiration (1 day, 7 days, etc.) that automatically revoke access.
- **Strict Security:** Content Security Policy (CSP), HttpOnly cookies for session management, and server-side strict validation (Zod).

### Technical Architecture

This project adopts a **Monorepo** structure to ensure type safety across the full stack.

#### Structure

```
note-gae-jp/
├── packages/
│   ├── frontend/    # React 19, Vite, TanStack Router/Query
│   ├── backend/     # Hono (Node.js), Drizzle ORM, SQLite
│   └── shared/      # Zod Schemas & TypeScript Interfaces (Single Source of Truth)
├── data/            # SQLite Database (WAL mode)
└── uploads/         # Local file storage
```

#### Technology Stack

| Layer           | Technology                                                     |
| :-------------- | :------------------------------------------------------------- |
| **Frontend**    | React 19, TypeScript, **LiftKit** (Golden Ratio), Lucide React |
| **Backend**     | Hono (RPC), Node.js                                            |
| **Database**    | SQLite, Drizzle ORM                                            |
| **Type Safety** | Zod, Hono RPC (End-to-End Type Safety)                         |
| **Testing**     | Vitest, Playwright, MSW                                        |

### Getting Started

#### Prerequisites

- Node.js v20+
- pnpm v9+

#### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/note-gae-jp.git
    cd note-gae-jp
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Setup environment variables:
   Copy `.env.example` to `.env` in both `packages/backend` and `packages/frontend`.

    **packages/backend/.env**

    ```env
    DATABASE_URL=./data.db
    SESSION_SECRET=super_secret_key_change_me
    FRONTEND_URL=http://localhost:5173
    ```

4. Initialize the database:
    ```bash
    pnpm --filter @note-app/backend db:migrate
    pnpm --filter @note-app/backend db:seed
    ```

#### Development

Start the development servers for both frontend and backend:

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

#### Building for Production

```bash
pnpm build
pnpm start
```

### Documentation

Comprehensive documentation is available in the `docs/specs` directory.

- [**Architecture**](./docs/specs/architecture.md) - System design and monorepo structure.
- [**API Design**](./docs/specs/api-design.md) - API endpoints, Hono RPC, and error handling.
- [**Database**](./docs/specs/database-design.md) - Schema definitions and ER diagram.
- [**Frontend**](./docs/specs/frontend-design.md) - Component architecture and state management.
- [**Security**](./docs/specs/security.md) - Authentication, CSRF, and security policies.

---

<a id="japanese"></a>

## 日本語

**note-gae-jp** は、スピード、シンプルさ、そして厳格な型安全性を重視して設計された、個人のためのナレッジベースシステムです。NotionライクなリッチなMarkdownエディタと、「ローカルファースト」なアーキテクチャを組み合わせることで、オフライン環境でもストレスなく執筆を続けることができます。

### 主な機能

#### 高機能 Markdown エディタ

- **ブロックベース編集:** Tiptap/Novel をベースにした、直感的な執筆体験。
- **リアルタイムプレビュー:** GitHub Flavored Markdown を即座にレンダリング。
- **メディア管理:** 画像やファイルのドラッグ＆ドロップに対応。Blurhash の自動生成により、読み込み時のレイアウトズレ（CLS）を防止。
- **排他制御:** ロック機構（`PATCH /lock`）を内蔵し、編集の競合を防止（Keep-alive 対応）。

#### オフラインファースト

- **ローカル保存:** 全ての変更は即座に IndexedDB に保存。
- **バックグラウンド同期:** オンライン復帰時に Service Worker がバックグラウンドでサーバーと同期。
- **Optimistic UI:** ネットワーク遅延に関わらず、UI は即座に更新。

#### セキュア & プライベート

- **柔軟な共有:** メモごとに「公開」「非公開」「リンク共有」を設定可能。
- **期限付きアクセス:** 1日、7日などの期限付き共有リンクを発行。期限切れ後は自動的にアクセス無効化。
- **厳格なセキュリティ:** CSP、HttpOnly Cookie、Zod による厳重なバリデーションを採用。

### 技術アーキテクチャ

フルスタックでの型安全性を保証するため、**Monorepo** 構成を採用しています。

#### ディレクトリ構造

```
note-gae-jp/
├── packages/
│   ├── frontend/    # React 19, Vite, TanStack Router/Query
│   ├── backend/     # Hono (Node.js), Drizzle ORM, SQLite
│   └── shared/      # Zod Schemas & TypeScript Interfaces (Single Source of Truth)
├── data/            # SQLite Database (WAL mode)
└── uploads/         # Local file storage
```

#### 技術スタック

| レイヤー        | 技術                                                           |
| :-------------- | :------------------------------------------------------------- |
| **Frontend**    | React 19, TypeScript, **LiftKit** (Golden Ratio), Lucide React |
| **Backend**     | Hono (RPC), Node.js                                            |
| **Database**    | SQLite, Drizzle ORM                                            |
| **Type Safety** | Zod, Hono RPC (End-to-End Type Safety)                         |
| **Testing**     | Vitest, Playwright, MSW                                        |

### 始め方

#### 前提条件

- Node.js v20+
- pnpm v9+

#### インストール

1. リポジトリをクローン:

    ```bash
    git clone https://github.com/yourusername/note-gae-jp.git
    cd note-gae-jp
    ```

2. 依存関係をインストール:

    ```bash
    pnpm install
    ```

3. 環境変数の設定:
   `.env.example` を `packages/backend` と `packages/frontend` の両方で `.env` としてコピーし、設定してください。

    **packages/backend/.env**

    ```env
    DATABASE_URL=./data.db
    SESSION_SECRET=super_secret_key_change_me
    FRONTEND_URL=http://localhost:5173
    ```

4. データベースの初期化:
    ```bash
    pnpm --filter @note-app/backend db:migrate
    pnpm --filter @note-app/backend db:seed
    ```

#### 開発

フロントエンドとバックエンドの開発サーバーを同時起動します:

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

#### 本番ビルド

```bash
pnpm build
pnpm start
```

### ドキュメント

詳細な設計書は `docs/specs` ディレクトリに含まれています。

- [**アーキテクチャ**](./docs/specs/architecture.md) - システム設計と Monorepo 構成について。
- [**API 設計**](./docs/specs/api-design.md) - API エンドポイント、Hono RPC、エラーハンドリング。
- [**データベース**](./docs/specs/database-design.md) - スキーマ定義と ER 図。
- [**フロントエンド**](./docs/specs/frontend-design.md) - コンポーネント設計と状態管理。
- [**セキュリティ**](./docs/specs/security.md) - 認証、CSRF、セキュリティポリシー。

## License

MIT
