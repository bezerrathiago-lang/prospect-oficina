# Story 5.1: Histórico Completo do Cliente

## Status
InReview

## Story
Como consultor,
eu quero visualizar o histórico de um cliente específico,
para que eu tenha contexto completo antes de ligar ou para consultar o histórico de atendimentos.

## Acceptance Criteria
- [ ] Toque no nome do cliente em qualquer card da lista de tarefas navega para a tela de histórico (`apps/web/src/pages/CustomerHistoryPage.tsx`), passando o `customer_id` via parâmetro de rota
- [ ] O endpoint `GET /api/v1/customers/:id` retorna o perfil completo do cliente incluindo: dados do cliente (`name`, `phone`), lista de `service_records` em ordem cronológica inversa (mais recente primeiro), e para cada `service_record` a lista de `tasks` com seus respectivos `contact_attempts`
- [ ] Tela exibe card de dados do cliente no topo com: nome, telefone (como link `tel:` clicável) e badge de status atual da prospecção
- [ ] Badge de status da prospecção usa cores e labels: "Prospecção Ativa" (laranja), "Agendada" (verde), "Encerrada" (cinza), "Desistência" (vermelho) — referência: seção 4.4 do `ux-design.md`
- [ ] Serviço mais recente aparece expandido por padrão; atendimentos anteriores aparecem colapsados com seta de expansão — tap expande com animação
- [ ] Para cada `service_record` expandido são exibidos: data do serviço, tipo de serviço, quilometragem registrada, data prevista do próximo serviço e lista cronológica de tentativas de prospecção
- [ ] Para cada tentativa de prospecção são exibidos: data da tentativa, resultado ("Agendado em [data]", "Sem contato — reagendado para [data]" ou "Desistência — [motivo]")
- [ ] Tentativas com outcome `abandoned` exibem ícone vermelho e o motivo de desistência completo (incluindo texto livre quando motivo = "Outros")
- [ ] Botão de voltar no header retorna para a lista de tarefas sem perder o contexto de data selecionada (selectedDate no uiStore permanece inalterado)

## Technical Notes
- Tabelas do banco envolvidas: `customers`, `service_records`, `service_types`, `tasks`, `contact_attempts`, `abandonment_reasons` — referência: seção 2 do `architecture.md`
- Módulo backend: `apps/api/src/modules/customers/customers.routes.ts` e `customers.service.ts`
- A query do endpoint `GET /api/v1/customers/:id` deve usar JOIN ou queries aninhadas para trazer toda a hierarquia: customer → service_records → tasks → contact_attempts → abandonment_reasons
- Status atual da prospecção: derivado do `status` da `task` mais recente associada ao `service_record` mais recente do cliente — lógica no serviço backend
- Endpoint de busca de clientes: `GET /api/v1/customers?q=<string>` para busca por nome ou telefone (usado pela aba "Histórico" na navegação como ponto de entrada alternativo — referência: seção 2 do `ux-design.md`)
- Componente frontend: `apps/web/src/pages/CustomerHistoryPage.tsx` com sub-componentes para card de dados do cliente, lista de serviços e linha do tempo de tentativas
- Animação de expand/collapse de cards de serviço: Tailwind CSS com `transition-all` e controle de `max-height` ou usando `details`/`summary` HTML nativo com estilização customizada
- Acesso ao histórico também disponível via aba "Histórico" na Bottom Tab Bar com campo de busca por nome/telefone
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 2.2 (atendimentos registrados), Story 3.1 (navegação a partir da lista de tarefas), Stories 4.1, 4.2 e 4.3 (tentativas de contato registradas)

## File List
### Backend (novo)
- `apps/api/src/modules/customers/customers.service.ts` — getById (hierarquia completa) + search (LIKE %q%)
- `apps/api/src/modules/customers/customers.routes.ts` — GET / (busca) + GET /:id (detalhe)

### Backend (modificado)
- `apps/api/src/app.ts` — import + registro de customersRoutes em /api/v1/customers

### Frontend (novo)
- `apps/web/src/services/customers.service.ts` — getCustomer + searchCustomers
- `apps/web/src/hooks/useCustomer.ts` — useCustomer + useCustomerSearch
- `apps/web/src/components/customer/CustomerHeader.tsx` — card com nome, telefone, badge de status
- `apps/web/src/components/customer/ServiceRecordCard.tsx` — card de atendimento expansível
- `apps/web/src/components/customer/ContactAttemptItem.tsx` — linha de tentativa de contato

### Frontend (modificado)
- `apps/web/src/pages/CustomerHistoryPage.tsx` — modo busca + modo detalhe via useParams
- `apps/web/src/App.tsx` — rota /historico/:customerId adicionada
- `apps/web/src/components/tasks/TaskCard.tsx` — nome do cliente vira Link para /historico/:customerId

## Change Log
| Data | Status | Autor | Nota |
|------|--------|-------|------|
| 2026-06-16 | Draft → InProgress | Dex (AIOX Developer) | Início da implementação |
| 2026-06-16 | InProgress → InReview | Dex (AIOX Developer) | Implementação completa — backend (customers module) + frontend (busca + detalhe + componentes + navegação) |
