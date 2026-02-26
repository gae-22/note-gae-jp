import { Hono } from 'hono';
import { createCommentSchema } from '@note-gae/shared';
import { requireAdmin, requireAuth } from '../middleware/auth';
import * as commentsService from '../services/comments';

export const commentsRoutes = new Hono();

// GET /api/comments/note/:noteId
commentsRoutes.get('/note/:noteId', requireAuth(), (c) => {
    const auth = c.get('auth');
    const noteId = c.req.param('noteId');

    // Share users can only view comments on their authorized note
    if (auth.role === 'share' && auth.shareToken?.noteId !== noteId) {
        return c.json({ success: false, error: 'Forbidden' }, 403);
    }

    const comments = commentsService.listCommentsByNoteId(noteId);
    return c.json({ success: true, data: { comments } });
});

// POST /api/comments/note/:noteId
commentsRoutes.post('/note/:noteId', requireAuth(), async (c) => {
    const auth = c.get('auth');
    const noteId = c.req.param('noteId');

    // Share users can only comment on their authorized note
    if (auth.role === 'share' && auth.shareToken?.noteId !== noteId) {
        return c.json({ success: false, error: 'Forbidden' }, 403);
    }

    const body = await c.req.json();
    const parsed = createCommentSchema.safeParse(body);
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

    const comment = commentsService.createComment(noteId, {
        authorName: auth.role === 'admin' ? 'gae' : parsed.data.authorName,
        body: parsed.data.body,
        shareTokenId: auth.role === 'share' ? auth.shareToken?.id : null,
    });

    return c.json({ success: true, data: { comment } }, 201);
});

// DELETE /api/comments/:id — Admin only
commentsRoutes.delete('/:id', requireAdmin(), (c) => {
    const id = c.req.param('id');
    commentsService.deleteComment(id);
    return c.json({ success: true });
});
