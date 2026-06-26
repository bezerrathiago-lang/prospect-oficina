/**
 * ResetPasswordPage — redefinição de senha (/redefinir-senha)
 *
 * Acessada via link enviado por e-mail (supabase.auth.resetPasswordForEmail).
 * O supabase-js processa o token na URL e cria uma sessão de recuperação;
 * aqui o usuário define a nova senha.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { updatePassword, signOut } from '../lib/auth.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // A sessão de recuperação é criada ao abrir o link do e-mail
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(password);
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setError(
        'Não foi possível redefinir. O link pode ter expirado — solicite a recuperação novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-red tracking-tight">ProspectMoto</h1>
          <p className="mt-1 text-gray-400 text-sm">Redefinir senha</p>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-xl p-8">
          {!ready ? (
            <p className="text-sm text-gray-300">
              Validando o link de recuperação... Se você chegou aqui sem clicar no link do
              e-mail, volte ao{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-brand-red underline"
              >
                login
              </button>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Nova senha</h2>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
                  Nova senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                             px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirmar senha
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError(null);
                  }}
                  placeholder="Repita a senha"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                             px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed
                           text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                {isLoading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
