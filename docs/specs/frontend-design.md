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

### 1.4 Design Vision (2026: Ambient & Spatial)

"機能的ミニマリズム" と "有機的なインタラクション" を融合させた、State-of-the-Art な体験を目指す。

1. **Ambient & Spatial (アンビエントかつ空間的)**
    - フラットデザインのその先へ。過剰な装飾ではなく、微細な「深度（Depth）」と「光（Lighting）」で階層を表現する。
    - 要素は画面に張り付くのではなく、空間に浮遊しているような軽やかさを持つこと。
    - Tailwind v4の `oklch` カラーパレットを活用し、目に優しく、かつ発光感のある色使い。

2. **Fluid & Organic Motion (流体的で有機的なモーション)**
    - アニメーションは「装飾」ではなく「文脈の説明」として機能させる。
    - 状態変化（保存中、モード切替）は、パキッと切り替わるのではなく、形状がモーフィングするように滑らかに変化させる（layout projection）。
    - マイクロインタラクションには物理演算のような「重み」と「反発」を持たせる。

3. **Intent-Centric Interface (意図中心のUI)**
    - ユーザーが次に何をごしたいかを予測し、必要なUIだけが文脈に応じて浮き上がる（Progressive Disclosure）。
    - 普段はコンテンツ（テキスト）が主役であり、クローム（ヘッダーやサイドバー）は極限まで存在感を消す。

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

## 9. 2026 UI/UX Implementation Specs

既存の `frontend-design.md` の原則に加え、以下の 2026 Vision を実現するための具体的実装指針。

### 9.1 Technical Foundation (Tailwind v4 & React 19)

- **Tailwind CSS v4 Integration:**
    - CSS Variables を活用した動的テーマ切り替え。
    - `@theme` ブロックを使用したデザインシステムの注入。
    - `oklch()` カラーモデルの採用により、知覚的に均一な明度調整を行う。

- **Animation & Interaction:**
    - ライブラリ: `framer-motion` (または React 19 対応の軽量ライブラリ)
    - **Spring Physics:** イージングカーブ（Bezier）ではなく、物理ベース（Stiffness, Damping）で「重み」を表現する。
    - **Layout Projection:** `layoutId` を使用して、要素間の遷移をシームレスにつなぐ。

### 9.2 Design Tokens (Tailwind v4 Config Proposal)

```css
@theme {
    /* Ambient Lighting Colors (OKLCH) */
    --color-ambient-bg: oklch(0.12 0.02 240); /* Deep distinct blue-grey */
    --color-ambient-surface: oklch(0.16 0.03 240 / 0.8); /* Glass surface */
    --color-ambient-highlight: oklch(0.98 0.01 240); /* Text high contrast */
    --color-ambient-primary: oklch(0.7 0.15 160); /* Fresh Teal */

    /* Depth & Shadows */
    --shadow-glass:
        0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -1px oklch(0 0 0 / 0.06),
        inset 0 1px 0 0 oklch(1 1 1 / 0.1);

    /* Blur */
    --blur-glass: 12px;
}
```

### 9.3 Component Specifications

#### A. Ambient Sidebar (Navigation)

- **Concept:** 常に存在するが主張しない「空気」のようなナビゲーション。
- **Implementation:**
    - 背景は `backdrop-filter: blur(var(--blur-glass))` と `bg-ambient-surface` で透過させる。
    - ホバー時のみ、マウス位置に連動して「スポットライト」効果（Radial Gradient）が追従する。
    - ステート変化（展開/折りたたみ）は `AnimatePresence` でコンテンツ自体をモーフィングさせる。

#### B. Fluid Note Card (List Item)

- **Concept:** 接地面を持たず、磁力で浮遊するオブジェクト。
- **Implementation:**
    - `whileHover={{ scale: 1.02, y: -4 }}` で「浮き上がり」を表現。
    - カーソルが近づくと、隣接するカードもわずかに反応する（Magnetic Grid effect）。
    - クリック時の画面遷移は、カードが全画面に拡大するような **Shared Element Transition** を実装する。

#### C. Intent-Centric Editor (Toolbar)

- **Concept:** 書く意思（Intent）がある時だけ具現化するツール。
- **Implementation:**
    - `BubbleMenu` (Tiptap) をカスタマイズし、テキスト選択時のみ「液状」に湧き出るアニメーションで表示。
    - スラッシュコマンド (`/`) は、キャレットの近傍に物理的な重みを持ってポップアップする。
    - 通常時のヘッダーやサイドバーは、スクロール開始とともに `opacity: 0` または `y: -100%` で退避し、没入モードへ移行する。

### 9.4 Implementation Roadmap

1. **Token Definition:** `index.css` に Tailwind v4 の `@theme` 定義を追加。
2. **Base Components:** `shadcn/ui` のコンポーネントを `oklch` ベースに再スタイリング。
3. **Motion System:** `framer-motion` の共通設定（`spring` config）をフック化 (`useOrganicMotion`)。
4. **Layout Check:** サイドバーとメインエリアの Composition を再構築。
