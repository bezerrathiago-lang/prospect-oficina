/**
 * HomeRedirect — redireciona a rota raiz conforme o papel do usuário.
 *
 * Consultor não tem a seção Início (dashboard) → vai para /tarefas.
 * Admin e gerente → /dashboard.
 */
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { homeForRole } from './RoleRoute.js';

export default function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={homeForRole(user?.role)} replace />;
}
