import { hc } from 'hono/client';
import type { AppType } from '@note-gae-jp/backend';

// In development, Vite verifies proxy. In production, we might need full URL.
// But for now, assuming relative path works due to proxy or same-origin.
export const client = hc<AppType>('/', {
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper for properly typed API calls
// @ts-ignore - Temporary fix for unknown client type
export const rpc = (client as any).api;
