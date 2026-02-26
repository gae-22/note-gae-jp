import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

function loadRootEnv() {
  // Walk up to find root .env (monorepo root has package.json with workspaces)
  let dir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  for (let i = 0; i < 5; i++) {
    const envPath = resolve(dir, '.env');
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        // Strip quotes
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      return;
    }
    dir = resolve(dir, '..');
  }
}

export function getEnv(): Env {
  if (!env) {
    loadRootEnv();
    env = envSchema.parse(process.env);
  }
  return env;
}
