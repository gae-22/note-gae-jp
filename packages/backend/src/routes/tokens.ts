import { Hono } from 'hono';
import { createTokenSchema } from '@note-gae/shared';
import { requireAdmin } from '../middleware/auth';
import * as tokensService from '../services/tokens';
import { getEnv } from '../env';

export const tokensRoutes = new Hono();

// GET /api/tokens/note/:noteId — list tokens for a note
tokensRoutes.get('/note/:noteId', requireAdmin(), (c) => {
    const noteId = c.req.param('noteId');
    const tokens = tokensService.listTokensByNoteId(noteId);
    const env = getEnv();

    const tokensWithUrl = tokens.map((t) => ({
        ...t,
        shareUrl: `${env.FRONTEND_URL}/s/${t.id}`,
    }));

    return c.json({ success: true, data: { tokens: tokensWithUrl } });
});

// POST /api/tokens/note/:noteId — create token
tokensRoutes.post('/note/:noteId', requireAdmin(), async (c) => {
    const noteId = c.req.param('noteId');
    const body = await c.req.json();
    const parsed = createTokenSchema.safeParse(body);
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

    const env = getEnv();
    const token = tokensService.createShareToken(noteId, parsed.data);
    return c.json(
        {
            success: true,
            data: {
                token: {
                    ...token,
                    shareUrl: `${env.FRONTEND_URL}/s/${token.id}`,
                },
            },
        },
        201,
    );
});

// DELETE /api/tokens/:id — revoke token
tokensRoutes.delete('/:id', requireAdmin(), (c) => {
    const id = c.req.param('id');
    tokensService.revokeToken(id);
    return c.json({ success: true });
});
