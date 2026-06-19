/**
 * Serviço HTTP para tarefas
 *
 * Utiliza o cliente axios configurado em api.ts (com interceptors de auth).
 */
import { api } from './api.js';

// ── Types ────────────────────────────────────────────────────────

export interface TaskItem {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceTypeName: string;
  nextServiceDate: number; // unix timestamp (seconds)
  attemptCount: number;
  status: 'pending' | 'completed_scheduled' | 'completed_rescheduled' | 'abandoned';
}

export interface TaskListResponse {
  date: string;
  pending_count: number;
  pending: TaskItem[];
  completed: TaskItem[];
}

// ── API Functions ────────────────────────────────────────────────

/**
 * Busca tarefas do consultor para uma data.
 * @param date - Data no formato YYYY-MM-DD
 */
export async function getTasks(date: string): Promise<TaskListResponse> {
  const response = await api.get<{ data: TaskListResponse }>('/api/v1/tasks', {
    params: { date },
  });
  return response.data.data;
}
