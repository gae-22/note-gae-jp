import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db/client';
import { sessions, shareTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export type AuthContext = {
    role: 'admin' | 'share' | 'public';
    adminId?: string;
    shareToken?: { id: string; noteId: string };
};

declare module 'hono' {
    interface ContextVariableMap {
        auth: AuthContext;
    }
}

export const authMiddleware = () => {
    return createMiddleware(async (c, next) => {
        const db = getDb();

        // 1. Session auth (Admin)
        const sessionId = getCookie(c, 'session_id');
        if (sessionId) {
            const [session] = db
                .select()
                .from(sessions)
                .where(
                    and(
                        eq(sessions.id, sessionId),
                        gt(sessions.expiresAt, new Date()),
                    ),
                )
                .all();

            if (session) {
                c.set('auth', { role: 'admin', adminId: session.adminId });
                return next();
            }
        }

        // 2. Token auth (Share)
        const token = c.req.query('token');
        if (token) {
            const [shareToken] = db
                .select()
                .from(shareTokens)
                .where(
                    and(
                        eq(shareTokens.id, token),
                        eq(shareTokens.isRevoked, false),
                        gt(shareTokens.expiresAt, new Date()),
                    ),
                )
                .all();

            if (shareToken) {
                c.set('auth', {
                    role: 'share',
                    shareToken: {
                        id: shareToken.id,
                        noteId: shareToken.noteId,
                    },
                });
                return next();
            }

            return c.json(
                { success: false, error: 'Token expired or invalid' },
                403,
            );
        }

        // 3. Public
        c.set('auth', { role: 'public' });
        return next();
    });
};

export const requireAdmin = () => {
    return createMiddleware(async (c, next) => {
        const auth = c.get('auth');
        if (auth.role !== 'admin') {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }
        return next();
    });
};

export const requireAuth = () => {
    return createMiddleware(async (c, next) => {
        const auth = c.get('auth');
        if (auth.role === 'public') {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }
        return next();
    });
};
