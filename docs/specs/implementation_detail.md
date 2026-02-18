# 実装詳細ガイド (Implementation Guide Index)

概要: 実装の順序、初期セットアップ、環境変数、シード手順、CIサンプルなど、実際にコードを動かしデプロイするためのハンドブックです。各専門設計書を参照するためのナビゲーション役も兼ねます。

推奨読者: 実装担当者、DevOps/CI担当、ローカルセットアップを行う開発者。

重要ポイント:

- まずは `database-design.md` → `api-design.md` → `frontend-design.md` の順で実装するワークフローを推奨。
- 環境変数の必須項目は起動時に検証し、欠如時はエラーで起動を中止すること。
- CI はビルド・テスト・Lint を必須化し、脆弱性チェックを組み込む。

## 1. 参照すべきドキュメント

実装を行う際は、以下の順序でドキュメントを参照することを強く推奨します。

### Step 1: データベース構築

**[データベース設計書 (Database Design)](./database-design.md)**

- **内容:** テーブル定義 (Drizzle Schema)、インデックス、リレーション、マイグレーション手順
- **実装対象:** `packages/backend/src/db/schema.ts` 等

### Step 2: バックエンド実装

**[API設計書 (API Design)](./api-design.md)**

- **内容:** APIエンドポイント定義 (Hono)、バリデーション (Zod)、サービス層のビジネスロジック詳細
- **実装対象:** `packages/backend/src/routes/*.ts`, `packages/backend/src/services/*.ts`

### Step 3: フロントエンド実装

**[フロントエンド設計書 (Frontend Design)](./frontend-design.md)**

- **内容:** ディレクトリ構成、コンポーネント設計 (Props定義)、カスタムフック実装ロジック、状態管理
- **実装対象:** `packages/frontend/src/**`

---

## 4. `packages/shared` の型共有・ビルド戦略（推奨）

Monorepo で Zod スキーマや Type を安全に共有するための実践的な方針を示します。`packages/shared` は型とバリデーションの唯一の信頼できる情報源（source of truth）にします。

### 4.1 目的

- フロントエンドとバックエンドで型を一致させる。
- 日付（`Date`）や `z.date()` と JSON のシリアライズ差（string <-> Date）による実行時エラーを回避する。

### 4.2 基本ルール

1. **Zod を中心に定義する**: すべての API 入出力型は `Zod` スキーマを `packages/shared` に置き、`export` する（例: `createNoteSchema`, `noteResponseSchema`）。
2. **スキーマは入力（raw JSON）と内部表現（runtime）を分ける**:
    - `Api` 向けスキーマ (受信/送信 JSON): 日付は `z.string().datetime()` を使うか、`z.preprocess` で受け入れる形にする。例: `noteResponseApiSchema`。
    - `Domain`/Server 内部スキーマ: `z.date()` を使う（DB やサービス層での利用）。例: `noteResponseDomainSchema`。
3. **シリアライザ/パーサを用意する**: `shared` に `toApi()` / `fromApi()` ヘルパーを置き、`Date` の変換を一箇所で行う。

### 4.3 具体例（パターン）

```typescript
// packages/shared/src/schemas/notes.ts
import { z } from 'zod';

export const noteResponseDomainSchema = z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.date(),
});

// API 表現: ISO-8601 strings
export const noteResponseApiSchema = z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string().datetime(),
});

export type NoteDomain = z.infer<typeof noteResponseDomainSchema>;
export type NoteApi = z.infer<typeof noteResponseApiSchema>;

export const toApi = (d: NoteDomain): NoteApi => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
});

export const fromApi = (a: NoteApi): NoteDomain => ({
    ...a,
    createdAt: new Date(a.createdAt),
});
```

### 4.4 ビルド / エクスポート

- `packages/shared` は `tsup` や `tsc` を使って `dist/` を吐き、`package.json` の `exports` と `types` を設定してください。開発時は `pnpm -w` のワークスペース参照で TypeScript の型をそのまま参照できますが、CI/Production 用にビルド出力を用意することで取り込みのブレを減らせます。
- 例 `package.json` の重要スクリプト:
    - `build`: `tsup src/index.ts --format cjs,esm --dts`
    - `dev`: `pnpm -w --filter backend dev` 等でワークスペースを利用

### 4.5 開発フロー推奨

1. `shared` に Zod スキーマを作る。2. バックエンドは `fromApi()` を使って受信データを内部表現（Date）に変換して処理。3. バックエンドのレスポンスは `toApi()` を用いて JSON シリアライズして返却。4. フロントエンドは受信 JSON を `shared` の `noteResponseApiSchema.parse()` でバリデートし、必要ならパーサで Domain に変換する。

この設計により「Zod を single source of truth」としつつ、Date の扱いに起因する実行時エラーを防ぎます。

## 2. 実装の進め方 (Workflow)

矛盾のない実装を行うための推奨フロー:

1. **DBスキーマ作成:** `database-design.md` に従い、`schema.ts` を記述し `db:migrate` する。
    - 既存データ移行: 既存プロジェクトがある場合は `notes.content` から `content_blocks` と `content_markdown` へ変換するマイグレーションを用意すること（自動変換が困難な場合は手動レビューフラグを併用）。
    - 併せて排他ロック用のテーブル（`note_locks` など）を追加し、`LOCK_TTL_SECONDS` に従うクリーンアップジョブを設計してください。
2. **バリデーション定義:** `api-design.md` の Zod Schema を `packages/backend(or shared)/src/validators` に実装する。
3. **バックエンドロジック:** `api-design.md` の Service Logic に従い、各機能を実装する。
4. **APIルート定義:** 実装した Service を Hono ルートに接続する。
5. **フロントエンド連携:** `frontend-design.md` に従い、API Client (`hono/client`) を用いたフックとコンポーネントを実装する。

---

## 3. 環境変数

バックエンドで使用する環境変数。`packages/backend/src/utils/env.ts` 等で検証・読み込みする。

| 変数名             | 必須       | デフォルト              | 説明                                                                 |
| ------------------ | ---------- | ----------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`         | Yes        | -                       | `development` / `production`                                         |
| `SESSION_SECRET`   | Yes        | -                       | セッション暗号化用。32文字以上のランダム文字列を推奨                 |
| `DATABASE_PATH`    | No         | `data/data.db`          | SQLite データベースファイルのパス                                    |
| `UPLOADS_DIR`      | No         | `uploads/`              | アップロードファイルの保存先                                         |
| `FRONTEND_URL`     | Yes (本番) | `http://localhost:5173` | CSRF 検証用のフロントエンドオリジン                                  |
| `LOCK_TTL_SECONDS` | No         | `300`                   | エディタ排他ロックの TTL（秒）。クライアントは定期リフレッシュを行う |
| `ORPHAN_TTL_DAYS`  | No         | `7`                     | 孤立アップロードファイルの GC 保持日数（デフォルト: 7 日）           |

**セキュアな初期セットアップ:**

- 初回起動時に `SESSION_SECRET` が未設定の場合は起動を拒否する。
- 本番環境では `FRONTEND_URL` を実際のドメインに設定する。

---

## 4. 初期セットアップ (Seed)

初回セットアップ時の手順。

1. **マイグレーション実行:** `pnpm --filter backend db:migrate`
2. **管理者ユーザー作成:** `pnpm --filter backend db:seed`
    - 初回のみ、`users` テーブルに管理者レコードを INSERT
    - ユーザー名・パスワードは環境変数または対話式で入力（平文パスワードは Argon2id でハッシュ化して保存）

---

## 6. 追加: 環境変数の詳細と CI サンプル

### 6.1 環境変数（詳細）

| 変数名            | 必須       | 説明                                | 例                           |
| ----------------- | ---------- | ----------------------------------- | ---------------------------- |
| NODE_ENV          | Yes        | 環境                                | `production`                 |
| SESSION_SECRET    | Yes        | セッション署名用（32文字以上）      | `r4nd0m-secret-...`          |
| DATABASE_PATH     | No         | SQLite ファイルのパス               | `data/data.db`               |
| UPLOADS_DIR       | No         | アップロードディレクトリ            | `uploads/`                   |
| FRONTEND_URL      | Yes (本番) | フロントエンドのオリジン（CSRF 用） | `https://example.com`        |
| SENTRY_DSN        | No         | Sentry の DSN                       | `https://xxxx@sentry.io/123` |
| PROMETHEUS_ENABLE | No         | メトリクス有効化フラグ              | `true`                       |

### 6.2 GitHub Actions: 簡易 CI ワークフロー

保存先: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
    build-test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: pnpm/action-setup@v2
                with:
                    version: 8
            - run: pnpm install
            - run: pnpm --filter frontend build
            - run: pnpm --filter backend build
            - run: pnpm -w test
            - run: pnpm -w lint
```

### 6.5 OpenAPI 自動生成（Zod → OpenAPI）

型安全な API ドキュメントのために、Zod スキーマから OpenAPI を自動生成することを推奨します。例として `zod-to-openapi` / `zod-to-json-schema` 経由で `openapi.yaml` を出力するワークフローを CI に追加してください。簡単なスクリプト例:

```json
// package.json scripts
"scripts": {
    "gen:openapi": "node ./scripts/gen-openapi.js"
}
```

GitHub Actions スニペット:

```yaml
- name: Generate OpenAPI
    run: pnpm gen:openapi
```

`gen-openapi.js` では `packages/shared` の Zod スキーマを読み、OpenAPI を生成して `docs/openapi.yaml` に出力します。CI で差分をチェックし、必要に応じてアーティファクトとして保存してください。

### 6.6 Resumable / Large File Uploads

大きなファイルや不安定な回線に対しては resumable upload（例: TUS プロトコル）を検討してください。最小実装でも以下を文書化しておくと安定します:

- クライアント側: アップロード中に `Idempotency-Key` を付与し、失敗時はキーを使ってリトライ。
- サーバ側: 小さなチャンク／Range を受け付けるか、TUS サーバライブラリを導入する（Node では `tus-node-server` 等）。
- CI/運用: 大容量アップロードは専用の一時領域（別ボリューム）に保存し、完了後に最終保存ディレクトリへ移動するワークフローを推奨。

簡易案: まずは `Idempotency-Key` とチャンクサイズ（例: 5MB）で再試行をサポートし、必要に応じて TUS に移行してください。

### 6.3 Seed / Dev helper commands

- DB マイグレーション生成: `pnpm --filter backend db:generate`
- DB マイグレーション適用: `pnpm --filter backend db:migrate`
- シード投入（対話式）: `pnpm --filter backend db:seed`

---

## 5. テスト戦略

### 5.1 テストフレームワーク

- **単体・統合:** Vitest
- **E2E:** Playwright

小さな実装ノート:

- Vitest (サービス層) での DB テスト: テスト時はインメモリ SQLite を使い、`beforeEach` でマイグレーションを適用してクリーンな状態を確保してください。例: `sqlite::memory:` 接続文字列を使用。
- Playwright: CI では headless モードで実行、`packages/e2e/playwright.config.ts` に `webServer` を定義してテスト前にバックエンドを立ち上げると安定します。

簡易 Playwright 設定例（`packages/e2e/playwright.config.ts`）:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173' },
    webServer: {
        command: 'pnpm --filter backend dev',
        port: 5173,
        reuseExistingServer: !process.env.CI,
    },
});
```

### 5.2 テスト範囲

| 対象           | 内容                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| サービス層     | `packages/backend/src/services/*` のビジネスロジック。DB はインメモリ SQLite を使用 |
| API ルート     | Hono のハンドラを `testClient` で呼び出し、レスポンスと DB 状態を検証               |
| フロントエンド | コンポーネントのレンダリング、フックの挙動。Testing Library 使用                    |
| E2E            | ログイン → メモ作成 → 公開 → 共有リンク取得 など主要フローの自動化                  |

### 5.3 テスト配置

- 単体: 対象ファイルと同じディレクトリに `*.test.ts` / `*.test.tsx`
- E2E: `packages/e2e/` または `e2e/` 配下に `*.spec.ts`

### 5.4 目標カバレッジ

- サービス層: 80% 以上
- フロントエンド: 主要コンポーネント・フックをカバー

---

## 6. デプロイ・CI/CD

### 6.1 本番デプロイ手順

[アーキテクチャ設計書 (architecture.md)](./architecture.md) の「6. デプロイメント戦略」を参照。

- 本番では `drizzle-kit push` を使わず、`db:migrate` でスキーマ適用
- マイグレーションはデプロイパイプラインで明示的に実行

### 6.2 CI/CD（推奨）

- **GitHub Actions** で以下を実行:
    - `pnpm install`
    - `pnpm lint` (Biome)
    - `pnpm test`
    - `pnpm build` (frontend + backend)
- 本番デプロイ: マージ時または手動トリガーで、ビルド → マイグレーション → デプロイ

### 6.3 バックアップ・監視

- **DB:** 定期バックアップ（`data/data.db` のコピー）
- **ログ:** 本番では構造化ログを出力し、外部サービスで集約
- **エラー監視:** Sentry 等でフロント・バックエンドの未捕捉エラーを監視

---

---

## 6.4 ルート `pnpm` スクリプト (`pnpm build` / `pnpm start` の一貫実行)

目的: ルートディレクトリで `pnpm build` → 両方のパッケージをビルド、`pnpm start` → フロントエンドとバックエンドを同時に起動できるようにする。

前提: Monorepo 構成 (`pnpm-workspace.yaml` をルートに配置し、`packages/frontend` と `packages/backend` が存在すること)。

ルートに配置した `pnpm-workspace.yaml` の例（既にルートに作成済み）:

```yaml
packages:
    - 'packages/*'

public-hoist-pattern:
    - '*'
```

ルート `package.json`（既にリポジトリに追加済み）の重要スクリプト:

```json
{
    "scripts": {
        "build": "pnpm -w -r run build",
        "start": "pnpm -w -r --parallel run start",
        "dev": "pnpm -w -r --parallel run dev"
    }
}
```

各パッケージでの必須スクリプト仕様（`packages/frontend/package.json` と `packages/backend/package.json`）:

- `packages/frontend/package.json`:

```json
{
    "scripts": {
        "build": "vite build",
        "start": "serve -s dist -l 5173",
        "dev": "vite"
    }
}
```

- `packages/backend/package.json`:

```json
{
    "scripts": {
        "build": "tsc -p tsconfig.build.json",
        "start": "node ./dist/index.js",
        "dev": "tsx src/index.ts"
    }
}
```

注記:

- フロントエンド `start` には `serve`（`npm i -D serve`）などの軽量静的サーバを使用する例を示しています。あるいは、バックエンドが静的ファイルを配信するように実装していれば、フロントの `start` は不要です。
- バックエンドは `build` で `dist/` を生成し、`start` がその `dist` を起動する想定です。

運用手順（最小）:

```bash
# 1) 依存関係インストール（ルートで）
pnpm install

# 2) ルートでビルド（フロント・バック両方）
pnpm build

# 3) ルートで起動（本番モード）
pnpm start
```

開発用:

```bash
pnpm dev
```

この設計により、ホスティング環境や CI/CD で `pnpm build` と `pnpm start` の2コマンドだけでビルドと起動が可能になります。

---

以上
