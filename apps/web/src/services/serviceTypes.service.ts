/**
 * Serviço de tipos de serviço — Supabase
 */
import { supabase } from '../lib/supabase.js';

// ── Types ────────────────────────────────────────────────────────

export interface ServiceType {
  id: number;
  name: string;
  contact_lead_days: number;
  is_active: boolean;
}

export interface CreateServiceTypeData {
  name: string;
  contact_lead_days: number;
}

export interface UpdateServiceTypeData {
  name?: string;
  contact_lead_days?: number;
  is_active?: boolean;
}

// ── Functions ────────────────────────────────────────────────────

export async function getServiceTypes(includeInactive = false): Promise<ServiceType[]> {
  let query = supabase
    .from('service_types')
    .select('id,name,contact_lead_days,is_active')
    .order('name', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ServiceType[];
}

export async function createServiceType(data: CreateServiceTypeData): Promise<ServiceType> {
  const { data: row, error } = await supabase
    .from('service_types')
    .insert(data)
    .select('id,name,contact_lead_days,is_active')
    .single();
  if (error) throw error;
  return row as ServiceType;
}

export async function updateServiceType(
  id: number,
  data: UpdateServiceTypeData,
): Promise<ServiceType> {
  const { data: row, error } = await supabase
    .from('service_types')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,name,contact_lead_days,is_active')
    .single();
  if (error) throw error;
  return row as ServiceType;
}
