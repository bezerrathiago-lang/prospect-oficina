/**
 * Migration runner — executa via: pnpm db:migrate
 */
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env['DATABASE_URL'];
if (!url) {
  throw new Error('DATABASE_URL environment variable is required');
}

// authToken é exigido pelo Turso (libsql remoto); ausente em dev local (file:./dev.db)
const authToken = process.env['DATABASE_AUTH_TOKEN'];
const client = createClient(authToken ? { url, authToken } : { url });
const db = drizzle(client);

console.log('Running migrations...');

await migrate(db, {
  migrationsFolder: resolve(__dirname, 'migrations'),
});

console.log('Migrations completed successfully.');
client.close();
