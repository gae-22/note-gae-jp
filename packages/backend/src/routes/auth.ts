import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '@note-gae-jp/shared';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rate-limit';
import { env } from '../env';

const app = new Hono();

// Login — with rate limiting (Spec: security.md §4)
app.post(
    '/login',
    loginRateLimiter,
    zValidator('json', loginSchema),
    async (c) => {
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
            secure: env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/',
            expires: result.expiresAt,
        });

        return c.json({
            success: true,
            data: { user: result.user },
        });
    },
);

// Logout — delete session from DB AND clear cookie (Spec fix: was only clearing cookie)
app.post('/logout', requireAuth, async (c) => {
    const token = getCookie(c, 'session_id');

    if (token) {
        await AuthService.logout(token);
    }

    deleteCookie(c, 'session_id');
    return c.json({ success: true, data: null });
});

// Get current user
app.get('/me', async (c) => {
    const user = c.get('user');
    return c.json({
        success: true,
        data: { user },
    });
});

export default app;
