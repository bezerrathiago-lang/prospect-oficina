/**
 * TasksPage — Tarefas de Hoje
 *
 * Exibe a lista de contatos do dia do consultor logado.
 * Usa selectedDate do uiStore; default = hoje em YYYY-MM-DD.
 *
 * Inclui DayNavigator para navegação entre dias com animação de slide horizontal.
 * O spinner de carregamento é sobreposto à lista durante o fetch.
 */
import { useState } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { useTasks } from '../hooks/useTasks.js';
import TaskList from '../components/tasks/TaskList.js';
import DayNavigator from '../components/tasks/DayNavigator.js';
import { formatDayLabel } from '../lib/dates.js';

export default function TasksPage() {
  const selectedDate = useUIStore((state) => state.selectedDate);
  const setSelectedDate = useUIStore((state) => state.setSelectedDate);

  /** Direção da animação: 'right' = avançou dia, 'left' = recuou dia */
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const { data, isLoading } = useTasks(selectedDate);

  function handleNavigate(newDate: string, direction: 'left' | 'right') {
    setSlideDirection(direction);
    setSelectedDate(newDate);
  }

  const animationClass =
    slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <main className="flex-1 px-4 py-6">
      {/* Título da tela */}
      <h1 className="text-xl font-bold text-gray-900 mb-3">
        {formatDayLabel(selectedDate)}
      </h1>

      {/* Navegador de dias */}
      <DayNavigator selectedDate={selectedDate} onNavigate={handleNavigate} />

      {/* Container animado da lista (key força remontagem a cada mudança de data) */}
      <div key={selectedDate} className={`mt-4 relative ${animationClass}`}>
        {/* Spinner de carregamento sobreposto */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-8 pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm text-gray-600">Carregando…</span>
            </div>
          </div>
        )}

        <TaskList
          pending={data?.pending ?? []}
          completed={data?.completed ?? []}
          isLoading={isLoading}
          selectedDate={selectedDate}
        />
      </div>
    </main>
  );
}
