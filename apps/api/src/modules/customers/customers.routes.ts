/**
 * Rotas de clientes — Story 5.1
 *
 * GET /api/v1/customers/:id   — perfil completo do cliente (autenticado)
 * GET /api/v1/customers?q=   — busca por nome/telefone (autenticado)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as customersService from './customers.service.js';

export async function customersRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET / (busca) ─────────────────────────────────────────────
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { q?: string };
      const q = query.q?.trim() ?? '';

      // Retorna lista vazia se q ausente ou menor que 2 chars
      if (q.length < 2) {
        return reply.code(200).send({ data: [] });
      }

      const data = await customersService.search(q);
      return reply.code(200).send({ data });
    },
  );

  // ── GET /:id (detalhe) ────────────────────────────────────────
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
        const data = await customersService.getById(numId);
        return reply.code(200).send({ data });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) {
          return reply.code(404).send({
            error: { code: 'NOT_FOUND', message: e.message ?? 'Cliente não encontrado.' },
          });
        }
        throw err;
      }
    },
  );
}
