/**
 * DayNavigator — Navegação entre dias
 *
 * Exibe setas de navegação (← e →) e um label central com a data selecionada.
 * Quando a data selecionada não for hoje, exibe também o botão "Hoje".
 *
 * Layout:
 *   [ ← ]  [ Qui, 19 jun  |  Hoje ]  [ → ]
 *
 * Ao clicar nas setas, chama onNavigate com a nova data (YYYY-MM-DD).
 * Ao clicar em "Hoje", chama onNavigate com a data de hoje.
 */
import { useRef } from 'react';
import { addDays, formatDayLabel, isToday, toISODate } from '../../lib/dates.js';

interface DayNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onNavigate: (date: string, direction: 'left' | 'right') => void;
}

export default function DayNavigator({ selectedDate, onNavigate }: DayNavigatorProps) {
  const showTodayButton = !isToday(selectedDate);
  const label = formatDayLabel(selectedDate);
  const dateInputRef = useRef<HTMLInputElement>(null);

  function handlePrev() {
    onNavigate(addDays(selectedDate, -1), 'left');
  }

  function handleNext() {
    onNavigate(addDays(selectedDate, 1), 'right');
  }

  function handleToday() {
    const today = toISODate(new Date());
    const direction: 'left' | 'right' = selectedDate < today ? 'right' : 'left';
    onNavigate(today, direction);
  }

  function handlePickDate(value: string) {
    if (!value) return;
    const direction: 'left' | 'right' = value < selectedDate ? 'left' : 'right';
    onNavigate(value, direction);
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 border border-gray-200">
      {/* Botão anterior */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Dia anterior"
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 active:bg-gray-300 text-lg font-medium transition-colors"
      >
        ←
      </button>

      {/* Label central (clicável = abre calendário) + botão Hoje */}
      <div className="relative flex flex-1 items-center justify-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="flex items-center gap-1 text-sm font-semibold text-gray-800 truncate hover:text-brand-red transition-colors"
          aria-label="Escolher data"
        >
          {label}
          <span className="text-gray-400" aria-hidden="true">▾</span>
        </button>
        {/* input de data oculto para o seletor nativo */}
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => handlePickDate(e.target.value)}
          className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />

        {showTodayButton && (
          <button
            type="button"
            onClick={handleToday}
            className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 active:bg-blue-300 transition-colors"
          >
            Hoje
          </button>
        )}
      </div>

      {/* Botão próximo */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Próximo dia"
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 active:bg-gray-300 text-lg font-medium transition-colors"
      >
        →
      </button>
    </div>
  );
}
