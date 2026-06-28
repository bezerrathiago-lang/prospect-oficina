/**
 * Serviço de usuários — Supabase
 *
 * - Listagem via RPC `list_users` (security definer, admin-only).
 * - Criação via Edge Function `admin-create-user` (a service_role nunca
 *   chega ao browser; a função valida que o chamador é admin).
 */
import { supabase } from '../lib/supabase.js';
import type { Role } from '../store/authStore.js';

// ── Types ────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  store_id: number | null;
  store_name: string | null;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'consultant' | 'manager';
  store_id?: number | null;
}

// ── Functions ────────────────────────────────────────────────────

export async function listUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase.rpc('list_users');
  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function createUser(payload: CreateUserData): Promise<{ id: string; email: string }> {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      store_id: payload.role === 'consultant' ? payload.store_id : undefined,
    },
  });

  // Em status != 2xx o supabase-js retorna FunctionsHttpError e guarda o
  // corpo da resposta em `error.context` (um Response). Tentamos extrair a
  // mensagem amigável da função antes de cair na mensagem genérica.
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) msg = body.error;
      }
    } catch {
      /* mantém msg genérica */
    }
    throw new Error(msg);
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as { id: string; email: string };
}
