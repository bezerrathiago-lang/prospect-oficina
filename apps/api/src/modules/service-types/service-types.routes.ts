/**
 * Rotas de tipos de serviço
 *
 * GET    /api/v1/service-types         — lista tipos ativos (autenticado)
 * POST   /api/v1/service-types         — cria novo tipo (role: manager)
 * GET    /api/v1/service-types/:id     — detalhe do tipo (autenticado)
 * PATCH  /api/v1/service-types/:id     — atualiza tipo (role: manager)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateServiceTypeSchema, UpdateServiceTypeSchema } from './service-types.schema.js';
import * as serviceTypesService from './service-types.service.js';

export async function serviceTypesRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET / ────────────────────────────────────────────────────
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { include_inactive?: string };
      const includeInactive = query.include_inactive === 'true';

      const data = await serviceTypesService.list(includeInactive);

      return reply.code(200).send({ data });
    },
  );

  // ── POST / ───────────────────────────────────────────────────
  fastify.post(
    '/',
    { preHandler: [fastify.requireRole('manager')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateServiceTypeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
            details: parsed.error.issues,
          },
        });
      }

      const data = await serviceTypesService.create(parsed.data);

      return reply.code(201).send({ data });
    },
  );

  // ── GET /:id ─────────────────────────────────────────────────
  fastify.get(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const numId = parseInt(id, 10);

      if (isNaN(numId)) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'ID inválido.' },
        });
      }

      try {
        const data = await serviceTypesService.findById(numId);
        return reply.code(200).send({ data });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) {
          return reply.code(404).send({
            error: { code: 'NOT_FOUND', message: e.message ?? 'Não encontrado.' },
          });
        }
        throw err;
      }
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

      const parsed = UpdateServiceTypeSchema.safeParse(request.body);
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
        const data = await serviceTypesService.update(numId, parsed.data);
        return reply.code(200).send({ data });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) {
          return reply.code(404).send({
            error: { code: 'NOT_FOUND', message: e.message ?? 'Não encontrado.' },
          });
        }
        throw err;
      }
    },
  );
}
