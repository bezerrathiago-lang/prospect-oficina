/**
 * Zustand store de UI
 *
 * State: selectedDate (ISO date string, default = hoje)
 * Actions: setSelectedDate
 *
 * Usado pela tela de Tarefas para navegar entre datas.
 * Não é persistido — reseta para hoje a cada reload.
 */
import { create } from 'zustand';

interface UIState {
  selectedDate: string; // ISO date: 'YYYY-MM-DD'
}

interface UIActions {
  setSelectedDate: (date: string) => void;
}

type UIStore = UIState & UIActions;

/** Retorna a data de hoje no formato 'YYYY-MM-DD' (local time) */
function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useUIStore = create<UIStore>()((set) => ({
  // ── Initial state ──────────────────────────────────────
  selectedDate: getTodayISO(),

  // ── Actions ────────────────────────────────────────────
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
}));
