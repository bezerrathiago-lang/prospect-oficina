/**
 * Hook TanStack Query para lista de tarefas do dia
 */
import { useQuery } from '@tanstack/react-query';
import { getTasks, type TaskListResponse } from '../services/tasks.service.js';

/**
 * Retorna as tarefas do consultor para a data fornecida.
 *
 * staleTime: 30 segundos — a lista muda com frequência durante o dia de trabalho.
 */
export function useTasks(date: string) {
  return useQuery<TaskListResponse>({
    queryKey: ['tasks', date],
    queryFn: () => getTasks(date),
    staleTime: 30 * 1000,
  });
}
