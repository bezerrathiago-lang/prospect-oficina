/**
 * App — roteador principal React Router v6
 *
 * Estrutura de rotas:
 *   /login           → LoginPage (pública)
 *   /                → ProtectedRoute → AppLayout
 *     index          → redireciona para /tarefas
 *     /tarefas       → TasksPage
 *     /novo          → NewServicePage
 *     /historico     → CustomerHistoryPage (busca)
 *     /historico/:customerId → CustomerHistoryPage (detalhe)
 *     /configuracoes → SettingsPage
 *   *                → redireciona para / (ProtectedRoute cuida do redirect para /login)
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { initAuth } from './lib/auth.js';
import LoginPage from './pages/LoginPage.js';
import ResetPasswordPage from './pages/ResetPasswordPage.js';
import DashboardPage from './pages/DashboardPage.js';
import MenuPage from './pages/MenuPage.js';
import TasksPage from './pages/TasksPage.js';
import NewServicePage from './pages/NewServicePage.js';
import CustomerHistoryPage from './pages/CustomerHistoryPage.js';
import SettingsPage from './pages/SettingsPage.js';
import ContactResultPage from './pages/ContactResultPage.js';

import ProtectedRoute from './components/layout/ProtectedRoute.js';
import AppLayout from './components/layout/AppLayout.js';
import RoleRoute from './components/layout/RoleRoute.js';
import HomeRedirect from './components/layout/HomeRedirect.js';

export default function App() {
  useEffect(() => {
    initAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rotas públicas ────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

        {/* ── Rotas protegidas ──────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Rota raiz: home conforme o papel (consultor → /tarefas) */}
            <Route index element={<HomeRedirect />} />

            {/* Início: apenas admin e gerente */}
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>

            <Route path="tarefas" element={<TasksPage />} />
            <Route path="tarefas/:taskId/resultado" element={<ContactResultPage />} />
            <Route path="novo" element={<NewServicePage />} />
            <Route path="historico" element={<CustomerHistoryPage />} />
            <Route path="historico/:customerId" element={<CustomerHistoryPage />} />

            {/* Configurações: apenas admin */}
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="configuracoes" element={<SettingsPage />} />
            </Route>

            <Route path="menu" element={<MenuPage />} />
          </Route>
        </Route>

        {/* ── Fallback ──────────────────────────────────────── */}
        {/* Qualquer rota desconhecida vai para / que redireciona para /tarefas
            (se autenticado) ou para /login (se não autenticado, via ProtectedRoute) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
