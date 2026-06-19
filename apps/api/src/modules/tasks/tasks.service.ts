/**
 * Serviço de tarefas
 *
 * Responsabilidades:
 *   - listByDate: retorna tarefas pendentes e concluídas do consultor para uma data
 */
import { and, between, eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { tasks, customers, serviceRecords, serviceTypes } from '../../db/schema.js';

// ── TaskDetail type (GET /tasks/:id) ─────────────────────────────

export interface TaskDetail {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceTypeName: string;
  nextServiceDate: number; // unix timestamp (seconds)
  scheduledDate: number;   // unix timestamp (seconds)
  attemptCount: number;
  status: string;
}

// ── Types ────────────────────────────────────────────────────────

export interface TaskItem {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceTypeName: string;
  nextServiceDate: number; // unix timestamp (seconds)
  attemptCount: number;
  status: string;
}

export interface TaskListResponse {
  date: string;
  pending_count: number;
  pending: TaskItem[];
  completed: TaskItem[];
}

// ── Service Functions ────────────────────────────────────────────

/**
 * Retorna dados completos de uma tarefa pelo ID.
 * Retorna null se não encontrada.
 *
 * @param taskId       - ID da tarefa
 * @param consultantId - ID do consultor autenticado (para validar ownership)
 */
export async function getById(
  taskId: number,
  consultantId: number,
): Promise<TaskDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      taskId: tasks.id,
      customerId: tasks.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceTypeName: serviceTypes.name,
      nextServiceDate: serviceRecords.nextServiceDate,
      scheduledDate: tasks.scheduledDate,
      attemptCount: tasks.attemptCount,
      status: tasks.status,
      taskConsultantId: tasks.consultantId,
    })
    .from(tasks)
    .innerJoin(customers, eq(tasks.customerId, customers.id))
    .innerJoin(serviceRecords, eq(tasks.serviceRecordId, serviceRecords.id))
    .innerJoin(serviceTypes, eq(serviceRecords.serviceTypeId, serviceTypes.id))
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!row) return null;
  if (row.taskConsultantId !== consultantId) return null;

  const toUnixSeconds = (val: Date | number): number =>
    val instanceof Date ? Math.floor(val.getTime() / 1000) : (val as number);

  return {
    id: row.taskId,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    serviceTypeName: row.serviceTypeName,
    nextServiceDate: toUnixSeconds(row.nextServiceDate),
    scheduledDate: toUnixSeconds(row.scheduledDate),
    attemptCount: row.attemptCount,
    status: row.status,
  };
}

/**
 * Lista tarefas do consultor para uma data específica.
 *
 * @param consultantId - ID do consultor (sub do JWT)
 * @param date - Data no formato YYYY-MM-DD
 */
export async function listByDate(
  consultantId: number,
  date: string,
): Promise<TaskListResponse> {
  const db = getDb();

  // Calcular timestamps de início e fim do dia (local time via Date)
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  const startTs = Math.floor(startOfDay.getTime() / 1000);
  const endTs = Math.floor(endOfDay.getTime() / 1000);

  // JOIN: tasks + customers + service_records + service_types
  const rows = await db
    .select({
      taskId: tasks.id,
      customerId: tasks.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceTypeName: serviceTypes.name,
      nextServiceDate: serviceRecords.nextServiceDate,
      attemptCount: tasks.attemptCount,
      status: tasks.status,
    })
    .from(tasks)
    .innerJoin(customers, eq(tasks.customerId, customers.id))
    .innerJoin(serviceRecords, eq(tasks.serviceRecordId, serviceRecords.id))
    .innerJoin(serviceTypes, eq(serviceRecords.serviceTypeId, serviceTypes.id))
    .where(
      and(
        eq(tasks.consultantId, consultantId),
        between(tasks.scheduledDate, new Date(startTs * 1000), new Date(endTs * 1000)),
      ),
    );

  // Mapear para TaskItem
  const allItems: TaskItem[] = rows.map((row) => ({
    id: row.taskId,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    serviceTypeName: row.serviceTypeName,
    // nextServiceDate pode ser Date (mode: timestamp) ou number — normalizar para unix seconds
    nextServiceDate:
      row.nextServiceDate instanceof Date
        ? Math.floor(row.nextServiceDate.getTime() / 1000)
        : (row.nextServiceDate as unknown as number),
    attemptCount: row.attemptCount,
    status: row.status,
  }));

  // Separar pendentes e concluídas
  const pending = allItems
    .filter((item) => item.status === 'pending')
    .sort((a, b) => b.attemptCount - a.attemptCount);

  const completed = allItems.filter(
    (item) =>
      item.status === 'completed_scheduled' ||
      item.status === 'completed_rescheduled' ||
      item.status === 'abandoned',
  );

  return {
    date,
    pending_count: pending.length,
    pending,
    completed,
  };
}
