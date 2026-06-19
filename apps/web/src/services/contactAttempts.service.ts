/**
 * Serviço HTTP para tentativas de contato
 *
 * Utiliza o cliente axios configurado em api.ts (com interceptors de auth).
 */
import { api } from './api.js';

// ── Types ────────────────────────────────────────────────────────

export interface TaskDetail {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceTypeName: string;
  nextServiceDate: number; // unix timestamp (seconds)
  scheduledDate: number;   // unix timestamp (seconds)
  attemptCount: number;
  status: string;
}

export interface RegisterScheduledData {
  task_id: number;
  outcome: 'scheduled';
  appointment_date: string; // YYYY-MM-DD
}

export interface RegisterRescheduledData {
  task_id: number;
  outcome: 'rescheduled';
  rescheduled_date: string; // YYYY-MM-DD
}

export interface RegisterAbandonedData {
  task_id: number;
  outcome: 'abandoned';
  abandonment_reason_id: number;
  abandonment_notes?: string;
}

export type RegisterAttemptData =
  | RegisterScheduledData
  | RegisterRescheduledData
  | RegisterAbandonedData;

export interface ContactAttemptResult {
  id: number;
  task_id: number;
  outcome: string;
  next_task_id?: number;
}

// ── API Functions ────────────────────────────────────────────────

/**
 * Registra o resultado de uma tentativa de contato.
 */
export async function registerAttempt(
  data: RegisterAttemptData,
): Promise<ContactAttemptResult> {
  const response = await api.post<{ data: ContactAttemptResult }>(
    '/api/v1/contact-attempts',
    data,
  );
  return response.data.data;
}

/**
 * Busca os dados de uma tarefa específica pelo ID.
 */
export async function getTaskById(taskId: number): Promise<TaskDetail> {
  const response = await api.get<{ data: TaskDetail }>(`/api/v1/tasks/${taskId}`);
  return response.data.data;
}
