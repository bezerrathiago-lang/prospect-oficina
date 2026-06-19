/**
 * Serviço HTTP para tipos de serviço
 *
 * Utiliza o cliente axios configurado em api.ts (com interceptors de auth).
 */
import { api } from './api.js';

// ── Types ────────────────────────────────────────────────────────

export interface ServiceType {
  id: number;
  name: string;
  contact_lead_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// ── API Functions ────────────────────────────────────────────────

/**
 * Lista tipos de serviço.
 * @param includeInactive — se true, inclui tipos inativos
 */
export async function getServiceTypes(includeInactive = false): Promise<ServiceType[]> {
  const params = includeInactive ? { include_inactive: 'true' } : {};
  const response = await api.get<{ data: ServiceType[] }>(
    '/api/v1/service-types',
    { params },
  );
  return response.data.data;
}

/**
 * Cria novo tipo de serviço.
 */
export async function createServiceType(data: CreateServiceTypeData): Promise<ServiceType> {
  const response = await api.post<{ data: ServiceType }>(
    '/api/v1/service-types',
    data,
  );
  return response.data.data;
}

/**
 * Atualiza tipo de serviço parcialmente (PATCH).
 */
export async function updateServiceType(
  id: number,
  data: UpdateServiceTypeData,
): Promise<ServiceType> {
  const response = await api.patch<{ data: ServiceType }>(
    `/api/v1/service-types/${id}`,
    data,
  );
  return response.data.data;
}
