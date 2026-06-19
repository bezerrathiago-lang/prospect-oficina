# Story 5.2: Gestão de Motivos de Desistência

## Status
InReview

## Story
Como gestor,
eu quero poder configurar os motivos de desistência disponíveis,
para que a lista reflita as razões reais da nossa operação.

## Acceptance Criteria
- [ ] Tela de configurações (`apps/web/src/pages/SettingsPage.tsx`) inclui seção "Motivos de Desistência" abaixo da seção "Tipos de Serviço", conforme wireframe da Tela 5 do `ux-design.md`
- [ ] A seção exibe lista dos motivos cadastrados com: nome do motivo, badge Ativo/Inativo e botão "Editar" em cada item
- [ ] Motivos desativados aparecem em sub-seção colapsável "Outros — motivos desativados" (não são exibidos na lista principal ativa)
- [ ] Botão "+ Adicionar Motivo" abre bottom sheet com campo "Nome do motivo" (obrigatório, mínimo 3 caracteres)
- [ ] Botão "Editar" em cada item abre bottom sheet com campo de nome preenchido e toggle Ativo/Inativo
- [ ] Motivos desativados (`is_active = false`) não aparecem nas opções de radio button na tela de desistência do consultor (Story 4.3)
- [ ] A API REST com endpoints implementados em `apps/api/src/modules/abandonment-reasons/`:
  - `GET /api/v1/abandonment-reasons` — lista motivos ativos (com `?include_inactive=true` para trazer todos), ordenados por `sort_order`
  - `POST /api/v1/abandonment-reasons` — cria novo motivo (acesso: role `manager`)
  - `PATCH /api/v1/abandonment-reasons/:id` — atualiza `label`, `is_active` ou `sort_order` (acesso: role `manager`)
- [ ] Sistema inicia com os 6 motivos seed obrigatórios populados via migration: "Cliente sem interesse", "Telefone inválido ou não atende", "Cliente foi para outra oficina", "Muitas tentativas sem retorno", "Cliente solicitou não ser contatado", "Outros"
- [ ] Endpoints de criação e edição exigem role `manager` — consultores recebem HTTP 403

## Technical Notes
- Tabela do banco: `abandonment_reasons` — campos `id` (UUID), `label`, `is_active`, `sort_order`, `created_at` — referência: seção 2 do `architecture.md`
- O motivo "Outros" requer tratamento especial no frontend (Story 4.3): quando selecionado, exibe campo de texto livre obrigatório — identificação pode ser feita por label exato ou por campo booleano `requires_notes` na tabela (sugestão de extensão do schema)
- Módulo backend: `apps/api/src/modules/abandonment-reasons/abandonment-reasons.routes.ts` e `abandonment-reasons.service.ts`
- A Story 4.3 já consome `GET /api/v1/abandonment-reasons` — este endpoint deve estar funcional antes ou em conjunto com a Story 4.3
- Bottom sheet de criação/edição: mesmo padrão de componente usado na Story 2.1 (tipos de serviço) — reutilizar lógica de bottom sheet de `apps/web/src/components/ui/`
- A ordenação por `sort_order` permite ao gestor controlar a sequência de exibição dos motivos na tela de desistência — campo editável via PATCH com `sort_order`
- Autorização por role: reutilizar o decorator de verificação de role `manager` já implementado na Story 2.1
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 2.1 (padrão de configurações e bottom sheet já estabelecido), Story 4.3 (consumer dos motivos de desistência)

## File List
### Backend (modificado)
- `apps/api/src/modules/abandonment-reasons/abandonment-reasons.service.ts` — adicionado: create (sort_order = max+1), update (PATCH parcial), list agora aceita includeInactive, adicionado campo is_active na response
- `apps/api/src/modules/abandonment-reasons/abandonment-reasons.routes.ts` — adicionado: POST /, PATCH /:id (manager only), GET agora aceita ?include_inactive=true, schemas Zod inline

### Frontend (novo)
- `apps/web/src/components/abandonment-reasons/AbandonmentReasonItem.tsx` — card com label, badge Ativo/Inativo, botão Editar (oculto para is_other)
- `apps/web/src/components/abandonment-reasons/AbandonmentReasonSheet.tsx` — bottom sheet criar/editar no padrão ServiceTypeSheet

### Frontend (modificado)
- `apps/web/src/services/abandonmentReasons.service.ts` — adicionado: createAbandonmentReason, updateAbandonmentReason, getAbandonmentReasons aceita includeInactive, tipo AbandonmentReason agora inclui is_active
- `apps/web/src/hooks/useAbandonmentReasons.ts` — adicionado: useCreateAbandonmentReason, useUpdateAbandonmentReason; useAbandonmentReasons aceita parâmetro includeInactive
- `apps/web/src/pages/SettingsPage.tsx` — seção "Motivos de Desistência" substituiu placeholder com lista ativa + colapsável de inativos + AbandonmentReasonSheet

## Change Log
| Data | Status | Autor | Nota |
|------|--------|-------|------|
| 2026-06-16 | Draft → InProgress | Dex (AIOX Developer) | Início da implementação |
| 2026-06-16 | InProgress → InReview | Dex (AIOX Developer) | Implementação completa — backend (POST + PATCH + include_inactive) + frontend (SettingsPage + componentes + hooks + serviços) |
