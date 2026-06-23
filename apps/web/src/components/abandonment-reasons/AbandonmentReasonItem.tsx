/**
 * AbandonmentReasonItem — Card de item da lista de motivos de desistência
 *
 * Exibe: label, badge Ativo/Inativo, botão Editar.
 * O motivo "Outros" (is_other=true) não exibe botão Editar — protegido contra edição acidental.
 */
import type { AbandonmentReason } from '../../services/abandonmentReasons.service.js';

interface AbandonmentReasonItemProps {
  reason: AbandonmentReason;
  onEdit: (reason: AbandonmentReason) => void;
}

export default function AbandonmentReasonItem({
  reason,
  onEdit,
}: AbandonmentReasonItemProps) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{reason.label}</p>
        <div className="mt-2">
          {reason.is_active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Botão Editar — oculto para o motivo "Outros" */}
      {!reason.is_other && (
        <button
          type="button"
          onClick={() => onEdit(reason)}
          className="ml-3 shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          aria-label={`Editar ${reason.label}`}
        >
          Editar
        </button>
      )}
    </div>
  );
}
