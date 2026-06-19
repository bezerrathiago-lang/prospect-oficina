/**
 * Rotas de tarefas
 *
 * GET /api/v1/tasks?date=YYYY-MM-DD — retorna tarefas do dia (autenticado)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as tasksService from './tasks.service.js';

/** Retorna a data de hoje no formato YYYY-MM-DD (local time) */
function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function tasksRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET / ────────────────────────────────────────────────────
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;
      let date = query['date'];

      // Valida formato YYYY-MM-DD; se ausente ou inválido, usa hoje
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        date = getTodayISO();
      }

      const consultantId = parseInt(request.user.sub, 10);

      const result = await tasksService.listByDate(consultantId, date);

      return reply.code(200).send({ data: result });
    },
  );

  // ── GET /:id ─────────────────────────────────────────────────
  fastify.get(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as Record<string, string>;
      const taskId = parseInt(params['id'] ?? '', 10);

      if (isNaN(taskId) || taskId <= 0) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'ID de tarefa inválido.' },
        });
      }

      const consultantId = parseInt(request.user.sub, 10);
      const task = await tasksService.getById(taskId, consultantId);

      if (!task) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Tarefa não encontrada.' },
        });
      }

      return reply.code(200).send({ data: task });
    },
  );
}
