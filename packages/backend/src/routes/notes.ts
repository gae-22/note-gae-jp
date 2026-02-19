import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
    createNoteSchema,
    updateNoteSchema,
    listNotesQuerySchema,
} from '@note-gae-jp/shared';
import { NoteService } from '../services/notes.service';
import { requireAuth } from '../middleware/auth';
import type { blockSchema } from '@note-gae-jp/shared';
import type { z } from 'zod';

const app = new Hono();

// List Notes
app.get('/', zValidator('query', listNotesQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const user = c.get('user');
    const result = await NoteService.list(query, user);

    // Transform for response (parsing JSON contentBlocks)
    const items = result.items.map((note) => ({
        ...note,
        contentBlocks: JSON.parse(note.contentBlocks) as z.infer<
            typeof blockSchema
        >[],
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        shareExpiresAt: note.shareExpiresAt?.toISOString() || null,
    }));

    return c.json({
        success: true,
        data: { ...result, items },
    });
});

// Get Note by ID
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const note = await NoteService.get(id, user);

    if (!note) {
        return c.json(
            {
                success: false,
                error: { code: 'NOT_FOUND', message: 'Note not found' },
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

// Create Note
app.post('/', requireAuth, zValidator('json', createNoteSchema), async (c) => {
    const input = c.req.valid('json');
    // const user = c.get('user')!; // Exists because of requireAuth
    const note = await NoteService.create(input);

    if (!note) {
        throw new Error('Failed to create note');
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

// Update Note
app.patch(
    '/:id',
    requireAuth,
    zValidator('json', updateNoteSchema),
    async (c) => {
        const id = c.req.param('id');
        const input = c.req.valid('json');
        // const user = c.get('user')!;

        const updated = await NoteService.update(id, input);

        if (!updated) {
            return c.json(
                {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Note not found' },
                },
                404,
            );
        }

        return c.json({
            success: true,
            data: {
                ...updated,
                contentBlocks: JSON.parse(updated.contentBlocks) as z.infer<
                    typeof blockSchema
                >[],
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
                shareExpiresAt: updated.shareExpiresAt?.toISOString() || null,
            },
        });
    },
);

// Delete Note
app.delete('/:id', requireAuth, async (c) => {
    const id = c.req.param('id');
    // const user = c.get('user')!;

    const deleted = await NoteService.delete(id);

    if (!deleted) {
        return c.json(
            {
                success: false,
                error: { code: 'NOT_FOUND', message: 'Note not found' },
            },
            404,
        );
    }

    return c.json({ success: true, data: { id: deleted.id } });
});

export default app;
