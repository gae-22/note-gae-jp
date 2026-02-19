import { z } from 'zod';
import { ulidSchema, blockSchema, paginationSchema } from './common.js';

// 共有有効期限オプション（visibility='shared' 時に使用）
export const shareDurationSchema = z.enum(['1d', '7d', '30d', 'unlimited']);

// メモ作成
export const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    // Canonical content: blocks JSON
    contentBlocks: z.array(blockSchema).default([]),
    // Optional derived/legacy Markdown string (server may populate from blocks)
    contentMarkdown: z.string().optional().nullable(),
    coverImage: z.string().url().max(1000).optional().nullable(),
    icon: z.string().max(10).optional().nullable(), // Emoji or short text
    visibility: z.enum(['private', 'public', 'shared']).default('private'),
    shareDuration: shareDurationSchema.optional(), // visibility='shared' 時のみ有効
});

// メモ更新（共有設定を含む）
export const updateNoteSchema = createNoteSchema.partial().extend({
    shareDuration: shareDurationSchema.optional(), // 指定時のみ share_token, share_expires_at を再生成
});

// メモ一覧検索クエリ
export const listNotesQuerySchema = paginationSchema.extend({
    q: z.string().optional(), // 検索キーワード
    visibility: z.enum(['private', 'public', 'shared']).optional(),
});

// メモレスポンス
export const noteResponseSchema = z.object({
    id: ulidSchema,
    title: z.string(),
    // Blocks JSON canonical representation
    contentBlocks: z.array(blockSchema),
    // Optional derived Markdown for compatibility
    contentMarkdown: z.string().nullable(),
    coverImage: z.string().nullable(),
    icon: z.string().nullable(),
    visibility: z.enum(['private', 'public', 'shared']),
    shareToken: z.string().uuid().nullable(),
    shareExpiresAt: z.string().datetime().nullable(), // ISO-8601 string in responses
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// メモ一覧レスポンス（ページネーション付き）
export const listNotesResponseSchema = z.object({
    items: z.array(noteResponseSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    hasNext: z.boolean(),
});
