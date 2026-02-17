# フロントエンド設計書 (Frontend Design Specification)

本ドキュメントは、`note-gae-jp` のフロントエンド実装を**厳密に**定義する。
UI/UX は Notion をベンチマークとし、直感的で美しい操作性を実現する。

---

## 1. プロジェクト構成

### 1.1 技術スタック

- **Core:** React 19, Vite, TypeScript (Strict Mode)
- **Routing:** TanStack Router (File-based routing)
- **State Management:** TanStack Query v5 (Server State), Nuqs (URL State)
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix UI base)
- **Editor:** Tiptap (Headless, Block-based feel)

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

バックエンドの API 定義 (`api-design.md`) と完全に一致させる。
可能であれば `packages/shared` から型をインポートして利用するが、フロントエンド側で定義する場合も以下を厳守する。

### 2.1 User

```typescript
export interface User {
    id: string; // ULID
    username: string;
    createdAt: string; // ISO 8601 Date String
}
```

### 2.2 Note

```typescript
export interface Note {
    id: string; // ULID
    title: string;
    content: string; // Markdown
    coverImage: string | null;
    icon: string | null;
    visibility: 'private' | 'public' | 'shared';
    shareToken: string | null; // UUID v4
    shareExpiresAt: string | null; // ISO 8601
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}
```

### 2.3 API Response Wrapper

```typescript
export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };
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
    - `POST /api/upload` を実行し、返却されたURLを `editor.chain().focus().setImage({ src: url }).run()` で挿入。

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

---

## 6. フック仕様 (Custom Hooks Specification)

### 6.1 `useNotes(params)`

- **Params:** `{ q?: string, visibility?: string, page?: number }`
- **Returns:** `{ notes: Note[], total: number, isLoading: boolean }`
- **Behavior:**
    - パラメータ変更時に自動で再取得 (KeepPreviousData: true)。

### 6.2 `useNoteMutation()`

- **Returns:**
    - `createNote: (data: CreateNoteDto) => Promise<Note>`
    - `updateNote: (id: string, data: UpdateNoteDto) => Promise<Note>`
    - `deleteNote: (id: string) => Promise<void>`
- **Side Effects:**
    - 成功時: `toast.success` 表示、及び `noteKeys.lists()` のクエリ無効化 (Invalidate)。
    - 失敗時: `toast.error` 表示。

### 6.3 `useUpload()`

- **Returns:** `{ upload: (file: File) => Promise<string>, isUploading: boolean }`
- **Behavior:**
    - ファイルアップロードAPIを叩き、URLを返す。
    - エディタやカバー画像変更で使用。
