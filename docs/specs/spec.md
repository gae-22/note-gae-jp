# プロジェクト仕様書 (Project Specification)

## 1. プロジェクト概要

### 1.1 プロジェクト名

**2026 Markdown Note Application**

### 1.2 概要

Notionのような高性能なMarkdownエディタを中心に据えた、個人用ナレッジベース兼情報共有プラットフォーム。
管理者が作成したメモはデフォルトで非公開だが、設定により「一般公開」または「限定共有（期限付き）」が可能。
2026年のモダンなWeb技術スタック（React 19, Hono, SQLite）を採用し、高速かつ堅牢な実装を目指す。

---

## 2. コア機能要件

### 2.1 認証・管理機能

- **管理者ログイン:**
    - ユーザー名とパスワードによる認証
    - HttpOnly Cookie (SameSite=Lax, Secure) を使用したセッション管理
    - セッション有効期限は7日間
- **ログアウト:** セッション破棄およびCookie削除

### 2.2 メモ管理機能 (CRUD)

- **作成:** タイトル、Markdown本文、公開設定を指定して作成
- **閲覧:** MarkdownをHTMLに変換して表示 (GFM準拠)
- **更新:** タイトル、本文、設定の変更
- **削除:** メモの物理削除（関連ファイルは連動して削除または残存設定）
- **検索:** キーワードによる全文検索（タイトル・本文）、公開設定によるフィルタ

### 2.3 公開・共有機能

- **Private (非公開):** 管理者のみ閲覧可能（デフォルト）
- **Public (公開):** 誰でも閲覧可能なWebページとして公開
- **Shared (限定共有):**
    - 期限付き（1日/7日/30日/無期限）の共有リンクを発行
    - UUID v4 による推測不可能なトークンを使用
    - 期限切れのリンクはアクセス不可（404/410）とする

### 2.4 ファイルアップロード機能

- **ドラッグ＆ドロップ:** エディタ上への画像・ファイルドロップに対応
- **ファイル保存:** サーバーローカルの `uploads/YYYY/MM/` ディレクトリに保存
- **バリデーション:** ファイルサイズ（最大10MB）、MIMEタイプ（画像、PDF等）、拡張子の整合性をチェック

---

## 3. 技術スタック・要件

### 3.1 推奨スタック

本書では以下の技術スタックでの実装を前提とする。

- **Frontend:** React 19, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui, Tiptap
- **Backend:** Node.js (v22+), Hono (RPC Mode), Zod
- **Database:** SQLite (better-sqlite3), Drizzle ORM
- **Package Manager:** pnpm

### 3.2 非機能要件

- **パフォーマンス:** 初期表示 1秒以内、エディタ入力遅延なし
- **セキュリティ:** XSS/CSRF対策、SQLインジェクション対策（ORM利用）、セキュアな認証
- **コード品質:** TypeScript Strict Mode、Biome（Lint・フォーマット）の適用
- **テスト:** Vitest (Unit/Integration), Playwright (E2E) による自動テスト

---

## 4. ドキュメント体系

本プロジェクトの仕様は以下のドキュメント群によって定義される。
実装時は各詳細設計書を参照すること。

1. **[アーキテクチャ設計書 (Architecture)](./architecture.md)**
    - システム構成、レイヤー、データフロー、デプロイ、環境変数
2. **[データベース設計書 (Database Design)](./database-design.md)**
    - データベーススキーマ、インデックス、リレーション定義
3. **[API設計書 (API Design)](./api-design.md)**
    - APIエンドポイント、リクエスト/レスポンス型定義、バリデーションルール、サービスロジック
4. **[フロントエンド設計書 (Frontend Design)](./frontend-design.md)**
    - コンポーネント設計、状態管理、ディレクトリ構成、フック実装詳細
5. **[セキュリティ設計書 (Security Design)](./security.md)**
    - セキュリティ対策の詳細（※適宜更新）
6. **[開発ガイドライン (Development Guidelines)](./development-guidelines.md)**
    - コーディング規約、Git運用、テスト方針
7. **[実装詳細ガイド (Implementation Detail)](./implementation_detail.md)**
    - 実装順序、環境変数、テスト戦略、デプロイ・CI/CD

---
