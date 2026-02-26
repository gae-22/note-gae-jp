import { nanoid } from 'nanoid';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { tags, noteTags } from '../db/schema';

export function listTags() {
    const db = getDb();
    const allTags = db.select().from(tags).all();

    return allTags.map((tag) => {
        const [count] = db
            .select({ count: sql<number>`count(*)` })
            .from(noteTags)
            .where(eq(noteTags.tagId, tag.id))
            .all();

        return {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            noteCount: count?.count ?? 0,
            createdAt: tag.createdAt.toISOString(),
        };
    });
}

export function createTag(input: { name: string; color: string }) {
    const db = getDb();
    const id = nanoid(12);
    db.insert(tags).values({ id, name: input.name, color: input.color }).run();
    return {
        id,
        name: input.name,
        color: input.color,
        noteCount: 0,
        createdAt: new Date().toISOString(),
    };
}

export function updateTag(
    id: string,
    input: { name?: string; color?: string },
) {
    const db = getDb();
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.color !== undefined) updates.color = input.color;
    db.update(tags).set(updates).where(eq(tags.id, id)).run();
    const [tag] = db.select().from(tags).where(eq(tags.id, id)).all();
    return tag ? { ...tag, createdAt: tag.createdAt.toISOString() } : null;
}

export function deleteTag(id: string) {
    const db = getDb();
    db.delete(tags).where(eq(tags.id, id)).run();
}
