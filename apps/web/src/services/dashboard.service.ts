/**
 * Serviço de métricas do dashboard — Supabase (RPC get_dashboard_metrics)
 */
import { supabase } from '../lib/supabase.js';

export interface DashboardMetrics {
  prospeccoes_registradas: number;
  agendamentos_realizados: number;
  prospeccoes_sem_sucesso: number;
}

/**
 * @param from data inicial (YYYY-MM-DD)
 * @param to   data final (YYYY-MM-DD)
 */
export async function getDashboardMetrics(from: string, to: string): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return data as DashboardMetrics;
}
