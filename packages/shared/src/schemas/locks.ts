import { z } from 'zod';
import { ulidSchema } from './common';

// Lock request (acquire)
export const lockRequestSchema = z.object({
    noteId: ulidSchema,
});

// Lock response
export const lockResponseSchema = z.object({
    id: ulidSchema,
    noteId: ulidSchema,
    lockToken: z.string().uuid(),
    ownerId: ulidSchema,
    expiresAt: z.string().datetime(), // ISO-8601
    createdAt: z.string().datetime(),
});

// Lock renewal request
export const renewLockSchema = z.object({
    lockToken: z.string().uuid(),
});
