/**
 * Hooks TanStack Query para motivos de desistência
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAbandonmentReasons,
  createAbandonmentReason,
  updateAbandonmentReason,
  type AbandonmentReason,
  type CreateAbandonmentReasonData,
  type UpdateAbandonmentReasonData,
} from '../services/abandonmentReasons.service.js';

const ABANDONMENT_REASONS_KEY = ['abandonment-reasons'] as const;

// ── Queries ──────────────────────────────────────────────────────

/**
 * Retorna a lista de motivos de desistência.
 *
 * @param includeInactive — se true, inclui motivos inativos (para SettingsPage)
 * staleTime: 10 minutos — lista raramente muda durante o uso.
 */
export function useAbandonmentReasons(includeInactive = false) {
  return useQuery<AbandonmentReason[]>({
    queryKey: [...ABANDONMENT_REASONS_KEY, { includeInactive }],
    queryFn: () => getAbandonmentReasons(includeInactive),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────

/**
 * Hook para criar motivo de desistência.
 * Invalida o cache após sucesso.
 */
export function useCreateAbandonmentReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAbandonmentReasonData) => createAbandonmentReason(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ABANDONMENT_REASONS_KEY });
    },
  });
}

/**
 * Hook para atualizar motivo de desistência.
 * Invalida o cache após sucesso.
 */
export function useUpdateAbandonmentReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAbandonmentReasonData }) =>
      updateAbandonmentReason(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ABANDONMENT_REASONS_KEY });
    },
  });
}
