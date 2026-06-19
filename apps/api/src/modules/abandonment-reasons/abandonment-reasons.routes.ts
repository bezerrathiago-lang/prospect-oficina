/**
 * Rotas de motivos de desistência
 *
 * GET   /api/v1/abandonment-reasons           — lista ativos (autenticado)
 *                                               com ?include_inactive=true: lista todos
 * POST  /api/v1/abandonment-reasons           — cria motivo (role: manager)
 * PATCH /api/v1/abandonment-reasons/:id       — atualiza motivo (role: manager)
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as abandonmentReasonsService from './abandonment-reasons.service.js';

// ── Schemas de validação ─────────────────────────────────────────

const CreateAbandonmentReasonSchema = z.object({
  label: z
    .string({ error: 'Nome é obrigatório.' })
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres.' }),
});

const UpdateAbandonmentReasonSchema = z.object({
  label: z
    .string()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres.' })
    .optional(),
  is_active: z.boolean().optional(),
});

// ── Rotas ────────────────────────────────────────────────────────

export async function abandonmentReasonsRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET / ────────────────────────────────────────────────────
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { include_inactive?: string };
      const includeInactive = query.include_inactive === 'true';

      const reasons = await abandonmentReasonsService.list(includeInactive);
      return reply.code(200).send({ data: reasons });
    },
  );

  // ── POST / ───────────────────────────────────────────────────
  fastify.post(
    '/',
    { preHandler: [fastify.requireRole('manager')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateAbandonmentReasonSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
            details: parsed.error.issues,
          },
        });
      }

      const data = await abandonmentReasonsService.create(parsed.data);
      return reply.code(201).send({ data });
    },
  );

  // ── PATCH /:id ───────────────────────────────────────────────
  fastify.patch(
    '/:id',
    { preHandler: [fastify.requireRole('manager')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const numId = parseInt(id, 10);

      if (isNaN(numId)) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'ID inválido.' },
        });
      }

      const parsed = UpdateAbandonmentReasonSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
            details: parsed.error.issues,
          },
        });
      }

      try {
        const data = await abandonmentReasonsService.update(numId, parsed.data);
        return reply.code(200).send({ data });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) {
          return reply.code(404).send({
            error: { code: 'NOT_FOUND', message: e.message ?? 'Motivo não encontrado.' },
          });
        }
        throw err;
      }
    },
  );
}
