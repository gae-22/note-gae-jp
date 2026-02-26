import { Hono } from 'hono';
import { createNoteSchema, updateNoteSchema } from '@note-gae/shared';
import { requireAdmin } from '../middleware/auth';
import * as notesService from '../services/notes';

export const notesRoutes = new Hono();

// GET /api/notes — Admin only, with search/filter
notesRoutes.get('/', requireAdmin(), (c) => {
  const q = c.req.query('q');
  const tagsParam = c.req.query('tags');
  const isPublicParam = c.req.query('isPublic');
  const sort = c.req.query('sort') as 'createdAt' | 'updatedAt' | undefined;
  const order = c.req.query('order') as 'asc' | 'desc' | undefined;
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;

  const result = notesService.listNotes({
    q: q || undefined,
    tagNames: tagsParam ? tagsParam.split(',') : undefined,
    isPublic: isPublicParam !== undefined ? isPublicParam === '1' : undefined,
    sort,
    order,
    page,
    limit,
  });

  return c.json({ success: true, data: result });
});

// POST /api/notes
notesRoutes.post('/', requireAdmin(), async (c) => {
  const body = await c.req.json();
  const parsed = createNoteSchema.safeParse(body);
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

  const note = notesService.createNote(parsed.data);
  return c.json({ success: true, data: { note } }, 201);
});

// GET /api/notes/:id — Access controlled per role
notesRoutes.get('/:id', (c) => {
  const auth = c.get('auth');
  const id = c.req.param('id');
  const note = notesService.getNoteById(id);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  if (auth.role === 'admin') {
    return c.json({ success: true, data: { note } });
  }

  if (auth.role === 'share') {
    if (auth.shareToken?.noteId !== id) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    return c.json({ success: true, data: { note } });
  }

  // Public
  if (!note.isPublic) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  return c.json({ success: true, data: { note } });
});

// PATCH /api/notes/:id
notesRoutes.patch('/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateNoteSchema.safeParse(body);
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

  const existing = notesService.getNoteById(id);
  if (!existing) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  const note = notesService.updateNote(id, parsed.data);
  return c.json({ success: true, data: { note } });
});

// DELETE /api/notes/:id
notesRoutes.delete('/:id', requireAdmin(), (c) => {
  const id = c.req.param('id');
  const existing = notesService.getNoteById(id);
  if (!existing) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  notesService.deleteNote(id);
  return c.json({ success: true });
});
