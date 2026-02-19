import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { AuthService } from '../services/auth.service';

type User = {
    id: string;
    username: string;
};

declare module 'hono' {
    interface ContextVariableMap {
        user: User | null;
    }
}

export const authMiddleware = async (c: Context, next: Next) => {
    const sessionId = getCookie(c, 'session_id');

    if (!sessionId) {
        c.set('user', null);
        return next();
    }

    const session = await AuthService.getSession(sessionId);

    if (session) {
        c.set('user', {
            id: session.user.id,
            username: session.user.username,
        });
    } else {
        c.set('user', null);
    }

    return next();
};

export const requireAuth = async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
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
    return next();
};
