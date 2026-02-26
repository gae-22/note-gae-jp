import { z } from 'zod';

export const createTokenSchema = z.object({
    label: z.string().max(100).optional(),
    expiresIn: z.enum(['1h', '1d', '7d', '30d']).default('7d'),
});
