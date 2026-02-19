import { rateLimiter } from 'hono-rate-limiter';
import type { Context } from 'hono';

/**
 * Rate limiter for login endpoint.
 * Spec: security.md §4 — Rate Limiting
 * - Login: 5 requests per 15 minutes per IP
 */
export const loginRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    standardHeaders: 'draft-6',
    keyGenerator: (c: Context) =>
        c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown',
    handler: (c: Context) =>
        c.json(
            {
                success: false,
                error: {
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many login attempts, please try again later',
                },
            },
            429,
        ),
});

/**
 * General API rate limiter.
 * Spec: security.md §4 — 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 100,
    standardHeaders: 'draft-6',
    keyGenerator: (c: Context) =>
        c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown',
    handler: (c: Context) =>
        c.json(
            {
                success: false,
                error: {
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Rate limit exceeded',
                },
            },
            429,
        ),
});
/**
 * Rate limiter for file upload endpoint.
 * Spec: api-design.md §5.2 — 10 requests per minute per User
 */
export const uploadRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 10,
    standardHeaders: 'draft-6',
    keyGenerator: (c: Context) =>
        c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown',
    handler: (c: Context) =>
        c.json(
            {
                success: false,
                error: {
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Upload rate limit exceeded',
                },
            },
            429,
        ),
});
