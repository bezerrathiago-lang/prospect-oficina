/**
 * ContactAttemptItem — Linha de uma tentativa de contato no histórico
 *
 * Formatos de exibição por outcome:
 *   scheduled   → "Agendado em DD/MM/AAAA" (verde)
 *   rescheduled → "Sem contato — reagendado para DD/MM/AAAA" (âmbar)
 *   abandoned   → "Desistência — [motivo] ([notes] se houver)" (vermelho)
 */
import type { ContactAttemptDetail } from '../../services/customers.service.js';

interface ContactAttemptItemProps {
  attempt: ContactAttemptDetail;
}

/** Formata unix timestamp (seconds) para DD/MM/AAAA */
function formatDate(timestamp: number | null): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ContactAttemptItem({ attempt }: ContactAttemptItemProps) {
  const dateLabel = formatDate(attempt.created_at);

  if (attempt.outcome === 'scheduled') {
    return (
      <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
        <span className="mt-0.5 shrink-0 text-green-600 font-bold" aria-hidden="true">✓</span>
        <div>
          <p className="text-xs text-gray-400">{dateLabel}</p>
          <p className="text-sm text-green-700 font-medium">
            Agendado em {formatDate(attempt.appointment_date)}
          </p>
        </div>
      </div>
    );
  }

  if (attempt.outcome === 'rescheduled') {
    return (
      <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
        <span className="mt-0.5 shrink-0 text-amber-600 font-bold" aria-hidden="true">↺</span>
        <div>
          <p className="text-xs text-gray-400">{dateLabel}</p>
          <p className="text-sm text-amber-700 font-medium">
            Sem contato — reagendado para {formatDate(attempt.rescheduled_date)}
          </p>
        </div>
      </div>
    );
  }

  // outcome === 'abandoned'
  const reasonLabel = attempt.abandonment_reason?.label ?? 'Motivo desconhecido';
  const notes = attempt.abandonment_notes;

  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="mt-0.5 shrink-0 text-red-600 font-bold" aria-hidden="true">✗</span>
      <div>
        <p className="text-xs text-gray-400">{dateLabel}</p>
        <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
          Desistência — {reasonLabel}
          {notes ? ` (${notes})` : ''}
        </p>
      </div>
    </div>
  );
}
