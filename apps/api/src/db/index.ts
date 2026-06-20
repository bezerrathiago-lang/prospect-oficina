import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb(): ReturnType<typeof drizzle> {
  if (_db) return _db;

  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // authToken é exigido pelo Turso (libsql remoto); ausente em dev local (file:./dev.db)
  const authToken = process.env['DATABASE_AUTH_TOKEN'];
  const client = createClient(authToken ? { url, authToken } : { url });
  _db = drizzle(client, { schema });
  return _db;
}

export type Db = ReturnType<typeof getDb>;
