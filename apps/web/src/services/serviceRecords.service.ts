/**
 * Serviço HTTP para registros de atendimento
 *
 * Utiliza o cliente axios configurado em api.ts (com interceptors de auth).
 */
import { api } from './api.js';

// ── Types ────────────────────────────────────────────────────────

export interface CreateServiceRecordData {
  customer_name: string;
  customer_phone: string;
  service_type_id: number;
  last_service_date: string;   // YYYY-MM-DD
  last_service_mileage: number;
  current_mileage: number;
  next_service_mileage: number;
}

export interface CustomerData {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecordData {
  id: number;
  customer_id: number;
  service_type_id: number;
  consultant_id: number;
  last_service_date: string;
  last_service_mileage: number;
  current_mileage: number;
  next_service_mileage: number;
  next_service_date: string;
  daily_average_km: number;
  created_at: string;
  updated_at: string;
}

export interface TaskData {
  id: number;
  service_record_id: number;
  customer_id: number;
  consultant_id: number;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'abandoned';
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceRecordResponse {
  service_record: ServiceRecordData;
  customer: CustomerData;
  task: TaskData;
}

// ── API Functions ────────────────────────────────────────────────

/**
 * Cria novo registro de atendimento.
 * Retorna service_record, customer e task criados.
 */
export async function createServiceRecord(
  data: CreateServiceRecordData,
): Promise<CreateServiceRecordResponse> {
  const response = await api.post<{ data: CreateServiceRecordResponse }>(
    '/api/v1/service-records',
    data,
  );
  return response.data.data;
}
