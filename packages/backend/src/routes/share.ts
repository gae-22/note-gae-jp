import { Hono } from 'hono';
import { NoteService } from '../services/notes.service';
import type { z } from 'zod';
import type { blockSchema } from '@note-gae-jp/shared';

const app = new Hono();

/**
 * GET /api/share/:token — Access shared note by share token
 * Spec: api-design.md §Shared Link
 * No authentication required.
 */
app.get('/:token', async (c) => {
    const token = c.req.param('token');
    const note = await NoteService.getByShareToken(token);

    if (!note) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Shared note not found or link expired',
                },
            },
            404,
        );
    }

    return c.json({
        success: true,
        data: {
            ...note,
            contentBlocks: JSON.parse(note.contentBlocks) as z.infer<
                typeof blockSchema
            >[],
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
            shareExpiresAt: note.shareExpiresAt?.toISOString() || null,
        },
    });
});

export default app;
