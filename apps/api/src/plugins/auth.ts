/**
 * Plugin de autenticação JWT
 *
 * Registra @fastify/jwt e @fastify/cookie.
 * Decora o servidor com:
 *   - fastify.authenticate — hook que valida Bearer token e injeta request.user
 *   - fastify.requireRole(role) — hook adicional que verifica role no payload JWT
 */
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { config } from '../config.js';

export interface JwtPayload {
  sub: string;
  name: string;
  role: 'consultant' | 'manager';
  iat?: number;
  exp?: number;
}

// Extend FastifyRequest to type request.user
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

// Extend FastifyInstance to expose decorator methods
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    requireRole: (
      role: 'consultant' | 'manager',
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Register cookie support (needed to read the refresh token cookie)
  await fastify.register(fastifyCookie);

  // Register JWT plugin
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  // Decorator: verifies Bearer token and populates request.user
  fastify.decorate(
    'authenticate',
    async function (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado.' },
        });
      }
    },
  );

  // Decorator factory: returns a preHandler that enforces a specific role
  fastify.decorate(
    'requireRole',
    function (
      role: 'consultant' | 'manager',
    ): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
      return async function (
        request: FastifyRequest,
        reply: FastifyReply,
      ): Promise<void> {
        try {
          await request.jwtVerify();
        } catch {
          reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Token inválido ou expirado.',
            },
          });
          return;
        }

        if (request.user.role !== role) {
          reply.code(403).send({
            error: {
              code: 'FORBIDDEN',
              message: 'Acesso negado. Permissão insuficiente.',
            },
          });
        }
      };
    },
  );
}

export default fp(authPlugin, {
  name: 'auth',
});
