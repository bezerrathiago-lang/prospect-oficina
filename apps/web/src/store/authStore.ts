/**
 * Zustand store de autenticação (Supabase)
 *
 * A sessão/token é gerenciada pelo client Supabase (persistSession).
 * Este store guarda apenas os dados do usuário para a interface.
 */
import { create } from 'zustand';

export type Role = 'consultant' | 'manager' | 'admin';

export interface AuthUser {
  id: string; // uuid do Supabase Auth
  name: string;
  email: string;
  role: Role;
  storeId: number | null; // loja do consultor; null para admin/gerente
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** true até a sessão inicial ser resolvida (evita flicker no ProtectedRoute) */
  loading: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setLoading: (loading) => set({ loading }),
}));
