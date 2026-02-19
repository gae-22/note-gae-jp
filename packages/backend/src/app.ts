import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { authMiddleware } from './middleware/auth';
import routes from './routes';
import path from 'path';
import { serveStatic } from '@hono/node-server/serve-static';

export const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', authMiddleware);

app.get('/health', (c) => c.json({ status: 'ok' }));

// Serve uploaded files
const uploadsDir =
    process.env.UPLOADS_DIR || path.resolve(process.cwd(), '../../uploads');
app.use(
    '/uploads/*',
    serveStatic({ root: path.relative(process.cwd(), uploadsDir) }),
);

// API Routes
const apiRoutes = app.route('/api', routes);

// Export type for RPC
export type AppType = typeof apiRoutes;
