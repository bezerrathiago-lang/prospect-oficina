/**
 * Helpers de autenticação sobre o Supabase Auth.
 *
 * Mapeia a sessão do Supabase para o AuthUser usado pela interface,
 * extraindo nome e papel (role) do user_metadata.
 */
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase.js';
import { useAuthStore, type AuthUser } from '../store/authStore.js';

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { name?: string; role?: string };
  const role = meta.role === 'manager' ? 'manager' : 'consultant';
  return {
    id: user.id,
    email: user.email ?? '',
    name: meta.name ?? user.email ?? 'Usuário',
    role,
  };
}

/** Login com e-mail e senha. Lança erro em caso de credenciais inválidas. */
export async function signIn(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  useAuthStore.getState().setUser(toAuthUser(data.user));
}

/** Encerra a sessão. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  useAuthStore.getState().setUser(null);
}

/**
 * Inicializa o estado de auth: carrega a sessão atual e escuta mudanças.
 * Deve ser chamado uma vez no boot do app.
 */
export function initAuth(): void {
  const store = useAuthStore.getState();

  void supabase.auth.getSession().then(({ data }) => {
    store.setUser(toAuthUser(data.session?.user ?? null));
    store.setLoading(false);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(toAuthUser(session?.user ?? null));
  });
}
