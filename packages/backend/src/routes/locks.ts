import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { renewLockSchema } from '@note-gae-jp/shared';
import { LockService } from '../services/lock.service';
import { requireAuth } from '../middleware/auth';

const app = new Hono();

// All lock routes require authentication
app.use('*', requireAuth);

/**
 * POST /api/notes/:id/lock — Acquire lock
 * Spec: api-design.md §Lock API
 */
app.post('/:id/lock', async (c) => {
    const noteId = c.req.param('id');
    const user = c.get('user')!;

    const result = await LockService.acquire(noteId, user.id);

    if ('error' in result) {
        if (result.error === 'NOT_FOUND') {
            return c.json(
                {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Note not found' },
                },
                404,
            );
        }
        if (result.error === 'CONFLICT') {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'CONFLICT',
                        message: 'Note is locked by another user',
                    },
                },
                409,
            );
        }
    }

    const lock = 'lock' in result ? result.lock : null;
    return c.json({
        success: true,
        data: lock
            ? {
                  ...lock,
                  expiresAt: lock.expiresAt.toISOString(),
                  createdAt: lock.createdAt.toISOString(),
              }
            : null,
    });
});

/**
 * DELETE /api/notes/:id/lock — Release lock
 */
app.delete('/:id/lock', async (c) => {
    const noteId = c.req.param('id');
    const lockToken = c.req.header('X-Lock-Token');
    const user = c.get('user')!;

    if (!lockToken) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'X-Lock-Token header required',
                },
            },
            400,
        );
    }

    const result = await LockService.release(noteId, lockToken, user.id);

    if ('error' in result) {
        return c.json(
            {
                success: false,
                error: { code: 'NOT_FOUND', message: 'Lock not found' },
            },
            404,
        );
    }

    return c.json({ success: true, data: null });
});

/**
 * GET /api/notes/:id/lock — Get lock status
 */
app.get('/:id/lock', async (c) => {
    const noteId = c.req.param('id');

    const lock = await LockService.getStatus(noteId);

    return c.json({
        success: true,
        data: lock
            ? {
                  ...lock,
                  expiresAt: lock.expiresAt.toISOString(),
                  createdAt: lock.createdAt.toISOString(),
              }
            : null,
    });
});

/**
 * PATCH /api/notes/:id/lock — Renew lock
 */
app.patch('/:id/lock', zValidator('json', renewLockSchema), async (c) => {
    const input = c.req.valid('json');
    const user = c.get('user')!;

    const result = await LockService.renew(input.lockToken, user.id);

    if ('error' in result) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Lock not found or expired',
                },
            },
            404,
        );
    }

    const lock = result.lock;
    return c.json({
        success: true,
        data: lock
            ? {
                  ...lock,
                  expiresAt: lock.expiresAt.toISOString(),
                  createdAt: lock.createdAt.toISOString(),
              }
            : null,
    });
});

export default app;
