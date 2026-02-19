import { db } from '../db/client';
import { noteLocks, notes } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { ulid } from 'ulid';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../env';

const LOCK_TTL_MS = env.LOCK_TTL_SECONDS * 1000;

export const LockService = {
    /**
     * Acquire a lock on a note.
     * Spec: api-design.md §Lock API
     * - Returns conflict if another user holds an active lock
     * - Expired locks are automatically overridden
     */
    async acquire(noteId: string, userId: string) {
        // Check if note exists
        const note = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .get();
        if (!note) return { error: 'NOT_FOUND' as const };

        // Clean up expired locks first
        await db.delete(noteLocks).where(lt(noteLocks.expiresAt, new Date()));

        // Check for existing active lock
        const existingLock = await db
            .select()
            .from(noteLocks)
            .where(eq(noteLocks.noteId, noteId))
            .get();

        if (existingLock) {
            // If the same user, renew instead of conflicting
            if (existingLock.ownerId === userId) {
                return this.renew(existingLock.lockToken, userId);
            }
            return {
                error: 'CONFLICT' as const,
                lockOwner: existingLock.ownerId,
            };
        }

        // Create new lock
        const id = ulid();
        const lockToken = uuidv4();
        const expiresAt = new Date(Date.now() + LOCK_TTL_MS);

        const [lock] = await db
            .insert(noteLocks)
            .values({
                id,
                noteId,
                lockToken,
                ownerId: userId,
                expiresAt,
            })
            .returning();

        return { lock };
    },

    /**
     * Release a lock.
     */
    async release(noteId: string, lockToken: string, userId: string) {
        const existing = await db
            .select()
            .from(noteLocks)
            .where(
                and(
                    eq(noteLocks.noteId, noteId),
                    eq(noteLocks.lockToken, lockToken),
                    eq(noteLocks.ownerId, userId),
                ),
            )
            .get();

        if (!existing) return { error: 'NOT_FOUND' as const };

        await db.delete(noteLocks).where(eq(noteLocks.id, existing.id));
        return { released: true };
    },

    /**
     * Renew a lock (extend expiry).
     */
    async renew(lockToken: string, userId: string) {
        const existing = await db
            .select()
            .from(noteLocks)
            .where(
                and(
                    eq(noteLocks.lockToken, lockToken),
                    eq(noteLocks.ownerId, userId),
                ),
            )
            .get();

        if (!existing) return { error: 'NOT_FOUND' as const };

        const newExpiresAt = new Date(Date.now() + LOCK_TTL_MS);

        const [updated] = await db
            .update(noteLocks)
            .set({ expiresAt: newExpiresAt })
            .where(eq(noteLocks.id, existing.id))
            .returning();

        return { lock: updated };
    },

    /**
     * Get lock status for a note.
     */
    async getStatus(noteId: string) {
        // Clean up expired first
        await db.delete(noteLocks).where(lt(noteLocks.expiresAt, new Date()));

        const lock = await db
            .select()
            .from(noteLocks)
            .where(eq(noteLocks.noteId, noteId))
            .get();

        return lock || null;
    },
};
