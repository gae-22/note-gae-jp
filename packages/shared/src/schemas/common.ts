import { z } from 'zod';

// ULID形式
export const ulidSchema = z
    .string()
    .length(26)
    .regex(/^[0-9A-Z]+$/);

// UUID形式
export const uuidSchema = z.string().uuid();

// ページネーション
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Block schema (canonical content model: Blocks JSON)
export const blockSchema = z.object({
    id: z.string().min(1),
    type: z.enum([
        'paragraph',
        'heading',
        'code',
        'image',
        'embed',
        'list',
        'quote',
    ]),
    // content may be string or structured object depending on block type
    content: z.any(),
    props: z.record(z.any()).optional(),
});
