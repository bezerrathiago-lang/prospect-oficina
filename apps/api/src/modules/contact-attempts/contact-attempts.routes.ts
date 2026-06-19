/**
 * Rotas de tentativas de contato
 *
 * POST /api/v1/contact-attempts — registra resultado de contato (autenticado)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RegisterContactAttemptSchema } from './contact-attempts.schema.js';
import * as contactAttemptsService from './contact-attempts.service.js';

export async function contactAttemptsRoutes(fastify: FastifyInstance): Promise<void> {
  // ── POST / ───────────────────────────────────────────────────
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = RegisterContactAttemptSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
            details: parsed.error.issues,
          },
        });
      }

      const consultantId = parseInt(request.user.sub, 10);

      try {
        const result = await contactAttemptsService.registerAttempt(
          parsed.data,
          consultantId,
        );
        return reply.code(201).send({ data: result });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) {
          return reply.code(404).send({
            error: { code: 'NOT_FOUND', message: e.message ?? 'Não encontrado.' },
          });
        }
        if (e.statusCode === 403) {
          return reply.code(403).send({
            error: { code: 'FORBIDDEN', message: e.message ?? 'Acesso negado.' },
          });
        }
        if (e.statusCode === 409) {
          return reply.code(409).send({
            error: { code: 'CONFLICT', message: e.message ?? 'Conflito.' },
          });
        }
        if (e.statusCode === 400) {
          return reply.code(400).send({
            error: { code: 'VALIDATION_ERROR', message: e.message ?? 'Dados inválidos.' },
          });
        }
        throw err;
      }
    },
  );
}
