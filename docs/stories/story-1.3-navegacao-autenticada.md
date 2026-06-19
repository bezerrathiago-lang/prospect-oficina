# Story 1.3: Estrutura de Navegação Autenticada

## Status
InReview

## Story
Como consultor autenticado,
eu quero ter acesso à estrutura de navegação principal do sistema,
para que eu possa me orientar entre as seções do app.

## Acceptance Criteria
- [x] Bottom Tab Bar fixa na base da tela (mobile) com quatro abas: "Hoje", "+ Novo", "Histórico" e "Menu", conforme o wireframe da seção 2 do `ux-design.md`
- [x] Em telas com largura >= 768px (tablet/desktop), a Bottom Tab Bar se transforma em sidebar lateral, mantendo os mesmos itens de navegação
- [x] Todas as rotas da área autenticada redirecionam para `/login` quando acessadas sem access token válido no `authStore`
- [x] Layout responsivo verificado nas breakpoints: 375px (mobile), 768px (tablet) e 1440px (desktop), sem overflow horizontal em nenhum dos tamanhos
- [x] Telas placeholder (`apps/web/src/pages/`) para cada seção do menu já existem e são navegáveis sem erro de rota: `TasksPage.tsx`, `NewServicePage.tsx`, `CustomerHistoryPage.tsx` e `SettingsPage.tsx`
- [x] Rota padrão após login redireciona automaticamente para a tela "Tarefas de Hoje" (`TasksPage`)
- [x] Nome do consultor logado visível na interface (header ou menu lateral) usando dados do `authStore`
- [x] Navegação entre telas ocorre sem recarregamento de página (SPA com React Router v6)

## Technical Notes
- Roteamento: React Router v6 em `apps/web/src/App.tsx` com rotas protegidas implementadas via loader `requireAuth`
- Componentes de layout: `apps/web/src/components/layout/` — `Header`, `NavBar`, `Layout` wrapper
- Zustand store de UI: `apps/web/src/store/uiStore.ts` para flags de navegação e `selectedDate`
- Bottom Tab Bar conforme especificado em `ux-design.md` seção 2: altura fixa 64px (`--spacing-16`), safe area respeitada (iOS)
- Em desktop (>768px), sidebar lateral substitui a Bottom Tab Bar — implementar via classe condicional Tailwind CSS (`hidden md:flex`, etc.)
- Proteção de rotas: se `authStore.token` for nulo ou expirado, redirecionar para `/login`; o interceptor de `api.ts` cuida da renovação silenciosa via refresh token
- Cada tela placeholder deve renderizar ao menos um título `<h1>` com o nome da seção para facilitar testes de rota
- Depende de: Story 1.1 (estrutura base) e Story 1.2 (autenticação e authStore)

## File List

### Arquivos criados
- `apps/web/src/store/uiStore.ts` — Zustand store de UI com `selectedDate` (ISO date) e `setSelectedDate`
- `apps/web/src/components/layout/AppLayout.tsx` — Wrapper responsivo: Header + Outlet + BottomNavBar (mobile) / Sidebar + Outlet (desktop)
- `apps/web/src/components/layout/BottomNavBar.tsx` — Barra de navegação fixa 64px (mobile < 768px), 4 abas com destaque ativo em laranja
- `apps/web/src/components/layout/Sidebar.tsx` — Navegação lateral 240px (desktop >= 768px), exibe nome/role do consultor e botão de logout
- `apps/web/src/components/layout/Header.tsx` — Header topo 56px (mobile), exibe título da tela atual e primeiro nome do consultor
- `apps/web/src/pages/TasksPage.tsx` — Placeholder: `<h1>Tarefas de Hoje</h1>`
- `apps/web/src/pages/NewServicePage.tsx` — Placeholder: `<h1>Novo Atendimento</h1>`
- `apps/web/src/pages/CustomerHistoryPage.tsx` — Placeholder: `<h1>Histórico de Clientes</h1>`
- `apps/web/src/pages/SettingsPage.tsx` — Placeholder: `<h1>Configurações</h1>`

### Arquivos modificados
- `apps/web/src/App.tsx` — Roteamento refatorado: `/login` (pública), `/` → AppLayout protegido com rotas aninhadas (`/tarefas`, `/novo`, `/historico`, `/configuracoes`); index redireciona para `/tarefas`

### Arquivos inalterados (dependências)
- `apps/web/src/components/layout/ProtectedRoute.tsx` — Mantido sem alterações; cobre o AppLayout via `<Outlet />`
- `apps/web/src/store/authStore.ts` — Mantido sem alterações
- `apps/web/src/services/api.ts` — Mantido sem alterações
- `apps/web/src/pages/LoginPage.tsx` — Mantido sem alterações

## Change Log

| Data | Agente | Status Anterior | Status Novo | Descrição |
|------|--------|----------------|-------------|-----------|
| 2026-06-16 | Dex (@dev) | Draft | InProgress | Início da implementação da Story 1.3 |
| 2026-06-16 | Dex (@dev) | InProgress | InReview | Implementação completa: uiStore, páginas placeholder, componentes de layout (BottomNavBar, Sidebar, Header, AppLayout) e refatoração do App.tsx com rotas aninhadas protegidas |
