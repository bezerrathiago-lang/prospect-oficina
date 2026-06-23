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
import {
  tasks,
  contactAttempts,
  abandonmentReasons,
  serviceRecords,
  serviceTypes,
} from '../../db/schema.js';
import { calculateNextServiceDate, subtractBusinessDays } from '../../lib/forecast.js';
import type {
  RegisterContactAttemptBody,
  ScheduledBody,
  RescheduledBody,
  AbandonedBody,
  RemeasuredBody,
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

  if (data.outcome === 'remeasured') {
    return registerRemeasured(data, taskRow, consultantId, now, db);
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

// ── outcome: 'remeasured' (Não chegou na km) ─────────────────────
//
// O cliente ainda não atingiu a km do próximo serviço. O consultor informa
// a quilometragem medida hoje; o sistema recalcula a previsão usando SEMPRE
// as duas últimas leituras (a leitura atual anterior + a nova de hoje) e
// reagenda a tarefa para a nova data prevista.

async function registerRemeasured(
  data: RemeasuredBody,
  taskRow: typeof tasks.$inferSelect,
  consultantId: number,
  now: Date,
  db: ReturnType<typeof getDb>,
): Promise<ContactAttemptResult> {
  // Buscar o service_record vinculado à tarefa
  const [record] = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.id, taskRow.serviceRecordId))
    .limit(1);

  if (!record) {
    const err = Object.assign(new Error('Registro de atendimento não encontrado.'), {
      statusCode: 404,
    });
    throw err;
  }

  // Buscar contact_lead_days do tipo de serviço (dias úteis de antecedência)
  const [serviceTypeRow] = await db
    .select({ contactLeadDays: serviceTypes.contactLeadDays })
    .from(serviceTypes)
    .where(eq(serviceTypes.id, record.serviceTypeId))
    .limit(1);

  const contactLeadDays = serviceTypeRow?.contactLeadDays ?? 5;

  // Leitura anterior = a leitura atual vigente do registro.
  // Fallback para a data do último serviço se currentMileageDate não existir (registros legados).
  const prevReadingDate = record.currentMileageDate ?? record.lastServiceDate;
  const prevReadingMileage = record.currentMileage;
  const newMileage = data.new_mileage;

  // Validações de coerência
  if (newMileage <= prevReadingMileage) {
    const err = Object.assign(
      new Error('A nova km deve ser maior que a última km registrada.'),
      { statusCode: 400 },
    );
    throw err;
  }
  if (newMileage >= record.nextServiceMileage) {
    const err = Object.assign(
      new Error(
        'A km informada já atingiu a meta do próximo serviço — registre o agendamento.',
      ),
      { statusCode: 400 },
    );
    throw err;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Recalcular usando as duas últimas leituras: (prevReadingDate, prevReadingMileage) → (hoje, newMileage)
  let forecast;
  try {
    forecast = calculateNextServiceDate({
      lastServiceDate: prevReadingDate as Date,
      lastServiceMileage: prevReadingMileage,
      currentMileage: newMileage,
      nextServiceMileage: record.nextServiceMileage,
      today,
    });
  } catch {
    const err = Object.assign(
      new Error('Não há intervalo suficiente entre as leituras para recalcular.'),
      { statusCode: 400 },
    );
    throw err;
  }

  const newScheduledDate = subtractBusinessDays(forecast.nextServiceDate, contactLeadDays);

  // Atualizar o service_record: a leitura de hoje vira a "atual"; a anterior é preservada como base
  await db
    .update(serviceRecords)
    .set({
      lastServiceDate: prevReadingDate as Date,
      lastServiceMileage: prevReadingMileage,
      currentMileage: newMileage,
      currentMileageDate: today,
      nextServiceDate: forecast.nextServiceDate,
      dailyAverageKm: forecast.dailyAverageKm,
      updatedAt: now,
    })
    .where(eq(serviceRecords.id, record.id));

  // INSERT contact_attempts (outcome remeasured, nova km, nova data agendada)
  const [attempt] = await db
    .insert(contactAttempts)
    .values({
      taskId: taskRow.id,
      consultantId,
      outcome: 'remeasured',
      newMileage,
      rescheduledDate: newScheduledDate,
    })
    .returning();

  if (!attempt) throw new Error('Falha ao inserir tentativa de contato.');

  // Tarefa atual encerrada como reagendada
  await db
    .update(tasks)
    .set({
      status: 'completed_rescheduled',
      attemptCount: taskRow.attemptCount + 1,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskRow.id));

  // Nova tarefa na data recalculada
  const [newTask] = await db
    .insert(tasks)
    .values({
      serviceRecordId: taskRow.serviceRecordId,
      customerId: taskRow.customerId,
      consultantId: taskRow.consultantId,
      scheduledDate: newScheduledDate,
      status: 'pending',
      attemptCount: taskRow.attemptCount + 1,
    })
    .returning();

  if (!newTask) throw new Error('Falha ao criar nova tarefa após recálculo.');

  await db
    .update(contactAttempts)
    .set({ nextTaskId: newTask.id })
    .where(eq(contactAttempts.id, attempt.id));

  return {
    id: attempt.id,
    task_id: taskRow.id,
    outcome: 'remeasured',
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
