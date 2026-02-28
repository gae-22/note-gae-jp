import { Hono } from 'hono';
import { createTagSchema, updateTagSchema } from '@note-gae/shared';
import { requireAdmin } from '../middleware/auth';
import * as tagsService from '../services/tags';

export const tagsRoutes = new Hono();

// GET /api/tags
tagsRoutes.get('/', requireAdmin(), (c) => {
  const tags = tagsService.listTags();
  return c.json({ success: true, data: { tags } });
});

// POST /api/tags
tagsRoutes.post('/', requireAdmin(), async (c) => {
  const body = await c.req.json();
  const parsed = createTagSchema.safeParse(body);
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

  try {
    const tag = tagsService.createTag(parsed.data);
    return c.json({ success: true, data: { tag } }, 201);
  } catch {
    return c.json({ success: false, error: 'Tag already exists' }, 409);
  }
});

// PATCH /api/tags/:id
tagsRoutes.patch('/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateTagSchema.safeParse(body);
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

  const tag = tagsService.updateTag(id, parsed.data);
  if (!tag) {
    return c.json({ success: false, error: 'Tag not found' }, 404);
  }
  return c.json({ success: true, data: { tag } });
});

// DELETE /api/tags/:id
tagsRoutes.delete('/:id', requireAdmin(), (c) => {
  const id = c.req.param('id');
  tagsService.deleteTag(id);
  return c.json({ success: true });
});

export default tagsRoutes;
