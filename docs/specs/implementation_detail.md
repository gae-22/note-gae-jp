# 実装詳細ガイド (Implementation Guide Index)

> **Note:**
> 本ドキュメントは以前「詳細実装仕様書」として存在しましたが、情報の分散と矛盾を防ぐため、現在は各専門分野の設計書に詳細情報を集約しています。
> 実装の際は、以下のリンク先を正ごとの「正」として参照してください。

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

## 2. 実装の進め方 (Workflow)

矛盾のない実装を行うための推奨フロー:

1. **DBスキーマ作成:** `database-design.md` に従い、`schema.ts` を記述し `db:migrate` する。
2. **バリデーション定義:** `api-design.md` の Zod Schema を `packages/backend(or shared)/src/validators` に実装する。
3. **バックエンドロジック:** `api-design.md` の Service Logic に従い、各機能を実装する。
4. **APIルート定義:** 実装した Service を Hono ルートに接続する。
5. **フロントエンド連携:** `frontend-design.md` に従い、API Client (`hono/client`) を用いたフックとコンポーネントを実装する。

---

## 3. 環境変数

バックエンドで使用する環境変数。`packages/backend/src/utils/env.ts` 等で検証・読み込みする。

| 変数名           | 必須       | デフォルト              | 説明                                                 |
| ---------------- | ---------- | ----------------------- | ---------------------------------------------------- |
| `NODE_ENV`       | Yes        | -                       | `development` / `production`                         |
| `SESSION_SECRET` | Yes        | -                       | セッション暗号化用。32文字以上のランダム文字列を推奨 |
| `DATABASE_PATH`  | No         | `data/data.db`          | SQLite データベースファイルのパス                    |
| `UPLOADS_DIR`    | No         | `uploads/`              | アップロードファイルの保存先                         |
| `FRONTEND_URL`   | Yes (本番) | `http://localhost:5173` | CSRF 検証用のフロントエンドオリジン                  |

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

## 5. テスト戦略

### 5.1 テストフレームワーク

- **単体・統合:** Vitest
- **E2E:** Playwright

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

以上
