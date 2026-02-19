import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { authMiddleware } from './middleware/auth';
import { apiRateLimiter } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { env } from './env';
import routes from './routes';
import path from 'path';
import { serveStatic } from '@hono/node-server/serve-static';
import { sqlite } from './db/client';

export const app = new Hono();

// --- Global Middleware ---

// Logging
app.use('*', logger());
app.use('*', prettyJSON());

// Security headers (Spec: security.md §10)
app.use(
    '*',
    secureHeaders({
        contentSecurityPolicy:
            env.NODE_ENV === 'production'
                ? {
                      defaultSrc: ["'self'"],
                      scriptSrc: ["'self'"],
                      styleSrc: ["'self'", "'unsafe-inline'"],
                      imgSrc: ["'self'", 'data:', 'blob:'],
                      connectSrc: ["'self'"],
                      fontSrc: ["'self'"],
                      objectSrc: ["'none'"],
                      frameAncestors: ["'none'"],
                  }
                : undefined,
        strictTransportSecurity:
            env.NODE_ENV === 'production'
                ? 'max-age=63072000; includeSubDomains; preload'
                : undefined,
        xFrameOptions: 'DENY',
    }),
);

// CORS (Spec: api-design.md §CORS)
app.use(
    '/api/*',
    cors({
        origin: env.FRONTEND_URL,
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'X-CSRF-Token'],
        credentials: true,
        maxAge: 86400,
    }),
);

// CSRF protection (Spec: security.md §5)
// Protects state-changing methods (POST, PATCH, DELETE)
// Uses SameSite=Lax cookies + origin check
app.use(
    '/api/*',
    csrf({
        origin: env.FRONTEND_URL,
    }),
);

// General API rate limiting (Spec: security.md §4)
app.use('/api/*', apiRateLimiter);

// Auth middleware (sets c.var.user)
app.use('*', authMiddleware);

// --- Global Error Handler (Spec: security.md §8) ---
app.onError(errorHandler);

// --- Health Checks (Spec: architecture.md §10.2) ---
// Liveness: process is alive
app.get('/healthz', (c) => c.json({ status: 'ok' }));
// Readiness: DB connection check
app.get('/readyz', (c) => {
    try {
        sqlite.prepare('SELECT 1').get();
        return c.json({ status: 'ready', db: 'ok' });
    } catch {
        return c.json({ status: 'not ready', db: 'error' }, 503);
    }
});

// --- Static File Serving ---
const uploadsDir =
    process.env.UPLOADS_DIR || path.resolve(process.cwd(), '../../uploads');
app.use(
    '/uploads/*',
    serveStatic({ root: path.relative(process.cwd(), uploadsDir) }),
);

// --- API Routes ---
const apiRoutes = app.route('/api', routes);

// Export type for RPC
export type AppType = typeof apiRoutes;
