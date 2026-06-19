/**
 * Hash utilities — bcrypt para senhas, SHA-256 para refresh tokens
 */
import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

const BCRYPT_COST = 12;

/**
 * Gera hash bcrypt (custo 12) de uma senha em texto plano.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Compara senha em texto plano com hash bcrypt armazenado.
 * Retorna true se corresponder.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera hash SHA-256 de um token opaco para armazenamento seguro no banco.
 * O token original (64 bytes hex) fica apenas no cookie httpOnly do cliente.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
