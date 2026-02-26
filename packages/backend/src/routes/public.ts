import { Hono } from 'hono';
import * as notesService from '../services/notes';

export const publicRoutes = new Hono();

// GET /api/public/notes
publicRoutes.get('/notes', (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;

  const result = notesService.listNotes({
    isPublic: true,
    sort: 'updatedAt',
    order: 'desc',
    page,
    limit,
  });

  // Strip content for list view
  const notes = result.notes.map(({ content, ...rest }) => rest);

  return c.json({
    success: true,
    data: { notes, pagination: result.pagination },
  });
});

// GET /api/public/notes/:id
publicRoutes.get('/notes/:id', (c) => {
  const id = c.req.param('id');
  const note = notesService.getNoteById(id);

  if (!note || !note.isPublic) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true, data: { note } });
});
