/**
 * ServiceRecordCard — Card de atendimento (service_record) no histórico do cliente
 *
 * Comportamento:
 *   - Primeiro card (defaultExpanded=true): expandido por padrão
 *   - Demais: colapsados, com botão de toggle
 *   - Dentro expandido: lista de tentativas de contato (ContactAttemptItem)
 */
import { useState } from 'react';
import type { ServiceRecordDetail } from '../../services/customers.service.js';
import ContactAttemptItem from './ContactAttemptItem.js';

interface ServiceRecordCardProps {
  record: ServiceRecordDetail;
  defaultExpanded?: boolean;
}

/** Formata unix timestamp (seconds) para DD/MM/AAAA */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Formata quilometragem com separador de milhar */
function formatKm(km: number): string {
  return km.toLocaleString('pt-BR') + ' km';
}

export default function ServiceRecordCard({
  record,
  defaultExpanded = false,
}: ServiceRecordCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Coletar todas as tentativas de contato de todas as tasks, em ordem cronológica
  const allAttempts = record.tasks
    .flatMap((t) => t.contact_attempts)
    .sort((a, b) => a.created_at - b.created_at);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Cabeçalho — sempre visível, clicável para toggle */}
      <button
        type="button"
        className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {record.service_type_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Serviço em {formatDate(record.last_service_date)} • {formatKm(record.last_service_mileage)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Próximo: {formatDate(record.next_service_date)}
          </p>
        </div>
        <span
          className={[
            'ml-3 shrink-0 text-gray-400 transition-transform duration-200',
            expanded ? 'rotate-90' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>

      {/* Corpo expandível */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {allAttempts.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              Nenhuma tentativa de contato registrada.
            </p>
          ) : (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Tentativas de prospecção
              </p>
              {allAttempts.map((attempt) => (
                <ContactAttemptItem key={attempt.id} attempt={attempt} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
