import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './env';

export type { AppType } from './app';

console.log(`Server is running on port ${env.PORT} [${env.NODE_ENV}]`);

serve({
    fetch: app.fetch,
    port: env.PORT,
});
