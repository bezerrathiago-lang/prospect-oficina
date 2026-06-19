/**
 * Hook TanStack Query para registrar tentativa de contato
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  registerAttempt,
  type RegisterAttemptData,
  type ContactAttemptResult,
} from '../services/contactAttempts.service.js';

/**
 * Hook de mutation para registrar o resultado de uma tentativa de contato.
 *
 * Após sucesso: invalida a query ['tasks'] para que a lista de tarefas
 * seja atualizada automaticamente.
 *
 * @param onSuccess - Callback chamado com o resultado da operação
 */
export function useRegisterAttempt(
  onSuccess?: (result: ContactAttemptResult) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterAttemptData) => registerAttempt(data),
    onSuccess: (result) => {
      // Invalida todas as queries de tasks para refletir a atualização
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSuccess?.(result);
    },
  });
}
