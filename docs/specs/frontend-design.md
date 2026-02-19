# フロントエンド設計書 (Frontend Design Specification)

概要: フロントエンドのアーキテクチャ、ディレクトリ構成、主要コンポーネント、UX指針、および型定義とフックの設計仕様をまとめた実装ガイドです。

推奨読者: フロントエンド開発者、デザイナー、フロントエンドレビュワー。

重要ポイント:

- 型は共有スキーマ（`packages/shared`）から再利用し、API との整合性を保つ。
- Tiptap をコアとしたエディタ設計、画像アップロードは `useUpload` フック経由で実装。
- Accessibility とレスポンシブを初期実装から考慮する。

---

## 1. プロジェクト構成

### 1.1 技術スタック

- **Core:** React 19, Vite, TypeScript (Strict Mode)
- **Routing:** TanStack Router (File-based routing)
- **State Management:** TanStack Query v5 (Server State), Nuqs (URL State)
- **Styling:** Tailwind CSS v4, **LiftKit** (Golden Ratio based system)
- **UI Components:** **LiftKit** (Layout/Spacing), shadcn/ui (Base Components)
- **Icons:** **Lucide React** (e.g. `lucide-react`)
- **Editor:** Tiptap (Headless, Block-based feel)
- **通知 (Toast):** sonner（shadcn/ui と相性が良い）

### 1.3 Design Philosophy (LiftKit)

**"Symmetry and Proportion through the Golden Ratio"**

- **Framework:** [LiftKit](https://www.chainlift.io/liftkit) を採用し、全ての寸法（マージン、パディング、フォントサイズ、Border Radius）を**黄金比**に基づいて決定する。
- **Optical Corrections:** アイコン付きボタンのパディング調整や、カードの視覚的補正（`opticalCorrection`）を積極的に行い、洗練されたプロフェッショナルな外観を実現する。
- **Icons:** `lucide-react` を使用する。shadcn/ui との親和性が高く、一貫したデザインを提供する。

### 1.2 ディレクトリ構造 (Feature-based)

機能単位でコロケーションを行う (Co-location)。

```text
packages/frontend/src/
├── app/                    # アプリケーションのエントリーポイント・設定
│   ├── routes/             # TanStack Router 定義 (File-based)
│   ├── router.tsx          # Router インスタンス生成
│   └── provider.tsx        # Context Providers (Query, Theme, Auth)
├── components/             # 共通コンポーネント (UI Library)
│   ├── ui/                 # shadcn/ui (Button, Input, etc.)
│   └── layout/             # Header, Sidebar, Footer
├── features/               # 機能別実装
│   ├── auth/               # 認証機能
│   │   ├── components/     # LoginForm 等
│   │   ├── hooks/          # useAuth, useLogin 等
│   │   └── types/          # Auth 関連型定義
│   ├── notes/              # メモ機能
│   │   ├── components/     # NoteList, NoteEditor 等
│   │   ├── hooks/          # useNotes, useNoteMutation 等
│   │   └── types/          # Note 関連型定義
│   └── editor/             # エディタ機能 (Tiptap 関連)
├── lib/                    # ユーティリティ・設定
│   ├── api-client.ts       # Hono RPC Client / Axios Instance
│   ├── query-client.ts     # TanStack Query Client
│   └── utils.ts            # clsx, twMerge 等
└── main.tsx                # Entry Point
```

---

## 2. 型定義 (TypeScript Interfaces)

バックエンドの API 定義 (`api-design.md`) と完全一致させるため、**原則として `packages/shared` から型をインポートして利用する。** フロントエンド独自での型再定義は行わない。

```typescript
import type { User, Note, ListNotesResponse, ApiResponse } from '@shared/types';
```

---

## 3. 状態管理 (State Management)の詳細

### 3.1 認証状態 (Auth State)

**戦略: Fetch-on-Mount with Query Cache**

1.  **初期化:**
    - アプリ起動時 (`AuthProvider` マウント時) に `/api/auth/me` をフェッチ。
    - 成功 -> `user` データをセットし、認証済みルートへアクセス許可。
    - 失敗 (401) -> `user` は `null`。ゲストとして扱う。
2.  **401ハンドリング (Interceptor):**
    - `api-client.ts` (または `fetch` ラッパー) にインターセプタを設定。
    - API レスポンスが `401 Unauthorized` だった場合、自動的に `queryClient.setQueryData(['auth'], null)` を実行し、強制的にログアウト状態へ遷移させる（ログイン画面へリダイレクト）。
3.  **フック:** `useAuth()`
    ```typescript
    export const useAuth = () => {
        const { data: user, isLoading } = useQuery({
            queryKey: ['auth'],
            queryFn: fetchUser, // GET /api/auth/me
            staleTime: Infinity, // 明示的なアクション以外で再取得しない
            retry: false,
        });
        return { user, isLoading, isAuthenticated: !!user };
    };
    ```

### 3.2 サーバー状態 (Server State)

`TanStack Query` を使用。

- **Keys:** `packages/frontend/src/lib/query-keys.ts` で一元管理 (Factory Pattern)。
    - 例: `noteKeys.all`, `noteKeys.lists()`, `noteKeys.detail(id)`
- **Cache Time:** デフォルト `staleTime: 5分`, `gcTime: 30分`。

### 3.3 URL状態 (URL State)

`Nuqs` ライブラリを使用し、検索条件をURLと同期させる。

```typescript
// useNoteSearch.ts
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export const useNoteSearch = () => {
    const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
    const [visibility, setVisibility] = useQueryState(
        'visibility',
        parseAsString,
    );
    return { q, setQ, visibility, setVisibility };
};
```

---

## 4. コンポーネント実装詳細

### 4.1 NoteEditor (Tiptap)

Notionライクな操作感を実現するための設定。

- **Extensions:**
    - `@tiptap/starter-kit`: 基本セット
    - `@tiptap/extension-placeholder`: "Press '/' for commands..."
    - `@tiptap/extension-image`: 画像表示
    - `tiptap-extension-resize-image`: 画像リサイズ (Community plugin推奨)
    - **Custom Slash Command:** "/" 入力でポップアップメニューを表示。
        - `tiptap-extension-slash-menu` などのライブラリ、または `Suggestion` API を用いて自作。
- **画像アップロード:**
    - エディタへのドラッグ＆ドロップ時に `handleDrop` イベントをフック。
    - `POST /api/upload` を実行し、一時的な `assetId` / `tempUrl` を受け取る。クライアントはプレースホルダを差し込み、メモ保存時に `assetId` を最終確定 (finalize) するワークフローを推奨する。完成時は `editor.chain().focus().setImage({ src: finalUrl }).run()` で差し替える。

    ### 画像最適化と CDN
    - クライアントはオリジナル画像をアップロードし、サーバー側で複数サイズとフォーマット（AVIF, WebP, JPEG/PNG）を生成して CDN に配信する設計を推奨。
    - 生成するバリエーション例: widths = [320, 640, 960, 1280, 1920]。品質パラメータ（例: q=75）をサーバー/処理パイプラインで制御する。
    - HTML 側は `srcset` / `sizes` を利用または `picture` 要素でフォーマットのフォールバックを提供。例: AVIF -> WebP -> JPEG。
    - エディタ挿入時はまず `tempUrl` を表示し、最終化された `finalUrl`（CDN 上の最適化済み URL）で差し替える。エディタ表示では `loading="lazy"` と `decoding="async"` を推奨。
    - クライアントサイドで軽量なリサイズ（プレビュー向け）を行い、アップロード帯域を節約する。ただし高品質な最終出力はサーバー側で生成すること。
    - サーバー側処理ツール: `libvips`（sharp も可）。処理は非同期ジョブ（ワーカーキュー）で行い、処理完了時に CDN へアップロードし署名済み URL を返す。
    - CDN とキャッシュ: `Cache-Control: public, max-age=31536000, immutable` を設定し、ファイル名（URL）にバージョン/ハッシュを含める。動的パラメータ（例: `?w=`）での配信は CDN のオリジン処理/リバースプロキシで行う。
    - セキュリティ: 非公開コンテンツは署名付き URL または認証付きオリジン経由で配信する。公開画像は公開 CDN 上に配置してブラウザキャッシュを最大化する。
    - プレースホルダー: ぼかしプレースホルダー（low-quality image placeholder, LQIP）や小サイズのベース64を提供して UX を向上させる。
    - Editor の `useUpload` はアップロード結果として `finalUrl` とメタ情報（width, height, blurhash/placeholder）を返すようにする。

### 4.2 NoteLayout (Header)

- **Cover Image:**
    - 高さ `30vh` (約200-300px)。
    - 画像がない場合は `bg-muted` またはランダムなグラデーションを表示。
    - ホバー時に「画像変更」「削除」ボタンを表示。
- **Icon:**
    - タイトルの上に配置。
    - クリックで絵文字ピッカー (例: `emoji-picker-react`) をポップオーバー表示。

---

## 5. ルーティング定義 (TanStack Router)

ファイルベースルーティングによる定義。

- `routes/__root.tsx`:
    - 全体の Layout。`Outlet`, `TanStackRouterDevtools` を配置。
    - `AuthContext` を Provide。
- `routes/index.tsx`:
    - `Public` メモ一覧 (LP的な役割も兼ねる)。
- `routes/login.tsx`:
    - ログイン画面 (`user` が存在する場合は `/admin` へリダイレクト)。
- `routes/_auth.tsx` (Layout Route):
    - `beforeLoad`: `!user` なら `/login` へリダイレクト。
    - サイドバー描画。
- `routes/_auth.admin.index.tsx` (`/admin`):
    - 管理ダッシュボード。自分のメモ一覧。
- `routes/_auth.admin.notes.$noteId.tsx`:
    - メモ編集画面。
- `routes/shared.$token.tsx`:
    - 共有メモ閲覧画面 (認証不要)。
    - ヘッダー等は簡易的なものにする。
- `routes/404.tsx`:
    - 404 Not Found ページ。存在しないパスやメモID、期限切れ共有リンクで表示。
- `routes/500.tsx`:
    - 500 Server Error ページ。予期せぬエラー発生時に表示（Error Boundary 経由）。

### 5.1 エラーページの仕様

| ルート | 表示条件                                         | UI                                                     |
| ------ | ------------------------------------------------ | ------------------------------------------------------ |
| 404    | 存在しないパス、削除済みメモ、期限切れ共有リンク | メッセージ「ページが見つかりません」、トップへのリンク |
| 500    | Error Boundary で捕捉した未処理エラー            | メッセージ「エラーが発生しました」、リロードボタン     |

---

## 6. エラー・ローディング・通知

### 6.1 エラーバウンダリ (Error Boundary)

- **配置:** `routes/__root.tsx` の直下で `ErrorBoundary` をラップ。
- **フォールバック:** 500ページへリダイレクト、またはインラインでエラーメッセージを表示。
- **ログ:** 本番環境では Sentry 等にエラーを送信することを推奨。

### 6.2 ローディング状態 (Loading States)

- **ページ単位:** TanStack Router の `pendingComponent` でスケルトンまたはスピナーを表示。
- **コンポーネント単位:** `isLoading` 時に shadcn/ui の `Skeleton` を使用。
- **エディタ:** 初回読み込み中はプレースホルダー表示。

### 6.3 トースト通知 (Toast)

- **ライブラリ:** sonner を使用。`<Toaster />` を Root に配置。
- **成功:** メモ保存、ログアウト完了等で `toast.success()` を呼び出す。
- **失敗:** API エラー時に `toast.error()` でエラーメッセージを表示。ユーザー向けメッセージは `error.message` をそのまま使わず、エラーコードに応じて文言をマッピングする。

---

## 7. フック仕様 (Custom Hooks Specification)

### 7.1 `useNotes(params)`

- **Params:** `{ q?: string, visibility?: string, page?: number, limit?: number }`
- **Returns:** `{ items: Note[], total: number, page: number, limit: number, hasNext: boolean, isLoading: boolean }`
- **Behavior:**
    - パラメータ変更時に自動で再取得 (`placeholderData: keepPreviousData` で前回データを表示しつつ更新)。

### 7.2 `useNoteMutation()`

- **Returns:**
    - `createNote: (data: CreateNoteDto) => Promise<Note>` … `shareDuration` は visibility='shared' 時のみ指定
    - `updateNote: (id: string, data: UpdateNoteDto) => Promise<Note>`
    - `deleteNote: (id: string) => Promise<void>`
- **Side Effects:**
    - 成功時: `toast.success` 表示、及び `noteKeys.lists()` のクエリ無効化 (Invalidate)。
    - 失敗時: `toast.error` 表示。

### 7.3 `useUpload()`

- **Returns:** `{ upload: (file: File) => Promise<UploadResponse>, isUploading: boolean }`
- **Type:** `UploadResponse` includes `{ id, url, width, height, blurhash }` (from shared types).
- **Behavior:**
    - ファイルアップロードAPIを叩き、URLを返す。
    - エディタやカバー画像変更で使用。

---

## 8. Accessibility, i18n, Mobile & Keyboard

### 8.1 Accessibility (A11Y)

- WCAG 2.1 AA を目標とする。
- 重要要件: キーボード操作可能、フォーカス順の明示、色に頼らない情報提示、適切な aria 属性の付与。
- 画像には必ず `alt` を付与。カスタムコンポーネントはアクセシブルなロールをサポートする。

### 8.2 Internationalization (i18n)

- 将来的な多言語対応を想定し、UI 文言は `i18n` レイヤーで管理する（例: `react-intl` / `@formatjs`）。
- 日付/時刻はローカル表示だが内部は UTC を利用する。

### 8.3 Mobile / Responsive

- レスポンシブ設計: モバイルファーストを基本にブレークポイントを定義。サイドバーはモバイル時に折りたたむ。
- タップ領域は推奨サイズを満たす（44x44px 以上）。

### 8.4 Keyboard Shortcuts

- エディタ操作や保存ショートカットを提供する（例: `Mod+S` で保存、`Mod+B` 太字）。ショートカットは設定で無効化可能にする。

### 8.5 SEO & OGP Strategy

`NoteDetail` ページ（特に Public/Shared）では、適切なメタタグを出力する。

- **Library:** `react-helmet-async` または TanStack Router の meta 機能を使用。
- **Tags:**
    - `<title>`: `Note Title | AppName`
    - `<meta name="description">`: 本文の冒頭 120 文字（Markdown をプレーンテキストに変換して抽出）
    - `og:image`: `coverImage` があればそれを設定。なければデフォルト OGP 画像。
    - `twitter:card`: `summary_large_image`

### 8.6 A11y Checklist (Concrete)

- [ ] **Focus Management:** モーダル開閉時にフォーカスをトラップし、閉じたら元のボタンに戻す。
- [ ] **Editor Toolbar:** 各ボタンに `aria-label` (例: "Bold", "Insert Image") を設定。
- [ ] **Toast:** `role="status"` または `role="alert"` を適切に使い分ける。
- [ ] **Keyboard Navigation:** `Tab` キーで全てのインタラクティブ要素に到達可能にする。カスタムコンポーネント（ドラッグハンドル等）も `Enter`/`Space` で操作可能にする。

---

## 9. Modern UI/UX (GAE-JP Reference)

目的: 参照サイト（https://github.com/gae-22/www-gae-jp, https://www.gae-jp.net）のモダンでクリーンなビジュアルを踏襲し、`note-gae-jp` の UI を洗練させる。以下は実装指針と具体的トークン、コンポーネント仕様で、フロントエンド実装チームがそのまま使えるレベルで記載する。

### 9.1 デザイン原則

- **Clarity:** 余白とタイポグラフィで情報の優先順位を明確にする。
- **Calm Contrast:** 強すぎないコントラスト、柔らかいアクセントカラーを使用し長時間の閲覧に耐える配色とする。
- **Subtle Motion:** アニメーションは状態変化を助ける程度に留める（フェード、スケール、slide）。
- **Component-first:** `shadcn/ui` と `Tailwind` をベースにアクセシブルな再利用コンポーネントを作る。

### 9.2 デザイントークン（Tailwind 拡張例）

Tailwind の `theme.extend` に次を追加することを推奨する。

- Colors (例):
    - `primary`: #0f766e (teal-700)
    - `accent`: #7c3aed (violet-600)
    - `muted`: #6b7280 (gray-500)
    - `bg`: #0f172a (dark) / #ffffff (light)
    - `surface`: #0b1220 (card background dark) / #f8fafc (light)
    - `border`: rgba(15,23,42,0.06)

- Typography:
    - `fontFamily`: ['Inter', 'ui-sans-serif', 'system-ui']
    - base: 16px, scale: 1rem (base), h1..h4: 2rem, 1.5rem, 1.25rem, 1rem

- Spacing / Radius / Shadows:
    - `spacing` scale 0.25rem steps (xs..xl)
    - `radius`: sm=6px, md=10px, lg=14px
    - `shadow`: small subtle card shadow and larger elevated shadow

例: `tailwind.config.cjs` への追加サンプルは Implementation に記載。

### 9.3 主要コンポーネント仕様

- `Header`: ロゴ左、メインナビ、検索、アカウントメニュー（右）。最小高さ: 56px。スクロールでシャドウが現れる。

- `Hero / Landing`: シンプルなキャッチ、サブテキスト、コールトゥアクション（Primary）、画像は背景グラデーションでアクセント。

- `NoteCard` (一覧):
    - カードに `title`, `excerpt`, `meta` (updatedAt, visibility) を表示。
    - Hover: 軽い上昇とシャドウ増し、右上にアクション（編集・メニュー）。
    - レイアウト: grid (col 1..3) responsive

- `Editor`:
    - フル幅のエディタ領域、左右の余白を確保。
    - ツールバーは `sticky` にしてスクロールで常時アクセス可能。
    - 画像プレビューはモーダルで拡大、クリックでダウンロード。

- `ShareDialog`:
    - 共有リンクを大きく表示、コピーボタン、期限表示、無効化ボタン。
    - 成功/エラーは `toast` でフィードバック。

- `FileUpload` (ドラッグ&ドロップ):
    - ドロップ領域は dashed ボーダー、アイコン、プログレスバーを表示。

### 9.4 Microcopy & UX flows

- ボタン文言は短く具体的に: `Save` → `Save draft`, `Publish` → `Publish note`。
- 重要な破壊操作（Delete）には確認ダイアログと不可逆性の警告を必須にする。

### 9.5 Accessibility & Responsiveness（補足）

- 各コンポーネントはキーボードフォーカスが明確に見えること。
- カラーコントラストは WCAG AA を満たすように確認。

### 9.6 Implementation checklist

1. `tailwind.config.cjs` に上記トークンを追加
2. ルートの `packages/frontend/src/design/tokens.ts` を作成し TypeScript トークンをエクスポート
3. `shadcn/ui` を導入し、`NoteCard`, `Header`, `EditorToolbar`, `ShareDialog` のコンポーネントを実装
4. ライブラリ: `@headlessui/react` / `radix-ui` の一部コンポーネントを利用
5. アニメーション: `framer-motion`（軽量使用）でページ間のトランジション・モーダルの出入りを実装

---

参考: 参照元の `www-gae-jp` はシンプルで落ち着いた色調・広い余白が特徴です。視覚的な基準を合わせるため、配色やフォント、カード間隔を近づけてください。
