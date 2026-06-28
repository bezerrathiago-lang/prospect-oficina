/**
 * Serviço de tentativas de contato — Supabase (RPC register_contact_attempt)
 */
import { supabase, isoToUnix } from '../lib/supabase.js';

// ── Types ────────────────────────────────────────────────────────

export interface TaskDetail {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceTypeName: string;
  serviceDescription: string;
  motorcycleModel: string;
  motorcyclePlate: string;
  nextServiceDate: number; // unix timestamp (seconds)
  scheduledDate: number; // unix timestamp (seconds)
  attemptCount: number;
  status: string;
}

export interface RegisterScheduledData {
  task_id: number;
  outcome: 'scheduled';
  appointment_date: string;
}

export interface RegisterRescheduledData {
  task_id: number;
  outcome: 'rescheduled';
  rescheduled_date: string;
}

export interface RegisterAbandonedData {
  task_id: number;
  outcome: 'abandoned';
  abandonment_reason_id: number;
  abandonment_notes?: string;
}

export interface RegisterRemeasuredData {
  task_id: number;
  outcome: 'remeasured';
  new_mileage: number;
}

export type RegisterAttemptData =
  | RegisterScheduledData
  | RegisterRescheduledData
  | RegisterAbandonedData
  | RegisterRemeasuredData;

export interface ContactAttemptResult {
  id: number;
  task_id: number;
  outcome: string;
  next_task_id?: number;
}

export interface RenewProspectionData {
  task_id: number;
  scenario: string; // cenário da renovação (já fez conosco / oficina paralela / concorrente Honda)
  service_type_id: number;
  service_description: string;
  last_service_date: string; // YYYY-MM-DD
  last_service_mileage: number;
  current_mileage: number;
  next_service_mileage: number;
}

/** Encerra a prospecção atual e programa um novo ciclo (próximo serviço). */
export async function renewProspection(
  data: RenewProspectionData,
): Promise<{ scheduled_date: string }> {
  const { data: result, error } = await supabase.rpc('renew_prospection', {
    p_task_id: data.task_id,
    p_scenario: data.scenario,
    p_service_type_id: data.service_type_id,
    p_service_description: data.service_description,
    p_last_service_date: data.last_service_date,
    p_last_service_mileage: data.last_service_mileage,
    p_current_mileage: data.current_mileage,
    p_next_service_mileage: data.next_service_mileage,
  });
  if (error) throw new Error(error.message);
  return (result as { task: { scheduled_date: string } }).task;
}

// ── Functions ────────────────────────────────────────────────────

export async function registerAttempt(
  data: RegisterAttemptData,
): Promise<ContactAttemptResult> {
  const params: Record<string, unknown> = {
    p_task_id: data.task_id,
    p_outcome: data.outcome,
  };
  if (data.outcome === 'scheduled') params['p_appointment_date'] = data.appointment_date;
  else if (data.outcome === 'rescheduled') params['p_rescheduled_date'] = data.rescheduled_date;
  else if (data.outcome === 'remeasured') params['p_new_mileage'] = data.new_mileage;
  else if (data.outcome === 'abandoned') {
    params['p_abandonment_reason_id'] = data.abandonment_reason_id;
    params['p_abandonment_notes'] = data.abandonment_notes ?? null;
  }

  const { data: result, error } = await supabase.rpc('register_contact_attempt', params);
  if (error) throw new Error(error.message);
  return result as ContactAttemptResult;
}

interface TaskDetailRow {
  id: number;
  customer_id: number;
  scheduled_date: string;
  status: string;
  attempt_count: number;
  customers: { name: string; phone: string };
  service_records: {
    next_service_date: string;
    service_description: string;
    motorcycle_model: string;
    motorcycle_plate: string;
    service_types: { name: string };
  };
}

export async function getTaskById(taskId: number): Promise<TaskDetail> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id, customer_id, scheduled_date, status, attempt_count,
      customers!inner ( name, phone ),
      service_records!inner ( next_service_date, service_description, motorcycle_model, motorcycle_plate, service_types!inner ( name ) )
    `)
    .eq('id', taskId)
    .single();
  if (error) throw error;
  const row = data as unknown as TaskDetailRow;
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customers.name,
    customerPhone: row.customers.phone,
    serviceTypeName: row.service_records.service_types.name,
    serviceDescription: row.service_records.service_description,
    motorcycleModel: row.service_records.motorcycle_model,
    motorcyclePlate: row.service_records.motorcycle_plate,
    nextServiceDate: isoToUnix(row.service_records.next_service_date),
    scheduledDate: isoToUnix(row.scheduled_date),
    attemptCount: row.attempt_count,
    status: row.status,
  };
}
