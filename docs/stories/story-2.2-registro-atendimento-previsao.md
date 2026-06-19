# Story 2.2: Registro de Atendimento e Previsão do Próximo Serviço

## Status
InReview

## Story
Como consultor,
eu quero registrar os dados de um serviço realizado em uma moto,
para que o sistema calcule automaticamente a data em que o cliente precisará do próximo serviço com base no uso real da moto.

## Acceptance Criteria
- [ ] Tela "Novo Atendimento" (`apps/web/src/pages/NewServicePage.tsx`) exibe formulário com os campos:
  - Nome do cliente (texto, obrigatório)
  - Telefone (máscara `(XX) XXXXX-XXXX`, obrigatório)
  - Tipo de Serviço (dropdown com lista de `service_types` ativos, obrigatório)
  - Data do último serviço (datepicker nativo, não permite data futura, obrigatório)
  - Km no último serviço (numérico com separador de milhar, obrigatório)
  - Km atual — hoje (numérico com separador de milhar, obrigatório; deve ser maior que km no último serviço)
  - Km do próximo serviço (numérico com separador de milhar, obrigatório; deve ser maior que km atual)
  - Data de hoje (exibida como campo somente-leitura, preenchida automaticamente pelo sistema)
- [ ] Enquanto os campos de km e datas estiverem preenchidos, o sistema exibe em tempo real um card de preview com: média diária calculada (ex.: "Média: 42 km/dia") e data prevista do próximo serviço (ex.: "Próximo serviço em: 14/09/2026")
- [ ] O cálculo de previsão segue a lógica:
  1. `dias_decorridos` = data de hoje − data do último serviço (em dias inteiros)
  2. `media_diaria` = (km atual − km no último serviço) ÷ `dias_decorridos`
  3. `km_restantes` = km do próximo serviço − km atual
  4. `dias_ate_proximo` = `km_restantes` ÷ `media_diaria` (arredondado para cima)
  5. `data_prevista` = data de hoje + `dias_ate_proximo`
- [ ] O endpoint `POST /api/v1/service-records` executa o mesmo cálculo no servidor (em `apps/api/src/lib/forecast.ts`) — o cálculo server-side é o autoritativo; o preview do frontend é apenas visual
- [ ] O endpoint implementa a lógica "find or create" para clientes: busca por telefone na tabela `customers`; se não existir, cria novo registro
- [ ] O atendimento é persistido na tabela `service_records` com todos os campos incluindo `next_service_date` (data prevista calculada) e `next_service_mileage` (km do próximo serviço informado pelo consultor)
- [ ] O sistema cria automaticamente uma tarefa na tabela `tasks` com `status = 'pending'`, `scheduled_date = next_service_date − contact_lead_days` (onde `contact_lead_days` vem do tipo de serviço selecionado) e `consultant_id` do consultor logado
- [ ] A resposta do endpoint inclui `{ service_record, customer, task }`
- [ ] Após salvamento, toast verde exibe "Atendimento salvo! Prospecção agendada para [data da tarefa]" e o usuário é redirecionado para a Lista de Tarefas
- [ ] Validações com mensagens inline:
  - Nome: obrigatório, mínimo 3 caracteres
  - Telefone: obrigatório, formato `(XX) XXXXX-XXXX`
  - Tipo de serviço: obrigatório
  - Data do último serviço: obrigatória, não pode ser futura, não pode ser igual a hoje (deve haver ao menos 1 dia de diferença para calcular média)
  - Km no último serviço: obrigatório, numérico positivo
  - Km atual: obrigatório, deve ser maior que km no último serviço — "Km atual deve ser maior que km do último serviço"
  - Km do próximo serviço: obrigatório, deve ser maior que km atual — "Km do próximo serviço deve ser maior que km atual"

## Technical Notes
- Lógica de cálculo centralizada exclusivamente no servidor em `apps/api/src/lib/forecast.ts` — função `calculateNextServiceDate({ lastServiceDate, lastServiceMileage, currentMileage, nextServiceMileage, today }): { dailyAverage, daysUntilNext, nextServiceDate }`
- O preview no frontend replica o mesmo cálculo client-side apenas para exibição em tempo real; o valor autoritativo é sempre o retornado pela API
- Tabelas do banco: `service_records`, `customers`, `tasks`
- `service_records` precisa dos campos: `last_service_date`, `last_service_mileage`, `current_mileage`, `next_service_mileage`, `next_service_date`, `daily_average_km`, `service_type_id`, `customer_id`, `consultant_id`
- Módulo backend: `apps/api/src/modules/service-records/` com `service-records.routes.ts`, `service-records.service.ts` e `service-records.schema.ts`
- Transação única no serviço: upsert `customers` + insert `service_records` + insert `tasks`
- Componente de formulário: `apps/web/src/components/service-record/ServiceForm.tsx` e `ForecastPreviewCard.tsx`
- Hook: `apps/web/src/hooks/useServiceRecord.ts`
- Teclado mobile: campos de km usam `inputmode="numeric"`, datas usam `<input type="date">`
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 2.1

## File List

### Backend
- `apps/api/src/db/schema.ts` — adicionadas tabelas `customers`, `service_records`, `tasks`
- `apps/api/src/db/migrations/0003_sharp_titanium_man.sql` — migration gerada automaticamente
- `apps/api/src/lib/forecast.ts` — função `calculateNextServiceDate` (lógica autoritativa)
- `apps/api/src/modules/service-records/service-records.schema.ts` — schemas Zod de request/response
- `apps/api/src/modules/service-records/service-records.service.ts` — serviço com upsert customer + insert service_record + insert task
- `apps/api/src/modules/service-records/service-records.routes.ts` — `POST /api/v1/service-records`
- `apps/api/src/app.ts` — registrada rota `/api/v1/service-records`

### Frontend
- `apps/web/src/services/serviceRecords.service.ts` — `createServiceRecord()` HTTP
- `apps/web/src/lib/forecast.ts` — cálculo client-side para preview em tempo real
- `apps/web/src/hooks/useServiceRecord.ts` — `useCreateServiceRecord()` com useMutation
- `apps/web/src/components/service-record/ForecastPreviewCard.tsx` — card de preview
- `apps/web/src/components/service-record/ServiceForm.tsx` — formulário completo com validações e preview
- `apps/web/src/pages/NewServicePage.tsx` — página atualizada com ServiceForm e toast

## Change Log

| Data | Agente | Status | Observação |
|------|--------|--------|------------|
| 2026-06-16 | @dev (Dex) | Draft → InProgress | Início da implementação da Story 2.2 |
| 2026-06-16 | @dev (Dex) | InProgress → InReview | Implementação completa: banco, backend, frontend — TypeScript sem erros |
