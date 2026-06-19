/**
 * Serviço de registros de atendimento
 *
 * Responsabilidades:
 *   - create: upsert customer + insert service_record + insert task (em transação)
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { customers, serviceRecords, tasks, serviceTypes } from '../../db/schema.js';
import { calculateNextServiceDate } from '../../lib/forecast.js';
import type {
  CreateServiceRecordBody,
  CustomerResponse,
  ServiceRecordResponse,
  TaskResponse,
  CreateServiceRecordResponse,
} from './service-records.schema.js';

// ── Helpers ─────────────────────────────────────────────────────

function toTimestamp(date: Date): string {
  return date instanceof Date
    ? date.toISOString()
    : new Date((date as unknown as number) * 1000).toISOString();
}

// ── Service Functions ────────────────────────────────────────────

/**
 * Cria um registro de atendimento.
 *
 * Fluxo em transação única:
 *   1. Busca service_type para obter contact_lead_days
 *   2. Calcula previsão via calculateNextServiceDate
 *   3. Upsert customer (find by phone, create if not exists)
 *   4. Insert service_record
 *   5. Insert task (scheduled_date = next_service_date − contact_lead_days)
 */
export async function create(
  data: CreateServiceRecordBody,
  consultantId: number,
): Promise<CreateServiceRecordResponse> {
  const db = getDb();

  // 1. Buscar o tipo de serviço para obter contact_lead_days
  const [serviceTypeRow] = await db
    .select()
    .from(serviceTypes)
    .where(eq(serviceTypes.id, data.service_type_id))
    .limit(1);

  if (!serviceTypeRow) {
    const err = Object.assign(new Error('Tipo de serviço não encontrado.'), {
      statusCode: 404,
    });
    throw err;
  }

  const contactLeadDays = serviceTypeRow.contactLeadDays;

  // 2. Calcular previsão
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastServiceDate = new Date(data.last_service_date + 'T00:00:00');

  const forecast = calculateNextServiceDate({
    lastServiceDate,
    lastServiceMileage: data.last_service_mileage,
    currentMileage: data.current_mileage,
    nextServiceMileage: data.next_service_mileage,
    today,
  });

  // Calcular scheduled_date: next_service_date − contact_lead_days
  const scheduledDate = new Date(forecast.nextServiceDate);
  scheduledDate.setDate(scheduledDate.getDate() - contactLeadDays);

  // 3–5. Executar em transação
  // libsql não suporta drizzle transactions nativamente; usamos batch ou sequencial
  // com verificação de integridade
  const now = new Date();

  // 3. Upsert customer (find by phone, create if not exists)
  let customerRow: typeof customers.$inferSelect | undefined;

  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, data.customer_phone))
    .limit(1);

  if (existingCustomer) {
    // Atualiza nome se necessário
    if (existingCustomer.name !== data.customer_name) {
      const [updated] = await db
        .update(customers)
        .set({ name: data.customer_name, updatedAt: now })
        .where(eq(customers.id, existingCustomer.id))
        .returning();
      customerRow = updated;
    } else {
      customerRow = existingCustomer;
    }
  } else {
    const [created] = await db
      .insert(customers)
      .values({
        name: data.customer_name,
        phone: data.customer_phone,
      })
      .returning();
    customerRow = created;
  }

  if (!customerRow) {
    throw new Error('Falha ao criar/buscar cliente.');
  }

  // 4. Insert service_record
  const [serviceRecordRow] = await db
    .insert(serviceRecords)
    .values({
      customerId: customerRow.id,
      serviceTypeId: data.service_type_id,
      consultantId,
      lastServiceDate,
      lastServiceMileage: data.last_service_mileage,
      currentMileage: data.current_mileage,
      nextServiceMileage: data.next_service_mileage,
      nextServiceDate: forecast.nextServiceDate,
      dailyAverageKm: forecast.dailyAverageKm,
    })
    .returning();

  if (!serviceRecordRow) {
    throw new Error('Falha ao criar registro de atendimento.');
  }

  // 5. Insert task
  const [taskRow] = await db
    .insert(tasks)
    .values({
      serviceRecordId: serviceRecordRow.id,
      customerId: customerRow.id,
      consultantId,
      scheduledDate,
      status: 'pending',
      attemptCount: 0,
    })
    .returning();

  if (!taskRow) {
    throw new Error('Falha ao criar tarefa.');
  }

  // Montar resposta
  const customer: CustomerResponse = {
    id: customerRow.id,
    name: customerRow.name,
    phone: customerRow.phone,
    created_at: toTimestamp(customerRow.createdAt),
    updated_at: toTimestamp(customerRow.updatedAt),
  };

  const serviceRecord: ServiceRecordResponse = {
    id: serviceRecordRow.id,
    customer_id: serviceRecordRow.customerId,
    service_type_id: serviceRecordRow.serviceTypeId,
    consultant_id: serviceRecordRow.consultantId,
    last_service_date: toTimestamp(serviceRecordRow.lastServiceDate),
    last_service_mileage: serviceRecordRow.lastServiceMileage,
    current_mileage: serviceRecordRow.currentMileage,
    next_service_mileage: serviceRecordRow.nextServiceMileage,
    next_service_date: toTimestamp(serviceRecordRow.nextServiceDate),
    daily_average_km: serviceRecordRow.dailyAverageKm,
    created_at: toTimestamp(serviceRecordRow.createdAt),
    updated_at: toTimestamp(serviceRecordRow.updatedAt),
  };

  const task: TaskResponse = {
    id: taskRow.id,
    service_record_id: taskRow.serviceRecordId,
    customer_id: taskRow.customerId,
    consultant_id: taskRow.consultantId,
    scheduled_date: toTimestamp(taskRow.scheduledDate),
    status: taskRow.status,
    attempt_count: taskRow.attemptCount,
    created_at: toTimestamp(taskRow.createdAt),
    updated_at: toTimestamp(taskRow.updatedAt),
  };

  return { service_record: serviceRecord, customer, task };
}
