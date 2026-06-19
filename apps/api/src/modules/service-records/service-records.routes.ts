/**
 * Rotas de registros de atendimento
 *
 * POST /api/v1/service-records — cria novo atendimento (autenticado)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateServiceRecordSchema } from './service-records.schema.js';
import * as serviceRecordsService from './service-records.service.js';

export async function serviceRecordsRoutes(fastify: FastifyInstance): Promise<void> {
  // ── POST / ───────────────────────────────────────────────────
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateServiceRecordSchema.safeParse(request.body);
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
        const data = await serviceRecordsService.create(parsed.data, consultantId);
        return reply.code(201).send({ data });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) {
          return reply.code(404).send({
            error: { code: 'NOT_FOUND', message: e.message ?? 'Não encontrado.' },
          });
        }
        if (e.message?.includes('Data do último serviço deve ser anterior')) {
          return reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: e.message,
            },
          });
        }
        throw err;
      }
    },
  );
}
