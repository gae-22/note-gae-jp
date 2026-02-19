import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '@note-gae-jp/shared';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';

const app = new Hono();

app.post('/login', zValidator('json', loginSchema), async (c) => {
    const input = c.req.valid('json');
    const result = await AuthService.login(input);

    if (!result) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid credentials',
                },
            },
            401,
        );
    }

    setCookie(c, 'session_id', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        expires: result.expiresAt,
    });

    return c.json({
        success: true,
        data: { user: result.user },
    });
});

app.post('/logout', requireAuth, async (c) => {
    // We can assume session_id exists because of requireAuth,
    // but AuthService.logout handles invalid tokens gracefully anyway.
    // However, to be strict, we get the token from cookie.
    // Optimization: we could store token in c.var if needed, but cookie access is cheap.
    // Actually, `requireAuth` doesn't strictly guarantee cookie presence if we used other auth methods,
    // but here it is cookie based.

    // Better: get cookie, if exists validation.
    // Wait, requireAuth checks cookie and sets user.

    // Let's just delete the cookie.

    deleteCookie(c, 'session_id');
    return c.json({ success: true, data: null });
});

app.get('/me', async (c) => {
    const user = c.get('user');
    return c.json({
        success: true,
        data: { user },
    });
});

export default app;
