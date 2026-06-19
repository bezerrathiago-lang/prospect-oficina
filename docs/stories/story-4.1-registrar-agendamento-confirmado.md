# Story 4.1: Registrar Agendamento Confirmado

## Status
InReview

## Story
Como consultor,
eu quero registrar que consegui agendar o serviço com o cliente,
para que a tarefa seja encerrada e o agendamento fique documentado.

## Acceptance Criteria
- [ ] Botão "Registrar Resultado" em cada card da lista de tarefas navega para a tela de resultado de contato (`apps/web/src/pages/ContactResultPage.tsx`), passando o ID da tarefa via rota ou estado
- [ ] A tela de resultado de contato exibe card de contexto com: nome do cliente, telefone, tipo de serviço previsto, data prevista do serviço e número da tentativa atual (ex.: "3ª tentativa") — referência: wireframe Tela 3a do `ux-design.md`
- [ ] Botão grande "Agendamento Confirmado" (borda verde, texto verde) visível na tela como opção principal de resultado
- [ ] Ao selecionar "Agendamento Confirmado", sub-tela 3b exibe campo datepicker obrigatório "Data do agendamento"
- [ ] O endpoint `POST /api/v1/contact-attempts` é chamado com payload `{ task_id, outcome: "scheduled", appointment_date }` e executa em transação:
  - Cria registro em `contact_attempts` com `outcome = 'scheduled'` e `appointment_date`
  - Atualiza `tasks.status = 'completed_scheduled'` e preenche `tasks.appointment_date`
  - Incrementa `tasks.attempt_count`
- [ ] Após confirmação bem-sucedida: toast verde "Agendamento registrado!" exibido por 3 segundos; a tarefa move-se para a seção "Concluídas hoje" na lista com visual de fundo verde-claro e ícone de check
- [ ] A tarefa encerrada não aparece mais na contagem de pendentes do dia
- [ ] Botão "Confirmar Agendamento" fica desabilitado até que a data do agendamento seja preenchida; exibe spinner inline e texto "Registrando..." durante o processamento

## Technical Notes
- Tabelas do banco envolvidas: `contact_attempts` (novo registro de tentativa), `tasks` (atualização de status e `appointment_date`) — referência: seção 2 do `architecture.md`
- Transição de status em `tasks`: `pending` → `completed_scheduled` (referência: campo `status CHECK (status IN ('pending', 'completed_scheduled', 'completed_rescheduled', 'abandoned'))` na tabela `tasks`)
- Módulo backend: `apps/api/src/modules/contact-attempts/contact-attempts.routes.ts` e `contact-attempts.service.ts`
- A atualização de `tasks.status`, `tasks.appointment_date`, `tasks.attempt_count` e a inserção em `contact_attempts` devem ocorrer em transação única para garantir consistência
- Componente frontend: `apps/web/src/pages/ContactResultPage.tsx`
- Após confirmação, o TanStack Query deve invalidar as queries `['tasks']` para refletir atualização na lista automaticamente
- Cor do botão de confirmação: verde (`--color-success-500: #22C55E`) — nunca usar vermelho para ação positiva (referência: princípio P7 do `ux-design.md`)
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 3.1 (lista de tarefas e navegação para resultado)

## File List
### Backend
- `apps/api/src/db/schema.ts` — adicionadas tabelas `abandonment_reasons` e `contact_attempts`; campos `appointment_date` e `completed_at` em `tasks`; enum de status atualizado
- `apps/api/src/db/migrations/0005_black_the_fallen.sql` — migration gerada pelo Drizzle
- `apps/api/src/db/seeds.ts` — reorganizado para garantir ordem correta; nenhuma alteração para esta story especificamente
- `apps/api/src/modules/contact-attempts/contact-attempts.schema.ts` — Zod schema com union discriminada por outcome
- `apps/api/src/modules/contact-attempts/contact-attempts.service.ts` — lógica transacional para outcome 'scheduled'
- `apps/api/src/modules/contact-attempts/contact-attempts.routes.ts` — POST /api/v1/contact-attempts
- `apps/api/src/modules/tasks/tasks.service.ts` — adicionado getById(); atualizado filtro de concluídas
- `apps/api/src/modules/tasks/tasks.routes.ts` — adicionado GET /:id
- `apps/api/src/app.ts` — registro das rotas contact-attempts e abandonment-reasons
- `apps/api/src/modules/service-records/service-records.schema.ts` — enum de status atualizado
### Frontend
- `apps/web/src/services/contactAttempts.service.ts` — registerAttempt(), getTaskById()
- `apps/web/src/services/abandonmentReasons.service.ts` — getAbandonmentReasons()
- `apps/web/src/hooks/useContactAttempt.ts` — useRegisterAttempt() com invalidação de queries
- `apps/web/src/hooks/useAbandonmentReasons.ts` — useAbandonmentReasons()
- `apps/web/src/pages/ContactResultPage.tsx` — página principal com todos os sub-fluxos
- `apps/web/src/components/contact/AbandonmentDialog.tsx` — componente de desistência
- `apps/web/src/App.tsx` — rota /tarefas/:taskId/resultado adicionada
- `apps/web/src/services/tasks.service.ts` — enum de status atualizado
- `apps/web/src/components/tasks/TaskCard.tsx` — isDone e cardBgClass atualizados para novos status

## Change Log
| Data       | Autor | Descrição                                              |
|------------|-------|--------------------------------------------------------|
| 2026-06-16 | Dex   | Status: Draft → InProgress — início da implementação  |
| 2026-06-16 | Dex   | Status: InProgress → InReview — implementação completa (Stories 4.1, 4.2, 4.3 implementadas em conjunto) |
