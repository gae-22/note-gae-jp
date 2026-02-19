import { env } from './env';
import { serve } from '@hono/node-server';
import { app } from './app';

export type { AppType } from './app';

console.log(`Server is running on port ${env.PORT} [${env.NODE_ENV}]`);

serve({
    fetch: app.fetch,
    port: env.PORT,
});
