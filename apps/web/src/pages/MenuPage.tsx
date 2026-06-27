/**
 * MenuPage — "Menu" (mobile): agrupa acessos que saíram da barra inferior
 *
 * Lista: Histórico de Clientes, Configurações, dados do usuário e Sair.
 * No desktop esses itens também estão na Sidebar.
 */
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { signOut } from '../lib/auth.js';

interface MenuLink {
  to: string;
  label: string;
  description: string;
  icon: string;
}

const LINKS: MenuLink[] = [
  {
    to: '/historico',
    label: 'Histórico de Clientes',
    description: 'Buscar clientes e ver atendimentos',
    icon: '🔍',
  },
  {
    to: '/configuracoes',
    label: 'Configurações',
    description: 'Tipos de serviço e motivos',
    icon: '⚙️',
  },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <main className="flex-1 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Menu</h1>

      {/* Dados do usuário */}
      {user && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-brand-red">
            {user.role === 'manager' ? 'Gerente' : 'Consultor'}
          </span>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-col gap-2">
        {LINKS.map((link) => (
          <button
            key={link.to}
            type="button"
            onClick={() => navigate(link.to)}
            className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="text-2xl" aria-hidden="true">{link.icon}</span>
            <span className="flex-1">
              <span className="block font-semibold text-gray-900 text-sm">{link.label}</span>
              <span className="block text-xs text-gray-500">{link.description}</span>
            </span>
            <span className="text-gray-300" aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      {/* Sair */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-brand-red hover:bg-red-50 active:bg-red-100 transition-colors"
      >
        <span aria-hidden="true">🚪</span>
        Sair
      </button>
    </main>
  );
}
