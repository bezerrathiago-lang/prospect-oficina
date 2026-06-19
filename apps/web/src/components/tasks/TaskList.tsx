/**
 * TaskList — Lista de tarefas do dia
 *
 * Renderiza:
 *   - Contador "X contatos para hoje / para este dia"
 *   - Lista de tarefas pendentes (com skeleton durante carregamento)
 *   - Estado vazio com mensagem e botão "+ Novo Atendimento"
 *   - Seção "Concluídas hoje" colapsável (só aparece se houver concluídas)
 *
 * Recebe `selectedDate` para calcular se a data é passada e marcar tarefas como
 * ATRASADAS (pending + dia passado).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard.js';
import { isPast } from '../../lib/dates.js';
import type { TaskItem } from '../../services/tasks.service.js';

interface TaskListProps {
  pending: TaskItem[];
  completed: TaskItem[];
  isLoading: boolean;
  /** Data selecionada (YYYY-MM-DD); usada para detectar tarefas atrasadas */
  selectedDate: string;
}

/** Skeleton animado para um card */
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/3 rounded bg-gray-200" />
      <div className="mt-3 flex gap-3">
        <div className="h-3 w-1/4 rounded bg-gray-200" />
        <div className="h-3 w-1/4 rounded bg-gray-200" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-5 w-20 rounded-full bg-gray-200" />
        <div className="h-7 w-28 rounded-md bg-gray-200" />
      </div>
    </div>
  );
}

export default function TaskList({ pending, completed, isLoading, selectedDate }: TaskListProps) {
  const navigate = useNavigate();
  const [completedOpen, setCompletedOpen] = useState(false);

  /** Tarefas pendentes de dias passados são marcadas como atrasadas */
  const isDatePast = isPast(selectedDate);

  // ── Estado de carregamento ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // ── Estado vazio ────────────────────────────────────────────
  if (pending.length === 0 && completed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-gray-500 text-base">
          Nenhum contato para hoje. Bom descanso!
        </p>
        <button
          type="button"
          onClick={() => void navigate('/novo')}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
        >
          + Novo Atendimento
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Contador de pendentes ─────────────────────────── */}
      <p className="text-sm font-medium text-gray-700">
        {pending.length} contato{pending.length !== 1 ? 's' : ''}{' '}
        {isDatePast ? 'pendente' : 'para hoje'}
        {pending.length !== 1 && isDatePast ? 's' : ''}
      </p>

      {/* ── Lista de pendentes ────────────────────────────── */}
      {pending.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-gray-500 text-sm">
            Nenhum contato pendente. Bom descanso!
          </p>
          <button
            type="button"
            onClick={() => void navigate('/novo')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
          >
            + Novo Atendimento
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isOverdue={isDatePast && task.status === 'pending'}
            />
          ))}
        </div>
      )}

      {/* ── Seção "Concluídas hoje" ───────────────────────── */}
      {completed.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setCompletedOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <span>Concluídas {isDatePast ? 'neste dia' : 'hoje'} ({completed.length})</span>
            <span>{completedOpen ? '▲' : '▼'}</span>
          </button>

          {completedOpen && (
            <div className="mt-2 flex flex-col gap-3">
              {completed.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
