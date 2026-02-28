import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../db/client';
import { books, chapters, notes } from '../db/schema';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const app = new Hono();

// ── Validation Schemas ──────────────────────────────────────────

const createBookSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens'),
  isPublic: z.boolean().optional().default(false),
});

const updateBookSchema = createBookSchema.partial();

const addChapterSchema = z.object({
  noteId: z.string(),
  title: z.string().optional(),
});

const reorderChaptersSchema = z.object({
  chapterIds: z.array(z.string()),
});

// ── GET /api/books (Public/Admin) ───────────────────────────────
app.get('/', async (c) => {
  const adminId = c.get('auth' as any)?.adminId || c.get('adminId' as any);
  const isAdmin = adminId != null;

  try {
    const list = await getDb().query.books.findMany({
      where: isAdmin ? undefined : eq(books.isPublic, true),
      orderBy: [desc(books.createdAt)],
    });

    return c.json({ success: true, data: { books: list } });
  } catch (error) {
    console.error('Failed to get books:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── GET /api/books/:idOrSlug (Public/Admin) ─────────────────────
app.get('/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug');
  const adminId = c.get('auth' as any)?.adminId || c.get('adminId' as any);
  const isAdmin = adminId != null;

  try {
    let book = await getDb().query.books.findFirst({
      where: eq(books.id, idOrSlug),
    });

    if (!book) {
      book = await getDb().query.books.findFirst({
        where: eq(books.slug, idOrSlug),
      });
    }

    if (!book) {
      return c.json({ success: false, error: 'Book not found' }, 404);
    }

    if (!isAdmin && !book.isPublic) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Actually, manual join is safer if relations are not in schema.ts
    const chaptersWithNotes = await getDb()
      .select({
        chapter: chapters,
        note: notes,
      })
      .from(chapters)
      .innerJoin(notes, eq(chapters.noteId, notes.id))
      .where(eq(chapters.bookId, book.id))
      .orderBy(chapters.order);

    const formattedChapters = chaptersWithNotes.map(({ chapter, note }: any) => ({
      id: chapter.id,
      bookId: chapter.bookId,
      noteId: chapter.noteId,
      title: chapter.title || note.title,
      order: chapter.order,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      // Include the note content
      note: {
        id: note.id,
        title: note.title,
        content: isAdmin ? note.content : (book!.isPublic ? note.content : null), // Ensure content is accessible
        isPublic: note.isPublic,
      }
    }));


    return c.json({
      success: true,
      data: {
        book,
        chapters: formattedChapters
      }
    });
  } catch (error) {
    console.error('Failed to get book:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── ADMIN ONLY ROUTES ───────────────────────────────────────────
app.use('/*', requireAdmin());

// ── POST /api/books ─────────────────────────────────────────────
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = createBookSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input data' }, 400);
    }

    // Check slug uniqueness
    const existing = await getDb().query.books.findFirst({
      where: eq(books.slug, result.data.slug),
    });

    if (existing) {
      return c.json({ success: false, error: 'Slug is already in use' }, 400);
    }

    const id = uuidv4();
    const [book] = await getDb().insert(books).values({
      id,
      title: result.data.title,
      description: result.data.description,
      slug: result.data.slug,
      isPublic: result.data.isPublic,
    }).returning();

    return c.json({ success: true, data: { book } }, 201);
  } catch (error) {
    console.error('Failed to create book:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── PUT /api/books/:id ──────────────────────────────────────────
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const result = updateBookSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input data' }, 400);
    }

    if (result.data.slug) {
      const existing = await getDb().query.books.findFirst({
        where: and(eq(books.slug, result.data.slug), eq(books.id, id)), // Ignore self
      });
      // Actually we need to check if slug exists for OTHER books
      const allWithSlug = await getDb().query.books.findMany({
        where: eq(books.slug, result.data.slug),
      });

      if (allWithSlug.some((b: any) => b.id !== id)) {
         return c.json({ success: false, error: 'Slug is already in use' }, 400);
      }
    }

    const [book] = await getDb()
      .update(books)
      .set({
        ...result.data,
        updatedAt: new Date()
      })
      .where(eq(books.id, id))
      .returning();

    if (!book) {
      return c.json({ success: false, error: 'Book not found' }, 404);
    }

    return c.json({ success: true, data: { book } });
  } catch (error) {
    console.error('Failed to update book:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── DELETE /api/books/:id ───────────────────────────────────────
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const [deleted] = await getDb().delete(books).where(eq(books.id, id)).returning();
    if (!deleted) {
      return c.json({ success: false, error: 'Book not found' }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete book:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── POST /api/books/:id/chapters ────────────────────────────────
app.post('/:id/chapters', async (c) => {
  const bookId = c.req.param('id');
  try {
    const body = await c.req.json();
    const result = addChapterSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input data' }, 400);
    }

    // Verify note exists
    const note = await getDb().query.notes.findFirst({
      where: eq(notes.id, result.data.noteId),
    });
    if (!note) {
      return c.json({ success: false, error: 'Note not found' }, 404);
    }

    // Get max order
    const existingChapters = await getDb().query.chapters.findMany({
      where: eq(chapters.bookId, bookId),
    });
    const nextOrder = existingChapters.length > 0
      ? Math.max(...existingChapters.map(c => c.order)) + 1
      : 0;

    const chapterId = uuidv4();
    const [chapter] = await getDb().insert(chapters).values({
      id: chapterId,
      bookId,
      noteId: result.data.noteId,
      title: result.data.title || null,
      order: nextOrder,
    }).returning();

    return c.json({ success: true, data: { chapter } }, 201);
  } catch (error) {
    console.error('Failed to add chapter:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── PUT /api/books/:id/chapters/reorder ─────────────────────────
app.put('/:id/chapters/reorder', async (c) => {
  const bookId = c.req.param('id');
  try {
    const body = await c.req.json();
    const result = reorderChaptersSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input data' }, 400);
    }

    const { chapterIds } = result.data;

    // Run simple loop update for simplicity constraints (Drizzle constraints)
    for (let i = 0; i < chapterIds.length; i++) {
      await getDb().update(chapters)
        .set({ order: i, updatedAt: new Date() })
        .where(and(eq(chapters.id, chapterIds[i]), eq(chapters.bookId, bookId)));
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder chapters:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ── DELETE /api/books/:id/chapters/:chapterId ───────────────────
app.delete('/:id/chapters/:chapterId', async (c) => {
  const bookId = c.req.param('id');
  const chapterId = c.req.param('chapterId');
  try {
    const [deleted] = await getDb().delete(chapters)
      .where(and(eq(chapters.id, chapterId), eq(chapters.bookId, bookId)))
      .returning();

    if (!deleted) {
      return c.json({ success: false, error: 'Chapter not found' }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to remove chapter:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export default app;
