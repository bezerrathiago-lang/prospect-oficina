/**
 * Helpers de autenticação sobre o Supabase Auth.
 *
 * Mapeia a sessão do Supabase para o AuthUser usado pela interface,
 * extraindo nome e papel (role) do user_metadata.
 */
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase.js';
import { useAuthStore, type AuthUser, type Role } from '../store/authStore.js';

/**
 * Monta o AuthUser a partir da sessão + profile (fonte de verdade no banco
 * para papel e loja). Cai para o user_metadata se o profile ainda não existir.
 */
async function toAuthUser(user: User | null): Promise<AuthUser | null> {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { name?: string; role?: string };

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, store_id')
    .eq('id', user.id)
    .single();

  const role = (profile?.role ?? meta.role ?? 'consultant') as Role;
  return {
    id: user.id,
    email: user.email ?? '',
    name: profile?.name ?? meta.name ?? user.email ?? 'Usuário',
    role: ['consultant', 'manager', 'admin'].includes(role) ? role : 'consultant',
    storeId: profile?.store_id ?? null,
  };
}

/** Login com e-mail e senha. Lança erro em caso de credenciais inválidas. */
export async function signIn(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  useAuthStore.getState().setUser(await toAuthUser(data.user));
}

/** Encerra a sessão. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  useAuthStore.getState().setUser(null);
}

/** Envia e-mail de recuperação de senha com link para /redefinir-senha. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
  if (error) throw error;
}

/** Define uma nova senha (usa a sessão de recuperação criada pelo link do e-mail). */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Inicializa o estado de auth: carrega a sessão atual e escuta mudanças.
 * Deve ser chamado uma vez no boot do app.
 */
export function initAuth(): void {
  const store = useAuthStore.getState();

  void supabase.auth.getSession().then(async ({ data }) => {
    store.setUser(await toAuthUser(data.session?.user ?? null));
    store.setLoading(false);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    // Evita refazer a query do profile em todo refresh de token
    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().setUser(null);
    } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      void toAuthUser(session?.user ?? null).then((u) =>
        useAuthStore.getState().setUser(u),
      );
    }
  });
}
