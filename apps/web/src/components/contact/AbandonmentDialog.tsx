/**
 * AbandonmentDialog — Sub-tela 3e: Encerrar Prospecção
 *
 * Exibe lista de motivos de desistência como radio buttons full-width.
 * Campo de texto livre aparece ao selecionar "Outros" (obrigatório, mín. 5 chars).
 * Botão "Confirmar Desistência" fica vermelho (#DC2626) apenas quando habilitado.
 *
 * Props:
 *   taskId    - ID da tarefa a encerrar
 *   onBack    - Callback para voltar ao estado anterior
 *   onConfirm - Callback chamado com os dados do abandono
 *   isPending - True enquanto a mutation está em voo
 */
import { useState } from 'react';
import type { AbandonmentReason } from '../../services/abandonmentReasons.service.js';
import { useAbandonmentReasons } from '../../hooks/useAbandonmentReasons.js';

// ── Props ─────────────────────────────────────────────────────────

interface AbandonmentDialogProps {
  taskId: number;
  onBack: () => void;
  onConfirm: (data: {
    abandonment_reason_id: number;
    abandonment_notes?: string;
  }) => void;
  isPending: boolean;
}

// ── Sub-componente: RadioItem ──────────────────────────────────────

interface RadioItemProps {
  reason: AbandonmentReason;
  selected: boolean;
  onSelect: (id: number) => void;
}

function RadioItem({ reason, selected, onSelect }: RadioItemProps) {
  return (
    <label
      className="flex items-center gap-3 w-full cursor-pointer rounded-lg border px-4"
      style={{
        minHeight: '44px',
        borderColor: selected ? '#F59E0B' : '#D1D5DB',
        backgroundColor: selected ? '#FFFBEB' : '#FFFFFF',
      }}
    >
      <input
        type="radio"
        name="abandonment_reason"
        value={reason.id}
        checked={selected}
        onChange={() => onSelect(reason.id)}
        className="accent-amber-500 w-4 h-4 shrink-0"
      />
      <span className="text-sm text-gray-800">{reason.label}</span>
    </label>
  );
}

// ── Componente principal ───────────────────────────────────────────

export default function AbandonmentDialog({
  taskId: _taskId,
  onBack,
  onConfirm,
  isPending,
}: AbandonmentDialogProps) {
  const { data: reasons, isLoading } = useAbandonmentReasons();

  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const selectedReason = reasons?.find((r) => r.id === selectedReasonId) ?? null;
  const requiresNotes = selectedReason?.is_other === true;
  const notesValid = !requiresNotes || notes.trim().length >= 5;
  const canConfirm = selectedReasonId !== null && notesValid && !isPending;

  function handleConfirm() {
    if (!canConfirm || selectedReasonId === null) return;
    const payload: { abandonment_reason_id: number; abandonment_notes?: string } = {
      abandonment_reason_id: selectedReasonId,
    };
    if (requiresNotes) payload.abandonment_notes = notes.trim();
    onConfirm(payload);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Aviso âmbar */}
      <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-800 font-medium">
        Esta ação encerrará definitivamente a prospecção deste cliente
      </div>

      <p className="text-sm font-semibold text-gray-700">Motivo do abandono</p>

      {/* Lista de motivos */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando motivos...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(reasons ?? []).map((reason) => (
            <RadioItem
              key={reason.id}
              reason={reason}
              selected={selectedReasonId === reason.id}
              onSelect={setSelectedReasonId}
            />
          ))}
        </div>
      )}

      {/* Campo texto livre — apenas para "Outros" */}
      {requiresNotes && (
        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="abandonment-notes"
          >
            Especifique o motivo <span className="text-red-500">*</span>
          </label>
          <textarea
            id="abandonment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descreva o motivo..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          />
          {notes.trim().length > 0 && notes.trim().length < 5 && (
            <p className="text-xs text-red-500">Descreva o motivo</p>
          )}
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
          style={{
            backgroundColor: canConfirm ? '#DC2626' : '#9CA3AF',
          }}
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
            'Confirmar Abandono'
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
