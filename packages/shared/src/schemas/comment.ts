import { z } from 'zod';

export const createCommentSchema = z.object({
    authorName: z.string().min(1).max(50),
    body: z.string().min(1).max(2000),
});
