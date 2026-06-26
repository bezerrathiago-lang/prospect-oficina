/**
 * ProtectedRoute — wrapper para rotas que exigem autenticação
 *
 * Se o usuário não estiver autenticado (isAuthenticated = false no authStore),
 * redireciona para /login preservando a URL de destino no state.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

  // Aguarda a resolução da sessão inicial para evitar redirect prematuro
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <span
          className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
          aria-label="Carregando..."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserva a URL que o usuário tentou acessar para redirecionar após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
