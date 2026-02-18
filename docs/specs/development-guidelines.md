# 開発ガイドライン

概要: コーディング規約、テスト戦略、ブランチ運用、フォーマット/リンティングの方針をまとめた開発者向けハンドブックです。

推奨読者: 開発者全員、コードレビュワー、CI 設定担当。

重要ポイント:

- TypeScript の厳格モードと Zod による型・バリデーション共有を重視。
- テスト（Vitest / Playwright）と Biome による品質ゲートを CI に組み込むこと。
- Feature-based Colocation を採用し可読性と保守性を高める。

## 1. デザイン原則

### 1.1 KISS (Keep It Simple, Stupid)

**シンプルな実装を優先する。**

- 複雑な抽象化を避ける
- 一目で理解できるコードを書く
- 必要になるまで汎用化しない

**良い例:**

```typescript
// ✅ シンプル
const isAuthenticated = !!user;

// ❌ 過剰に複雑
const isAuthenticated = (() => {
    if (user) {
        return user !== null && user !== undefined;
    }
    return false;
})();
```

---

### 1.2 YAGNI (You Aren't Gonna Need It)

**必要になってから実装する。**

- 将来使うかもしれない機能は実装しない
- 現時点で必要な機能のみ実装する
- 拡張性は必要になった時に追加する

**良い例:**

```typescript
// ✅ 必要な機能のみ
export const createNote = async (input: CreateNoteInput) => {
    return await db.insert(notes).values(input);
};

// ❌ 不要な拡張性
export const createNote = async (
    input: CreateNoteInput,
    options?: {
        hooks?: {
            beforeCreate?: (input: CreateNoteInput) => void;
            afterCreate?: (note: Note) => void;
        };
        middleware?: Array<(note: Note) => Note>;
    },
) => {
    // 複雑な処理...
};
```

---

### 1.3 DRY (Don't Repeat Yourself)

**重複コードは関数化する。**

ただし、1-2行の単純なコードを無理に共通化しない（KISS原則を優先）。

```typescript
// ❌ 重複
const user1 = await db.select().from(users).where(eq(users.id, id1)).get();
const user2 = await db.select().from(users).where(eq(users.id, id2)).get();

// ✅ 共通関数化
const getUserById = async (id: number) => {
    return await db.select().from(users).where(eq(users.id, id)).get();
};

const user1 = await getUserById(id1);
const user2 = await getUserById(id2);
```

---

## 2. TypeScript コーディング規約

### 2.1 Strict モード

`tsconfig.json` で厳格な型チェックを有効にする。

```json
{
    "compilerOptions": {
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true
    }
}
```

---

### 2.2 型定義

#### 明示的な型注釈

関数の引数・戻り値には **必ず型注釈** を付ける。

```typescript
// ✅ 良い例
export const createNote = async (input: CreateNoteInput): Promise<Note> => {
    // ...
};

// ❌ 悪い例
export const createNote = async (input) => {
    // ...
};
```

#### Zod スキーマからの型推論

APIのリクエスト/レスポンス型は **Zodスキーマから推論** する。

```typescript
import { z } from 'zod';

export const createNoteSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string(),
});

// Zod スキーマから型を推論
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
```

#### `any` の使用禁止

`any` は **絶対に使用しない**。どうしても必要な場合は `unknown` を使用する。

```typescript
// ❌ 悪い例
const data: any = JSON.parse(json);

// ✅ 良い例
const data: unknown = JSON.parse(json);

// 型ガードで安全に使用
if (isNote(data)) {
    console.log(data.title);
}
```

---

### 2.3 Null/Undefined の扱い

#### Nullish Coalescing 演算子

デフォルト値の設定には `??` を使用する。

```typescript
// ✅ 良い例
const title = note.title ?? 'Untitled';

// ❌ 悪い例（空文字列もデフォルト値になる）
const title = note.title || 'Untitled';
```

#### Optional Chaining

ネストしたプロパティアクセスには `?.` を使用する。

```typescript
// ✅ 良い例
const username = user?.profile?.name;

// ❌ 悪い例
const username = user && user.profile && user.profile.name;
```

---

## 3. React コーディング規約

### 3.1 関数コンポーネント

全てのコンポーネントは **関数コンポーネント** で実装する。

```typescript
// ✅ 良い例
export const NoteCard = ({ note }: { note: Note }) => {
  return <div>{note.title}</div>;
};

// ❌ 悪い例（クラスコンポーネント）
export class NoteCard extends React.Component<{ note: Note }> {
  render() {
    return <div>{this.props.note.title}</div>;
  }
}
```

---

### 3.2 Props の型定義

Props は **インターフェース** で定義する。

```typescript
interface NoteCardProps {
    note: Note;
    onDelete?: (id: number) => void;
}

export const NoteCard = ({ note, onDelete }: NoteCardProps) => {
    // ...
};
```

---

### 3.3 手動メモ化の禁止

**React Compiler が最適化するため、手動メモ化は不要。**

```typescript
// ❌ 不要（React Compiler が自動最適化）
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => {
    doSomething(a, b);
}, [a, b]);

// ✅ そのまま書く
const value = computeExpensiveValue(a, b);
const callback = () => {
    doSomething(a, b);
};
```

**例外:** 以下の場合のみ `useMemo`/`useCallback` を使用する。

- サードパーティライブラリとの統合
- 意図的な再計算の抑制（例: debounce）

---

### 3.4 Custom Hooks

ロジックの再利用には **Custom Hooks** を使用する。

```typescript
// packages/frontend/src/hooks/useAuth.ts
export const useAuth = () => {
    const { data: user, isLoading } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => apiClient.auth.me.$get(),
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
    };
};
```

---

### 3.5 状態管理

#### TanStack Query を使用

サーバー状態は **TanStack Query** で管理する。

```typescript
// ✅ TanStack Query を使用
const { data: notes, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => apiClient.notes.$get(),
});

// ❌ useState + useEffect で管理
const [notes, setNotes] = useState<Note[]>([]);
useEffect(() => {
    fetchNotes().then(setNotes);
}, []);
```

#### useState の使用

ローカル状態（UI状態）は `useState` で管理する。

```typescript
const [isOpen, setIsOpen] = useState(false);
```

#### グローバル状態管理ライブラリの禁止

**Zustand/Redux/Jotai などは使用しない。**

- サーバー状態: TanStack Query
- ローカル状態: useState
- コンポーネント間の状態共有: Props や Context

---

## 4. APIクライアント

### 4.1 Hono RPC の使用

**全てのAPIリクエストは Hono RPC (`hono/client`) 経由で行う。**

```typescript
// packages/frontend/src/lib/api-client.ts
import { hc } from 'hono/client';
import type { AppType } from '@note-app/backend';

export const apiClient = hc<AppType>('/api');
```

**Fetch API の直接使用を禁止:**

```typescript
// ❌ 悪い例
const response = await fetch('/api/notes');
const notes = await response.json();

// ✅ 良い例
const response = await apiClient.notes.$get();
const notes = await response.json();
```

---

### 4.2 型安全性

Hono RPCは **型安全** なAPIクライアントを提供する。

```typescript
// バックエンドの型定義が自動的に反映される
const response = await apiClient.notes.$post({
    json: {
        title: 'New Note',
        content: '',
    },
});

// TypeScriptがエラーを検出
const response = await apiClient.notes.$post({
    json: {
        invalidField: 'error', // ❌ コンパイルエラー
    },
});
```

---

## 5. データベース

### 5.1 Drizzle ORM の使用

**生SQLは禁止。Drizzle ORMを使用する。**

```typescript
// ✅ Drizzle ORM
const user = await db.select().from(users).where(eq(users.id, id)).get();

// ❌ 生SQL（セキュリティリスク）
const user = await db.run(sql.raw(`SELECT * FROM users WHERE id = ${id}`));
```

---

### 5.2 マイグレーション

#### マイグレーションファイルの生成

```bash
# スキーマ変更後、マイグレーションを生成
pnpm --filter @note-app/backend db:generate
```

#### マイグレーションの適用

```bash
# 本番環境では必ず手動で実行
pnpm --filter @note-app/backend db:migrate
```

**自動マイグレーションの禁止:**

本番環境では `drizzle-kit push` を使用しない。

---

## 6. ファイル構成

### 6.1 Feature-based Colocation

機能ごとにファイルを配置する。

```
packages/frontend/src/
  features/
    auth/
      components/
        LoginForm.tsx
        RegisterForm.tsx
      hooks/
        useAuth.ts
      types.ts
    notes/
      components/
        NoteCard.tsx
        NoteList.tsx
        NoteEditor.tsx
      hooks/
        useNotes.ts
        useCreateNote.ts
      types.ts
```

---

### 6.2 ファイル命名規則

| ファイルタイプ      | 命名規則            | 例                    |
| ------------------- | ------------------- | --------------------- |
| Reactコンポーネント | PascalCase + `.tsx` | `NoteCard.tsx`        |
| カスタムフック      | `use` + camelCase   | `useNotes.ts`         |
| 型定義              | `types.ts`          | `types.ts`            |
| ユーティリティ      | camelCase + `.ts`   | `formatDate.ts`       |
| API ルート          | kebab-case + `.ts`  | `notes.ts`, `auth.ts` |

---

## 7. テスト

### 7.1 テストフレームワーク

- **Vitest**: 単体テスト・統合テスト
- **Playwright**: E2Eテスト

---

### 7.2 テストの配置

テストファイルは **テスト対象と同じディレクトリ** に配置する。

```
packages/frontend/src/features/notes/
  components/
    NoteCard.tsx
    NoteCard.test.tsx       # ← Reactコンポーネントのテスト
  hooks/
    useNotes.ts
    useNotes.test.ts        # ← Custom Hooksのテスト
```

---

### 7.3 テスト命名規則

| ファイルタイプ | 命名規則                        |
| -------------- | ------------------------------- |
| 単体テスト     | `*.test.ts` または `*.test.tsx` |
| E2Eテスト      | `*.spec.ts`                     |

---

### 7.4 テストカバレッジ

目標カバレッジ: **80%以上**

```bash
# カバレッジを確認
pnpm test:coverage
```

---

## 8. Git ワークフロー

### 8.1 ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `fix/*`: バグ修正

---

### 8.2 コミットメッセージ

**Conventional Commits** に従う。

```
<type>(<scope>): <subject>

<body>

<footer>
```

**例:**

```
feat(notes): add full-text search

- Add FTS5 virtual table
- Implement search API endpoint
- Add search UI component

Closes #123
```

**Type の種類:**

| Type       | 説明                             |
| ---------- | -------------------------------- |
| `feat`     | 新機能                           |
| `fix`      | バグ修正                         |
| `docs`     | ドキュメント変更                 |
| `style`    | フォーマット変更（動作変更なし） |
| `refactor` | リファクタリング                 |
| `test`     | テスト追加・修正                 |
| `chore`    | ビルド・設定変更                 |

---

## 9. コードフォーマット

### 9.1 Biome の使用

**Prettier/ESLint の代わりに Biome を使用する。**

```bash
# フォーマット + Lint
pnpm format

# Lint のみ
pnpm lint
```

---

### 9.2 エディタ設定

**VS Code の場合:**

`.vscode/settings.json`:

```json
{
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "quickfix.biome": "explicit",
        "source.organizeImports.biome": "explicit"
    }
}
```

---

## 10. パフォーマンス最適化

### 10.1 コード分割

TanStack Router の `lazy` を使用する。

```typescript
import { lazy } from 'react';

const NotesPage = lazy(() => import('./pages/NotesPage'));
```

---

### 10.2 画像最適化

- WebP 形式を優先
- 適切なサイズにリサイズ
- 遅延読み込み (`loading="lazy"`)

```tsx
<img
    src='/uploads/2024/01/image.webp'
    alt='Note image'
    loading='lazy'
    width={800}
    height={600}
/>
```

---

### 10.3 データベースクエリ最適化

- 必要なカラムのみ取得
- インデックスを適切に設定
- N+1問題を回避（JOIN を使用）

```typescript
// ✅ 良い例（JOIN を使用）
const notesWithUser = await db
    .select({
        id: notes.id,
        title: notes.title,
        username: users.username,
    })
    .from(notes)
    .leftJoin(users, eq(notes.userId, users.id));

// ❌ 悪い例（N+1問題）
const notes = await db.select().from(notes);
for (const note of notes) {
    const user = await db.select().from(users).where(eq(users.id, note.userId));
}
```

---

## 11. セキュリティチェックリスト

**コードレビュー時に確認する項目:**

- [ ] ユーザー入力のバリデーション（Zod使用）
- [ ] SQLインジェクション対策（Drizzle ORM使用）
- [ ] XSS対策（`dangerouslySetInnerHTML` 未使用）
- [ ] CSRF対策（`sameSite` Cookie設定）
- [ ] 認証・認可チェック（middleware使用）
- [ ] ファイルアップロードの検証（MIME/拡張子/サイズ）
- [ ] パスワードのハッシュ化（Argon2id使用）
- [ ] 機密情報のログ出力禁止

---

## 12. デプロイ前チェックリスト

- [ ] 本番環境での動作確認
- [ ] データベースマイグレーション実行
- [ ] 環境変数の設定
- [ ] HTTPS の有効化
- [ ] セキュリティヘッダーの設定
- [ ] エラー監視の設定（Sentry等）
- [ ] バックアップの設定
- [ ] ログ監視の設定
- [ ] パフォーマンステスト実行
- [ ] 依存関係の脆弱性チェック (`pnpm audit`)

---

## 13. 参考資料

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TanStack Query Documentation](https://tanstack.com/query/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
