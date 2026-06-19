/**
 * Hook TanStack Query para registros de atendimento
 */
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  createServiceRecord,
  type CreateServiceRecordData,
  type CreateServiceRecordResponse,
} from '../services/serviceRecords.service.js';

// ── Mutations ────────────────────────────────────────────────────

/**
 * Hook para criar registro de atendimento.
 * onSuccess: aciona callback de toast (fornecido por quem chama) e navega para /tarefas.
 */
export function useCreateServiceRecord(
  onSuccess?: (response: CreateServiceRecordResponse) => void,
) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateServiceRecordData) => createServiceRecord(data),
    onSuccess: (response) => {
      onSuccess?.(response);
      void navigate('/tarefas');
    },
  });
}
