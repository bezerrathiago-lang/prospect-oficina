/**
 * Serviço de tarefas — Supabase
 *
 * Lista as tarefas do consultor logado para uma data, com dados do cliente,
 * tipo e descrição do serviço. Datas convertidas para unix timestamp (segundos)
 * para manter a interface dos componentes inalterada.
 */
import { supabase, isoToUnix } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';

// ── Types ────────────────────────────────────────────────────────

export interface TaskItem {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceTypeName: string;
  serviceDescription: string;
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

interface TaskRow {
  id: number;
  customer_id: number;
  scheduled_date: string;
  status: TaskItem['status'];
  attempt_count: number;
  customers: { name: string; phone: string };
  service_records: {
    next_service_date: string;
    service_description: string;
    service_types: { name: string };
  };
}

const SELECT = `
  id, customer_id, scheduled_date, status, attempt_count,
  customers!inner ( name, phone ),
  service_records!inner ( next_service_date, service_description, service_types!inner ( name ) )
`;

function mapRow(row: TaskRow): TaskItem {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customers.name,
    customerPhone: row.customers.phone,
    serviceTypeName: row.service_records.service_types.name,
    serviceDescription: row.service_records.service_description,
    nextServiceDate: isoToUnix(row.service_records.next_service_date),
    attemptCount: row.attempt_count,
    status: row.status,
  };
}

// ── Functions ────────────────────────────────────────────────────

export async function getTasks(date: string): Promise<TaskListResponse> {
  const consultantId = useAuthStore.getState().user?.id;
  if (!consultantId) {
    return { date, pending_count: 0, pending: [], completed: [] };
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(SELECT)
    .eq('consultant_id', consultantId)
    .eq('scheduled_date', date);
  if (error) throw error;

  const items = ((data ?? []) as unknown as TaskRow[]).map(mapRow);

  const pending = items
    .filter((t) => t.status === 'pending')
    .sort((a, b) => b.attemptCount - a.attemptCount);
  const completed = items.filter((t) => t.status !== 'pending');

  return { date, pending_count: pending.length, pending, completed };
}
