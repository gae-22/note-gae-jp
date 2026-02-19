import type { Context } from 'hono';
import { env } from '../env';

/**
 * Global error handler.
 * Spec: security.md §8 — Information leakage prevention
 * - Never expose stack traces in production
 * - Return generic error messages to clients
 */
export const errorHandler = (err: Error, c: Context) => {
    const isDev = env.NODE_ENV === 'development';

    console.error(`[Error] ${err.message}`, isDev ? err.stack : '');

    // Check for known error types
    if (err.message === 'UNSUPPORTED_MEDIA_TYPE') {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNSUPPORTED_MEDIA_TYPE',
                    message: 'Unsupported file type',
                },
            },
            415,
        );
    }

    if (err.message === 'PAYLOAD_TOO_LARGE') {
        return c.json(
            {
                success: false,
                error: {
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'File too large',
                },
            },
            413,
        );
    }

    // Generic server error — no stack trace leak
    return c.json(
        {
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: isDev ? err.message : 'An unexpected error occurred',
            },
        },
        500,
    );
};
