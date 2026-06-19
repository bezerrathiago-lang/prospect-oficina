/**
 * Hooks TanStack Query para tipos de serviço
 *
 * Cache compartilhado com chave ['service-types'] para uso em múltiplas telas
 * (Settings, formulário de atendimento na Story 2.2, etc.)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  type CreateServiceTypeData,
  type UpdateServiceTypeData,
} from '../services/serviceTypes.service.js';

const SERVICE_TYPES_KEY = ['service-types'] as const;

// ── Queries ─────────────────────────────────────────────────────

/**
 * Hook para listar tipos de serviço.
 * @param includeInactive — se true, inclui tipos inativos
 */
export function useServiceTypes(includeInactive = false) {
  return useQuery({
    queryKey: [...SERVICE_TYPES_KEY, { includeInactive }],
    queryFn: () => getServiceTypes(includeInactive),
  });
}

// ── Mutations ────────────────────────────────────────────────────

/**
 * Hook para criar tipo de serviço.
 * Invalida o cache de service-types após sucesso.
 */
export function useCreateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceTypeData) => createServiceType(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICE_TYPES_KEY });
    },
  });
}

/**
 * Hook para atualizar tipo de serviço.
 * Invalida o cache de service-types após sucesso.
 */
export function useUpdateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceTypeData }) =>
      updateServiceType(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICE_TYPES_KEY });
    },
  });
}
