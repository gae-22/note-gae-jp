import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getEnv } from './env';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import tagsRouter from './routes/tags';
import tokensRouter from './routes/tokens';
import booksRouter from './routes/books';
import { commentsRoutes } from './routes/comments';
import { publicRoutes } from './routes/public';

const env = getEnv();

const app = new Hono();

// Global middleware
app.use(
  '*',
  cors({
    origin: `${env.FRONTEND_URL}:${env.FRONTEND_PORT}`,
    credentials: true,
  }),
);
app.use('/api/*', authMiddleware());

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/tags', tagsRouter);
app.route('/api/tokens', tokensRouter);
app.route('/api/books', booksRouter);
app.route('/api/comments', commentsRoutes);
app.route('/api/public', publicRoutes);

// Health check
app.get('/api/health', (c) => c.json({ success: true, data: { status: 'ok' } }));

console.log(`🚀 Backend running on ${env.BACKEND_URL}:${env.BACKEND_PORT}`);

export default {
  port: env.BACKEND_PORT,
  fetch: app.fetch,
};
