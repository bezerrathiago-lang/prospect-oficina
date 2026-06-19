# Story 3.1: Lista de Tarefas do Dia

## Status
InReview

## Story
Como consultor,
eu quero ver a lista de todos os contatos que devo realizar hoje,
para que eu saiba exatamente com quem ligar sem precisar procurar as informações.

## Acceptance Criteria
- [ ] A tela "Tarefas de Hoje" (`apps/web/src/pages/TasksPage.tsx`) é a tela inicial exibida imediatamente após o login bem-sucedido
- [ ] O endpoint `GET /api/v1/tasks?date=YYYY-MM-DD` retorna as tarefas do consultor autenticado para a data informada, respondendo com `{ date, pending_count, tasks[] }` conforme especificado na seção 5.6 do `architecture.md`
- [ ] Cada card de tarefa exibe: nome do cliente, telefone (como link `tel:` clicável para discagem nativa em mobile), tipo de serviço previsto, data prevista do próximo serviço e número de tentativas anteriores (`attempt_count`)
- [ ] Cards são ordenados do maior `attempt_count` para o menor (clientes com mais tentativas aparecem no topo — maior prioridade)
- [ ] Badge de tentativas com cor variável: cinza neutro para 1 tentativa, âmbar (`#F59E0B`) para 2 tentativas, vermelho (`#EF4444`) para 3 ou mais tentativas — referência: seção 4.1 do `ux-design.md`
- [ ] Tarefas concluídas no dia aparecem em seção separada "Concluídas hoje" abaixo das pendentes, colapsada por padrão, com visual diferenciado (fundo verde-claro para agendadas, fundo cinza para reagendadas)
- [ ] Contador de tarefas pendentes exibido no topo da tela com texto "X contatos para hoje"
- [ ] Estado vazio (sem tarefas pendentes) exibe ilustração simples e mensagem "Nenhum contato para hoje. Bom descanso!" com botão "+ Novo Atendimento"
- [ ] Cada tarefa exibe botão "Registrar Resultado" que navega para a tela de resultado de contato passando o ID da tarefa
- [ ] Tarefas pertencem exclusivamente ao consultor logado — a query filtra por `consultant_id` igual ao `sub` do JWT; consultores não veem tarefas uns dos outros
- [ ] A lista carrega em menos de 2 segundos para até 100 tarefas (referência: NFR2 do PRD)

## Technical Notes
- Tabelas do banco: `tasks` (lista de tarefas), `customers` (nome e telefone), `service_records` (data do próximo serviço), `service_types` (nome do tipo de serviço) — referência: seção 2 do `architecture.md`
- Query SQL para a lista de tarefas: JOIN entre `tasks`, `customers`, `service_records` e `service_types`, filtrado por `tasks.consultant_id = :userId AND tasks.scheduled_date = :date AND tasks.status = 'pending'`, ordenado por `tasks.attempt_count DESC`
- Índice utilizado: `idx_tasks_consultant_date` em `tasks(consultant_id, scheduled_date)` garante performance (referência: seção 2 do `architecture.md`)
- `attempt_count` já é desnormalizado na tabela `tasks` — não requer COUNT de `contact_attempts` para exibição (decisão arquitetural 6.4 do `architecture.md`)
- Módulo backend: `apps/api/src/modules/tasks/tasks.routes.ts` e `tasks.service.ts`
- Componentes frontend: `apps/web/src/components/tasks/TaskCard.tsx` e `TaskList.tsx`
- Hook personalizado: `apps/web/src/hooks/useTasks.ts` usando TanStack Query com chave `['tasks', selectedDate, userId]`
- Skeleton screens (placeholder animado) devem ser exibidos durante carregamento inicial — referência: seção 6.5 do `ux-design.md`
- Telefone como link `tel:` — formato: `<a href="tel:+55XXXXXXXXXXX">` com área de tap expandida via padding (mín. 44x44px — referência: seção 6.3 do `ux-design.md`)
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 2.2 (tarefas são criadas pelo registro de atendimento)

## File List

### Backend
- `apps/api/src/db/schema.ts` — adicionado índice composto `idx_tasks_consultant_date` na tabela `tasks`
- `apps/api/src/db/migrations/0004_worthless_blazing_skull.sql` — migration gerada pelo Drizzle para o novo índice
- `apps/api/src/modules/tasks/tasks.service.ts` — serviço com `listByDate(consultantId, date)`
- `apps/api/src/modules/tasks/tasks.routes.ts` — rota `GET /api/v1/tasks?date=YYYY-MM-DD`
- `apps/api/src/app.ts` — registro das rotas de tasks

### Frontend
- `apps/web/src/services/tasks.service.ts` — cliente HTTP `getTasks(date)`
- `apps/web/src/hooks/useTasks.ts` — hook TanStack Query com staleTime 30s
- `apps/web/src/components/tasks/TaskCard.tsx` — card de tarefa com badge de tentativas, link tel:, botão "Registrar Resultado"
- `apps/web/src/components/tasks/TaskList.tsx` — lista com skeleton, estado vazio, seção colapsável de concluídas
- `apps/web/src/pages/TasksPage.tsx` — página atualizada com useTasks + uiStore

## Change Log

### 2026-06-16 — Dex (AIOX Developer)
- **InProgress**: Iniciada implementação da Story 3.1
- Backend: adicionado índice composto `(consultant_id, scheduled_date)` no schema Drizzle
- Backend: gerada e aplicada migration `0004_worthless_blazing_skull.sql`
- Backend: criado `tasks.service.ts` com JOIN de 4 tabelas, separação pending/completed, ordenação por attemptCount DESC
- Backend: criada rota `GET /api/v1/tasks?date=YYYY-MM-DD` protegida por JWT
- Backend: rota registrada em `app.ts` sob prefixo `/api/v1/tasks`
- Frontend: criado `tasks.service.ts` com `getTasks(date)`
- Frontend: criado `useTasks.ts` com useQuery e staleTime de 30s
- Frontend: criado `TaskCard.tsx` com badge colorido, link tel:, variante visual para concluídas
- Frontend: criado `TaskList.tsx` com skeleton (3 cards pulse), estado vazio, seção colapsável
- Frontend: atualizado `TasksPage.tsx` para usar uiStore.selectedDate e renderizar TaskList
- TypeScript: builds API e Web sem erros
- **InReview**: Implementação concluída
