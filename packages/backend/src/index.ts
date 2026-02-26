import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getEnv } from './env';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import { tagsRoutes } from './routes/tags';
import { tokensRoutes } from './routes/tokens';
import { commentsRoutes } from './routes/comments';
import { publicRoutes } from './routes/public';

const env = getEnv();

const app = new Hono();

// Global middleware
app.use(
    '*',
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    }),
);
app.use('/api/*', authMiddleware());

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/tags', tagsRoutes);
app.route('/api/tokens', tokensRoutes);
app.route('/api/comments', commentsRoutes);
app.route('/api/public', publicRoutes);

// Health check
app.get('/api/health', (c) =>
    c.json({ success: true, data: { status: 'ok' } }),
);

console.log(`🚀 Backend running on http://localhost:${env.PORT}`);

export default {
    port: env.PORT,
    fetch: app.fetch,
};
