/**
 * Serviço HTTP para motivos de desistência
 *
 * Utiliza o cliente axios configurado em api.ts (com interceptors de auth).
 */
import { api } from './api.js';

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

// ── API Functions ────────────────────────────────────────────────

/**
 * Retorna lista de motivos de desistência.
 * @param includeInactive — se true, inclui motivos inativos
 */
export async function getAbandonmentReasons(includeInactive = false): Promise<AbandonmentReason[]> {
  const params = includeInactive ? { include_inactive: 'true' } : {};
  const response = await api.get<{ data: AbandonmentReason[] }>(
    '/api/v1/abandonment-reasons',
    { params },
  );
  return response.data.data;
}

/**
 * Cria novo motivo de desistência.
 */
export async function createAbandonmentReason(
  data: CreateAbandonmentReasonData,
): Promise<AbandonmentReason> {
  const response = await api.post<{ data: AbandonmentReason }>(
    '/api/v1/abandonment-reasons',
    data,
  );
  return response.data.data;
}

/**
 * Atualiza motivo de desistência parcialmente (PATCH).
 */
export async function updateAbandonmentReason(
  id: number,
  data: UpdateAbandonmentReasonData,
): Promise<AbandonmentReason> {
  const response = await api.patch<{ data: AbandonmentReason }>(
    `/api/v1/abandonment-reasons/${id}`,
    data,
  );
  return response.data.data;
}
