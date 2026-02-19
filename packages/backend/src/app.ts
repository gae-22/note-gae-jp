import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

export const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

app.get('/health', (c) => c.json({ status: 'ok' }));
