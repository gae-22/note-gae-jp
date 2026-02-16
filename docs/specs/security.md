# セキュリティ設計書

## 1. セキュリティ概要

本システムのセキュリティ設計は、**OWASP Top 10** および **OWASP API Security Top 10** に基づき、以下の脅威に対する対策を実装する。

### 1.1 対象とする脅威

| 脅威                              | 対策                          |
| --------------------------------- | ----------------------------- |
| XSS (Cross-Site Scripting)        | エスケープ処理、CSP設定       |
| CSRF (Cross-Site Request Forgery) | CSRFトークン、SameSite Cookie |
| SQLインジェクション               | パラメータ化クエリ（ORM使用） |
| 認証バイパス                      | セッション検証、有効期限管理  |
| パストラバーサル                  | パス検証、ホワイトリスト方式  |
| ファイルアップロード攻撃          | MIMEタイプ・拡張子検証        |
| ブルートフォース攻撃              | レート制限、アカウントロック  |
| セッション固定攻撃                | セッションID再生成            |
| 情報漏洩                          | エラーメッセージのサニタイズ  |

---

## 2. 認証・認可

### 2.1 パスワードセキュリティ

#### パスワードハッシュ化

```typescript
import bcrypt from 'bcryptjs';

// bcrypt でハッシュ化（cost factor: 10）
const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};
```

**推奨パスワードポリシー:**

- 最小長: 8文字
- 最大長: 100文字
- 複雑さ: 英大文字・小文字・数字を含む（推奨）

**OWASP推奨事項:**

- bcrypt, scrypt, argon2 のいずれかを使用
- ソルトは自動生成（bcryptは自動）
- ペッパーは使用しない（DBと分離できないため）

---

### 2.2 セッション管理

#### セッションCookie設定

```typescript
setCookie(c, 'session_token', token, {
    httpOnly: true, // JavaScript からアクセス不可（XSS対策）
    secure: true, // HTTPS のみ（本番環境）
    sameSite: 'Lax', // CSRF対策
    maxAge: 604800, // 7日間
    path: '/',
});
```

**セキュリティ設定の意味:**

| 属性       | 説明                                                        |
| ---------- | ----------------------------------------------------------- |
| `httpOnly` | JavaScriptからのアクセスを禁止。XSS攻撃でもCookieは盗めない |
| `secure`   | HTTPS通信のみで送信。中間者攻撃対策                         |
| `sameSite` | クロスサイトリクエストでCookieを送信しない（CSRF対策）      |
| `maxAge`   | セッション有効期限（秒単位）                                |

#### セッション有効期限チェック

```typescript
export const getUserFromSession = async (token: string) => {
    const result = await db
        .select()
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
            and(
                eq(sessions.token, token),
                gt(sessions.expiresAt, new Date()), // 期限チェック
            ),
        )
        .get();

    return result || null;
};
```

#### セッション固定攻撃対策

```typescript
// ログイン成功時に新しいセッショントークンを発行
export const loginUser = async (input: LoginInput) => {
    // 認証成功

    // 既存セッションを削除（もしあれば）
    await db.delete(sessions).where(eq(sessions.userId, user.id));

    // 新しいセッション作成
    const sessionToken = await createSession(user.id);

    return { success: true, sessionToken };
};
```

---

### 2.3 レート制限（Brute Force対策）

```typescript
import { rateLimiter } from 'hono-rate-limiter';

// ログインエンドポイント: 15分間に5回まで
const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: 'draft-7',
    keyGenerator: (c) => {
        // IPアドレスベースの制限
        return (
            c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            'unknown'
        );
    },
    handler: (c) => {
        return c.json(
            {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message:
                        'Too many login attempts. Please try again in 15 minutes.',
                },
            },
            429,
        );
    },
});

authRoutes.post('/login', loginLimiter /* ... */);
```

**レート制限設定:**

| エンドポイント     | 制限        | 理由                 |
| ------------------ | ----------- | -------------------- |
| `POST /auth/login` | 15分間に5回 | ブルートフォース対策 |
| `POST /upload`     | 1分間に10回 | リソース枯渇対策     |
| `GET /notes`       | 1分間に60回 | DoS対策              |

---

## 3. XSS対策

### 3.1 React のデフォルトエスケープ

Reactは **デフォルトでXSSをエスケープ** する。

```tsx
// ✅ 安全（自動エスケープ）
<div>{userInput}</div>

// ❌ 危険（エスケープされない）
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**原則:** `dangerouslySetInnerHTML` は **絶対に使用しない**。

---

### 3.2 Markdownレンダリングのサニタイズ

```typescript
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

export const renderMarkdown = async (markdown: string): Promise<string> => {
    const result = await remark()
        .use(remarkGfm)
        .use(remarkHtml)
        .use(rehypeSanitize) // ✅ HTMLサニタイズ
        .process(markdown);

    return result.toString();
};
```

**rehypeSanitize の役割:**

- `<script>` タグを除去
- `onclick` 等のイベントハンドラを除去
- `javascript:` スキームのリンクを除去

---

### 3.3 Content Security Policy (CSP)

```typescript
// packages/backend/src/middleware/csp.ts
import type { Context, Next } from 'hono';

export const cspMiddleware = async (c: Context, next: Next) => {
    c.header(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'", // React では unsafe-inline が必要な場合がある
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "media-src 'self'",
            "object-src 'none'",
            "frame-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    );

    await next();
};

app.use('*', cspMiddleware);
```

---

## 4. CSRF対策

### 4.1 SameSite Cookie

```typescript
// session_token Cookie に SameSite=Lax を設定
setCookie(c, 'session_token', token, {
    sameSite: 'Lax', // クロスサイトリクエストではCookieを送信しない
    // ...
});
```

**SameSite の動作:**

| 値       | 動作                                                         |
| -------- | ------------------------------------------------------------ |
| `Strict` | 全てのクロスサイトリクエストでCookieを送信しない（最も厳格） |
| `Lax`    | トップレベルナビゲーション（GETリクエスト）のみ送信          |
| `None`   | 常に送信（`Secure` 属性必須）                                |

**推奨:** `Lax` （ユーザビリティとセキュリティのバランス）

---

### 4.2 CSRFトークン（POST/PATCH/DELETE）

```typescript
import { csrf } from 'hono/csrf';

export const csrfMiddleware = csrf({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
});

app.use('/api/*', csrfMiddleware);
```

**動作:**

1. `Origin` または `Referer` ヘッダーをチェック
2. 許可されたオリジンからのリクエストのみ受け付ける

---

## 5. SQLインジェクション対策

### 5.1 Drizzle ORM の使用

Drizzle ORM は **パラメータ化クエリ** を自動生成するため、SQLインジェクションは発生しない。

```typescript
// ✅ 安全（パラメータ化クエリ）
const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

// ❌ 危険（生SQL）
const user = await db.run(
    sql.raw(`SELECT * FROM users WHERE username = '${username}'`),
);
```

**原則:** `sql.raw()` は **絶対に使用しない**。

---

### 5.2 生SQLを使う場合

FTS5検索など、生SQLが必要な場合は **必ずパラメータバインディング** を使用する。

```typescript
// ✅ 安全（パラメータバインディング）
const results = await db.all(sql`
  SELECT * FROM notes_fts
  WHERE notes_fts MATCH ${query}
`);

// ❌ 危険（文字列連結）
const results = await db.all(
    sql.raw(`SELECT * FROM notes_fts WHERE notes_fts MATCH '${query}'`),
);
```

---

## 6. ファイルアップロードセキュリティ

### 6.1 MIMEタイプ検証

```typescript
const ALLOWED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    // ...
]);

export const validateFile = (file: File): void => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error('Unsupported file type');
    }

    // 拡張子も検証（二重拡張子攻撃対策）
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error('Invalid file extension');
    }
};
```

---

### 6.2 ファイルサイズ制限

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds limit');
}
```

---

### 6.3 パストラバーサル対策

```typescript
import { basename, resolve } from 'path';

// ファイル名からディレクトリ部分を除去
const filename = basename(file.name);

// 保存先パスの検証
const uploadsDir = resolve(process.cwd(), 'uploads');
const fullPath = resolve(uploadsDir, relativePath);

if (!fullPath.startsWith(uploadsDir)) {
    throw new Error('Invalid file path');
}
```

---

### 6.4 実行権限の剥奪

```bash
# uploads/ ディレクトリには実行権限を付与しない
chmod -R 644 uploads/**/*
find uploads/ -type d -exec chmod 755 {} \;
```

---

### 6.5 Content-Type の強制

```typescript
// 静的ファイル配信時、正しいContent-Typeを返す
app.use(
    '/uploads/*',
    serveStatic({
        root: './',
        mimes: {
            png: 'image/png',
            jpg: 'image/jpeg',
            pdf: 'application/pdf',
            // ...
        },
    }),
);
```

---

## 7. 情報漏洩対策

### 7.1 エラーメッセージのサニタイズ

```typescript
// ❌ 悪い例（詳細なエラー情報を返す）
} catch (error) {
  return c.json({ error: error.message }, 500);
}

// ✅ 良い例（一般的なメッセージのみ）
} catch (error) {
  console.error('Internal error:', error);  // サーバーログに記録

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  );
}
```

---

### 7.2 スタックトレースの非表示

```typescript
// packages/backend/src/middleware/error-handler.ts
export const errorHandler = async (c: Context, next: Next) => {
    try {
        await next();
    } catch (error) {
        // 本番環境ではスタックトレースを返さない
        if (process.env.NODE_ENV === 'production') {
            console.error(error);
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred',
                    },
                },
                500,
            );
        }

        // 開発環境ではスタックトレースを返す
        return c.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message,
                    stack: error.stack,
                },
            },
            500,
        );
    }
};
```

---

### 7.3 ユーザー列挙攻撃対策

ログイン失敗時、ユーザーの存在を推測できないようにする。

```typescript
// ❌ 悪い例
if (!user) {
    return c.json({ error: 'User not found' }, 404);
}
if (!isValidPassword) {
    return c.json({ error: 'Invalid password' }, 401);
}

// ✅ 良い例（どちらも同じメッセージ）
if (!user || !isValidPassword) {
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
```

---

## 8. HTTPSの強制

### 8.1 本番環境でのHTTPS必須化

```typescript
// packages/backend/src/middleware/force-https.ts
export const forceHttps = async (c: Context, next: Next) => {
    if (process.env.NODE_ENV === 'production') {
        const proto = c.req.header('x-forwarded-proto');

        if (proto !== 'https') {
            const httpsUrl = `https://${c.req.header('host')}${c.req.url}`;
            return c.redirect(httpsUrl, 301);
        }
    }

    await next();
};

app.use('*', forceHttps);
```

---

### 8.2 HSTS (HTTP Strict Transport Security)

```typescript
app.use('*', async (c, next) => {
    if (process.env.NODE_ENV === 'production') {
        c.header(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
        );
    }
    await next();
});
```

---

## 9. セキュリティヘッダー

### 9.1 推奨セキュリティヘッダー

```typescript
// packages/backend/src/middleware/security-headers.ts
export const securityHeaders = async (c: Context, next: Next) => {
    // XSS対策
    c.header('X-Content-Type-Options', 'nosniff');

    // クリックジャッキング対策
    c.header('X-Frame-Options', 'DENY');

    // MIME Sniffing対策
    c.header('X-Content-Type-Options', 'nosniff');

    // XSS Protection（古いブラウザ用）
    c.header('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    await next();
};

app.use('*', securityHeaders);
```

---

## 10. 共有リンクのセキュリティ

### 10.1 推測不可能なトークン

```typescript
import { v4 as uuidv4 } from 'uuid';

// UUID v4 を使用（推測不可能）
const shareToken = uuidv4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

**UUIDの強度:**

- UUID v4 は 122ビットのランダム性
- 衝突確率: 約 $1 / 2^{122}$ （天文学的に低い）

---

### 10.2 有効期限の厳格な検証

```typescript
export const validateShareToken = async (token: string) => {
    const note = await db
        .select()
        .from(notes)
        .where(
            and(
                eq(notes.shareToken, token),
                eq(notes.visibility, 'shared'),
                or(
                    isNull(notes.shareExpiresAt),
                    gt(notes.shareExpiresAt, new Date()), // 期限チェック
                ),
            ),
        )
        .get();

    return note || null;
};
```

---

### 10.3 共有リンク経由のアクセスログ

```typescript
// 将来的な拡張: アクセスログを記録
const logShareAccess = async (shareToken: string, ipAddress: string) => {
    await db.insert(shareAccessLogs).values({
        id: ulid(),
        shareToken,
        ipAddress,
        accessedAt: new Date(),
    });
};
```

---

## 11. 定期的なセキュリティメンテナンス

### 11.1 期限切れセッションの削除

```typescript
// 毎日実行
export const cleanupExpiredSessions = async () => {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
};
```

### 11.2 期限切れ共有リンクのクリア

```typescript
export const cleanupExpiredShares = async () => {
    await db
        .update(notes)
        .set({
            visibility: 'private',
            shareToken: null,
            shareExpiresAt: null,
        })
        .where(
            and(
                eq(notes.visibility, 'shared'),
                lt(notes.shareExpiresAt, new Date()),
            ),
        );
};
```

### 11.3 依存関係の脆弱性チェック

```bash
# 定期的に実行
pnpm audit

# 自動修正
pnpm audit --fix
```

---

## 12. セキュリティチェックリスト

### 本番環境デプロイ前

- [ ] HTTPS の有効化
- [ ] セキュリティヘッダーの設定
- [ ] CSP (Content Security Policy) の設定
- [ ] CSRF対策の有効化
- [ ] レート制限の設定
- [ ] エラーメッセージのサニタイズ
- [ ] デフォルトパスワードの変更
- [ ] 不要なエンドポイントの削除
- [ ] ログ監視の設定
- [ ] バックアップの自動化

### コードレビュー時

- [ ] `dangerouslySetInnerHTML` の使用禁止
- [ ] `sql.raw()` の使用禁止
- [ ] パスワードの平文保存禁止
- [ ] ユーザー入力の適切なバリデーション
- [ ] ファイルアップロードの検証
- [ ] 認証・認可のチェック

---

## 13. 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
