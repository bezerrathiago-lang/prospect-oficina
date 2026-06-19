/**
 * ContactResultPage — Tela de Resultado de Contato (Stories 4.1, 4.2, 4.3)
 *
 * Recebe taskId via parâmetro de rota: /tarefas/:taskId/resultado
 *
 * Sub-fluxo visual (estado local, sem rotas separadas):
 *   'select'     → Tela 3a: "Agendamento Confirmado" | "Não consegui agendar"
 *   'scheduled'  → Tela 3b: datepicker + confirmar agendamento
 *   'not_reached'→ Tela 3c: "Reagendar contato" | "Desistir desta prospecção"
 *   'rescheduled'→ Tela 3d: datepicker nova data + confirmar reagendamento
 *   'abandoned'  → Tela 3e: AbandonmentDialog
 *
 * Toast: estado local + auto-dismiss 3s (sem biblioteca externa).
 * Após ação bem-sucedida: invalida queries, exibe toast, navega para /tarefas.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTaskById } from '../services/contactAttempts.service.js';
import { useRegisterAttempt } from '../hooks/useContactAttempt.js';
import AbandonmentDialog from '../components/contact/AbandonmentDialog.js';
import type { TaskDetail } from '../services/contactAttempts.service.js';

// ── Tipos ──────────────────────────────────────────────────────────

type SubFlow =
  | 'select'
  | 'scheduled'
  | 'not_reached'
  | 'rescheduled'
  | 'abandoned';

interface Toast {
  message: string;
  color: 'green' | 'blue' | 'gray';
}

// ── Helpers ───────────────────────────────────────────────────────

/** Formata unix timestamp (seconds) para DD/MM/AAAA */
function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Retorna a data de amanhã no formato YYYY-MM-DD */
function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ordinal em português: 1ª, 2ª, 3ª... */
function ordinal(n: number): string {
  return `${n}ª`;
}

// ── Cores do toast ────────────────────────────────────────────────

const TOAST_BG: Record<Toast['color'], string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-500',
};

// ── Card de contexto ──────────────────────────────────────────────

function ContextCard({ task }: { task: TaskDetail }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="font-bold text-gray-900 text-base">{task.customerName}</p>
      <p className="text-sm text-blue-600 mt-0.5">{task.customerPhone}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span>{task.serviceTypeName}</span>
        <span>Próximo serviço: {formatDate(task.nextServiceDate)}</span>
      </div>
      <div className="mt-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          {task.attemptCount === 0
            ? '1ª tentativa'
            : `${ordinal(task.attemptCount + 1)} tentativa`}
        </span>
      </div>
    </div>
  );
}

// ── Sub-tela 3a: Selecionar resultado principal ───────────────────

function SelectView({
  onScheduled,
  onNotReached,
}: {
  onScheduled: () => void;
  onNotReached: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <p className="text-sm font-semibold text-gray-700">Qual foi o resultado?</p>

      {/* Agendamento Confirmado */}
      <button
        type="button"
        onClick={onScheduled}
        className="w-full rounded-xl border-2 py-4 px-4 text-left font-semibold text-sm transition-colors hover:bg-green-50 active:bg-green-100"
        style={{ borderColor: '#22C55E', color: '#16A34A' }}
      >
        <span className="text-base">Agendamento Confirmado</span>
        <p className="font-normal text-green-700 text-xs mt-0.5">
          Cliente aceitou agendar o serviço
        </p>
      </button>

      {/* Não consegui agendar */}
      <button
        type="button"
        onClick={onNotReached}
        className="w-full rounded-xl border-2 border-gray-300 py-4 px-4 text-left font-semibold text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <span className="text-base">Não consegui agendar</span>
        <p className="font-normal text-gray-500 text-xs mt-0.5">
          Não houve contato ou cliente recusou
        </p>
      </button>
    </div>
  );
}

// ── Sub-tela 3b: Confirmar agendamento ────────────────────────────

function ScheduledView({
  onBack,
  onConfirm,
  isPending,
}: {
  onBack: () => void;
  onConfirm: (date: string) => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState('');
  const canConfirm = date.length > 0 && !isPending;

  return (
    <div className="flex flex-col gap-4 mt-2">
      <p className="text-sm font-semibold text-gray-700">Data do agendamento</p>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600" htmlFor="appointment-date">
          Quando o cliente vai trazer a moto?
        </label>
        <input
          id="appointment-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => onConfirm(date)}
          disabled={!canConfirm}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
          style={{ backgroundColor: canConfirm ? '#22C55E' : undefined }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Registrando...
            </span>
          ) : (
            'Confirmar Agendamento'
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}

// ── Sub-tela 3c: Não conseguiu agendar — escolher próximo passo ───

function NotReachedView({
  onReschedule,
  onAbandon,
  onBack,
}: {
  onReschedule: () => void;
  onAbandon: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <p className="text-sm font-semibold text-gray-700">O que deseja fazer?</p>

      <button
        type="button"
        onClick={onReschedule}
        className="w-full rounded-xl border-2 py-4 px-4 text-left font-semibold text-sm transition-colors hover:bg-orange-50 active:bg-orange-100"
        style={{ borderColor: '#F97316', color: '#EA580C' }}
      >
        <span className="text-base">Reagendar contato</span>
        <p className="font-normal text-orange-600 text-xs mt-0.5">
          Definir nova data para tentar de novo
        </p>
      </button>

      <button
        type="button"
        onClick={onAbandon}
        className="w-full rounded-xl border-2 border-gray-300 py-4 px-4 text-left font-semibold text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <span className="text-base">Desistir desta prospecção</span>
        <p className="font-normal text-gray-500 text-xs mt-0.5">
          Encerrar definitivamente o contato com este cliente
        </p>
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        ← Voltar
      </button>
    </div>
  );
}

// ── Sub-tela 3d: Reagendar contato ───────────────────────────────

function RescheduledView({
  onBack,
  onConfirm,
  isPending,
}: {
  onBack: () => void;
  onConfirm: (date: string) => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState('');
  const tomorrow = getTomorrowISO();
  const canConfirm = date.length > 0 && date >= tomorrow && !isPending;

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Texto informativo */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        Tentativa atual será registrada como &quot;sem contato&quot;
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="reschedule-date">
          Nova data para ligar
        </label>
        <input
          id="reschedule-date"
          type="date"
          value={date}
          min={tomorrow}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        {date.length > 0 && date < tomorrow && (
          <p className="text-xs text-red-500">A nova data deve ser a partir de amanhã</p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => onConfirm(date)}
          disabled={!canConfirm}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
          style={{ backgroundColor: canConfirm ? '#F97316' : undefined }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Registrando...
            </span>
          ) : (
            'Confirmar Reagendamento'
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────

export default function ContactResultPage() {
  const { taskId: taskIdParam } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const taskId = parseInt(taskIdParam ?? '', 10);

  // ── Dados da tarefa
  const {
    data: task,
    isLoading,
    isError,
  } = useQuery<TaskDetail>({
    queryKey: ['task', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: !isNaN(taskId),
    staleTime: 60 * 1000,
  });

  // ── Sub-fluxo
  const [subFlow, setSubFlow] = useState<SubFlow>('select');

  // ── Toast
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Mutation
  const mutation = useRegisterAttempt((result) => {
    if (result.outcome === 'scheduled') {
      setToast({ message: `Agendamento registrado!`, color: 'green' });
    } else if (result.outcome === 'rescheduled') {
      setToast({ message: 'Novo contato agendado', color: 'blue' });
    } else {
      setToast({ message: 'Prospecção encerrada', color: 'gray' });
    }
    void navigate('/tarefas');
  });

  // ── Handlers
  function handleScheduledConfirm(appointmentDate: string) {
    mutation.mutate({
      task_id: taskId,
      outcome: 'scheduled',
      appointment_date: appointmentDate,
    });
    // Atualiza mensagem do toast com a data formatada após sucesso (via callback acima)
  }

  function handleRescheduledConfirm(rescheduledDate: string) {
    mutation.mutate({
      task_id: taskId,
      outcome: 'rescheduled',
      rescheduled_date: rescheduledDate,
    });
  }

  function handleAbandonedConfirm(data: {
    abandonment_reason_id: number;
    abandonment_notes?: string;
  }) {
    const payload: import('../services/contactAttempts.service.js').RegisterAbandonedData = {
      task_id: taskId,
      outcome: 'abandoned',
      abandonment_reason_id: data.abandonment_reason_id,
    };
    if (data.abandonment_notes !== undefined) {
      payload.abandonment_notes = data.abandonment_notes;
    }
    mutation.mutate(payload);
  }

  // ── Renderização
  if (isNaN(taskId)) {
    return (
      <main className="flex-1 px-4 py-6">
        <p className="text-red-500 text-sm">ID de tarefa inválido.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-6 flex items-center justify-center">
        <span
          className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
          aria-label="Carregando..."
        />
      </main>
    );
  }

  if (isError || !task) {
    return (
      <main className="flex-1 px-4 py-6">
        <p className="text-red-500 text-sm">Tarefa não encontrada ou sem permissão.</p>
        <button
          type="button"
          onClick={() => void navigate('/tarefas')}
          className="mt-4 text-sm text-blue-600 underline"
        >
          ← Voltar para tarefas
        </button>
      </main>
    );
  }

  // Título por sub-fluxo
  const titleMap: Record<SubFlow, string> = {
    select: 'Registrar Resultado',
    scheduled: 'Agendamento Confirmado',
    not_reached: 'Não Conseguiu Agendar',
    rescheduled: 'Reagendar Contato',
    abandoned: 'Encerrar Prospecção',
  };

  return (
    <main className="flex-1 px-4 py-6">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-4 right-4 z-50 rounded-lg ${TOAST_BG[toast.color]} text-white px-4 py-3 text-sm font-medium shadow-lg transition-all`}
        >
          {toast.message}
        </div>
      )}

      {/* Cabeçalho */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">{titleMap[subFlow]}</h1>

      {/* Card de contexto */}
      <ContextCard task={task} />

      {/* Sub-fluxo */}
      <div className="mt-4">
        {subFlow === 'select' && (
          <SelectView
            onScheduled={() => setSubFlow('scheduled')}
            onNotReached={() => setSubFlow('not_reached')}
          />
        )}

        {subFlow === 'scheduled' && (
          <ScheduledView
            onBack={() => setSubFlow('select')}
            onConfirm={handleScheduledConfirm}
            isPending={mutation.isPending}
          />
        )}

        {subFlow === 'not_reached' && (
          <NotReachedView
            onReschedule={() => setSubFlow('rescheduled')}
            onAbandon={() => setSubFlow('abandoned')}
            onBack={() => setSubFlow('select')}
          />
        )}

        {subFlow === 'rescheduled' && (
          <RescheduledView
            onBack={() => setSubFlow('not_reached')}
            onConfirm={handleRescheduledConfirm}
            isPending={mutation.isPending}
          />
        )}

        {subFlow === 'abandoned' && (
          <AbandonmentDialog
            taskId={taskId}
            onBack={() => setSubFlow('not_reached')}
            onConfirm={handleAbandonedConfirm}
            isPending={mutation.isPending}
          />
        )}
      </div>

      {/* Mutation error */}
      {mutation.isError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {(mutation.error as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? 'Erro ao registrar. Tente novamente.'}
        </div>
      )}
    </main>
  );
}

