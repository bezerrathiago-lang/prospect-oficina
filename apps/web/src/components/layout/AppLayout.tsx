/**
 * AppLayout — wrapper de layout para área autenticada
 *
 * Composição responsiva:
 *   Mobile  (< 768px): Header (topo) + <Outlet> + BottomNavBar (base fixa)
 *   Desktop (>= 768px): Sidebar (lateral) + <Outlet>
 *
 * O <Outlet> do React Router renderiza a página atual no slot de conteúdo.
 *
 * Estrutura DOM:
 *   <div class="flex min-h-screen">
 *     <Sidebar />         ← hidden md:flex
 *     <div class="flex flex-col flex-1">
 *       <Header />        ← md:hidden
 *       <main>
 *         <Outlet />
 *       </main>
 *       <BottomNavBar />  ← md:hidden (fixed, não ocupa espaço no flow)
 *     </div>
 *   </div>
 *
 * O padding-bottom no main garante que o conteúdo não fique atrás
 * da BottomNavBar fixada em mobile.
 */
import { Outlet } from 'react-router-dom';
import Header from './Header.js';
import Sidebar from './Sidebar.js';
import BottomNavBar from './BottomNavBar.js';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar lateral — visível apenas em >= 768px */}
      <Sidebar />

      {/* Coluna de conteúdo */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header topo — visível apenas em < 768px */}
        <Header />

        {/* Área de conteúdo da página atual */}
        <main
          className="flex-1
                     pb-16 md:pb-0" /* pb-16 = espaço para BottomNavBar fixo em mobile */
        >
          <Outlet />
        </main>

        {/* BottomNavBar fixa na base — visível apenas em < 768px */}
        <BottomNavBar />
      </div>
    </div>
  );
}
