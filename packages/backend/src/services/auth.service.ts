import { db } from '../db/client';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import argon2id from 'argon2id';
import { ulid } from 'ulid';
import { v4 as uuidv4 } from 'uuid';
import type { z } from 'zod';
import type { loginSchema } from '@note-gae-jp/shared';

const SESSION_DURATION_DAYS = 7;

export const AuthService = {
    async login(input: z.infer<typeof loginSchema>) {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.username, input.username))
            .get();

        if (!user) {
            return null;
        }

        const valid = await argon2id.verify(user.passwordHash, input.password);
        if (!valid) {
            return null;
        }

        // Create session
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        await db.insert(sessions).values({
            id: ulid(),
            userId: user.id,
            token,
            expiresAt,
        });

        return {
            token,
            expiresAt,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt.toISOString(),
            },
        };
    },

    async logout(token: string) {
        await db.delete(sessions).where(eq(sessions.token, token));
    },

    async getSession(token: string) {
        const session = await db.query.sessions.findFirst({
            where: eq(sessions.token, token),
            with: {
                user: true,
            },
        });

        if (!session) return null;

        if (session.expiresAt < new Date()) {
            await this.logout(token);
            return null;
        }

        return session;
    },
};
