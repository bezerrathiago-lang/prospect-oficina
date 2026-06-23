/**
 * TaskCard — Card de tarefa individual
 *
 * Exibe informações do contato a realizar:
 *   - Banner âmbar "ATRASADA" quando a tarefa está pendente e é de dia passado
 *   - Nome do cliente
 *   - Telefone clicável (link tel:)
 *   - Tipo de serviço
 *   - Data prevista do próximo serviço
 *   - Badge de tentativas com cor variável
 *   - Botão "Registrar Resultado"
 *
 * Variante visual para tarefas concluídas.
 */
import { useNavigate, Link } from 'react-router-dom';
import type { TaskItem } from '../../services/tasks.service.js';

interface TaskCardProps {
  task: TaskItem;
  /** True quando a tarefa é de um dia passado e está com status 'pending' */
  isOverdue?: boolean;
}

/** Formata unix timestamp (seconds) para DD/MM/AAAA */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/** Formata telefone para link tel: — remove não-dígitos e prefixa +55 */
function toTelHref(phone: string): string {
  return `tel:+55${phone.replace(/\D/g, '')}`;
}

/** Retorna classe de cor para badge de tentativas */
function attemptBadgeStyle(attemptCount: number): React.CSSProperties {
  if (attemptCount >= 3) {
    return { backgroundColor: '#EF4444', color: '#fff' };
  }
  if (attemptCount === 2) {
    return { backgroundColor: '#F59E0B', color: '#fff' };
  }
  // 0 ou 1
  return { backgroundColor: '#9CA3AF', color: '#fff' };
}

/** Retorna classes Tailwind para o card baseado no status */
function cardBgClass(status: string): string {
  if (status === 'completed_scheduled') return 'bg-green-50 border-green-200';
  if (status === 'completed_rescheduled') return 'bg-gray-50 border-gray-200';
  if (status === 'abandoned') return 'bg-gray-100 border-gray-300';
  return 'bg-white border-gray-200';
}

export default function TaskCard({ task, isOverdue = false }: TaskCardProps) {
  const navigate = useNavigate();
  const isDone =
    task.status === 'completed_scheduled' ||
    task.status === 'completed_rescheduled' ||
    task.status === 'abandoned';

  return (
    <div
      className={`rounded-lg border shadow-sm overflow-hidden ${cardBgClass(task.status)}`}
    >
      {/* Banner âmbar para tarefas atrasadas */}
      {isOverdue && (
        <div className="bg-amber-400 px-4 py-1 text-xs font-bold tracking-widest text-amber-900 uppercase">
          ATRASADA
        </div>
      )}

      <div className="p-4">
      {/* Nome do cliente — link para histórico */}
      <Link
        to={`/historico/${task.customerId}`}
        className="font-bold text-gray-900 text-base underline decoration-dotted hover:text-red-600 transition-colors"
      >
        {task.customerName}
      </Link>

      {/* Telefone clicável */}
      <a
        href={toTelHref(task.customerPhone)}
        className="inline-block text-blue-600 underline text-sm mt-1"
        style={{ minHeight: '44px', paddingTop: '10px', paddingBottom: '10px' }}
      >
        {task.customerPhone}
      </a>

      {/* Tipo de serviço e data */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span>{task.serviceTypeName}</span>
        <span>Próximo: {formatDate(task.nextServiceDate)}</span>
      </div>

      {/* Descrição do serviço */}
      {task.serviceDescription && (
        <p className="mt-1 text-sm text-gray-500">{task.serviceDescription}</p>
      )}

      {/* Badge de tentativas + botão */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={attemptBadgeStyle(task.attemptCount)}
        >
          {task.attemptCount === 0
            ? 'Sem tentativas'
            : `${task.attemptCount} tentativa${task.attemptCount > 1 ? 's' : ''}`}
        </span>

        {!isDone && (
          <button
            type="button"
            onClick={() => void navigate(`/tarefas/${task.id}/resultado`)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
          >
            Registrar Resultado
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
