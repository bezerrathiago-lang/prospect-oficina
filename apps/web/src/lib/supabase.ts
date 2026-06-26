/**
 * Cliente Supabase — instância única usada em todo o app.
 *
 * Substitui o antigo cliente axios (api.ts): autenticação, queries e RPC
 * passam a ser feitas diretamente contra o Supabase.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env['VITE_SUPABASE_URL'] as string;
const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Verifique o .env.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'prospectmoto-auth',
  },
});

/** Converte uma data ISO ('YYYY-MM-DD' ou ISO datetime) para unix timestamp em segundos. */
export function isoToUnix(iso: string | null | undefined): number {
  if (!iso) return 0;
  // Datas 'YYYY-MM-DD' são interpretadas no fuso local (meia-noite)
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  return Math.floor(d.getTime() / 1000);
}
