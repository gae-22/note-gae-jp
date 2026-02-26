import { nanoid } from 'nanoid';
import { getDb } from './client';
import { admins } from './schema';
import { getEnv } from '../env';

async function seed() {
  const env = getEnv();
  const db = getDb();

  // Check if admin already exists
  const existing = db.select().from(admins).all();
  if (existing.length > 0) {
    console.log('⏭ Admin user already exists, skipping seed.');
    return;
  }

  const passwordHash = await Bun.password.hash(env.ADMIN_PASSWORD, {
    algorithm: 'argon2id',
  });

  db.insert(admins)
    .values({
      id: nanoid(12),
      username: env.ADMIN_USERNAME,
      passwordHash,
    })
    .run();

  console.log(`✅ Admin user "${env.ADMIN_USERNAME}" created.`);
}

seed().catch(console.error);
