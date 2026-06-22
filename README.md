# 個人用メモ・日記アプリ

日常の気付きや技術的な学びを記録するための個人用メモ・日記Webアプリケーションです。
実務のベストプラクティス（徹底した型安全、第3正規形DB、環境別コンテナ運用、自動テスト）と、海外の最新SaaSに見られる極限まで洗練されたUI/UXデザインを融合させた、エンタープライズ品質のプロダクトとして設計されています。

---

## 1. プロジェクトの特長と最適化ポイント

* **極限の開発者体験と型安全**: フロントエンドからバックエンド、インフラに至るまで、静的解析と自動フォーマットを徹底。
* **エンタープライズ級のパフォーマンス**:
  * **バックエンド**: FastAPI + SQLAlchemy 2.0による**完全非同期(Async)アーキテクチャ**。
  * **データベース**: `pg_trgm` を用いたN-gramベースの**高速全文検索インデックス**。
  * **フロントエンド**: `TanStack Query` を用いた楽観的UI更新(Optimistic Updates)による遅延ゼロ体験。`next/dynamic` によるMonaco Editorの遅延読み込み(Lazy Loading)。
* **本番水準のインフラ構築**:
  * マルチステージビルドによる**100MB台の超軽量・非root実行コンテナ**。
  * DBの起動完了を待つ `healthcheck` を搭載した堅牢な `docker-compose` 構成。
* **CI/CD 完全自動化**: GitHub ActionsによるLint、型チェック、コンテナDBを用いた結合テストの**並列自動実行**。

---

## 2. 技術スタック

* **フロントエンド**
  * **Framework:** Next.js 15+ (TypeScript / App Router / Standalone Build)
  * **UI / State:** MUI (Material-UI) / React Hooks / TanStack Query
  * **Editor:** `@monaco-editor/react`, `react-markdown`, `remark-gfm`
  * **Quality:** pnpm / ESLint / Prettier / Vitest
* **バックエンド**
  * **Framework:** FastAPI (Python 3.14)
  * **ORM / DB:** SQLAlchemy 2.0 (Async) / PostgreSQL 18
  * **Quality:** uv / Ruff / ty / pytest
* **インフラ / DevOps**
  * **Container:** Docker / Docker Compose
  * **CI/CD:** GitHub Actions
---

## 3. システムアーキテクチャ（ディレクトリ構成）

フロントエンドとバックエンドを完全に分離したモノレポ構成を採用しています。

```text
my-diary-app/
├── backend/                  # FastAPI (Python 3.14)
│   ├── app/                  
│   │   ├── api/              # エンドポイント
│   │   ├── core/             # 設定(pydantic-settings)・例外処理
│   │   ├── crud/             # DB操作 (非同期CRUD)
│   │   ├── db/               # DB接続設定 (AsyncSession)
│   │   ├── models/           # DBモデル
│   │   └── schemas/          # Pydantic型定義
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
│   ├── __tests__/            # テストコード (Vitest)
│   ├── next.config.mjs       # バックエンドへのプロキシ・Standalone設定
│   ├── package.json          
│   └── Dockerfile            # マルチステージ・非root化
├── .github/workflows/        # CI/CD自動化 (GitHub Actions)
├── docker-compose.yml        # 開発用・DBヘルスチェック構成
└── .gitignore                # プロジェクト全体のGit管理ルール
```

---

## 4. API設計（RESTful API）

フロントエンド（Next.js Rewrites）からプロキシ経由でアクセスされるバックエンドAPIのエンドポイント一覧です。

| メソッド | エンドポイント | 説明 | 認証 |
| --- | --- | --- | --- |
| **POST** | `/api/v1/auth/register` | 新規ユーザー登録 | 不要 |
| **POST** | `/api/v1/auth/token` | ログイン（JWT発行） | 不要 |
| **GET** | `/api/v1/entries` | 日記一覧取得（カーソルベースPaging・全文検索対応） | 必要 |
| **POST** | `/api/v1/entries` | 新規日記作成 | 必要 |
| **GET** | `/api/v1/entries/{id}` | 特定日記の単一取得 | 必要 |
| **PUT** | `/api/v1/entries/{id}` | 特定日記の更新 | 必要 |
| **DELETE** | `/api/v1/entries/{id}` | 特定日記の削除（論理削除） | 必要 |
| **GET** | `/api/v1/tags` | 登録済みタグ一覧取得 | 必要 |
| **POST** | `/api/v1/tags` | 新規タグ作成 | 必要 |

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

## 7. データベース設計（PostgreSQL 18 DDL）

サロゲートキー、論理削除、自動タイムスタンプ更新に加え、高速全文検索（pg_trgm）を備えたエンタープライズ対応のテーブル定義。

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) NOT NULL DEFAULT '名無しユーザー',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_account_modtime BEFORE UPDATE ON account FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE entry (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_entry_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);
CREATE INDEX idx_entry_account_id ON entry(account_id);
-- 全文検索用 GIN インデックス
CREATE INDEX idx_entry_content_trgm ON entry USING gin (content gin_trgm_ops);
CREATE TRIGGER update_entry_modtime BEFORE UPDATE ON entry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE tag (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    color_code VARCHAR(7) NOT NULL DEFAULT '#808080',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tag_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT uq_account_tag_name UNIQUE (account_id, name)
);

CREATE TABLE entry_tag (
    entry_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (entry_id, tag_id),
    CONSTRAINT fk_entry_tag_entry BEFORE KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_tag_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);
```

---

## 8. インフラ・コンテナ最適化設計

セキュリティ（非root化）とパフォーマンス（マルチステージビルド）を極限まで高めた本番運用レベルのDocker構成。

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
RUN uv venv /opt/venv && uv pip install --python /opt/venv fastapi uvicorn sqlalchemy psycopg2-binary asyncpg alembic pydantic-settings ruff ty pytest httpx

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

DBの起動完了を `pg_isready` で監視し、バックエンドの起動エラーを防ぐ堅牢な構成。

```yaml
services:
  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
    depends_on:
      db:
        condition: service_healthy
  frontend:
    build: ./frontend
    depends_on:
      - backend
```

---

## 9. CI/CD 完全自動化パイプライン (GitHub Actions)

コードのプッシュ時に、フロントエンドとバックエンドの静的解析・ビルド・結合テストを**並列**で自動実行。

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
    env:
      DATABASE_URL: postgresql+asyncpg://test_user:test_password@localhost:5432/test_db
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - uses: actions/setup-python@v5
        with: { python-version: '3.14' }
      - run: uv pip install --system fastapi uvicorn sqlalchemy psycopg2-binary asyncpg alembic pydantic-settings ruff ty pytest httpx
      - run: uv run ruff format --check . && uv run ruff check . && uv run ty . && uv run pytest
```

---

## 10. アプリケーション詳細設計（関数・型ブループリント）

### 10-1. フロントエンド (TypeScript / Next.js 15+)

* **型定義:** `EntryStatus`, `Entry`, `Account`, `Tag` などの厳密なインターフェースを定義。
* **カスタムフック:**
   * `useAuth()`: 認証状態とJWTトークンの管理。
   * `useEntries(cursor, limit)`: TanStack Queryを用いた無限スクロールと楽観的更新対応データフェッチ。
   * `useEntryDetail(id)`: 単一メモの取得・更新・削除処理。



### 10-2. バックエンド (Python 3.14 / FastAPI - 非同期 Async 構成)

* **Pydantic スキーマ:** `AccountCreate`, `EntryCreate`, `Token` 等による入出力の厳格なバリデーション。
* **非同期 CRUD 操作:**
   * `async def get_multi(db: AsyncSession, account_id: UUID, cursor: Optional[int] = None, limit: int = 50) -> List[Entry]`
* **非同期 API ルーター:**
   * `@router.get("/") async def read_entries(...) -> List[EntryResponse]`
   * `@router.post("/") async def create_new_entry(...) -> EntryResponse`

---

## 11. Git 管理ルール (`.gitignore`)

```text
# 環境変数・シークレット
.env
.env.*
!.env.example

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
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
frontend/coverage/

# バックエンド (Python 3.14 / FastAPI / uv)
backend/.venv/
backend/venv/
backend/env/
__pycache__/
*.py[cod]
*$py.class
*.so
backend/.pytest_cache/
backend/.coverage
backend/htmlcov/
backend/.ruff_cache/
backend/.mypy_cache/
backend/.ty_cache/

# インフラ・データベース (Docker)
postgres_data/
pgdata/
db_data/

# OS / エディタ共通
.DS_Store
.AppleDouble
.LSOverride
Thumbs.db
ehthumbs.db
Desktop.ini
.idea/
*.swp
*.swo
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
```

---

## 12. 開発ガイド (Getting Started)

### 12-1. ローカル環境のセットアップ

1. **リポジトリのクローン**
```bash
git clone [https://github.com/your-username/my-diary-app.git](https://github.com/your-username/my-diary-app.git)
cd my-diary-app
```

2. **環境変数の設定**
```bash
cp .env.example .env.dev
# .env.dev にデータベースのパスワードやJWTシークレットキーを設定
```

3. **Dockerコンテナのビルドと起動**
```bash
docker compose up -d --build
```

4. **動作確認**
* フロントエンド: `http://localhost:3000`
* バックエンド API: `http://localhost:8000`

### 12-2. データベースマイグレーション運用 (Alembic)

テーブル定義を変更した際は、以下のコマンドでスキーマを同期します。

```bash
# マイグレーションファイルの自動生成
docker compose exec backend alembic revision --autogenerate -m "add_xxx_table"

# データベースへの反映
docker compose exec backend alembic upgrade head
```

### 12-3. APIドキュメント (Swagger UI)

FastAPIによって自動生成されるインタラクティブなAPI仕様書です。

* **Swagger UI (テスト実行可能):** `http://localhost:8000/docs`
* **ReDoc (仕様確認用):** `http://localhost:8000/redoc`
