import { FileService } from '../services/file.service';
import { sqlite } from '../db/client';

async function main() {
    console.log('Starting orphan file cleanup...');

    // retention days from env or default 1
    const days = process.env.ORPHAN_TTL_DAYS
        ? parseInt(process.env.ORPHAN_TTL_DAYS)
        : 1;

    try {
        const result = await FileService.cleanupOrphans(days);
        console.log(
            `Cleanup completed. Found: ${result.found}, Deleted: ${result.deleted}`,
        );
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    } finally {
        sqlite.close();
    }
}

main();
