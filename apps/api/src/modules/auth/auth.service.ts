/**
 * Serviço de autenticação
 *
 * Responsabilidades:
 *   - login: valida credenciais, gera access JWT + refresh token opaco
 *   - logout: revoga refresh token no banco
 *   - refresh: valida refresh token e emite novo access JWT
 */
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';
import { users, refreshTokens } from '../../db/schema.js';
import { verifyPassword, hashToken } from '../../lib/hash.js';
import type { LoginBody, UserPayload } from './auth.schema.js';

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutos em segundos
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

// ── Types ───────────────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  refreshToken: string; // opaque — enviado via cookie
  user: UserPayload;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateOpaqueToken(): string {
  return randomBytes(64).toString('hex');
}

// ── Service Functions ────────────────────────────────────────────

/**
 * Autentica usuário com e-mail e senha.
 * Retorna access JWT, refresh token opaco e dados do usuário.
 * Lança 401 se credenciais inválidas.
 */
export async function login(
  fastify: FastifyInstance,
  body: LoginBody,
): Promise<LoginResult> {
  const db = getDb();

  // Busca usuário pelo e-mail
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  // Mensagem genérica — não revela se e-mail ou senha estão errados
  if (!user) {
    throw fastify.httpErrors.unauthorized('Credenciais inválidas.');
  }

  const passwordValid = await verifyPassword(body.password, user.passwordHash);
  if (!passwordValid) {
    throw fastify.httpErrors.unauthorized('Credenciais inválidas.');
  }

  // Gera access token JWT (15 min)
  const accessToken = fastify.jwt.sign(
    { sub: String(user.id), name: user.name, role: user.role },
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  // Gera refresh token opaco e persiste o hash no banco
  const opaqueToken = generateOpaqueToken();
  const tokenHash = hashToken(opaqueToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken: opaqueToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Invalida um refresh token preenchendo `revoked_at`.
 * Silencioso se token não existir (operação idempotente).
 */
export async function logout(tokenHash: string): Promise<void> {
  const db = getDb();

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

/**
 * Valida refresh token e emite novo access JWT.
 * Lança 401 se token expirado ou revogado.
 */
export async function refresh(
  fastify: FastifyInstance,
  opaqueToken: string,
): Promise<string> {
  const db = getDb();
  const tokenHash = hashToken(opaqueToken);

  const [record] = await db
    .select({ id: refreshTokens.id, userId: refreshTokens.userId, expiresAt: refreshTokens.expiresAt, revokedAt: refreshTokens.revokedAt })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!record) {
    throw fastify.httpErrors.unauthorized('Refresh token inválido.');
  }

  if (record.revokedAt) {
    throw fastify.httpErrors.unauthorized('Refresh token revogado.');
  }

  if (record.expiresAt < new Date()) {
    throw fastify.httpErrors.unauthorized('Refresh token expirado.');
  }

  // Busca dados atuais do usuário
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, record.userId))
    .limit(1);

  if (!user) {
    throw fastify.httpErrors.unauthorized('Usuário não encontrado.');
  }

  const accessToken = fastify.jwt.sign(
    { sub: String(user.id), name: user.name, role: user.role },
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  return accessToken;
}
