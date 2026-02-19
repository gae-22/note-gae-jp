import { hc } from 'hono/client';
import type { AppType } from '@note-gae-jp/backend';
import { queryClient } from './query';

// Custom fetch wrapper to handle 401s
const fetchWithInterceptor: typeof fetch = async (input, init) => {
    const res = await fetch(input, init);

    if (res.status === 401) {
        // If 401, clear auth query
        queryClient.setQueryData(['auth', 'me'], null);
        // Optional: Redirect to login if not already there
        // window.location.href = '/login';
    }

    return res;
};

export const client = hc<AppType>('/', {
    fetch: fetchWithInterceptor,
    headers: {
        'Content-Type': 'application/json',
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rpc = (client as any).api;
