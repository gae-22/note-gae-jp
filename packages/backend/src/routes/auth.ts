import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { loginSchema } from '@note-gae/shared';
import {
    verifyCredentials,
    createSession,
    deleteSession,
    getSessionAdmin,
} from '../services/auth';
import { requireAdmin } from '../middleware/auth';

export const authRoutes = new Hono();

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
        return c.json(
            {
                success: false,
                error: 'Validation failed',
                details: parsed.error.issues,
            },
            400,
        );
    }

    const user = await verifyCredentials(
        parsed.data.username,
        parsed.data.password,
    );
    if (!user) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    const sessionId = createSession(user.id);

    setCookie(c, 'session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return c.json({ success: true, data: { user } });
});

// POST /api/auth/logout
authRoutes.post('/logout', requireAdmin(), (c) => {
    const sessionId = getCookie(c, 'session_id');
    if (sessionId) {
        deleteSession(sessionId);
        deleteCookie(c, 'session_id', { path: '/' });
    }
    return c.json({ success: true });
});

// GET /api/auth/me
authRoutes.get('/me', requireAdmin(), (c) => {
    const auth = c.get('auth');
    if (auth.role !== 'admin' || !auth.adminId) {
        return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const user = getSessionAdmin(getCookie(c, 'session_id')!);
    if (!user) {
        return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    return c.json({ success: true, data: { user } });
});
