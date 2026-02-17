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

以上
