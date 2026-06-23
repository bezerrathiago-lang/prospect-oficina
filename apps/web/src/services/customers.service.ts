/**
 * Serviço HTTP para clientes — Story 5.1
 *
 * Utiliza o cliente axios configurado em api.ts (com interceptors de auth).
 */
import { api } from './api.js';

// ── Types ────────────────────────────────────────────────────────

export interface ContactAttemptDetail {
  id: number;
  outcome: 'scheduled' | 'rescheduled' | 'abandoned' | 'remeasured';
  appointment_date: number | null;   // unix timestamp seconds
  rescheduled_date: number | null;   // unix timestamp seconds
  new_mileage: number | null;        // km informada no recálculo "não chegou na km"
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
  service_description: string;
  last_service_date: number;        // unix timestamp seconds
  last_service_mileage: number;
  current_mileage: number;
  next_service_date: number;        // unix timestamp seconds
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

// ── API Functions ─────────────────────────────────────────────────

/**
 * Retorna perfil completo do cliente com hierarquia de atendimentos.
 */
export async function getCustomer(id: number): Promise<CustomerDetail> {
  const response = await api.get<{ data: CustomerDetail }>(`/api/v1/customers/${id}`);
  return response.data.data;
}

/**
 * Busca clientes por nome ou telefone.
 */
export async function searchCustomers(q: string): Promise<CustomerSummary[]> {
  const response = await api.get<{ data: CustomerSummary[] }>('/api/v1/customers', {
    params: { q },
  });
  return response.data.data;
}
