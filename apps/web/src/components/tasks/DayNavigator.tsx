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
import { addDays, formatDayLabel, isToday, toISODate } from '../../lib/dates.js';

interface DayNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onNavigate: (date: string, direction: 'left' | 'right') => void;
}

export default function DayNavigator({ selectedDate, onNavigate }: DayNavigatorProps) {
  const showTodayButton = !isToday(selectedDate);
  const label = formatDayLabel(selectedDate);

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

      {/* Label central + botão Hoje */}
      <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-gray-800 truncate">
          {label}
        </span>

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
