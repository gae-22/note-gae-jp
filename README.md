# 個人用メモ・日記アプリ (note-gae-jp)

日常の気付きや技術的な学びを記録するための個人用メモ・日記Webアプリケーションです。
実務のベストプラクティス（徹底した型安全、第3正規形DB、環境別コンテナ運用、自動テスト、オブザーバビリティ）と、海外の最新SaaSに見られる極限まで洗練されたUI/UXデザインを融合させた、エンタープライズ品質のプロダクトとして設計されています。

---

## 1. プロジェクトの特長と最適化ポイント

* **極限の開発者体験と型安全**: フロントエンドからバックエンド、インフラに至るまで、静的解析、自動フォーマット、型推論を徹底。
* **エンタープライズ級のパフォーマンスとデータ保護**:
  * **バックエンド**: FastAPI + SQLAlchemy 2.0による**完全非同期(Async)アーキテクチャ**。さらに、`structlog`による構造化ログとRequest IDトラッキングを搭載。
  * **データベース**: PostgreSQL 18 の**行レベルセキュリティ (RLS: Row Level Security)** を有効化。アプリ層のバグによるデータ漏洩をDBレイヤーで物理的にシャットアウト。
  * **高速日本語検索**: `pg_bigm` (2-gram) を用いた高速な日本語全文検索インデックス。
  * **フロントエンド**: `TanStack Query` を用いた楽観的UI更新(Optimistic Updates)による遅延ゼロ体験。`next/dynamic` によるMonaco Editorの遅延読み込み(Lazy Loading)。
* **本番水準のインフラとセキュリティ**:
  * Docker Composeにおける **Docker Secrets** を活用した、環境変数に依存しない安全なシークレット情報のマウント。
  * セッション・JWTブラックリスト管理用に高速な **Redis** コンテナを統合。
  * マルチステージビルドによる**100MB台の超軽量・非root実行コンテナ**。
* **CI/CD & テスト完全自動化**: GitHub ActionsによるLint、型チェックに加え、PlaywrightによるE2EテストおよびコンテナDBを用いた結合テストの並列自動実行。

---

## 2. 技術スタック

* **フロントエンド**
  * **Framework:** Next.js 15+ (TypeScript 5+ / App Router / Standalone Build)
  * **UI / State:** MUI (Material-UI) / React Hooks / TanStack Query v5
  * **Editor:** `@monaco-editor/react`, `react-markdown`, `remark-gfm`
  * **Quality / Testing:** pnpm / ESLint / Prettier / Playwright (E2E) / Vitest
* **バックエンド**
  * **Framework:** FastAPI (Python 3.14)
  * **Cache / Session:** Redis 7-alpine (JWT無効化・セッションストア)
  * **ORM / DB:** SQLAlchemy 2.0 (Async) / PostgreSQL 18
  * **Quality / Logging:** uv / Ruff / ty / pytest / structlog
* **インフラ / DevOps**
  * **Container:** Docker / Docker Compose (Docker Secrets対応)
  * **CI/CD:** GitHub Actions (Lint, Test, Build, E2E)

---

## 3. システムアーキテクチャ（ディレクトリ構成）

フロントエンドとバックエンドを完全に分離したモノレポ構成を採用しています。

```text
note-gae-jp/
├── backend/                  # FastAPI (Python 3.14)
│   ├── app/                  
│   │   ├── api/              # エンドポイント
│   │   │   ├── v1/
│   │   │   │   ├── auth.py   # 認証関連（JWT、ログアウト対応）
│   │   │   │   ├── entries.py# エントリー（CRUD、エクスポート対応）
│   │   │   │   ├── tags.py   # タグ管理
│   │   │   │   └── admin.py  # 管理者用API（監査ログ生成）
│   │   ├── core/             # 設定・共通例外ハンドラ・structlog設定
│   │   ├── crud/             # DB操作 (非同期CRUD)
│   │   ├── db/               # DB接続設定 (AsyncSession, Redisクライアント)
│   │   ├── models/           # DBモデル (SQLAlchemy 2.0 / Mapped)
│   │   └── schemas/          # Pydantic型定義 (V2)
│   ├── tests/                # テストコード (pytest)
│   ├── pyproject.toml        # uv, ruff, ty 設定
│   └── Dockerfile            # マルチステージ・非root化
├── frontend/                 # Next.js 15+ (TypeScript)
│   ├── src/                  
│   │   ├── app/              # ルーティング (App Router)
│   │   ├── components/       # UIパーツ (elements, layouts, features)
│   │   ├── hooks/            # カスタムフック (useAuth, useEntries)
│   │   ├── lib/              # APIクライアント, theme.ts
│   │   └── types/            # 型定義
│   ├── __tests__/            # 単体テスト (Vitest)
│   ├── e2e/                  # E2Eテスト (Playwright)
│   ├── next.config.mjs       # バックエンドへのプロキシ・Standalone設定
│   ├── package.json          
│   └── Dockerfile            # マルチステージ・非root化
├── .github/workflows/        
│   └── ci.yml                # CI/CD自動化 (GitHub Actions + Playwright)
├── secrets/                  # ローカル開発用シークレットマウントディレクトリ
│   ├── db_password.txt
│   └── jwt_secret.txt
├── docker-compose.yml        # 開発用・DBヘルスチェック・Redis連携・Secrets構成
└── .gitignore                # プロジェクト全体のGit管理ルール
```

---

## 4. API設計（RESTful API）

フロントエンド（Next.js Rewrites）からプロキシ経由でアクセスされるバックエンドAPIのエンドポイント一覧です。

| メソッド | エンドポイント | 説明 | 認証 | ログ出力 |
| --- | --- | --- | --- | --- |
| **POST** | `/api/v1/auth/register` | 新規ユーザー登録 | 不要 | 構造化ログ |
| **POST** | `/api/v1/auth/token` | ログイン（JWT・リフレッシュトークン発行） | 不要 | 構造化ログ |
| **POST** | `/api/v1/auth/logout` | ログアウト（トークンをRedisブラックリストへ登録） | 必要 | 構造化ログ |
| **GET** | `/api/v1/entries` | 日記一覧取得（カーソルベースPaging・全文検索対応） | 必要 | なし |
| **POST** | `/api/v1/entries` | 新規日記作成 | 必要 | 構造化ログ |
| **GET** | `/api/v1/entries/{id}` | 特定日記の単一取得 | 必要 | なし |
| **PUT** | `/api/v1/entries/{id}` | 特定日記の更新 | 必要 | 構造化ログ |
| **DELETE** | `/api/v1/entries/{id}` | 特定日記の削除（論理削除） | 必要 | 構造化ログ |
| **GET** | `/api/v1/entries/export` | ユーザーの全日記データの一括エクスポート (Markdown/JSON) | 必要 | 構造化ログ |
| **GET** | `/api/v1/tags` | 登録済みタグ一覧取得 | 必要 | なし |
| **POST** | `/api/v1/tags` | 新規タグ作成 | 必要 | 構造化ログ |
| **GET** | `/api/v1/admin/accounts` | 【管理者】全ユーザー一覧取得 | 管理者 | 監査ログ記録 |
| **PUT** | `/api/v1/admin/accounts/{id}` | 【管理者】ユーザー情報の更新（論理削除・復活含む） | 管理者 | 監査ログ記録 |

---

## 5. UI/UX デザイン設計「Digital Zen」

**コンセプト：「Mathematical Harmony & Micro-details（数学的調和と極限のディテール）」**
黄金比（1.618）に基づいたプロポーションと、触れた瞬間の滑らかなアニメーションで上質な操作感を演出。MUIのデフォルトの影や波紋エフェクトを排除し、極薄のシャドウと繊細な境界線で構成しています。

### MUI テーマ設定 (`frontend/src/lib/theme.ts` 抜粋)

```typescript
'use client';
import { createTheme } from '@mui/material/styles';

const GOLDEN_RATIO = 1.618;
const EASE_OUT_SMOOTH = 'cubic-bezier(0.25, 1, 0.5, 1)';

export const theme = createTheme({
  palette: {
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    primary: { main: '#111111', light: '#333333' },
    text: { primary: '#1A1A1A', secondary: '#737373' },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", sans-serif',
    h1: { fontSize: `${1 * Math.pow(GOLDEN_RATIO, 3)}rem`, fontWeight: 700, letterSpacing: '-0.04em' },
    h2: { fontSize: `${1 * Math.pow(GOLDEN_RATIO, 2)}rem`, fontWeight: 700, letterSpacing: '-0.03em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          transition: `all 0.4s ${EASE_OUT_SMOOTH}`,
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
        },
      },
    },
  },
});
```

---

## 6. Markdown 執筆環境（エディタ＆プレビュー）

VS Codeと同じエンジンである **Monaco Editor** を統合し、リアルタイムレンダリングと2画面スプリットレイアウトを備えたプロフェッショナル向け執筆環境。

* **Markdownエディタ (`MarkdownEditor.tsx`):** `next/dynamic` で遅延読み込み。ミニマップ・行番号を非表示にし、Digital Zenテーマに合わせたカスタム配色を適用。
* **Markdownレンダラー (`MarkdownRenderer.tsx`):** `react-markdown` + `remark-gfm` + `rehype-highlight` + `rehype-sanitize`。テーブル、タスクリスト、安全なコードハイライトに完全対応。
* **レスポンシブフォーム (`EntryForm.tsx`):** PC表示時は左右分割、スマホ表示時は縦並びに最適化。

---

## 7. データベース設計（PostgreSQL 18 DDL / RLS対応）

サロゲートキー、論理削除、自動タイムスタンプ更新、高速日本語全文検索（`pg_bigm`）、さらに安全性を究極まで高めた**行レベルセキュリティ (RLS)** を完全に組み込んだ実務水準のテーブル定義。

```sql
-- ==============================================================================
-- 1. EXTENSIONS & SETTINGS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_bigm";

-- ステータス ENUM 型
CREATE TYPE entry_status_type AS ENUM ('draft', 'published', 'archived');

-- ==============================================================================
-- 2. UTILITIES
-- ==============================================================================
-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION fn_update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES
-- ==============================================================================

-- ACCOUNTS: ユーザー管理
CREATE TABLE accounts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT '名無し',
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMPTZ,

    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
COMMENT ON TABLE accounts IS 'ユーザーアカウント情報';
COMMENT ON COLUMN accounts.email IS 'メールアドレス（ユニーク）';

CREATE TRIGGER trg_accounts_updated_at 
BEFORE UPDATE ON accounts 
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ENTRIES: 日記エントリー
CREATE TABLE entries (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    status     entry_status_type NOT NULL DEFAULT 'draft',
    is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_entries_account 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
COMMENT ON TABLE entries IS 'ユーザーの日記エントリー';
COMMENT ON COLUMN entries.status IS 'draft/published/archived';

-- 日本語全文検索インデックス
CREATE INDEX idx_entries_content_bigm 
    ON entries USING gin (content gin_bigm_ops);

-- アクティブなエントリーの高速取得
CREATE INDEX idx_entries_active 
    ON entries(account_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_entries_updated_at 
BEFORE UPDATE ON entries 
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- TAGS: タグ定義
CREATE TABLE tags (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    name       TEXT NOT NULL,
    color_code TEXT NOT NULL DEFAULT '#808080',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tags_account 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT uq_account_tag_name UNIQUE (account_id, name)
);
COMMENT ON TABLE tags IS 'ユーザーごとのタグ定義';

-- 大文字小文字を無視した検索用
CREATE INDEX idx_tags_name_lower ON tags (LOWER(name));


-- ENTRY_TAGS: 多対多リレーション
CREATE TABLE entry_tags (
    entry_id BIGINT NOT NULL,
    tag_id   BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_entry_tags PRIMARY KEY (entry_id, tag_id),
    CONSTRAINT fk_et_entry FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_et_tag   FOREIGN KEY (tag_id)   REFERENCES tags(id)   ON DELETE CASCADE
);
CREATE INDEX idx_entry_tags_tag_id ON entry_tags(tag_id);


-- AUDIT_LOGS: 管理操作ログ
CREATE TABLE audit_logs (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id          UUID,
    target_account_id UUID NOT NULL,
    action            TEXT NOT NULL,
    details           JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_admin  
        FOREIGN KEY (admin_id) REFERENCES accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_target 
        FOREIGN KEY (target_account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_account_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

-- ACCOUNTS: 自分自身 or 管理者のみ
CREATE POLICY account_isolation_policy ON accounts
    USING (
        id = current_setting('app.current_account_id', true)::UUID
        OR is_admin = true
    )
    WITH CHECK (
        id = current_setting('app.current_account_id', true)::UUID
        OR is_admin = true
    );

-- ENTRIES: 自分のエントリーのみ
CREATE POLICY entry_isolation_policy ON entries
    USING (account_id = current_setting('app.current_account_id', true)::UUID)
    WITH CHECK (account_id = current_setting('app.current_account_id', true)::UUID);

-- TAGS: 自分のタグのみ
CREATE POLICY tag_isolation_policy ON tags
    USING (account_id = current_setting('app.current_account_id', true)::UUID)
    WITH CHECK (account_id = current_setting('app.current_account_id', true)::UUID);

-- ENTRY_TAGS: 自分の entries に紐づくもののみ
CREATE POLICY entry_tags_isolation_policy ON entry_tags
    USING (
        EXISTS (
            SELECT 1 FROM entries 
            WHERE entries.id = entry_tags.entry_id
              AND entries.account_id = current_setting('app.current_account_id', true)::UUID
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM entries 
            WHERE entries.id = entry_tags.entry_id
              AND entries.account_id = current_setting('app.current_account_id', true)::UUID
        )
    );
```

```mermaid
erDiagram
    %% ============================
    %% Relationships
    %% ============================
    ACCOUNTS ||--o{ ENTRIES : "owns"
    ACCOUNTS ||--o{ TAGS : "owns"
    ACCOUNTS ||--o{ AUDIT_LOGS : "admin (nullable)"
    ACCOUNTS ||--o{ AUDIT_LOGS : "target"

    ENTRIES ||--o{ ENTRY_TAGS : "tagged"
    TAGS ||--o{ ENTRY_TAGS : "tagged"

    %% ============================
    %% Entities
    %% ============================
    ACCOUNTS {
        uuid id PK
        text email
        text password_hash
        text display_name
        boolean is_admin
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at "論理削除"
    }

    ENTRIES {
        bigint id PK
        uuid account_id FK
        text title
        text content
        entry_status_type status
        boolean is_pinned
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    TAGS {
        bigint id PK
        uuid account_id FK
        text name
        text color_code
        timestamptz created_at
    }

    ENTRY_TAGS {
        bigint entry_id PK, FK
        bigint tag_id PK, FK
        timestamptz created_at
    }

    AUDIT_LOGS {
        bigint id PK
        uuid admin_id FK "NULL 許可 / ON DELETE SET NULL"
        uuid target_account_id FK
        text action
        jsonb details
        timestamptz created_at
    }
```

---

## 8. インフラ・コンテナ最適化設計

セキュリティ（Docker Secretsの活用・非root化）とパフォーマンス（Redisの統合、マルチステージビルド）を追求したプロダクション仕様の環境設計です。

### 8-1. フロントエンド (`frontend/Dockerfile`)

```dockerfile
# 1. Depsステージ (依存関係のインストール)
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 2. Builderステージ (Standalone build)
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 3. Runnerステージ (実行用軽量イメージ)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 8-2. バックエンド (`backend/Dockerfile`)

```dockerfile
# 1. Builderステージ (uv venv)
FROM python:3.14-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
RUN uv venv /opt/venv && uv pip install --python /opt/venv fastapi uvicorn sqlalchemy psycopg2-binary asyncpg alembic pydantic-settings ruff ty pytest httpx redis structlog

# 2. Runnerステージ (実行用軽量イメージ)
FROM python:3.14-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN useradd -m -s /bin/bash appuser && chown -R appuser:appuser /app
USER appuser
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8-3. Docker Compose (`docker-compose.yml`)

```yaml
version: "3.8"

services:
  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: ${DB_NAME:-digital_zen_db}
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-digital_zen_db}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass_file /run/secrets/redis_password
    secrets:
      - redis_password
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://${DB_USER:-postgres}@db:5432/${DB_NAME:-digital_zen_db}
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD_FILE=/run/secrets/redis_password
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
    secrets:
      - db_password
      - redis_password
      - jwt_secret
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

secrets:
  db_password:
    file: ./secrets/db_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

volumes:
  postgres_data:
  redis_data:
```

---

## 9. CI/CD 完全自動化パイプライン (GitHub Actions)

**`.github/workflows/ci.yml`**

```yaml
name: CI Pipeline
on: [push, pull_request]

jobs:
  frontend-ci:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: ./frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: corepack enable pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm test && pnpm build
      - name: Install Playwright Browsers
        run: pnpm playwright install --with-deps
      - name: Run E2E Tests
        run: pnpm playwright test

  backend-ci:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: ./backend } }
    services:
      postgres:
        image: postgres:18-alpine
        env: { POSTGRES_USER: test_user, POSTGRES_PASSWORD: test_password, POSTGRES_DB: test_db }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    env:
      DATABASE_URL: postgresql+asyncpg://test_user:test_password@localhost:5432/test_db
      REDIS_HOST: localhost
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - uses: actions/setup-python@v5
        with: { python-version: '3.14' }
      - run: uv pip install --system fastapi uvicorn sqlalchemy psycopg2-binary asyncpg alembic pydantic-settings ruff ty pytest httpx redis structlog
      - run: uv run ruff format --check . && uv run ruff check . && uv run ty . && uv run pytest
```

---

## 10. アプリケーション詳細設計

### 10-1. フロントエンド (TypeScript / Next.js 15+)

* **型定義:** `EntryStatus`, `Entry`, `Account`, `Tag` などの厳密なインターフェースを定義。
* **カスタムフック:**
* `useAuth()`: 認証状態、JWTおよびRedisと連動するセッション無効化(ログアウト)処理。
* `useEntries(cursor, limit)`: TanStack Queryを用いた無限スクロールと楽観的更新対応データフェッチ。
* `useEntryDetail(id)`: 単一メモの取得・更新・削除処理。

### 10-2. バックエンド (Python 3.14 / FastAPI - 非同期 Async 構成 & 構造化ロギング)

```python
import structlog
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
```

---

## 11. Git 管理ルール (`.gitignore`)

```text
# 環境変数・シークレット
.env
.env.*
!.env.example
secrets/*.txt

# フロントエンド (Next.js 15+ / pnpm)
node_modules/
frontend/node_modules/
.pnp
.pnp.js
frontend/.next/
frontend/out/
frontend/build/
frontend/.swc/
npm-debug.log*
pnpm-debug.log*
frontend/coverage/
frontend/playwright-report/

# バックエンド (Python 3.14 / FastAPI / uv)
backend/.venv/
backend/venv/
backend/env/
__pycache__/
*.py[cod]
backend/.pytest_cache/
backend/.coverage
backend/.ruff_cache/
backend/.ty_cache/

# インフラ・データベース (Docker)
postgres_data/
redis_data/

# OS / エディタ共通
.DS_Store
Thumbs.db
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
```

---

## 12. 開発ガイド (Getting Started)

### 12-1. ローカル環境のセットアップ

1. **リポジトリのクローン**

```bash
git clone https://github.com/gae-22/note-gae-jp.git
cd note-gae-jp
```

2. **シークレットファイルの作成 (Docker Secrets用)**

```bash
mkdir -p secrets
echo "my_super_secure_db_password" > secrets/db_password.txt
echo "my_secure_redis_password" > secrets/redis_password.txt
echo "my_jwt_session_secret_key" > secrets/jwt_secret.txt
```

3. **Dockerコンテナのビルドと起動**

```bash
docker compose up -d --build
```

### 12-2. データベースマイグレーション運用 (Alembic)

```bash
# マイグレーションファイルの自動生成
docker compose exec backend alembic revision --autogenerate -m "add_xxx_table"

# データベースへの反映
docker compose exec backend alembic upgrade head
```

### 12-3. APIドキュメント (Swagger UI)

* **Swagger UI (テスト実行可能):** `http://localhost:8000/docs`
* **ReDoc (仕様確認用):** `http://localhost:8000/redoc`
