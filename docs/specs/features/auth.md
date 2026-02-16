# 認証機能詳細設計書

## 1. 認証機能概要

本システムは**セッションベース認証**を採用し、HttpOnly Cookieによるセッショントークン管理を行う。

### 1.1 認証方式

| 項目                 | 値                                |
| -------------------- | --------------------------------- |
| 認証方式             | Session-based Authentication      |
| セッション保存       | データベース（sessions テーブル） |
| トークン保存         | HttpOnly Cookie                   |
| セッション有効期限   | 7日間                             |
| パスワードハッシュ化 | bcrypt (cost factor: 10)          |

---

## 2. バックエンド実装

### 2.1 パスワードハッシュ化

#### hashPassword()

**ファイル:** `packages/backend/src/services/auth/hash-password.ts`

```typescript
import bcrypt from 'bcryptjs';

/**
 * パスワードをbcryptでハッシュ化する
 *
 * @param password - 平文パスワード
 * @returns ハッシュ化されたパスワード
 */
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};
```

**テストケース:**

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword } from './hash-password';
import bcrypt from 'bcryptjs';

describe('hashPassword', () => {
    it('should hash password correctly', async () => {
        const password = 'TestPassword123!';
        const hashed = await hashPassword(password);

        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(password);
        expect(await bcrypt.compare(password, hashed)).toBe(true);
    });
});
```

---

#### verifyPassword()

**ファイル:** `packages/backend/src/services/auth/verify-password.ts`

```typescript
import bcrypt from 'bcryptjs';

/**
 * パスワードとハッシュを比較する
 *
 * @param password - 平文パスワード
 * @param hash - ハッシュ化されたパスワード
 * @returns 一致すればtrue
 */
export const verifyPassword = async (
    password: string,
    hash: string,
): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};
```

**テストケース:**

```typescript
describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
        const password = 'TestPassword123!';
        const hash = await hashPassword(password);

        const result = await verifyPassword(password, hash);
        expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
        const password = 'TestPassword123!';
        const hash = await hashPassword(password);

        const result = await verifyPassword('WrongPassword', hash);
        expect(result).toBe(false);
    });
});
```

---

### 2.2 セッション管理

#### createSession()

**ファイル:** `packages/backend/src/services/auth/create-session.ts`

```typescript
import { ulid } from 'ulid';
import { randomBytes } from 'crypto';
import { db } from '../../db/client';
import { sessions } from '../../db/schema';

/**
 * ユーザーのセッションを作成する
 *
 * @param userId - ユーザーID
 * @returns セッショントークン
 */
export const createSession = async (userId: string): Promise<string> => {
    const sessionId = ulid();
    const token = randomBytes(32).toString('hex');

    // 有効期限: 7日後
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(sessions).values({
        id: sessionId,
        userId,
        token,
        expiresAt,
        createdAt: new Date(),
    });

    return token;
};
```

---

#### deleteSession()

**ファイル:** `packages/backend/src/services/auth/delete-session.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { sessions } from '../../db/schema';

/**
 * セッションを削除する（ログアウト時）
 *
 * @param token - セッショントークン
 */
export const deleteSession = async (token: string): Promise<void> => {
    await db.delete(sessions).where(eq(sessions.token, token));
};
```

---

#### getUserFromSession()

**ファイル:** `packages/backend/src/services/auth/get-user-from-session.ts`

```typescript
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../db/client';
import { sessions, users } from '../../db/schema';

type User = {
    id: string;
    username: string;
};

/**
 * セッショントークンからユーザーを取得する
 *
 * @param token - セッショントークン
 * @returns ユーザー情報（存在しない、または期限切れの場合はnull）
 */
export const getUserFromSession = async (
    token: string,
): Promise<User | null> => {
    const result = await db
        .select({
            id: users.id,
            username: users.username,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
            and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())),
        )
        .get();

    return result || null;
};
```

**ビジネスロジック:**

1. セッショントークンで `sessions` テーブルを検索
2. `users` テーブルと JOIN してユーザー情報を取得
3. セッション有効期限をチェック（`expiresAt > now()`）
4. 有効なセッションが存在すればユーザー情報を返却、なければ `null`

---

### 2.3 ログイン処理

#### loginUser()

**ファイル:** `packages/backend/src/services/auth/login.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { verifyPassword } from './verify-password';
import { createSession } from './create-session';

type LoginInput = {
    username: string;
    password: string;
};

type LoginResult =
    | {
          success: true;
          user: {
              id: string;
              username: string;
          };
          sessionToken: string;
      }
    | {
          success: false;
      };

/**
 * ユーザーログイン処理
 *
 * @param input - ユーザー名とパスワード
 * @returns ログイン成功時はユーザー情報とセッショントークン、失敗時はsuccess: false
 */
export const loginUser = async (input: LoginInput): Promise<LoginResult> => {
    // ユーザー検索
    const user = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .get();

    if (!user) {
        return { success: false };
    }

    // パスワード検証
    const isValid = await verifyPassword(input.password, user.passwordHash);

    if (!isValid) {
        return { success: false };
    }

    // セッション作成
    const sessionToken = await createSession(user.id);

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username,
        },
        sessionToken,
    };
};
```

**処理フロー:**

```
1. username で users テーブルを検索
   ↓
2. ユーザーが存在しない → { success: false }
   ↓
3. パスワードハッシュを検証
   ↓
4. パスワードが一致しない → { success: false }
   ↓
5. セッション作成（sessions テーブルに INSERT）
   ↓
6. { success: true, user, sessionToken } を返却
```

---

### 2.4 ルートハンドラ実装

**ファイル:** `packages/backend/src/routes/auth.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { loginSchema } from '../validators/auth';
import { loginUser } from '../services/auth/login';
import { deleteSession } from '../services/auth/delete-session';
import { getUserFromSession } from '../services/auth/get-user-from-session';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = new Hono();

// POST /api/auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
    const { username, password } = c.req.valid('json');

    const result = await loginUser({ username, password });

    if (!result.success) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password',
                },
            },
            401,
        );
    }

    // セッショントークンをCookieに保存
    setCookie(c, 'session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 7, // 7日間
        path: '/',
    });

    return c.json({
        success: true,
        data: {
            user: result.user,
        },
    });
});

// POST /api/auth/logout
authRoutes.post('/logout', authMiddleware, async (c) => {
    const sessionToken = getCookie(c, 'session_token');

    if (sessionToken) {
        await deleteSession(sessionToken);
    }

    deleteCookie(c, 'session_token');

    return c.json({
        success: true,
        data: null,
    });
});

// GET /api/auth/me
authRoutes.get('/me', async (c) => {
    const sessionToken = getCookie(c, 'session_token');

    if (!sessionToken) {
        return c.json({
            success: true,
            data: { user: null },
        });
    }

    const user = await getUserFromSession(sessionToken);

    return c.json({
        success: true,
        data: { user },
    });
});
```

---

## 3. ミドルウェア実装

### 3.1 authMiddleware（認証必須）

**ファイル:** `packages/backend/src/middleware/auth.ts`

```typescript
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getUserFromSession } from '../services/auth/get-user-from-session';

export const authMiddleware = async (c: Context, next: Next) => {
    const sessionToken = getCookie(c, 'session_token');

    if (!sessionToken) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            },
            401,
        );
    }

    const user = await getUserFromSession(sessionToken);

    if (!user) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired session',
                },
            },
            401,
        );
    }

    // Context にユーザー情報を保存
    c.set('user', user);

    await next();
};
```

**使用例:**

```typescript
// 管理者のみアクセス可能なエンドポイント
notesRoutes.post('/', authMiddleware, async (c) => {
    const user = c.get('user'); // ミドルウェアで設定されたユーザー情報
    // ...
});
```

---

### 3.2 optionalAuthMiddleware（認証任意）

**ファイル:** `packages/backend/src/middleware/auth.ts`

```typescript
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
    const sessionToken = getCookie(c, 'session_token');

    if (sessionToken) {
        const user = await getUserFromSession(sessionToken);

        if (user) {
            c.set('user', user);
        }
    }

    await next();
};
```

**使用例:**

```typescript
// 認証状態に応じて表示内容を変えるエンドポイント
notesRoutes.get('/', optionalAuthMiddleware, async (c) => {
    const user = c.get('user'); // undefined または User object

    if (user) {
        // 管理者: 全メモを返す
    } else {
        // ゲスト: 公開メモのみ返す
    }
});
```

---

## 4. フロントエンド実装

### 4.1 Zodスキーマ

**ファイル:** `packages/frontend/src/features/auth/schemas.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

---

### 4.2 Custom Hooks

#### useAuth()

**ファイル:** `packages/frontend/src/features/auth/hooks/use-auth.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/**
 * 現在のログインユーザー情報を取得する
 */
export const useAuth = () => {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const res = await apiClient.auth.me.$get();

            if (!res.ok) {
                throw new Error('Failed to fetch user');
            }

            return await res.json();
        },
        staleTime: Infinity, // ログイン情報は変化しにくいためキャッシュを長く保持
    });
};
```

---

#### useLogin()

**ファイル:** `packages/frontend/src/features/auth/hooks/use-login.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import type { LoginInput } from '../schemas';

/**
 * ログイン処理を行う
 */
export const useLogin = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (input: LoginInput) => {
            const res = await apiClient.auth.login.$post({
                json: input,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error.message);
            }

            return await res.json();
        },
        onSuccess: (data) => {
            // ユーザー情報をキャッシュに保存
            queryClient.setQueryData(['auth', 'me'], {
                success: true,
                data: { user: data.data.user },
            });

            toast({
                title: 'Success',
                description: 'Logged in successfully',
            });

            // 管理画面へリダイレクト
            navigate({ to: '/admin' });
        },
        onError: (error) => {
            toast({
                title: 'Login Failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

---

#### useLogout()

**ファイル:** `packages/frontend/src/features/auth/hooks/use-logout.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

/**
 * ログアウト処理を行う
 */
export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.auth.logout.$post();

            if (!res.ok) {
                throw new Error('Failed to logout');
            }

            return await res.json();
        },
        onSuccess: () => {
            // 全キャッシュをクリア
            queryClient.clear();

            toast({
                title: 'Success',
                description: 'Logged out successfully',
            });

            // ホームページへリダイレクト
            navigate({ to: '/' });
        },
        onError: (error) => {
            toast({
                title: 'Logout Failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
```

---

### 4.3 UIコンポーネント

#### LoginForm

**ファイル:** `packages/frontend/src/features/auth/components/login-form.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '../hooks/use-login';
import { loginSchema, type LoginInput } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle>Login to Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      autoComplete="username"
                      {...field}
                    />
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
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

---

#### LogoutButton

**ファイル:** `packages/frontend/src/features/auth/components/logout-button.tsx`

```typescript
import { useLogout } from '../hooks/use-logout';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <Button
      variant="ghost"
      onClick={() => logout()}
      disabled={isPending}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isPending ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
```

---

## 5. セキュリティ考慮事項

### 5.1 セッションCookie設定

```typescript
setCookie(c, 'session_token', token, {
    httpOnly: true, // JavaScript からアクセス不可（XSS対策）
    secure: true, // HTTPS のみ（本番環境）
    sameSite: 'Lax', // CSRF 対策
    maxAge: 604800, // 7日間
    path: '/', // 全パスで有効
});
```

### 5.2 パスワードポリシー

- **最小長:** 8文字
- **最大長:** 100文字
- **推奨:** 英大文字、小文字、数字、記号を含む

### 5.3 レート制限（ブルートフォース対策）

```typescript
import { rateLimiter } from 'hono-rate-limiter';

const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15分間
    max: 5, // 最大5回まで
    standardHeaders: 'draft-7',
    keyGenerator: (c) => {
        return c.req.header('x-forwarded-for') || 'unknown';
    },
    handler: (c) => {
        return c.json(
            {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many login attempts. Please try again later.',
                },
            },
            429,
        );
    },
});

authRoutes.post('/login', loginLimiter /* ... */);
```

### 5.4 セッションタイムアウト

期限切れセッションは定期的に削除する。

```typescript
// packages/backend/src/db/maintenance.ts
import { lt } from 'drizzle-orm';
import { db } from './client';
import { sessions } from './schema';

export const cleanupExpiredSessions = async () => {
    const result = await db
        .delete(sessions)
        .where(lt(sessions.expiresAt, new Date()));

    console.log(`Deleted ${result.changes} expired sessions`);
};
```

**Cron設定（例）:**

```typescript
// packages/backend/src/index.ts
import cron from 'node-cron';
import { cleanupExpiredSessions } from './db/maintenance';

// 毎日午前3時に実行
cron.schedule('0 3 * * *', async () => {
    await cleanupExpiredSessions();
});
```

---

## 6. テスト

### 6.1 バックエンドテスト

```typescript
// packages/backend/src/routes/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from 'hono/testing';
import { app } from '../../app';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { hashPassword } from '../../services/auth/hash-password';
import { ulid } from 'ulid';

describe('Auth API', () => {
    beforeEach(async () => {
        // テストユーザー作成
        await db.insert(users).values({
            id: ulid(),
            username: 'testuser',
            passwordHash: await hashPassword('TestPassword123!'),
            createdAt: new Date(),
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const client = testClient(app);

            const res = await client.auth.login.$post({
                json: {
                    username: 'testuser',
                    password: 'TestPassword123!',
                },
            });

            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.data.user.username).toBe('testuser');

            // Cookie が設定されているか確認
            const setCookieHeader = res.headers.get('set-cookie');
            expect(setCookieHeader).toContain('session_token');
            expect(setCookieHeader).toContain('HttpOnly');
        });

        it('should reject invalid credentials', async () => {
            const client = testClient(app);

            const res = await client.auth.login.$post({
                json: {
                    username: 'testuser',
                    password: 'WrongPassword',
                },
            });

            expect(res.status).toBe(401);

            const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_CREDENTIALS');
        });
    });
});
```

---

## 7. 参考資料

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcrypt npm package](https://www.npmjs.com/package/bcryptjs)
- [Hono Cookie Helper](https://hono.dev/helpers/cookie)
- [TanStack Query - Authentication](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
