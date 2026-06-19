# Story 4.3: Registrar Desistência com Motivo

## Status
InReview

## Story
Como consultor,
eu quero registrar a desistência de uma prospecção e informar o motivo,
para que o histórico do cliente reflita por que paramos de tentar contatá-lo.

## Acceptance Criteria
- [ ] Ao escolher "Desistir desta prospecção" na sub-tela 3c, a sub-tela 3e "Encerrar Prospecção" é exibida com aviso visual âmbar: "Esta ação encerrará definitivamente a prospecção deste cliente" — referência: wireframe Tela 3e do `ux-design.md`
- [ ] A tela exibe lista de motivos como radio buttons com área de tap full-width (linha inteira clicável, mín. 44px de altura), com os seguintes motivos pré-definidos vindos do endpoint `GET /api/v1/abandonment-reasons`:
  - "Cliente sem interesse"
  - "Telefone inválido ou não atende"
  - "Cliente foi para outra oficina"
  - "Muitas tentativas sem retorno"
  - "Cliente solicitou não ser contatado"
  - "Outros"
- [ ] Ao selecionar o motivo "Outros", campo de texto livre "Especifique o motivo" aparece abaixo do radio button e torna-se obrigatório para habilitar a confirmação
- [ ] Botão "Confirmar Desistência" mantém-se desabilitado (cinza) até que um motivo seja selecionado; ao selecionar, fica habilitado com cor vermelha (`#DC2626`) — referência: seção 4.3 do `ux-design.md`
- [ ] O endpoint `POST /api/v1/contact-attempts` é chamado com payload `{ task_id, outcome: "abandoned", abandonment_reason_id, abandonment_notes? }` e executa em transação:
  - Cria registro em `contact_attempts` com `outcome = 'abandoned'`, `abandonment_reason_id` e `abandonment_notes` (obrigatório quando motivo = "Outros")
  - Atualiza `tasks.status = 'abandoned'` na tarefa, preenche `tasks.completed_at`
  - Incrementa `tasks.attempt_count`
- [ ] Após confirmação bem-sucedida: toast cinza "Prospecção encerrada" exibido por 3 segundos; a tarefa some completamente da lista de pendentes e não reaparece
- [ ] Nenhuma nova tarefa é criada — a prospecção é encerrada definitivamente
- [ ] Validação: campo "Outros" exige ao menos 5 caracteres — mensagem "Descreva o motivo"
- [ ] Componente `AbandonmentDialog` (`apps/web/src/components/contact/AbandonmentDialog.tsx`) gerencia o fluxo de desistência com confirmação explícita, evitando acionamento acidental — referência: princípio P5 do `ux-design.md`

## Technical Notes
- Tabelas do banco envolvidas: `contact_attempts` (inserção com `outcome = 'abandoned'`), `tasks` (atualização para `status = 'abandoned'` e preenchimento de `completed_at`), `abandonment_reasons` (leitura da lista de motivos) — referência: seção 2 do `architecture.md`
- Campo `abandonment_reason_id` em `contact_attempts` é FK para `abandonment_reasons`; campo `abandonment_notes` recebe texto livre quando motivo = "Outros"
- O campo "Outros" em `abandonment_reasons` tem flag `is_other = 1` para que o frontend saiba quando exibir o campo de texto livre
- Transição de status em `tasks`: `pending` → `abandoned` (estado terminal — não gera novas tarefas)
- Módulo backend: `apps/api/src/modules/abandonment-reasons/` com endpoint `GET /api/v1/abandonment-reasons` (lista motivos ativos com `sort_order`)
- Toda a operação (insert em `contact_attempts` + update em `tasks`) deve ocorrer em transação única
- Motivos seed populados via `pnpm --filter api db:seed`
- Radio buttons: área de tap full-width para facilitar uso mobile — toda a linha é clicável, não apenas o círculo do radio — referência: seção 6.3 do `ux-design.md`
- Cor do botão destrutivo: vermelho escuro `#DC2626` quando habilitado — referência: seção 5.1 do `ux-design.md`
- Após confirmação, invalidar queries `['tasks']` via TanStack Query
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 3.1, Story 4.2 (sub-tela de "não conseguiu agendar" já implementada)

## File List
### Backend
- `apps/api/src/db/schema.ts` — tabela `abandonment_reasons` com flag `is_other`
- `apps/api/src/db/seeds.ts` — 6 motivos de desistência populados idempotentemente
- `apps/api/src/modules/abandonment-reasons/abandonment-reasons.service.ts` — list()
- `apps/api/src/modules/abandonment-reasons/abandonment-reasons.routes.ts` — GET /api/v1/abandonment-reasons
- `apps/api/src/modules/contact-attempts/contact-attempts.service.ts` — função registerAbandoned() com validação de notes para is_other
- `apps/api/src/app.ts` — registro da rota abandonment-reasons
### Frontend
- `apps/web/src/services/abandonmentReasons.service.ts` — getAbandonmentReasons()
- `apps/web/src/hooks/useAbandonmentReasons.ts` — useAbandonmentReasons()
- `apps/web/src/components/contact/AbandonmentDialog.tsx` — componente completo com radio buttons, campo condicional, botão destrutivo
- `apps/web/src/pages/ContactResultPage.tsx` — estado 'abandoned' delega para AbandonmentDialog

## Change Log
| Data       | Autor | Descrição                                              |
|------------|-------|--------------------------------------------------------|
| 2026-06-16 | Dex   | Status: Draft → InProgress — início da implementação  |
| 2026-06-16 | Dex   | Status: InProgress → InReview — implementação completa (Stories 4.1, 4.2, 4.3 implementadas em conjunto) |
