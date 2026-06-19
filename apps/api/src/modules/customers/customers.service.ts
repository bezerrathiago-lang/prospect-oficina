/**
 * Serviço de clientes — Story 5.1
 *
 * Responsabilidades:
 *   - getById: retorna hierarquia completa do cliente
 *     customer → service_records → tasks → contact_attempts → abandonment_reason
 *   - search: busca por nome ou telefone (LIKE %q%)
 */
import { eq, desc, asc, or, like, sql } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import {
  customers,
  serviceRecords,
  serviceTypes,
  tasks,
  contactAttempts,
  abandonmentReasons,
} from '../../db/schema.js';

// ── Types ────────────────────────────────────────────────────────

export interface ContactAttemptDetail {
  id: number;
  outcome: 'scheduled' | 'rescheduled' | 'abandoned';
  appointment_date: number | null;   // unix timestamp seconds
  rescheduled_date: number | null;   // unix timestamp seconds
  abandonment_reason: {
    label: string;
    is_other: boolean;
  } | null;
  abandonment_notes: string | null;
  created_at: number;               // unix timestamp seconds
}

export interface TaskDetail {
  id: number;
  status: 'pending' | 'completed_scheduled' | 'completed_rescheduled' | 'abandoned';
  scheduled_date: number;           // unix timestamp seconds
  attempt_count: number;
  contact_attempts: ContactAttemptDetail[];
  created_at: number;
}

export interface ServiceRecordDetail {
  id: number;
  service_type_name: string;
  last_service_date: number;        // unix timestamp seconds
  last_service_mileage: number;
  current_mileage: number;
  next_service_date: number;        // unix timestamp seconds
  tasks: TaskDetail[];
  created_at: number;
}

export interface CustomerDetail {
  id: number;
  name: string;
  phone: string;
  latest_status: 'pending' | 'completed_scheduled' | 'completed_rescheduled' | 'abandoned' | null;
  service_records: ServiceRecordDetail[];
}

export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
  latest_status: 'pending' | 'completed_scheduled' | 'completed_rescheduled' | 'abandoned' | null;
}

// ── Helpers ──────────────────────────────────────────────────────

/** Converte timestamp para segundos (se vier em milissegundos ou como Date) */
function toUnixSeconds(val: Date | number | null | undefined): number | null {
  if (val == null) return null;
  if (val instanceof Date) return Math.floor(val.getTime() / 1000);
  // Se já for number, pode ser seconds (< 1e10) ou ms (> 1e10)
  if (val > 1e10) return Math.floor(val / 1000);
  return val;
}

function toUnixSecondsRequired(val: Date | number): number {
  return toUnixSeconds(val) ?? 0;
}

// ── Service Functions ─────────────────────────────────────────────

/**
 * Retorna perfil completo do cliente com toda a hierarquia de atendimentos.
 * Lança 404 se não encontrado.
 */
export async function getById(customerId: number): Promise<CustomerDetail> {
  const db = getDb();

  // ── 1. Buscar customer ────────────────────────────────────────
  const [customerRow] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customerRow) {
    const err = Object.assign(new Error('Cliente não encontrado.'), { statusCode: 404 });
    throw err;
  }

  // ── 2. Buscar service_records com service_type, ordem DESC ───
  const recordRows = await db
    .select({
      id: serviceRecords.id,
      serviceTypeName: serviceTypes.name,
      lastServiceDate: serviceRecords.lastServiceDate,
      lastServiceMileage: serviceRecords.lastServiceMileage,
      currentMileage: serviceRecords.currentMileage,
      nextServiceDate: serviceRecords.nextServiceDate,
      createdAt: serviceRecords.createdAt,
    })
    .from(serviceRecords)
    .innerJoin(serviceTypes, eq(serviceRecords.serviceTypeId, serviceTypes.id))
    .where(eq(serviceRecords.customerId, customerId))
    .orderBy(desc(serviceRecords.createdAt));

  if (recordRows.length === 0) {
    return {
      id: customerRow.id,
      name: customerRow.name,
      phone: customerRow.phone,
      latest_status: null,
      service_records: [],
    };
  }

  const recordIds = recordRows.map((r) => r.id);

  // ── 3. Buscar todas as tasks dos service_records ──────────────
  // Drizzle SQLite não suporta inArray diretamente em todas as versões,
  // usamos sql template para IN clause
  const allTasks = await db
    .select()
    .from(tasks)
    .where(sql`${tasks.serviceRecordId} IN (${sql.join(recordIds.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(asc(tasks.createdAt));

  const taskIds = allTasks.map((t) => t.id);

  // ── 4. Buscar todas as contact_attempts das tasks ─────────────
  let allAttempts: (typeof contactAttempts.$inferSelect & {
    reasonLabel: string | null;
    reasonIsOther: number | null;
  })[] = [];

  if (taskIds.length > 0) {
    allAttempts = await db
      .select({
        id: contactAttempts.id,
        taskId: contactAttempts.taskId,
        consultantId: contactAttempts.consultantId,
        outcome: contactAttempts.outcome,
        appointmentDate: contactAttempts.appointmentDate,
        rescheduledDate: contactAttempts.rescheduledDate,
        nextTaskId: contactAttempts.nextTaskId,
        abandonmentReasonId: contactAttempts.abandonmentReasonId,
        abandonmentNotes: contactAttempts.abandonmentNotes,
        createdAt: contactAttempts.createdAt,
        reasonLabel: abandonmentReasons.label,
        reasonIsOther: abandonmentReasons.isOther,
      })
      .from(contactAttempts)
      .leftJoin(
        abandonmentReasons,
        eq(contactAttempts.abandonmentReasonId, abandonmentReasons.id),
      )
      .where(
        sql`${contactAttempts.taskId} IN (${sql.join(taskIds.map((id) => sql`${id}`), sql`, `)})`,
      )
      .orderBy(asc(contactAttempts.createdAt));
  }

  // ── 5. Montar hierarquia ──────────────────────────────────────

  // Agrupar attempts por taskId
  const attemptsByTaskId = new Map<number, typeof allAttempts>();
  for (const attempt of allAttempts) {
    const list = attemptsByTaskId.get(attempt.taskId) ?? [];
    list.push(attempt);
    attemptsByTaskId.set(attempt.taskId, list);
  }

  // Agrupar tasks por serviceRecordId
  const tasksByRecordId = new Map<number, typeof allTasks>();
  for (const task of allTasks) {
    const list = tasksByRecordId.get(task.serviceRecordId) ?? [];
    list.push(task);
    tasksByRecordId.set(task.serviceRecordId, list);
  }

  // Construir service_records com tasks e attempts
  const serviceRecordDetails: ServiceRecordDetail[] = recordRows.map((rec) => {
    const recTasks = tasksByRecordId.get(rec.id) ?? [];

    const taskDetails: TaskDetail[] = recTasks.map((t) => {
      const attempts = attemptsByTaskId.get(t.id) ?? [];
      const attemptDetails: ContactAttemptDetail[] = attempts.map((a) => ({
        id: a.id,
        outcome: a.outcome,
        appointment_date: toUnixSeconds(a.appointmentDate as Date | number | null),
        rescheduled_date: toUnixSeconds(a.rescheduledDate as Date | number | null),
        abandonment_reason:
          a.outcome === 'abandoned' && a.reasonLabel != null
            ? { label: a.reasonLabel, is_other: (a.reasonIsOther ?? 0) === 1 }
            : null,
        abandonment_notes: a.abandonmentNotes ?? null,
        created_at: toUnixSecondsRequired(a.createdAt as Date | number),
      }));

      return {
        id: t.id,
        status: t.status,
        scheduled_date: toUnixSecondsRequired(t.scheduledDate as Date | number),
        attempt_count: t.attemptCount,
        contact_attempts: attemptDetails,
        created_at: toUnixSecondsRequired(t.createdAt as Date | number),
      };
    });

    return {
      id: rec.id,
      service_type_name: rec.serviceTypeName,
      last_service_date: toUnixSecondsRequired(rec.lastServiceDate as Date | number),
      last_service_mileage: rec.lastServiceMileage,
      current_mileage: rec.currentMileage,
      next_service_date: toUnixSecondsRequired(rec.nextServiceDate as Date | number),
      tasks: taskDetails,
      created_at: toUnixSecondsRequired(rec.createdAt as Date | number),
    };
  });

  // ── 6. Status atual: task mais recente do service_record mais recente
  const latestRecord = serviceRecordDetails[0]; // já ordenado DESC
  const latestTask = latestRecord
    ? [...latestRecord.tasks].sort((a, b) => b.created_at - a.created_at)[0]
    : null;
  const latestStatus = latestTask?.status ?? null;

  return {
    id: customerRow.id,
    name: customerRow.name,
    phone: customerRow.phone,
    latest_status: latestStatus,
    service_records: serviceRecordDetails,
  };
}

/**
 * Busca clientes por nome ou telefone (LIKE %q%).
 * Retorna lista resumida com status atual da prospecção.
 */
export async function search(q: string): Promise<CustomerSummary[]> {
  const db = getDb();

  const pattern = `%${q}%`;

  const matchingCustomers = await db
    .select()
    .from(customers)
    .where(or(like(customers.name, pattern), like(customers.phone, pattern)))
    .orderBy(asc(customers.name))
    .limit(30);

  if (matchingCustomers.length === 0) return [];

  // Para cada cliente, buscar o status da task mais recente do service_record mais recente
  const results: CustomerSummary[] = await Promise.all(
    matchingCustomers.map(async (customer) => {
      // Pegar o service_record mais recente
      const [latestRecord] = await db
        .select({ id: serviceRecords.id })
        .from(serviceRecords)
        .where(eq(serviceRecords.customerId, customer.id))
        .orderBy(desc(serviceRecords.createdAt))
        .limit(1);

      let latestStatus: CustomerSummary['latest_status'] = null;

      if (latestRecord) {
        // Pegar a task mais recente desse service_record
        const [latestTask] = await db
          .select({ status: tasks.status })
          .from(tasks)
          .where(eq(tasks.serviceRecordId, latestRecord.id))
          .orderBy(desc(tasks.createdAt))
          .limit(1);

        latestStatus = latestTask?.status ?? null;
      }

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        latest_status: latestStatus,
      };
    }),
  );

  return results;
}
