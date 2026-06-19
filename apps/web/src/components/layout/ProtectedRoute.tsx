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
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserva a URL que o usuário tentou acessar para redirecionar após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
