import { Hono } from 'hono';
import auth from './auth';
import notes from './notes';
import upload from './upload';
import locks from './locks';
import share from './share';

const app = new Hono();

const routes = app
    .route('/auth', auth)
    .route('/notes', notes)
    .route('/notes', locks) // Mounts lock routes under /api/notes/:id/lock
    .route('/upload', upload)
    .route('/share', share); // Mounts /api/share/:token

export default routes;
