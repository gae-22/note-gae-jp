import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { FileService } from '../services/file.service';
import { requireAuth } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rate-limit';

const app = new Hono();

app.post(
    '/',
    requireAuth,
    uploadRateLimiter,
    bodyLimit({
        maxSize: 10 * 1024 * 1024, // 10MB
        onError: (c) =>
            c.json(
                {
                    success: false,
                    error: {
                        code: 'PAYLOAD_TOO_LARGE',
                        message: 'File too large',
                    },
                },
                413,
            ),
    }),
    async (c) => {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file || !(file instanceof File)) {
            return c.json(
                {
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
                },
                400,
            );
        }

        try {
            // const user = c.get('user')!;
            const result = await FileService.upload(file);

            return c.json({
                success: true,
                data: {
                    ...result,
                    uploadedAt:
                        result.uploadedAt?.toISOString() ??
                        new Date().toISOString(),
                },
            });
        } catch (e: any) {
            if (e.message === 'UNSUPPORTED_MEDIA_TYPE') {
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
            if (e.message === 'PAYLOAD_TOO_LARGE') {
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
            throw e;
        }
    },
);

export default app;
