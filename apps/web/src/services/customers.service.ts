/**
 * Serviço de clientes — Supabase
 *
 * getCustomer: hierarquia completa (cliente → atendimentos → tarefas → tentativas)
 * searchCustomers: busca por nome ou telefone + status atual da prospecção
 *
 * Datas convertidas para unix timestamp (segundos) para preservar a interface.
 */
import { supabase, isoToUnix } from '../lib/supabase.js';

// ── Types ────────────────────────────────────────────────────────

export interface ContactAttemptDetail {
  id: number;
  outcome: 'scheduled' | 'rescheduled' | 'abandoned' | 'remeasured';
  appointment_date: number | null;
  rescheduled_date: number | null;
  new_mileage: number | null;
  service_done_location: string | null;
  abandonment_reason: { label: string; is_other: boolean } | null;
  abandonment_notes: string | null;
  created_at: number;
}

export interface TaskDetail {
  id: number;
  status: 'pending' | 'completed_scheduled' | 'completed_rescheduled' | 'abandoned';
  scheduled_date: number;
  attempt_count: number;
  contact_attempts: ContactAttemptDetail[];
  created_at: number;
}

export interface ServiceRecordDetail {
  id: number;
  service_type_name: string;
  service_description: string;
  motorcycle_model: string;
  motorcycle_plate: string;
  last_service_date: number;
  last_service_mileage: number;
  current_mileage: number;
  next_service_date: number;
  tasks: TaskDetail[];
  created_at: number;
}

export type ProspectionStatus =
  | 'pending'
  | 'completed_scheduled'
  | 'completed_rescheduled'
  | 'abandoned'
  | null;

export interface CustomerDetail {
  id: number;
  name: string;
  phone: string;
  latest_status: ProspectionStatus;
  service_records: ServiceRecordDetail[];
}

export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
  latest_status: ProspectionStatus;
}

// ── getCustomer ───────────────────────────────────────────────────

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      id, name, phone,
      service_records (
        id, service_description, motorcycle_model, motorcycle_plate,
        last_service_date, last_service_mileage,
        current_mileage, next_service_date, created_at,
        service_types ( name ),
        tasks (
          id, status, scheduled_date, attempt_count, created_at,
          contact_attempts!contact_attempts_task_id_fkey (
            id, outcome, appointment_date, rescheduled_date, new_mileage,
            service_done_location, abandonment_notes, created_at,
            abandonment_reasons ( label, is_other )
          )
        )
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const c = data as any;

  const records: ServiceRecordDetail[] = (c.service_records ?? [])
    .map((r: any) => {
      const tasks: TaskDetail[] = (r.tasks ?? [])
        .map((t: any) => {
          const attempts: ContactAttemptDetail[] = (t.contact_attempts ?? [])
            .map((a: any) => ({
              id: a.id,
              outcome: a.outcome,
              appointment_date: a.appointment_date ? isoToUnix(a.appointment_date) : null,
              rescheduled_date: a.rescheduled_date ? isoToUnix(a.rescheduled_date) : null,
              new_mileage: a.new_mileage ?? null,
              service_done_location: a.service_done_location ?? null,
              abandonment_reason: a.abandonment_reasons
                ? { label: a.abandonment_reasons.label, is_other: a.abandonment_reasons.is_other }
                : null,
              abandonment_notes: a.abandonment_notes ?? null,
              created_at: isoToUnix(a.created_at),
            }))
            .sort((x: ContactAttemptDetail, y: ContactAttemptDetail) => x.created_at - y.created_at);
          return {
            id: t.id,
            status: t.status,
            scheduled_date: isoToUnix(t.scheduled_date),
            attempt_count: t.attempt_count,
            contact_attempts: attempts,
            created_at: isoToUnix(t.created_at),
          };
        })
        .sort((x: TaskDetail, y: TaskDetail) => x.created_at - y.created_at);
      return {
        id: r.id,
        service_type_name: r.service_types?.name ?? '',
        service_description: r.service_description ?? '',
        motorcycle_model: r.motorcycle_model ?? '',
        motorcycle_plate: r.motorcycle_plate ?? '',
        last_service_date: isoToUnix(r.last_service_date),
        last_service_mileage: r.last_service_mileage,
        current_mileage: r.current_mileage,
        next_service_date: isoToUnix(r.next_service_date),
        tasks,
        created_at: isoToUnix(r.created_at),
      };
    })
    .sort((x: ServiceRecordDetail, y: ServiceRecordDetail) => y.created_at - x.created_at);

  // status atual = task mais recente do atendimento mais recente
  const latestRecord = records[0];
  const latestTask = latestRecord
    ? [...latestRecord.tasks].sort((a, b) => b.created_at - a.created_at)[0]
    : null;

  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    latest_status: latestTask?.status ?? null,
    service_records: records,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// ── searchCustomers ──────────────────────────────────────────────

export async function searchCustomers(q: string): Promise<CustomerSummary[]> {
  if (q.trim().length < 2) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone')
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(30);
  if (error) throw error;

  const customers = data ?? [];
  if (customers.length === 0) return [];

  // Status atual de cada cliente: status da task mais recente
  const ids = customers.map((c) => c.id);
  const { data: tasks } = await supabase
    .from('tasks')
    .select('customer_id, status, created_at')
    .in('customer_id', ids)
    .order('created_at', { ascending: false });

  const statusByCustomer = new Map<number, ProspectionStatus>();
  for (const t of tasks ?? []) {
    if (!statusByCustomer.has(t.customer_id)) {
      statusByCustomer.set(t.customer_id, t.status as ProspectionStatus);
    }
  }

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    latest_status: statusByCustomer.get(c.id) ?? null,
  }));
}
