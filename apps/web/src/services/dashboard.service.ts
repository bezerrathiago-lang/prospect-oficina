/**
 * Serviço de métricas do dashboard — Supabase (RPC get_dashboard_metrics)
 */
import { supabase } from '../lib/supabase.js';

export interface DashboardMetrics {
  prospeccoes_registradas: number;
  agendamentos_realizados: number;
  prospeccoes_sem_sucesso: number;
}

export type DetailMetric = 'registradas' | 'agendamentos' | 'sem_sucesso';

export interface DashboardDetailItem {
  id: number;
  customer_name: string;
  customer_phone: string;
  motorcycle_model?: string;
  motorcycle_plate?: string;
  next_service_date?: string;
  appointment_date?: string;
  reason?: string;
  created_at: string;
}

export interface AbandonmentBreakdownItem {
  label: string;
  count: number;
}

export interface ConsultantRankingItem {
  consultant_id: string;
  name: string;
  prospeccoes: number;
  agendamentos: number;
}

/**
 * @param from data inicial (YYYY-MM-DD)
 * @param to   data final (YYYY-MM-DD)
 */
export async function getDashboardMetrics(
  from: string,
  to: string,
  storeId?: number | null,
): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    p_from: from,
    p_to: to,
    p_store_id: storeId ?? null,
  });
  if (error) throw error;
  return data as DashboardMetrics;
}

/** Lista detalhada de um indicador (drill-down). */
export async function getDashboardDetails(
  metric: DetailMetric,
  from: string,
  to: string,
  storeId?: number | null,
): Promise<DashboardDetailItem[]> {
  const { data, error } = await supabase.rpc('get_dashboard_details', {
    p_metric: metric,
    p_from: from,
    p_to: to,
    p_store_id: storeId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as DashboardDetailItem[];
}

/** Contagem de motivos de insucesso no período. */
export async function getAbandonmentBreakdown(
  from: string,
  to: string,
  storeId?: number | null,
): Promise<AbandonmentBreakdownItem[]> {
  const { data, error } = await supabase.rpc('get_abandonment_breakdown', {
    p_from: from,
    p_to: to,
    p_store_id: storeId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as AbandonmentBreakdownItem[];
}

/** Ranking de consultores: prospecções registradas e agendamentos no período. */
export async function getConsultantRanking(
  from: string,
  to: string,
  storeId?: number | null,
): Promise<ConsultantRankingItem[]> {
  const { data, error } = await supabase.rpc('get_consultant_ranking', {
    p_from: from,
    p_to: to,
    p_store_id: storeId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as ConsultantRankingItem[];
}

/** Contagem dos cenários que motivaram nova prospecção no período (gráfico pizza). */
export async function getRenewalBreakdown(
  from: string,
  to: string,
  storeId?: number | null,
): Promise<AbandonmentBreakdownItem[]> {
  const { data, error } = await supabase.rpc('get_renewal_breakdown', {
    p_from: from,
    p_to: to,
    p_store_id: storeId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as AbandonmentBreakdownItem[];
}
