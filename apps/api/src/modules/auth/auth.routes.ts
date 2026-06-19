/**
 * Rotas de autenticação
 *
 * POST /api/v1/auth/login   — login com e-mail e senha
 * POST /api/v1/auth/logout  — invalida refresh token e limpa cookie
 * POST /api/v1/auth/refresh — renova access token via cookie
 * GET  /api/v1/auth/me      — retorna usuário autenticado
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LoginBodySchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { hashToken } from '../../lib/hash.js';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias em segundos

function cookieOptions(
  nodeEnv: string,
): Parameters<FastifyReply['setCookie']>[2] {
  return {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
    // Em produção, o cookie precisa da flag Secure (HTTPS)
    secure: nodeEnv === 'production',
  };
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';

  // ── POST /login ─────────────────────────────────────────────
  fastify.post(
    '/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = LoginBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          },
        });
      }

      const result = await authService.login(fastify, parsed.data);

      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(nodeEnv));

      return reply.code(200).send({
        accessToken: result.accessToken,
        user: result.user,
      });
    },
  );

  // ── POST /logout ─────────────────────────────────────────────
  fastify.post(
    '/logout',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawToken = request.cookies?.[REFRESH_COOKIE];

      if (rawToken) {
        const tokenHash = hashToken(rawToken);
        await authService.logout(tokenHash);
      }

      reply.clearCookie(REFRESH_COOKIE, { path: '/' });

      return reply.code(200).send({ message: 'Sessão encerrada com sucesso.' });
    },
  );

  // ── POST /refresh ────────────────────────────────────────────
  fastify.post(
    '/refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawToken = request.cookies?.[REFRESH_COOKIE];

      if (!rawToken) {
        return reply.code(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Refresh token ausente.' },
        });
      }

      const accessToken = await authService.refresh(fastify, rawToken);

      return reply.code(200).send({ accessToken });
    },
  );

  // ── GET /me ──────────────────────────────────────────────────
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub, name, role } = request.user;

      return reply.code(200).send({
        id: Number(sub),
        name,
        role,
      });
    },
  );
}
