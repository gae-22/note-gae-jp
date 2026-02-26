import { nanoid } from 'nanoid';
import { eq, desc, asc, sql, and, inArray } from 'drizzle-orm';
import { getDb } from '../db/client';
import { notes, noteTags, tags, comments } from '../db/schema';

export function createNote(input: {
    title: string;
    content: string;
    isPublic: boolean;
    tagIds: string[];
}) {
    const db = getDb();
    const id = nanoid(12);
    const now = new Date();

    db.insert(notes)
        .values({
            id,
            title: input.title,
            content: input.content,
            isPublic: input.isPublic,
            createdAt: now,
            updatedAt: now,
        })
        .run();

    if (input.tagIds.length > 0) {
        db.insert(noteTags)
            .values(input.tagIds.map((tagId) => ({ noteId: id, tagId })))
            .run();
    }

    return getNoteById(id);
}

export function getNoteById(id: string) {
    const db = getDb();
    const [note] = db.select().from(notes).where(eq(notes.id, id)).all();
    if (!note) return null;

    const noteTags_ = db
        .select({ id: tags.id, name: tags.name, color: tags.color })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(noteTags.noteId, id))
        .all();

    const [commentCount] = db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.noteId, id))
        .all();

    return {
        ...note,
        isPublic: !!note.isPublic,
        tags: noteTags_,
        commentCount: commentCount?.count ?? 0,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
    };
}

export function listNotes(opts: {
    q?: string;
    tagNames?: string[];
    isPublic?: boolean;
    sort?: 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}) {
    const db = getDb();
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 100);
    const offset = (page - 1) * limit;
    const sortCol =
        opts.sort === 'createdAt' ? notes.createdAt : notes.updatedAt;
    const orderFn = opts.order === 'asc' ? asc : desc;

    const conditions: ReturnType<typeof eq>[] = [];
    if (opts.isPublic !== undefined) {
        conditions.push(eq(notes.isPublic, opts.isPublic));
    }

    // Tag filter
    let tagFilterNoteIds: string[] | null = null;
    if (opts.tagNames && opts.tagNames.length > 0) {
        const matchingTags = db
            .select({ id: tags.id })
            .from(tags)
            .where(inArray(tags.name, opts.tagNames))
            .all();

        if (matchingTags.length === 0) {
            return {
                notes: [],
                pagination: { page, limit, total: 0, totalPages: 0 },
            };
        }

        const tagIds = matchingTags.map((t) => t.id);
        const noteIdsWithTags = db
            .select({ noteId: noteTags.noteId })
            .from(noteTags)
            .where(inArray(noteTags.tagId, tagIds))
            .groupBy(noteTags.noteId)
            .having(sql`count(distinct ${noteTags.tagId}) = ${tagIds.length}`)
            .all();

        tagFilterNoteIds = noteIdsWithTags.map((r) => r.noteId);
        if (tagFilterNoteIds.length === 0) {
            return {
                notes: [],
                pagination: { page, limit, total: 0, totalPages: 0 },
            };
        }
    }

    // Full-text search (LIKE based)
    if (opts.q) {
        conditions.push(
            sql`(${notes.title} LIKE ${'%' + opts.q + '%'} OR ${notes.content} LIKE ${'%' + opts.q + '%'})`,
        );
    }

    let query = db.select().from(notes);
    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
    }

    let allResults = query.orderBy(orderFn(sortCol)).all();
    if (tagFilterNoteIds) {
        allResults = allResults.filter((n) => tagFilterNoteIds!.includes(n.id));
    }

    const total = allResults.length;
    const paginatedResults = allResults.slice(offset, offset + limit);

    const enriched = paginatedResults.map((note) => {
        const noteTags_ = db
            .select({ id: tags.id, name: tags.name, color: tags.color })
            .from(noteTags)
            .innerJoin(tags, eq(noteTags.tagId, tags.id))
            .where(eq(noteTags.noteId, note.id))
            .all();

        const [commentCount] = db
            .select({ count: sql<number>`count(*)` })
            .from(comments)
            .where(eq(comments.noteId, note.id))
            .all();

        return {
            ...note,
            isPublic: !!note.isPublic,
            tags: noteTags_,
            commentCount: commentCount?.count ?? 0,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
        };
    });

    return {
        notes: enriched,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export function updateNote(
    id: string,
    input: {
        title?: string;
        content?: string;
        isPublic?: boolean;
        tagIds?: string[];
    },
) {
    const db = getDb();

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.content !== undefined) updates.content = input.content;
    if (input.isPublic !== undefined) updates.isPublic = input.isPublic;

    db.update(notes).set(updates).where(eq(notes.id, id)).run();

    if (input.tagIds !== undefined) {
        db.delete(noteTags).where(eq(noteTags.noteId, id)).run();
        if (input.tagIds.length > 0) {
            db.insert(noteTags)
                .values(input.tagIds.map((tagId) => ({ noteId: id, tagId })))
                .run();
        }
    }

    return getNoteById(id);
}

export function deleteNote(id: string) {
    const db = getDb();
    db.delete(notes).where(eq(notes.id, id)).run();
}
