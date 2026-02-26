import { z } from 'zod';

const envSchema = z.object({
  SESSION_SECRET: z.string().min(16).default('change-me-to-a-secure-random-string'),
  ADMIN_USERNAME: z.string().default('gae'),
  ADMIN_PASSWORD: z.string().min(1).default('change-me'),
  DATABASE_URL: z.string().default('./data/note-gae.db'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (!env) {
    env = envSchema.parse(process.env);
  }
  return env;
}
