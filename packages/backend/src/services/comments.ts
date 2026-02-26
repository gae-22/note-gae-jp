import { nanoid } from 'nanoid';
import { eq, asc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { comments } from '../db/schema';

export function listCommentsByNoteId(noteId: string) {
    const db = getDb();
    return db
        .select()
        .from(comments)
        .where(eq(comments.noteId, noteId))
        .orderBy(asc(comments.createdAt))
        .all()
        .map((c) => ({
            id: c.id,
            noteId: c.noteId,
            authorName: c.authorName,
            body: c.body,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
        }));
}

export function createComment(
    noteId: string,
    input: {
        authorName: string;
        body: string;
        shareTokenId?: string | null;
    },
) {
    const db = getDb();
    const id = nanoid(12);
    const now = new Date();

    db.insert(comments)
        .values({
            id,
            noteId,
            shareTokenId: input.shareTokenId || null,
            authorName: input.authorName,
            body: input.body,
            createdAt: now,
            updatedAt: now,
        })
        .run();

    return {
        id,
        noteId,
        authorName: input.authorName,
        body: input.body,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
}

export function deleteComment(id: string) {
    const db = getDb();
    db.delete(comments).where(eq(comments.id, id)).run();
}
