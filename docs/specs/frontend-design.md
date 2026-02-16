# フロントエンド設計書

## 1. フロントエンド概要

### 1.1 基本情報

| 項目            | 値                           |
| --------------- | ---------------------------- |
| Framework       | React 19                     |
| Build Tool      | Vite 6.x                     |
| Language        | TypeScript 5.x (Strict Mode) |
| Package Manager | pnpm                         |
| Target Browsers | Modern browsers (ES2022+)    |

### 1.2 技術スタック

| カテゴリ        | 技術              | 用途                         |
| --------------- | ----------------- | ---------------------------- |
| Routing         | TanStack Router   | 型安全なルーティング         |
| Server State    | TanStack Query v5 | データフェッチ・キャッシング |
| URL State       | Nuqs              | URLパラメータ管理            |
| Form Handling   | React Hook Form   | フォーム状態管理             |
| Validation      | Zod               | スキーマバリデーション       |
| Styling         | Tailwind CSS v4   | ユーティリティCSS            |
| UI Components   | shadcn/ui         | 再利用可能UIコンポーネント   |
| Icons           | Lucide React      | アイコンライブラリ           |
| Markdown Editor | Tiptap / Novel    | リッチテキストエディタ       |
| Date Handling   | date-fns          | 日付フォーマット             |

---

## 2. プロジェクト構造

### 2.1 ディレクトリ構成

```
packages/frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/                      # アプリケーションルート
│   │   ├── routes/               # ページコンポーネント
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx
│   │   │   ├── login.tsx
│   │   │   ├── admin/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   └── notes/
│   │   │   │       ├── index.tsx
│   │   │   │       ├── new.tsx
│   │   │   │       └── $id.tsx
│   │   │   ├── notes/
│   │   │   │   └── $id.tsx
│   │   │   └── shared/
│   │   │       └── $token.tsx
│   │   └── router.tsx
│   │
│   ├── components/               # 共有UIコンポーネント
│   │   ├── ui/                   # shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       ├── sidebar.tsx
│   │       └── page-container.tsx
│   │
│   ├── features/                 # 機能別モジュール
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── logout-button.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-login.ts
│   │   │   │   └── use-logout.ts
│   │   │   ├── api/
│   │   │   │   └── auth-api.ts
│   │   │   └── schemas.ts
│   │   │
│   │   ├── notes/
│   │   │   ├── components/
│   │   │   │   ├── note-card.tsx
│   │   │   │   ├── note-list.tsx
│   │   │   │   ├── note-detail.tsx
│   │   │   │   ├── note-filters.tsx
│   │   │   │   └── note-search.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-notes.ts
│   │   │   │   ├── use-note.ts
│   │   │   │   ├── use-create-note.ts
│   │   │   │   ├── use-update-note.ts
│   │   │   │   ├── use-delete-note.ts
│   │   │   │   └── use-search-notes.ts
│   │   │   ├── api/
│   │   │   │   └── notes-api.ts
│   │   │   ├── utils/
│   │   │   │   └── note-helpers.ts
│   │   │   └── schemas.ts
│   │   │
│   │   ├── editor/
│   │   │   ├── components/
│   │   │   │   ├── markdown-editor.tsx
│   │   │   │   ├── editor-toolbar.tsx
│   │   │   │   ├── editor-bubble-menu.tsx
│   │   │   │   └── file-upload-button.tsx
│   │   │   ├── extensions/
│   │   │   │   ├── image-upload.ts
│   │   │   │   ├── file-embed.ts
│   │   │   │   └── custom-link.ts
│   │   │   ├── hooks/
│   │   │   │   └── use-editor.ts
│   │   │   └── utils/
│   │   │       └── editor-config.ts
│   │   │
│   │   └── sharing/
│   │       ├── components/
│   │       │   ├── share-dialog.tsx
│   │       │   ├── share-link-display.tsx
│   │       │   ├── visibility-selector.tsx
│   │       │   └── expiry-selector.tsx
│   │       ├── hooks/
│   │       │   └── use-generate-share-link.ts
│   │       └── utils/
│   │           └── share-url-builder.ts
│   │
│   ├── lib/                      # ユーティリティ・設定
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── eslint.config.js
```

---

## 3. ルーティング設計

### 3.1 TanStack Router 設定

```typescript
// packages/frontend/src/app/router.tsx
import { createRouter, createRootRoute } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5分
            gcTime: 1000 * 60 * 30, // 30分
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const rootRoute = createRootRoute({
    component: RootLayout,
});

export const router = createRouter({
    routeTree: rootRoute,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
```

### 3.2 ルート定義

#### ルートレイアウト (`__root.tsx`)

```typescript
// packages/frontend/src/app/routes/__root.tsx
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../router';
import { Toaster } from '@/components/ui/toaster';

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Outlet />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
```

#### ホームページ (`index.tsx`)

```typescript
// packages/frontend/src/app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useNotes } from '@/features/notes/hooks/use-notes';
import { NoteList } from '@/features/notes/components/note-list';
import { Header } from '@/components/layout/header';

function HomePage() {
  const { data, isLoading } = useNotes({ visibility: 'public' });

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Public Notes</h1>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <NoteList notes={data?.data || []} />
        )}
      </main>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
```

#### ログインページ (`login.tsx`)

```typescript
// packages/frontend/src/app/routes/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/components/login-form';
import { useAuth } from '@/features/auth/hooks/use-auth';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: async ({ context }) => {
    // すでにログイン済みなら管理画面へ
    const user = await context.queryClient.fetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: async () => {
        const res = await apiClient.auth.me.$get();
        return await res.json();
      },
    });

    if (user.data.user) {
      throw redirect({ to: '/admin' });
    }
  },
});
```

#### 管理画面レイアウト (`admin/_layout.tsx`)

```typescript
// packages/frontend/src/app/routes/admin/_layout.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/features/auth/hooks/use-auth';

function AdminLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/admin/_layout')({
  component: AdminLayout,
  beforeLoad: async ({ context }) => {
    // 認証チェック
    const user = await context.queryClient.fetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: async () => {
        const res = await apiClient.auth.me.$get();
        return await res.json();
      },
    });

    if (!user.data.user) {
      throw redirect({ to: '/login' });
    }
  },
});
```

#### メモ編集ページ (`admin/notes/$id.tsx`)

```typescript
// packages/frontend/src/app/routes/admin/notes/$id.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useNote } from '@/features/notes/hooks/use-note';
import { NoteEditForm } from '@/features/notes/components/note-edit-form';

function NoteEditPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useNote(id);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data?.data) {
    return <div>Note not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Note</h1>
      <NoteEditForm note={data.data} />
    </div>
  );
}

export const Route = createFileRoute('/admin/notes/$id')({
  component: NoteEditPage,
});
```

---

## 4. 状態管理

### 4.1 Server State (TanStack Query)

#### API Client 設定

```typescript
// packages/frontend/src/lib/api-client.ts
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/app';

export const apiClient = hc<AppType>('/api', {
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
});
```

#### Query Client 設定

```typescript
// packages/frontend/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5分間はキャッシュ有効
            gcTime: 1000 * 60 * 30, // 30分後にガベージコレクション
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
        },
        mutations: {
            retry: 0,
        },
    },
});
```

### 4.2 Custom Hooks

#### useNotes（メモ一覧取得）

```typescript
// packages/frontend/src/features/notes/hooks/use-notes.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type UseNotesOptions = {
    q?: string;
    page?: number;
    limit?: number;
    visibility?: 'public' | 'private' | 'shared';
};

export const useNotes = (options: UseNotesOptions = {}) => {
    const { q, page = 1, limit = 20, visibility } = options;

    return useQuery({
        queryKey: ['notes', { q, page, limit, visibility }],
        queryFn: async () => {
            const res = await apiClient.notes.$get({
                query: {
                    q: q || '',
                    page: String(page),
                    limit: String(limit),
                },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch notes');
            }

            return await res.json();
        },
    });
};
```

#### useNote（メモ詳細取得）

```typescript
// packages/frontend/src/features/notes/hooks/use-note.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useNote = (id: string) => {
    return useQuery({
        queryKey: ['notes', id],
        queryFn: async () => {
            const res = await apiClient.notes[':id'].$get({
                param: { id },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch note');
            }

            return await res.json();
        },
        enabled: !!id,
    });
};
```

#### useCreateNote（メモ作成）

```typescript
// packages/frontend/src/features/notes/hooks/use-create-note.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import type { CreateNoteInput } from '../schemas';

export const useCreateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateNoteInput) => {
            const res = await apiClient.notes.$post({
                json: input,
            });

            if (!res.ok) {
                throw new Error('Failed to create note');
            }

            return await res.json();
        },
        onSuccess: () => {
            // キャッシュ無効化
            queryClient.invalidateQueries({ queryKey: ['notes'] });

            toast({
                title: 'Success',
                description: 'Note created successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

#### useUpdateNote（メモ更新）

```typescript
// packages/frontend/src/features/notes/hooks/use-update-note.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import type { UpdateNoteInput } from '../schemas';

export const useUpdateNote = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateNoteInput) => {
            const res = await apiClient.notes[':id'].$patch({
                param: { id },
                json: input,
            });

            if (!res.ok) {
                throw new Error('Failed to update note');
            }

            return await res.json();
        },
        onSuccess: (data) => {
            // 特定メモのキャッシュ更新
            queryClient.setQueryData(['notes', id], data);

            // リスト更新
            queryClient.invalidateQueries({ queryKey: ['notes'] });

            toast({
                title: 'Success',
                description: 'Note updated successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

#### useDeleteNote（メモ削除）

```typescript
// packages/frontend/src/features/notes/hooks/use-delete-note.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

export const useDeleteNote = (id: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.notes[':id'].$delete({
                param: { id },
            });

            if (!res.ok) {
                throw new Error('Failed to delete note');
            }

            return await res.json();
        },
        onSuccess: () => {
            // キャッシュから削除
            queryClient.removeQueries({ queryKey: ['notes', id] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });

            toast({
                title: 'Success',
                description: 'Note deleted successfully',
            });

            // メモ一覧へリダイレクト
            navigate({ to: '/admin/notes' });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

### 4.3 URL State (Nuqs)

```typescript
// packages/frontend/src/features/notes/components/note-search.tsx
import { useQueryState } from 'nuqs';
import { Input } from '@/components/ui/input';

export function NoteSearch() {
  const [search, setSearch] = useQueryState('q', {
    defaultValue: '',
    parse: (value) => value || '',
  });

  return (
    <Input
      type="search"
      placeholder="Search notes..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

---

## 5. コンポーネント設計

### 5.1 共有UIコンポーネント（shadcn/ui）

shadcn/ui のコンポーネントは必要に応じて追加する。

```bash
# 例: Button コンポーネント追加
npx shadcn-ui@latest add button

# 例: Dialog コンポーネント追加
npx shadcn-ui@latest add dialog
```

### 5.2 レイアウトコンポーネント

#### Header

```typescript
// packages/frontend/src/components/layout/header.tsx
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { Button } from '@/components/ui/button';

export function Header() {
  const { data } = useAuth();
  const user = data?.data.user;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          Markdown Notes
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/admin">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

#### Sidebar

```typescript
// packages/frontend/src/components/layout/sidebar.tsx
import { Link } from '@tanstack/react-router';
import { FileText, PlusCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  return (
    <aside className="w-64 border-r min-h-screen p-4">
      <nav className="space-y-2">
        <Link to="/admin/notes/new">
          <Button className="w-full justify-start" variant="default">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </Link>

        <Link to="/admin/notes">
          <Button className="w-full justify-start" variant="ghost">
            <FileText className="mr-2 h-4 w-4" />
            All Notes
          </Button>
        </Link>

        <Link to="/admin/settings">
          <Button className="w-full justify-start" variant="ghost">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </nav>
    </aside>
  );
}
```

### 5.3 機能コンポーネント

#### LoginForm

```typescript
// packages/frontend/src/features/auth/components/login-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '../hooks/use-login';
import { loginSchema, type LoginInput } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
```

#### NoteCard

```typescript
// packages/frontend/src/features/notes/components/note-card.tsx
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Note } from '../types';

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const preview = note.content.substring(0, 150) + '...';

  return (
    <Link to={`/notes/${note.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{note.title}</CardTitle>
            <Badge variant={note.visibility === 'public' ? 'default' : 'secondary'}>
              {note.visibility}
            </Badge>
          </div>
          <CardDescription>
            {formatDistanceToNow(new Date(note.updatedAt * 1000), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{preview}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

#### NoteList

```typescript
// packages/frontend/src/features/notes/components/note-list.tsx
import { NoteCard } from './note-card';
import type { Note } from '../types';

type NoteListProps = {
  notes: Note[];
};

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No notes found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
```

---

## 6. Markdownエディタ実装

### 6.1 Tiptap設定

```typescript
// packages/frontend/src/features/editor/utils/editor-config.ts
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

export const createEditor = (
    content: string,
    onUpdate: (markdown: string) => void,
) => {
    return new Editor({
        extensions: [
            StarterKit,
            Image,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing...',
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            const markdown = editor.storage.markdown.getMarkdown();
            onUpdate(markdown);
        },
    });
};
```

### 6.2 MarkdownEditor コンポーネント

```typescript
// packages/frontend/src/features/editor/components/markdown-editor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import { createEditor } from '../utils/editor-config';
import { EditorToolbar } from './editor-toolbar';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editor = useEditor({
    ...createEditor(value, onChange),
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[400px]"
      />
    </div>
  );
}
```

### 6.3 EditorToolbar

```typescript
// packages/frontend/src/features/editor/components/editor-toolbar.tsx
import type { Editor } from '@tiptap/react';
import { Bold, Italic, List, ListOrdered, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadButton } from './file-upload-button';

type EditorToolbarProps = {
  editor: Editor;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="border-b p-2 flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-accent' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-accent' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-accent' : ''}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-accent' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <FileUploadButton editor={editor} />
    </div>
  );
}
```

### 6.4 FileUploadButton

```typescript
// packages/frontend/src/features/editor/components/file-upload-button.tsx
import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadFile } from '@/features/upload/hooks/use-upload-file';

type FileUploadButtonProps = {
  editor: Editor;
};

export function FileUploadButton({ editor }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadFile } = useUploadFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadFile(file, {
      onSuccess: (data) => {
        // 画像の場合は挿入
        if (data.data.mimeType.startsWith('image/')) {
          editor.chain().focus().setImage({ src: data.data.url }).run();
        } else {
          // その他はリンクとして挿入
          editor.chain().focus().insertContent(
            `[${data.data.originalFilename}](${data.data.url})`
          ).run();
        }
      },
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
```

---

## 7. ユーティリティ関数

### 7.1 cn() ヘルパー

```typescript
// packages/frontend/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

### 7.2 日付フォーマット

```typescript
// packages/frontend/src/lib/utils.ts
import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (timestamp: number): string => {
    return format(new Date(timestamp * 1000), 'yyyy-MM-dd HH:mm');
};

export const formatRelativeTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
};
```

---

## 8. エラーハンドリング

### 8.1 エラーバウンダリ

```typescript
// packages/frontend/src/components/error-boundary.tsx
import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 9. テスト

### 9.1 Vitest設定

```typescript
// packages/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
});
```

### 9.2 テスト例

```typescript
// packages/frontend/src/features/notes/components/note-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteCard } from './note-card';

describe('NoteCard', () => {
  it('renders note title and preview', () => {
    const note = {
      id: '1',
      title: 'Test Note',
      content: 'This is a test content',
      visibility: 'public' as const,
      createdAt: Date.now() / 1000,
      updatedAt: Date.now() / 1000,
    };

    render(<NoteCard note={note} />);

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText(/This is a test content/)).toBeInTheDocument();
  });
});
```

---

## 10. 参考資料

- [React 19 Documentation](https://react.dev/)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tiptap Documentation](https://tiptap.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
