/**
 * RoleRoute — guard de rota por papel (role).
 *
 * Envolve rotas restritas: se o papel do usuário logado não estiver na lista
 * `allow`, redireciona para a home apropriada (consultor → /tarefas; demais → /dashboard).
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type Role } from '../../store/authStore.js';

export function homeForRole(role: Role | undefined): string {
  return role === 'consultant' ? '/tarefas' : '/dashboard';
}

export default function RoleRoute({ allow }: { allow: Role[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allow.includes(user.role)) {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }
  return <Outlet />;
}
