import { z } from 'zod';
import { ulidSchema } from './common';

export const uploadResponseSchema = z.object({
    id: ulidSchema,
    url: z.string().url(), // アクセス用URL (/uploads/...)
    filename: z.string(),
    originalFilename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    blurhash: z.string().nullable(),
});
