import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client';
import { shareTokens } from '../db/schema';

const EXPIRES_MAP: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export function createShareToken(noteId: string, input: { label?: string; expiresIn: string }) {
  const db = getDb();
  const id = nanoid(32);
  const duration = EXPIRES_MAP[input.expiresIn] || EXPIRES_MAP['7d'];
  const expiresAt = new Date(Date.now() + duration);

  db.insert(shareTokens)
    .values({
      id,
      noteId,
      label: input.label || null,
      expiresAt,
    })
    .run();

  return {
    id,
    noteId,
    label: input.label || null,
    expiresAt: expiresAt.toISOString(),
    isRevoked: false,
    createdAt: new Date().toISOString(),
  };
}

export function listTokensByNoteId(noteId: string) {
  const db = getDb();
  return db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.noteId, noteId))
    .all()
    .map((t) => ({
      id: t.id,
      noteId: t.noteId,
      label: t.label,
      expiresAt: t.expiresAt.toISOString(),
      isRevoked: !!t.isRevoked,
      createdAt: t.createdAt.toISOString(),
    }));
}

export function revokeToken(id: string) {
  const db = getDb();
  db.update(shareTokens).set({ isRevoked: true }).where(eq(shareTokens.id, id)).run();
}
