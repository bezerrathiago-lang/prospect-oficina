/**
 * Tela de login — responsiva (375px mobile, 1440px desktop)
 * Campos: e-mail e senha
 * Sucesso: salva no authStore e redireciona para /
 * Erro: exibe "E-mail ou senha inválidos" (sem revelar qual campo está errado)
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuthStore, type AuthUser } from '../store/authStore.js';

interface LoginApiResponse {
  accessToken: string;
  user: AuthUser;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validação client-side básica
    if (!email.trim()) {
      setError('E-mail é obrigatório.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password) {
      setError('Senha é obrigatória.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<LoginApiResponse>('/api/v1/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate('/', { replace: true });
    } catch {
      // Mensagem genérica — não revela qual campo está errado
      setError('E-mail ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-orange tracking-tight">
            ProspectMoto
          </h1>
          <p className="mt-1 text-gray-400 text-sm">
            Sistema de Gestão de Prospecção
          </p>
        </div>

        {/* Card do formulário */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Campo e-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="seu@email.com"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                           px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent
                           transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Campo senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                           px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent
                           transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-orange hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-semibold rounded-lg px-4 py-2.5 text-sm
                         transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
