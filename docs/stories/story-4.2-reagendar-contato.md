# Story 4.2: Registrar Não Conseguiu Agendar — Reagendar Contato

## Status
InReview

## Story
Como consultor,
eu quero registrar que não consegui contato com o cliente e definir uma nova data para tentar de novo,
para que a tentativa seja documentada e uma nova tarefa seja criada automaticamente.

## Acceptance Criteria
- [ ] Botão grande "Não consegui agendar" (borda cinza, texto cinza-escuro) visível na tela de resultado de contato como segunda opção principal — referência: wireframe Tela 3a do `ux-design.md`
- [ ] Ao selecionar "Não consegui agendar", sub-tela 3c exibe duas opções de escolha: botão "Reagendar contato" (laranja/primário) e botão "Desistir desta prospecção" (cinza/secundário) — referência: wireframe Tela 3c do `ux-design.md`
- [ ] Ao escolher "Reagendar contato", sub-tela 3d exibe datepicker obrigatório "Nova data para ligar" com restrição de data mínima = amanhã (não permite data passada nem hoje)
- [ ] Texto informativo na sub-tela 3d: "Tentativa atual será registrada como 'sem contato'" — deixa claro ao consultor o que será gravado
- [ ] O endpoint `POST /api/v1/contact-attempts` é chamado com payload `{ task_id, outcome: "rescheduled", rescheduled_date }` e executa em transação:
  - Cria registro em `contact_attempts` com `outcome = 'rescheduled'` e `rescheduled_date`
  - Atualiza `tasks.status = 'completed_rescheduled'` na tarefa original
  - Cria nova tarefa em `tasks` com `scheduled_date = rescheduled_date`, `status = 'pending'`, `attempt_count = attempt_count_atual + 1` e mesmo `consultant_id`, `customer_id` e `service_record_id`
  - Preenche `contact_attempts.next_task_id` com o ID da nova tarefa criada
- [ ] Após confirmação bem-sucedida: toast azul "Novo contato agendado para [data]" exibido por 3 segundos; a tarefa original move-se para a seção "Concluídas hoje" com visual de fundo cinza e texto "Reagendada"
- [ ] O número de tentativas visível na nova tarefa (quando ela aparecer na data correta) reflete o valor incrementado
- [ ] Botão "Confirmar Reagendamento" fica desabilitado até que a nova data seja selecionada; exibe spinner e texto "Registrando..." durante processamento
- [ ] Validação: data de reagendamento não pode ser anterior a amanhã — mensagem "A nova data deve ser a partir de amanhã" — referência: seção 4.6 do `ux-design.md`

## Technical Notes
- Tabelas do banco envolvidas: `contact_attempts` (inserção com `outcome = 'rescheduled'`), `tasks` (atualização da original para `completed_rescheduled` e inserção da nova tarefa com `attempt_count` incrementado) — referência: seção 2 e seção 5.7 do `architecture.md`
- Transição de status em `tasks`: original vai de `pending` → `completed_rescheduled`; nova tarefa nasce com `status = 'pending'`
- Campo `next_task_id` em `contact_attempts` vincula a tentativa à nova tarefa criada, permitindo rastrear a cadeia de reagendamentos
- A incrementação de `attempt_count` ocorre na nova tarefa (não na original), garantindo que quando a nova tarefa aparecer na lista ela já mostre o número correto de tentativas
- Toda a operação deve ser executada em transação única no serviço `apps/api/src/modules/contact-attempts/contact-attempts.service.ts`
- Componente frontend: `apps/web/src/pages/ContactResultPage.tsx` (mesmo componente da Story 4.1, com renderização condicional por sub-fluxo)
- Após confirmação, invalidar queries `['tasks']` via TanStack Query
- Datepicker com restrição `min = tomorrow`: usar `<input type="date" min={tomorrowISO}>` — referência: seção 6.2 do `ux-design.md`
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 3.1, Story 4.1 (módulo de contact-attempts já parcialmente implementado)

## File List
### Backend (compartilhado com Stories 4.1 e 4.3)
- `apps/api/src/modules/contact-attempts/contact-attempts.schema.ts` — lógica de validação para outcome 'rescheduled' incluindo min = amanhã
- `apps/api/src/modules/contact-attempts/contact-attempts.service.ts` — função registerRescheduled() com criação de nova tarefa e atualização de next_task_id
### Frontend (compartilhado com Stories 4.1 e 4.3)
- `apps/web/src/pages/ContactResultPage.tsx` — estados 'not_reached' (Tela 3c) e 'rescheduled' (Tela 3d)
- `apps/web/src/services/contactAttempts.service.ts` — tipo RegisterRescheduledData

## Change Log
| Data       | Autor | Descrição                                              |
|------------|-------|--------------------------------------------------------|
| 2026-06-16 | Dex   | Status: Draft → InProgress — início da implementação  |
| 2026-06-16 | Dex   | Status: InProgress → InReview — implementação completa (Stories 4.1, 4.2, 4.3 implementadas em conjunto) |
