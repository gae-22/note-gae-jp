import { db } from '../db/client';
import { notes } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { v4 as uuidv4 } from 'uuid';
import type { z } from 'zod';
import type {
    createNoteSchema,
    updateNoteSchema,
    listNotesQuerySchema,
} from '@note-gae-jp/shared';

// Helper to calculate share expiry
const calculateExpiry = (duration?: string): Date | null => {
    if (!duration || duration === 'unlimited') return null;
    const now = new Date();
    switch (duration) {
        case '1d':
            now.setDate(now.getDate() + 1);
            break;
        case '7d':
            now.setDate(now.getDate() + 7);
            break;
        case '30d':
            now.setDate(now.getDate() + 30);
            break;
    }
    return now;
};

export const NoteService = {
    async create(
        input: z.infer<typeof createNoteSchema>,
        // userId: string, // Unused for now
    ) {
        const id = ulid();
        const now = new Date();

        let shareToken: string | null = null;
        let shareExpiresAt: Date | null = null;

        if (input.visibility === 'shared') {
            shareToken = uuidv4();
            shareExpiresAt = calculateExpiry(input.shareDuration);
        }

        const [note] = await db
            .insert(notes)
            .values({
                id,
                title: input.title,
                contentBlocks: JSON.stringify(input.contentBlocks),
                contentMarkdown: input.contentMarkdown,
                coverImage: input.coverImage,
                icon: input.icon,
                visibility: input.visibility,
                shareToken,
                shareExpiresAt,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return note;
    },

    async update(
        id: string,
        input: z.infer<typeof updateNoteSchema>,
        // userId: string,
    ) {
        const existing = await db
            .select()
            .from(notes)
            .where(eq(notes.id, id))
            .get();

        if (!existing) return null;

        const updateData: Partial<typeof notes.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.contentBlocks !== undefined)
            updateData.contentBlocks = JSON.stringify(input.contentBlocks);
        if (input.contentMarkdown !== undefined)
            updateData.contentMarkdown = input.contentMarkdown;
        if (input.coverImage !== undefined)
            updateData.coverImage = input.coverImage;
        if (input.icon !== undefined) updateData.icon = input.icon;

        // Visibility & Sharing logic
        if (input.visibility !== undefined) {
            updateData.visibility = input.visibility;

            if (input.visibility === 'shared') {
                // If switching to shared or updating duration while shared
                if (
                    input.shareDuration ||
                    !existing.shareToken // Generate if missing
                ) {
                    updateData.shareToken = existing.shareToken || uuidv4();
                    updateData.shareExpiresAt = calculateExpiry(
                        input.shareDuration,
                    );
                }
            } else {
                // If switching to private/public, clear share options based on requirements?
                // Spec says: "visibility を private または public に変更する場合: share_token, share_expires_at を NULL にクリア"
                updateData.shareToken = null;
                updateData.shareExpiresAt = null;
            }
        } else if (existing.visibility === 'shared' && input.shareDuration) {
            // Already shared, just updating duration
            updateData.shareExpiresAt = calculateExpiry(input.shareDuration);
        }

        const [updated] = await db
            .update(notes)
            .set(updateData)
            .where(eq(notes.id, id))
            .returning();

        return updated;
    },

    async delete(id: string) {
        // Cascading deletes handled by DB for note_locks etc.
        // Files have ON DELETE SET NULL as per spec.
        const [deleted] = await db
            .delete(notes)
            .where(eq(notes.id, id))
            .returning();
        return deleted;
    },

    async get(id: string, currentUser?: { id: string } | null) {
        const note = await db
            .select()
            .from(notes)
            .where(eq(notes.id, id))
            .get();
        if (!note) return null;

        // Permission check
        const isPublic = note.visibility === 'public';
        const isOwner = !!currentUser; // Assuming single tenant admin for now

        if (!isPublic && !isOwner) {
            // Check if shared? usually shared access is via token, but direct ID access might be allowed if shared?
            // Spec says: "currentUser が null (ゲスト): 自動的に visibility = 'public' の条件を強制付与"
            // So get(id) by guest should only return if public.
            // Shared notes are accessed via getByShareToken usually.
            // But if I have the ID and it IS shared, can I view it?
            // Conventionally, shared notes use the token. ID access for 'shared' visibility without token might be restricted or allowed.
            // Let's be strict: Guest can only see 'public' via ID. 'shared' requires token route.
            return null;
        }

        return note;
    },

    async getByShareToken(token: string) {
        const note = await db
            .select()
            .from(notes)
            .where(eq(notes.shareToken, token))
            .get();

        if (!note) return null;

        if (note.visibility !== 'shared') return null;
        if (note.shareExpiresAt && note.shareExpiresAt < new Date())
            return null;

        return note;
    },

    async list(
        input: z.infer<typeof listNotesQuerySchema>,
        currentUser?: { id: string } | null,
    ) {
        const page = input.page || 1;
        const limit = input.limit || 20;
        const offset = (page - 1) * limit;

        const conditions = [];

        // Visibility Filter
        if (currentUser) {
            // Admin: can see all. If input.visibility set, filter by it.
            if (input.visibility) {
                conditions.push(eq(notes.visibility, input.visibility));
            }
        } else {
            // Guest: ONLY public.
            conditions.push(eq(notes.visibility, 'public'));
        }

        // FTS Search (Spec: database-design.md §FTS5)
        if (input.q) {
            // Using raw SQL for FTS5 + JOIN with notes table
            const whereConditions =
                conditions.length > 0 ? and(...conditions) : sql`1=1`;

            // FTS Match query
            const searchQuery = sql`
                SELECT n.* FROM notes n
                JOIN notes_fts fts ON n.rowid = fts.rowid
                WHERE fts MATCH ${input.q}
                AND ${whereConditions}
                ORDER BY fts.rank
                LIMIT ${limit} OFFSET ${offset}
            `;

            const results = await db.all(searchQuery);

            // Count query for pagination
            const countQuery = sql`
                SELECT COUNT(*) as count FROM notes_fts fts
                JOIN notes n ON n.rowid = fts.rowid
                WHERE fts MATCH ${input.q}
                AND ${whereConditions}
            `;

            // Explicitly cast the result to avoid type errors
            const countRes = (await db.get(countQuery)) as
                | { count: number }
                | undefined;
            const total = countRes ? countRes.count : 0;

            return {
                items: results.map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt),
                    updatedAt: new Date(n.updatedAt),
                    shareExpiresAt: n.shareExpiresAt
                        ? new Date(n.shareExpiresAt)
                        : null,
                })),
                total,
                page,
                limit,
                hasNext: offset + results.length < total,
            };
        }

        // Standard list without FTS
        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const results = await db
            .select()
            .from(notes)
            .where(where)
            .orderBy(desc(notes.updatedAt))
            .limit(limit)
            .offset(offset);

        // Count for standard list
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(notes)
            .where(where);

        const total = countResult?.count ?? 0;

        return {
            items: results,
            total,
            page,
            limit,
            hasNext: offset + results.length < total,
        };
    },
};
