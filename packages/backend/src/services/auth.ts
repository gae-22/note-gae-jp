import { nanoid } from 'nanoid';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../db/client';
import { admins, sessions } from '../db/schema';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function verifyCredentials(username: string, password: string) {
  const db = getDb();
  const [admin] = db.select().from(admins).where(eq(admins.username, username)).all();

  if (!admin) return null;

  const valid = await Bun.password.verify(password, admin.passwordHash);
  if (!valid) return null;

  return { id: admin.id, username: admin.username };
}

export function createSession(adminId: string): string {
  const db = getDb();
  const id = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  db.insert(sessions).values({ id, adminId, expiresAt }).run();

  return id;
}

export function deleteSession(sessionId: string) {
  const db = getDb();
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function getSessionAdmin(sessionId: string) {
  const db = getDb();
  const [session] = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .all();

  if (!session) return null;

  const [admin] = db
    .select({ id: admins.id, username: admins.username })
    .from(admins)
    .where(eq(admins.id, session.adminId))
    .all();

  return admin || null;
}
