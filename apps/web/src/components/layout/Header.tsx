/**
 * Header — cabeçalho topo da página (mobile only)
 *
 * - Visível apenas em telas < 768px (md:hidden)
 * - Exibe título da tela atual e nome do consultor logado
 * - Sem logout aqui — logout fica na Sidebar (desktop)
 *
 * O título é derivado do pathname atual via mapa estático.
 */
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import Logo from '../Logo.js';

/** Mapeia pathname para título legível */
const TITLE_MAP: Record<string, string> = {
  '/dashboard': 'Início',
  '/tarefas': 'Tarefas de Hoje',
  '/novo': 'Novo Atendimento',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações',
  '/menu': 'Menu',
};

function getPageTitle(pathname: string): string {
  return TITLE_MAP[pathname] ?? 'ProspectMoto';
}

export default function Header() {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);

  const title = getPageTitle(pathname);

  return (
    <header
      className="md:hidden sticky top-0 z-40
                 flex items-center justify-between
                 h-14 px-4
                 bg-white border-b border-gray-200"
    >
      {/* Logo + título da tela */}
      <div className="flex items-center gap-2 min-w-0">
        <Logo size={26} withWordmark={false} />
        <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
      </div>

      {/* Nome do consultor */}
      {user && (
        <span
          className="text-sm text-gray-500 truncate max-w-[120px]"
          aria-label={`Usuário: ${user.name}`}
        >
          {user.name.split(' ')[0]}
        </span>
      )}
    </header>
  );
}
