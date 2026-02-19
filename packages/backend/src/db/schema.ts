import {
    sqliteTable,
    text,
    integer,
    index,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// Users Table
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Notes Table
export const notes = sqliteTable(
    'notes',
    {
        id: text('id').primaryKey(),
        title: text('title').notNull(),
        contentBlocks: text('content_blocks').notNull().default('[]'),
        contentMarkdown: text('content_markdown'),
        coverImage: text('cover_image'),
        icon: text('icon'),
        visibility: text('visibility', {
            enum: ['private', 'public', 'shared'],
        })
            .notNull()
            .default('private'),
        shareToken: text('share_token'),
        shareExpiresAt: integer('share_expires_at', { mode: 'timestamp' }),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer('updated_at', { mode: 'timestamp' })
            .notNull()
            .default(sql`(unixepoch())`),
    },
    (table) => ({
        visibilityIdx: index('idx_notes_visibility').on(table.visibility),
        updatedAtIdx: index('idx_notes_updated_at').on(table.updatedAt),
        shareTokenIdx: uniqueIndex('idx_notes_share_token').on(
            table.shareToken,
        ),
    }),
);

// Files Table
export const files = sqliteTable('files', {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(),
    originalFilename: text('original_filename').notNull(),
    path: text('path').notNull().unique(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    blurhash: text('blurhash'),
    noteId: text('note_id').references(() => notes.id, {
        onDelete: 'set null',
    }),
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Sessions Table
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Note Locks Table
export const noteLocks = sqliteTable('note_locks', {
    id: text('id').primaryKey(),
    noteId: text('note_id')
        .notNull()
        .references(() => notes.id, { onDelete: 'cascade' }),
    lockToken: text('lock_token').notNull().unique(),
    ownerId: text('owner_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));

export const notesRelations = relations(notes, ({ many }) => ({
    files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
    note: one(notes, {
        fields: [files.noteId],
        references: [notes.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));
