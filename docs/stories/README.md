# ProspectMoto — Índice de Stories

**Produto:** ProspectMoto — Sistema de Gestão de Prospecção de Clientes para Oficina de Motos
**Versão:** 1.0.0
**Gerado por:** Pax — AIOX Product Owner Agent
**Data:** 2026-06-16
**Baseado em:** PRD v1.0.0 + Architecture v1.0.0 + UX Design v1.0.0

---

## Visão Geral

Este diretório contém as 10 stories de desenvolvimento do MVP do ProspectMoto, organizadas em 5 epics. Cada story está pronta para implementação com Acceptance Criteria testáveis, referências diretas à arquitetura (tabelas, endpoints, componentes) e dependências explícitas entre stories.

---

## Epic 1 — Fundação e Infraestrutura

**Objetivo:** Estabelecer a base técnica do projeto e entregar estrutura navegável com login e área autenticada.
**Milestone:** Semana 2

| Story | Arquivo | Status | Descrição |
|-------|---------|--------|-----------|
| 1.1 | [story-1.1-setup-projeto.md](./story-1.1-setup-projeto.md) | Draft | Configura o monorepo com frontend (React + Vite), backend (Fastify) e banco de dados (SQLite/PostgreSQL via Drizzle), com healthcheck em `/health` e README de instalação |
| 1.2 | [story-1.2-autenticacao-consultores.md](./story-1.2-autenticacao-consultores.md) | Draft | Implementa autenticação JWT com login/logout, refresh token em cookie httpOnly e seed de usuários para testes |
| 1.3 | [story-1.3-navegacao-autenticada.md](./story-1.3-navegacao-autenticada.md) | Draft | Cria a estrutura de navegação (Bottom Tab Bar mobile / sidebar desktop) com rotas protegidas e telas placeholder para todas as seções |

---

## Epic 2 — Registro de Atendimento e Cálculo de Previsão

**Objetivo:** Permitir ao consultor registrar um serviço realizado e visualizar a previsão do próximo serviço.
**Milestone:** Semana 4

| Story | Arquivo | Status | Descrição |
|-------|---------|--------|-----------|
| 2.1 | [story-2.1-cadastro-tipos-servico.md](./story-2.1-cadastro-tipos-servico.md) | Draft | CRUD de tipos de serviço com intervalos configuráveis (dias e km), restrito a gestores, com 3 tipos seed (Troca de Óleo, Revisão Completa, Calibração e Pneus) |
| 2.2 | [story-2.2-registro-atendimento-previsao.md](./story-2.2-registro-atendimento-previsao.md) | Draft | Formulário de novo atendimento com cálculo server-side da previsão do próximo serviço, find-or-create de cliente por telefone e criação automática de tarefa de prospecção |

---

## Epic 3 — Gestão de Tarefas Diárias de Prospecção

**Objetivo:** Apresentar ao consultor a lista organizada de contatos do dia com navegação entre datas.
**Milestone:** Semana 6

| Story | Arquivo | Status | Descrição |
|-------|---------|--------|-----------|
| 3.1 | [story-3.1-lista-tarefas-do-dia.md](./story-3.1-lista-tarefas-do-dia.md) | Draft | Tela principal pós-login exibindo tarefas do dia do consultor logado, ordenadas por número de tentativas, com telefone clicável e seção de concluídas |
| 3.2 | [story-3.2-navegacao-entre-dias.md](./story-3.2-navegacao-entre-dias.md) | Draft | Seletores de data anterior/próximo na lista de tarefas com indicador visual de "atrasada" para tarefas de dias passados e botão "Hoje" para retorno rápido |

---

## Epic 4 — Registro de Resultado de Contato e Fluxo de Desistência

**Objetivo:** Completar o ciclo de prospecção com registro de agendamento, reagendamento e desistência documentada.
**Milestone:** Semana 8

| Story | Arquivo | Status | Descrição |
|-------|---------|--------|-----------|
| 4.1 | [story-4.1-registrar-agendamento-confirmado.md](./story-4.1-registrar-agendamento-confirmado.md) | Draft | Registra agendamento confirmado com data, encerra a tarefa com status `completed_scheduled` e move card para seção "Concluídas" |
| 4.2 | [story-4.2-reagendar-contato.md](./story-4.2-reagendar-contato.md) | Draft | Registra tentativa sem sucesso e cria nova tarefa com data definida pelo consultor, incrementando o contador de tentativas |
| 4.3 | [story-4.3-registrar-desistencia.md](./story-4.3-registrar-desistencia.md) | Draft | Encerra definitivamente uma prospecção com seleção obrigatória de motivo (pré-definido ou texto livre para "Outros") e confirmação explícita para evitar acionamento acidental |

---

## Epic 5 — Histórico do Cliente e Configurações

**Objetivo:** Dar visibilidade completa do histórico de cada cliente e permitir gestão das configurações do sistema.
**Milestone:** Semana 10 (MVP completo)

| Story | Arquivo | Status | Descrição |
|-------|---------|--------|-----------|
| 5.1 | [story-5.1-historico-cliente.md](./story-5.1-historico-cliente.md) | Draft | Perfil do cliente com linha do tempo de todos os serviços e tentativas de prospecção, acessível pelo toque no nome do cliente na lista de tarefas |
| 5.2 | [story-5.2-gestao-motivos-desistencia.md](./story-5.2-gestao-motivos-desistencia.md) | Draft | Gestão dos motivos de desistência pelo gestor na tela de configurações, com ativação/desativação e seed dos 6 motivos pré-definidos |

---

## Grafo de Dependências

```
Story 1.1 (Setup)
    └── Story 1.2 (Auth)
            └── Story 1.3 (Navegação)
                    ├── Story 2.1 (Tipos de Serviço)
                    │       └── Story 2.2 (Registro de Atendimento)
                    │               └── Story 3.1 (Lista de Tarefas)
                    │                       ├── Story 3.2 (Navegação entre Dias)
                    │                       └── Story 4.1 (Agendamento Confirmado)
                    │                               └── Story 4.2 (Reagendar Contato)
                    │                                       └── Story 4.3 (Desistência)
                    │                                               └── Story 5.1 (Histórico)
                    └── Story 5.2 (Motivos Desistência) ── depende de Story 4.3
```

---

## Mapeamento de Arquivos Chave

| Camada | Arquivo | Stories Relacionadas |
|--------|---------|---------------------|
| Backend — Auth | `apps/api/src/modules/auth/` | 1.2 |
| Backend — Service Types | `apps/api/src/modules/service-types/` | 2.1 |
| Backend — Service Records | `apps/api/src/modules/service-records/` | 2.2 |
| Backend — Tasks | `apps/api/src/modules/tasks/` | 3.1, 3.2 |
| Backend — Contact Attempts | `apps/api/src/modules/contact-attempts/` | 4.1, 4.2, 4.3 |
| Backend — Customers | `apps/api/src/modules/customers/` | 5.1 |
| Backend — Abandonment Reasons | `apps/api/src/modules/abandonment-reasons/` | 4.3, 5.2 |
| Backend — Cálculo de Previsão | `apps/api/src/lib/forecast.ts` | 2.2 |
| Frontend — Páginas | `apps/web/src/pages/` | Todas |
| Frontend — Auth Store | `apps/web/src/store/authStore.ts` | 1.2, 1.3 |
| Frontend — UI Store | `apps/web/src/store/uiStore.ts` | 3.2 |
| Frontend — Componentes de Tarefa | `apps/web/src/components/tasks/` | 3.1, 3.2 |
| Frontend — Componentes de Contato | `apps/web/src/components/contact/` | 4.1, 4.2, 4.3 |
| Shared — Tipos e Schemas | `packages/shared/src/` | Todas |

---

**Gerado por:** Pax — AIOX Product Owner Agent
**Template Version:** stories-v1.0
