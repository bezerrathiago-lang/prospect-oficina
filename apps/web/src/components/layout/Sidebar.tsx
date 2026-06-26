/**
 * Sidebar — navegação lateral (desktop/tablet)
 *
 * - Visível apenas em telas >= 768px (hidden md:flex)
 * - Largura fixa 240px
 * - Mesmos 4 itens da BottomNavBar
 * - Exibe nome e role do consultor logado (authStore)
 * - Botão de logout no rodapé
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { signOut } from '../../lib/auth.js';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/tarefas', label: 'Hoje', icon: '📋' },
  { to: '/novo', label: '+ Novo Atendimento', icon: '➕' },
  { to: '/historico', label: 'Histórico', icon: '🔍' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className="hidden md:flex flex-col
                 w-60 shrink-0
                 min-h-screen
                 bg-white border-r border-gray-200"
      aria-label="Menu lateral"
    >
      {/* Logo / cabeçalho */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-brand-red tracking-tight">
          ProspectMoto
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-50 text-brand-red'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')
            }
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé: info do usuário + logout */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        {user && (
          <div className="px-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-brand-red capitalize">
              {user.role === 'consultant' ? 'Consultor' : 'Gerente'}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                     text-sm font-medium text-gray-500
                     hover:bg-gray-50 hover:text-gray-700
                     transition-colors"
          aria-label="Sair do sistema"
        >
          <span aria-hidden="true">🚪</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
