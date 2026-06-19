/**
 * Zustand store de autenticação
 *
 * State: user, token, isAuthenticated
 * Actions: login, logout, setToken
 * Persistência: localStorage via zustand/middleware persist (key: 'auth-storage')
 *
 * NOTA: A chave 'auth-storage' é a mesma que o interceptor de api.ts lê
 * para injetar o Bearer token sem criar dependência circular.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'consultant' | 'manager';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ── Initial state ──────────────────────────────────────
      user: null,
      token: null,
      isAuthenticated: false,

      // ── Actions ────────────────────────────────────────────
      login: (token: string, user: AuthUser) => {
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      setToken: (token: string) => {
        set({ token });
      },
    }),
    {
      name: 'auth-storage', // chave no localStorage
      // Persiste apenas token e user — isAuthenticated é derivado
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
