import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    SESSION_SECRET: z
        .string()
        .min(32, 'SESSION_SECRET must be at least 32 characters'),
    DATABASE_PATH: z.string().default('./data/note-gae.db'),
    UPLOADS_DIR: z.string().default('./uploads'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    LOCK_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    ORPHAN_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

function validateEnv() {
    // In development, provide a default SESSION_SECRET for convenience
    const raw = {
        ...process.env,
        SESSION_SECRET:
            process.env.SESSION_SECRET ||
            (process.env.NODE_ENV !== 'production'
                ? 'dev-secret-key-minimum-32-characters-long!!'
                : undefined),
    };

    const parsed = envSchema.safeParse(raw);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        for (const issue of parsed.error.issues) {
            console.error(`  ${issue.path.join('.')}: ${issue.message}`);
        }
        process.exit(1);
    }

    return parsed.data;
}

export const env = validateEnv();
