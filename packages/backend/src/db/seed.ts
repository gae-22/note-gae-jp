import 'dotenv/config';
import { db } from './client';
import { users } from './schema';
import { hash as argon2Hash } from '@node-rs/argon2';
import { ulid } from 'ulid';

console.log('Seeding database...');

async function main() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'password';

    const hashedPassword = await argon2Hash(password);

    try {
        await db.insert(users).values({
            id: ulid(),
            username,
            passwordHash: hashedPassword,
        });
        console.log('Admin user created');
    } catch (e) {
        console.log('Admin user might already exist');
    }
}

main()
    .then(() => {
        console.log('Seeding completed');
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
