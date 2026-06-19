# Story 2.1: Cadastro de Tipos de Serviço

## Status
InReview

## Story
Como gestor,
eu quero cadastrar os tipos de serviço disponíveis na oficina,
para que o consultor possa categorizar cada atendimento e o sistema aplique a antecedência correta na criação da tarefa de prospecção.

## Acceptance Criteria
- [ ] Tela de configurações (`apps/web/src/pages/SettingsPage.tsx`) exibe a seção "Tipos de Serviço" com a lista de tipos cadastrados, conforme wireframe da Tela 5 do `ux-design.md`
- [ ] Cada item da lista exibe: nome do serviço, antecedência para contato (dias) e badge de status (Ativo/Inativo)
- [ ] Botão "+ Adicionar Tipo de Serviço" abre bottom sheet com formulário contendo campos: Nome (obrigatório) e Antecedência para contato em dias (numérico positivo, obrigatório, padrão 15)
- [ ] Botão "Editar" em cada item abre bottom sheet com os dados preenchidos para edição dos campos acima mais toggle Ativo/Inativo
- [ ] Tipos de serviço podem ser desativados (`is_active = false`) mas não deletados — itens desativados aparecem em seção colapsável "Inativos" na lista
- [ ] Validação inline: campo numérico aceita apenas inteiros positivos; mensagem de erro abaixo do campo correspondente
- [ ] API REST com os seguintes endpoints implementados em `apps/api/src/modules/service-types/`:
  - `GET /api/v1/service-types` — lista tipos ativos (com `?include_inactive=true` para trazer todos)
  - `POST /api/v1/service-types` — cria novo tipo (acesso: role `manager`)
  - `GET /api/v1/service-types/:id` — detalhe de um tipo
  - `PATCH /api/v1/service-types/:id` — atualiza campos (acesso: role `manager`)
- [ ] Banco de dados populado com os tipos de serviço seed ao rodar `db:seed`: Revisão (15 dias de antecedência) e Troca de Peças (15 dias)
- [ ] Endpoints de criação e edição exigem role `manager` no JWT — consultores comuns recebem HTTP 403

## Technical Notes
- Tabela do banco: `service_types` — campos `id`, `name`, `contact_lead_days` (default 15), `is_active`, `created_at`, `updated_at`
- **Removido** nesta versão: `interval_days` e `interval_km` — o cálculo de previsão agora usa os dados reais de km/data inseridos pelo consultor em cada atendimento (FR2), não intervalos fixos por tipo de serviço
- O `contact_lead_days` é o único parâmetro de configuração do tipo de serviço que influencia o cálculo: define quantos dias antes da data prevista a tarefa de prospecção é criada
- Módulo backend: `apps/api/src/modules/service-types/` com `service-types.routes.ts`, `service-types.service.ts` e `service-types.schema.ts`
- Autorização por role: o plugin `apps/api/src/plugins/auth.ts` deve expor decorator para verificar `role = 'manager'` nas rotas restritas
- Frontend: dados de tipos de serviço são usados também na Story 2.2 (dropdown de seleção no formulário de atendimento) — usar query TanStack Query com cache compartilhado
- Depende de: Story 1.1, Story 1.2, Story 1.3

## File List

### Backend
- `apps/api/src/db/schema.ts` — tabela `serviceTypes` adicionada
- `apps/api/src/db/migrations/0002_right_pete_wisdom.sql` — migration gerada pelo Drizzle
- `apps/api/src/db/seeds.ts` — seeds dos 3 tipos de serviço adicionados
- `apps/api/src/modules/service-types/service-types.schema.ts` — Zod schemas (Create, Update, Response)
- `apps/api/src/modules/service-types/service-types.service.ts` — funções list, findById, create, update
- `apps/api/src/modules/service-types/service-types.routes.ts` — rotas GET, POST, GET/:id, PATCH/:id
- `apps/api/src/app.ts` — registro das rotas `/api/v1/service-types`

### Frontend
- `apps/web/package.json` — dependências `@tanstack/react-query` e `@tanstack/react-query-devtools` adicionadas
- `apps/web/src/main.tsx` — `QueryClientProvider` envolvendo a aplicação
- `apps/web/src/services/serviceTypes.service.ts` — funções HTTP getServiceTypes, createServiceType, updateServiceType
- `apps/web/src/hooks/useServiceTypes.ts` — hooks useServiceTypes, useCreateServiceType, useUpdateServiceType
- `apps/web/src/components/service-types/ServiceTypeSheet.tsx` — bottom sheet (slide-up) para criar/editar
- `apps/web/src/components/service-types/ServiceTypeItem.tsx` — card de item da lista
- `apps/web/src/pages/SettingsPage.tsx` — tela de configurações com seção Tipos de Serviço

### Correção de bug pré-existente
- `apps/web/src/components/layout/BottomNavBar.tsx` — fix TS error: `end={item.end ?? false}`

## Change Log

### 2026-06-16 — @dev (Dex)
- **InProgress**: implementação da Story 2.1 iniciada
- Backend: tabela `service_types` criada no schema Drizzle, migration `0002_right_pete_wisdom.sql` gerada e aplicada
- Seeds: 3 tipos de serviço inseridos (Troca de Óleo 15d, Revisão Completa 15d, Calibração e Pneus 10d)
- Módulo `apps/api/src/modules/service-types/` criado com schema Zod, service e routes
- Routes registradas em `app.ts` sob `/api/v1/service-types`
- Frontend: `@tanstack/react-query` instalado; `QueryClientProvider` configurado em `main.tsx`
- Serviço HTTP, hooks TanStack Query, componentes `ServiceTypeItem` e `ServiceTypeSheet` criados
- `SettingsPage.tsx` implementado com lista ativa, seção colapsável de inativos, sheet de criar/editar
- Bug pré-existente corrigido: `BottomNavBar.tsx` TS error no prop `end` do `NavLink`
- Builds API e web passando sem erros TypeScript
- **InReview**: implementação concluída, story em revisão
