import { z } from 'zod';
import { ulidSchema } from './common.js';

export const loginSchema = z.object({
    username: z.string().min(1).max(50), // 空文字不可
    password: z.string().min(1).max(100),
});

export const userResponseSchema = z.object({
    id: ulidSchema,
    username: z.string(),
    // API uses ISO-8601 datetime strings
    createdAt: z.string().datetime(),
});
