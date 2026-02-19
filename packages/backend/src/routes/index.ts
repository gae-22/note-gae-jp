import { Hono } from 'hono';
import auth from './auth';
import notes from './notes';
import upload from './upload';

const app = new Hono();

const routes = app
    .route('/auth', auth)
    .route('/notes', notes)
    .route('/upload', upload);

export default routes;
