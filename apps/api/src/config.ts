import { config as loadEnv } from 'dotenv';

loadEnv();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(optionalEnv('PORT', '3000')),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  databaseUrl: requireEnv('DATABASE_URL'),
  // Token de autenticação do Turso (libsql remoto). Vazio em dev local (SQLite em arquivo).
  databaseAuthToken: process.env['DATABASE_AUTH_TOKEN'],
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  jwtSecret: requireEnv('JWT_SECRET'),
} as const;
