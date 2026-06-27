/**
 * Serviço de registros de atendimento — Supabase (RPC create_service_record)
 */
import { supabase } from '../lib/supabase.js';

// ── Types ────────────────────────────────────────────────────────

export interface CreateServiceRecordData {
  customer_name: string;
  customer_phone: string;
  service_type_id: number;
  service_description: string;
  motorcycle_plate: string;
  motorcycle_model: string;
  last_service_date: string; // YYYY-MM-DD
  last_service_mileage: number;
  current_mileage: number;
  next_service_mileage: number;
}

export interface CustomerData {
  id: number;
  name: string;
  phone: string;
}

export interface ServiceRecordData {
  id: number;
  customer_id: number;
  service_type_id: number;
  service_description: string;
  last_service_date: string;
  next_service_date: string;
  daily_average_km: number;
}

export interface TaskData {
  id: number;
  service_record_id: number;
  customer_id: number;
  scheduled_date: string; // YYYY-MM-DD
  status: string;
  attempt_count: number;
}

export interface CreateServiceRecordResponse {
  service_record: ServiceRecordData;
  customer: CustomerData;
  task: TaskData;
}

// ── Functions ────────────────────────────────────────────────────

export async function createServiceRecord(
  data: CreateServiceRecordData,
): Promise<CreateServiceRecordResponse> {
  const { data: result, error } = await supabase.rpc('create_service_record', {
    p_customer_name: data.customer_name,
    p_customer_phone: data.customer_phone,
    p_service_type_id: data.service_type_id,
    p_service_description: data.service_description,
    p_motorcycle_plate: data.motorcycle_plate,
    p_motorcycle_model: data.motorcycle_model,
    p_last_service_date: data.last_service_date,
    p_last_service_mileage: data.last_service_mileage,
    p_current_mileage: data.current_mileage,
    p_next_service_mileage: data.next_service_mileage,
  });
  if (error) throw new Error(error.message);
  return result as CreateServiceRecordResponse;
}
