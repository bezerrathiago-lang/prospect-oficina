/**
 * Serviço de lojas — Supabase
 */
import { supabase } from '../lib/supabase.js';

// ── Types ────────────────────────────────────────────────────────

export interface Store {
  id: number;
  name: string;
  is_active: boolean;
}

export interface CreateStoreData {
  name: string;
}

export interface UpdateStoreData {
  name?: string;
  is_active?: boolean;
}

// ── Functions ────────────────────────────────────────────────────

export async function getStores(includeInactive = false): Promise<Store[]> {
  let query = supabase
    .from('stores')
    .select('id,name,is_active')
    .order('name', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Store[];
}

export async function createStore(data: CreateStoreData): Promise<Store> {
  const { data: row, error } = await supabase
    .from('stores')
    .insert(data)
    .select('id,name,is_active')
    .single();
  if (error) throw error;
  return row as Store;
}

export async function updateStore(id: number, data: UpdateStoreData): Promise<Store> {
  const { data: row, error } = await supabase
    .from('stores')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,name,is_active')
    .single();
  if (error) throw error;
  return row as Store;
}
