import { db } from '../db/client';
import { files } from '../db/schema';
import { ulid } from 'ulid';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { and, isNull, lt, eq } from 'drizzle-orm';

const UPLOADS_DIR =
    process.env.UPLOADS_DIR || path.resolve(process.cwd(), '../../uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
];

export const FileService = {
    async upload(file: File) {
        // Validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error('UNSUPPORTED_MEDIA_TYPE');
        }
        if (file.size > MAX_SIZE) {
            throw new Error('PAYLOAD_TOO_LARGE');
        }

        const id = ulid();
        const ext = path.extname(file.name) || '.bin';
        const filename = `${id}${ext}`;

        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');

        const relativeDir = path.join(year, month);
        const absoluteDir = path.join(UPLOADS_DIR, relativeDir);

        // Ensure directory exists
        if (!existsSync(absoluteDir)) {
            mkdirSync(absoluteDir, { recursive: true });
        }

        const relativePath = path.join(relativeDir, filename);
        const absolutePath = path.join(absoluteDir, filename);

        // Write file
        const buffer = await file.arrayBuffer();
        await fs.writeFile(absolutePath, Buffer.from(buffer));

        // DB Insert
        const [record] = await db
            .insert(files)
            .values({
                id,
                filename,
                originalFilename: file.name,
                path: relativePath,
                mimeType: file.type,
                size: file.size,
                uploadedAt: now,
            })
            .returning();

        // Return public URL (assuming served via /uploads)
        // Adjust returned path format to match frontend expectation if needed
        const url = `/uploads/${relativePath}`; // Standard static serving path

        return {
            ...record,
            url,
        };
    },

    async cleanupOrphans(retentionDays = 1) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Find orphan files older than cutoff
        // Orphan means noteId is null
        const orphans = await db
            .select()
            .from(files)
            .where(and(isNull(files.noteId), lt(files.uploadedAt, cutoffDate)));

        console.log(`Found ${orphans.length} orphan files to cleanup.`);

        let deletedCount = 0;
        for (const file of orphans) {
            try {
                const absolutePath = path.join(UPLOADS_DIR, file.path);
                // Delete from disk
                if (existsSync(absolutePath)) {
                    await fs.unlink(absolutePath);
                }
                // Delete from DB
                await db.delete(files).where(eq(files.id, file.id));
                deletedCount++;
            } catch (err) {
                console.error(`Failed to cleanup orphan file ${file.id}:`, err);
            }
        }

        return { found: orphans.length, deleted: deletedCount };
    },
};
