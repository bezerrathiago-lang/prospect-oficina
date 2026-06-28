/**
 * BottomNavBar — barra de navegação fixa na base da tela (mobile only)
 *
 * - Visível apenas em telas < 768px (md:hidden)
 * - Altura fixa 64px (--spacing-16 conforme ux-design.md)
 * - 4 abas: Hoje, + Novo, Histórico, Menu (Configurações)
 * - Aba ativa destacada com cor primária laranja (#DC2626)
 * - Safe area respeitada via padding-bottom (iOS home indicator)
 */
import { NavLink } from 'react-router-dom';
import { useAuthStore, type Role } from '../../store/authStore.js';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** Marca como ativa também em sub-rotas */
  end?: boolean;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Início', icon: '📊', end: true, roles: ['admin', 'manager'] },
  { to: '/tarefas', label: 'Hoje', icon: '📋', end: true, roles: ['admin', 'manager', 'consultant'] },
  { to: '/novo', label: '+ Novo', icon: '➕', end: true, roles: ['admin', 'manager', 'consultant'] },
  { to: '/menu', label: 'Menu', icon: '☰', end: true, roles: ['admin', 'manager', 'consultant'] },
];

export default function BottomNavBar() {
  const user = useAuthStore((s) => s.user);
  const navItems = NAV_ITEMS.filter((i) => user && i.roles.includes(user.role));
  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50
                 bg-white border-t border-gray-200
                 flex items-stretch
                 h-16 pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end ?? false}
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center justify-center gap-0.5',
              'text-xs font-medium transition-colors',
              'min-h-[44px]', // touch target WCAG 2.5.5
              isActive
                ? 'text-brand-red'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="text-xl leading-none"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span
                className={[
                  'text-[11px] leading-tight',
                  isActive ? 'font-semibold' : 'font-medium',
                ].join(' ')}
              >
                {item.label}
              </span>
              {/* Indicador de aba ativa */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2
                             w-8 h-0.5 bg-brand-red rounded-full"
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
