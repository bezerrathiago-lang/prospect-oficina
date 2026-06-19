/**
 * Serviço de tentativas de contato (Stories 4.1, 4.2, 4.3)
 *
 * Responsabilidades:
 *   - registerAttempt: registra o resultado do contato e atualiza a tarefa em transação
 *
 * Outcomes:
 *   - 'scheduled':   insert contact_attempt + update task (completed_scheduled, appointment_date)
 *   - 'rescheduled': insert contact_attempt + update task original + insert nova task + update next_task_id
 *   - 'abandoned':   insert contact_attempt (com motivo) + update task (abandoned)
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { tasks, contactAttempts, abandonmentReasons } from '../../db/schema.js';
import type {
  RegisterContactAttemptBody,
  ScheduledBody,
  RescheduledBody,
  AbandonedBody,
} from './contact-attempts.schema.js';

// ── Types ─────────────────────────────────────────────────────────

export interface ContactAttemptResult {
  id: number;
  task_id: number;
  outcome: string;
  next_task_id?: number;
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Converte data ISO (YYYY-MM-DD) para objeto Date no início do dia local.
 */
function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

// ── Service Functions ─────────────────────────────────────────────

/**
 * Registra tentativa de contato e executa atualizações na task em transação.
 *
 * @param data         - Body validado pelo schema (discriminated union)
 * @param consultantId - ID do consultor autenticado (sub do JWT)
 */
export async function registerAttempt(
  data: RegisterContactAttemptBody,
  consultantId: number,
): Promise<ContactAttemptResult> {
  const db = getDb();
  const now = new Date();

  // ── 1. Buscar e validar ownership da task ──────────────────────
  const [taskRow] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, data.task_id))
    .limit(1);

  if (!taskRow) {
    const err = Object.assign(new Error('Tarefa não encontrada.'), { statusCode: 404 });
    throw err;
  }

  if (taskRow.consultantId !== consultantId) {
    const err = Object.assign(
      new Error('Você não tem permissão para registrar resultado nesta tarefa.'),
      { statusCode: 403 },
    );
    throw err;
  }

  if (taskRow.status !== 'pending') {
    const err = Object.assign(
      new Error('Esta tarefa já foi encerrada e não pode ser alterada.'),
      { statusCode: 409 },
    );
    throw err;
  }

  // ── 2. Despachar por outcome ───────────────────────────────────
  if (data.outcome === 'scheduled') {
    return registerScheduled(data, taskRow, consultantId, now, db);
  }

  if (data.outcome === 'rescheduled') {
    return registerRescheduled(data, taskRow, consultantId, now, db);
  }

  // data.outcome === 'abandoned'
  return registerAbandoned(data, taskRow, consultantId, now, db);
}

// ── outcome: 'scheduled' ──────────────────────────────────────────

async function registerScheduled(
  data: ScheduledBody,
  taskRow: typeof tasks.$inferSelect,
  consultantId: number,
  now: Date,
  db: ReturnType<typeof getDb>,
): Promise<ContactAttemptResult> {
  const appointmentDate = isoToDate(data.appointment_date);

  // INSERT contact_attempts
  const [attempt] = await db
    .insert(contactAttempts)
    .values({
      taskId: taskRow.id,
      consultantId,
      outcome: 'scheduled',
      appointmentDate,
    })
    .returning();

  if (!attempt) throw new Error('Falha ao inserir tentativa de contato.');

  // UPDATE tasks
  await db
    .update(tasks)
    .set({
      status: 'completed_scheduled',
      appointmentDate,
      attemptCount: taskRow.attemptCount + 1,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskRow.id));

  return {
    id: attempt.id,
    task_id: taskRow.id,
    outcome: 'scheduled',
  };
}

// ── outcome: 'rescheduled' ────────────────────────────────────────

async function registerRescheduled(
  data: RescheduledBody,
  taskRow: typeof tasks.$inferSelect,
  consultantId: number,
  now: Date,
  db: ReturnType<typeof getDb>,
): Promise<ContactAttemptResult> {
  const rescheduledDate = isoToDate(data.rescheduled_date);

  // INSERT contact_attempts (sem next_task_id ainda)
  const [attempt] = await db
    .insert(contactAttempts)
    .values({
      taskId: taskRow.id,
      consultantId,
      outcome: 'rescheduled',
      rescheduledDate,
    })
    .returning();

  if (!attempt) throw new Error('Falha ao inserir tentativa de contato.');

  // UPDATE tarefa original → completed_rescheduled
  await db
    .update(tasks)
    .set({
      status: 'completed_rescheduled',
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskRow.id));

  // INSERT nova tarefa com attempt_count incrementado e scheduled_date = rescheduled_date
  const [newTask] = await db
    .insert(tasks)
    .values({
      serviceRecordId: taskRow.serviceRecordId,
      customerId: taskRow.customerId,
      consultantId: taskRow.consultantId,
      scheduledDate: rescheduledDate,
      status: 'pending',
      attemptCount: taskRow.attemptCount + 1,
    })
    .returning();

  if (!newTask) throw new Error('Falha ao criar nova tarefa de reagendamento.');

  // UPDATE contact_attempts.next_task_id
  await db
    .update(contactAttempts)
    .set({ nextTaskId: newTask.id })
    .where(eq(contactAttempts.id, attempt.id));

  return {
    id: attempt.id,
    task_id: taskRow.id,
    outcome: 'rescheduled',
    next_task_id: newTask.id,
  };
}

// ── outcome: 'abandoned' ──────────────────────────────────────────

async function registerAbandoned(
  data: AbandonedBody,
  taskRow: typeof tasks.$inferSelect,
  consultantId: number,
  now: Date,
  db: ReturnType<typeof getDb>,
): Promise<ContactAttemptResult> {
  // Verificar se o motivo exige texto livre (is_other = 1)
  const [reasonRow] = await db
    .select({ isOther: abandonmentReasons.isOther })
    .from(abandonmentReasons)
    .where(eq(abandonmentReasons.id, data.abandonment_reason_id))
    .limit(1);

  if (!reasonRow) {
    const err = Object.assign(new Error('Motivo de desistência não encontrado.'), {
      statusCode: 404,
    });
    throw err;
  }

  if (reasonRow.isOther === 1) {
    if (!data.abandonment_notes || data.abandonment_notes.trim().length < 5) {
      const err = Object.assign(
        new Error('Descreva o motivo (mínimo 5 caracteres).'),
        { statusCode: 400 },
      );
      throw err;
    }
  }

  // INSERT contact_attempts
  const [attempt] = await db
    .insert(contactAttempts)
    .values({
      taskId: taskRow.id,
      consultantId,
      outcome: 'abandoned',
      abandonmentReasonId: data.abandonment_reason_id,
      abandonmentNotes: data.abandonment_notes ?? null,
    })
    .returning();

  if (!attempt) throw new Error('Falha ao inserir tentativa de contato.');

  // UPDATE tasks → abandoned
  await db
    .update(tasks)
    .set({
      status: 'abandoned',
      attemptCount: taskRow.attemptCount + 1,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskRow.id));

  return {
    id: attempt.id,
    task_id: taskRow.id,
    outcome: 'abandoned',
  };
}
