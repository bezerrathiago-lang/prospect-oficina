# Story 3.2: Navegação entre Dias

## Status
InReview

## Story
Como consultor,
eu quero poder navegar entre os dias da semana para ver tarefas passadas e futuras,
para que eu possa me planejar e acompanhar contatos que ficaram pendentes.

## Acceptance Criteria
- [ ] Seletores de data "anterior" e "próximo" (setas ou botões) visíveis no header da tela de tarefas, permitindo avançar ou recuar um dia por vez
- [ ] Ao navegar para outro dia, o endpoint `GET /api/v1/tasks?date=YYYY-MM-DD` é chamado com a data selecionada e a lista é atualizada sem recarregamento de página
- [ ] O título da tela exibe a data selecionada de forma legível: "Hoje, 16 jun" para o dia atual, ou "Qui, 19 jun" (com dia da semana abreviado e dia/mês) para outros dias
- [ ] Tarefas de dias passados com `status = 'pending'` aparecem com banner âmbar "ATRASADA" no topo do card, indicando visualmente que estão em atraso — referência: seção 4.1 do `ux-design.md`
- [ ] Botão "Hoje" visível no header (ao lado dos seletores de data) quando a data selecionada não for o dia atual; ao clicar, retorna imediatamente para o dia corrente
- [ ] A data selecionada é armazenada no `uiStore` Zustand (`apps/web/src/store/uiStore.ts`) como `selectedDate`, persistindo enquanto o usuário navega entre telas
- [ ] Transição entre dias ocorre com animação suave de slide (horizontal) e spinner de carregamento enquanto os dados são buscados

## Technical Notes
- A data selecionada (`selectedDate`) é gerenciada no `uiStore` Zustand — estado global para que outras telas possam referenciar a data em contexto
- O endpoint `GET /api/v1/tasks?date=YYYY-MM-DD` já suporta qualquer data (não apenas "hoje") — sem necessidade de endpoint separado para tarefas atrasadas; o endpoint `GET /api/v1/tasks/overdue` lista pendências de dias anteriores para uso futuro
- Componente de navegação: `apps/web/src/components/tasks/DayNavigator.tsx` com botões anterior/próximo e label de data
- A chave do TanStack Query `['tasks', selectedDate, userId]` garante que cada data seja cacheada separadamente — navegação para data já visitada é instantânea (stale-while-revalidate)
- Tarefas atrasadas: o backend distingue tarefas atrasadas comparando `scheduled_date < today AND status = 'pending'`; o frontend aplica o estilo de "ATRASADA" quando `scheduled_date < today` na tarefa retornada
- Formato de exibição de data: utilizar `Intl.DateTimeFormat` com locale `pt-BR` para formatação consistente ("Hoje", "Seg", "Ter", etc.)
- Animação de transição: Tailwind CSS com `transition-transform` e controle de direção por estado (avançar = slide da direita; recuar = slide da esquerda) — referência: seção 4.1 do `ux-design.md`
- Depende de: Story 1.1, Story 1.2, Story 1.3, Story 3.1 (lista de tarefas base)

## File List

### Criados
- `apps/web/src/lib/dates.ts` — helpers de data sem bibliotecas externas (toISODate, fromISODate, addDays, isToday, isPast, formatDayLabel)
- `apps/web/src/components/tasks/DayNavigator.tsx` — componente de navegação entre dias (setas, label, botão Hoje)

### Modificados
- `apps/web/src/components/tasks/TaskCard.tsx` — adicionado prop `isOverdue` e banner âmbar "ATRASADA"
- `apps/web/src/components/tasks/TaskList.tsx` — adicionado prop `selectedDate`, lógica de isOverdue por tarefa, textos adaptativos
- `apps/web/src/pages/TasksPage.tsx` — integração do DayNavigator, animação de slide, spinner de carregamento
- `apps/web/src/index.css` — keyframes `slideInRight` / `slideInLeft` e classes `.animate-slide-in-right` / `.animate-slide-in-left`

## Change Log

### 2026-06-16 — @dev (Dex)
- **Draft → InProgress**: início da implementação da Story 3.2
- Criado `apps/web/src/lib/dates.ts` com todos os helpers de data solicitados usando `Intl.DateTimeFormat` pt-BR e manipulação nativa
- Criado `apps/web/src/components/tasks/DayNavigator.tsx` com setas ← / →, label formatado e botão "Hoje" condicional
- Atualizado `TaskCard.tsx`: prop `isOverdue?: boolean`, banner âmbar "ATRASADA" no topo do card
- Atualizado `TaskList.tsx`: prop `selectedDate`, cálculo de `isDatePast` via `isPast()`, passa `isOverdue` para cada `TaskCard` pendente, textos adaptativos (contador, seção concluídas)
- Atualizado `TasksPage.tsx`: substituído h1 simples por `formatDayLabel`, adicionado `DayNavigator`, controle de direção de animação via `useState`, `key={selectedDate}` no container da lista, spinner sobreposto durante carregamento
- Atualizado `index.css`: keyframes de slide horizontal, classes `.animate-slide-in-right` e `.animate-slide-in-left`
- **InProgress → InReview**: implementação completa, todos os ACs cobertos
