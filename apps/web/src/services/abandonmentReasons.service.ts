/**
 * Serviço de motivos de desistência — Supabase
 */
import { supabase } from '../lib/supabase.js';

// ── Types ────────────────────────────────────────────────────────

export interface AbandonmentReason {
  id: number;
  label: string;
  is_other: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface CreateAbandonmentReasonData {
  label: string;
}

export interface UpdateAbandonmentReasonData {
  label?: string;
  is_active?: boolean;
}

// ── Functions ────────────────────────────────────────────────────

export async function getAbandonmentReasons(
  includeInactive = false,
): Promise<AbandonmentReason[]> {
  let query = supabase
    .from('abandonment_reasons')
    .select('id,label,is_other,is_active,sort_order')
    .order('sort_order', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AbandonmentReason[];
}

export async function createAbandonmentReason(
  data: CreateAbandonmentReasonData,
): Promise<AbandonmentReason> {
  // sort_order = maior existente + 1
  const { data: maxRow } = await supabase
    .from('abandonment_reasons')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data: row, error } = await supabase
    .from('abandonment_reasons')
    .insert({ label: data.label, is_other: false, sort_order: nextOrder })
    .select('id,label,is_other,is_active,sort_order')
    .single();
  if (error) throw error;
  return row as AbandonmentReason;
}

export async function updateAbandonmentReason(
  id: number,
  data: UpdateAbandonmentReasonData,
): Promise<AbandonmentReason> {
  const { data: row, error } = await supabase
    .from('abandonment_reasons')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,label,is_other,is_active,sort_order')
    .single();
  if (error) throw error;
  return row as AbandonmentReason;
}
