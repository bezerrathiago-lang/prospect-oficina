# ProspectMoto — Arquitetura Técnica

**Produto:** ProspectMoto — Sistema de Gestão de Prospecção de Clientes para Oficina de Motos
**Versão:** 1.0.0
**Autor:** Aria (AIOX Architect Agent)
**Data:** 2026-06-16
**Baseado em:** PRD v1.0.0

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-06-16 | 1.0.0 | Documento de arquitetura inicial derivado do PRD v1.0.0 | Aria (AIOX Architect) |

---

## Índice

1. [Stack Tecnológica](#1-stack-tecnológica)
2. [Schema do Banco de Dados](#2-schema-do-banco-de-dados)
3. [Estrutura de Pastas do Monorepo](#3-estrutura-de-pastas-do-monorepo)
4. [Estratégia de Autenticação e Sessões](#4-estratégia-de-autenticação-e-sessões)
5. [Plano de API REST](#5-plano-de-api-rest)
6. [Decisões Arquiteturais Relevantes](#6-decisões-arquiteturais-relevantes)

---

## 1. Stack Tecnológica

### Resumo

| Camada | Tecnologia | Versão Mínima |
|--------|------------|---------------|
| Runtime backend | Node.js | 20 LTS |
| Framework backend | Fastify | 4.x |
| ORM / Query builder | Drizzle ORM | 0.30+ |
| Banco de dados (produção) | PostgreSQL | 15+ |
| Banco de dados (desenvolvimento local) | SQLite (via libsql) | — |
| Framework frontend | React | 18.x |
| Roteamento frontend | React Router | 6.x |
| Gerenciamento de estado | Zustand | 4.x |
| Cliente HTTP (frontend) | TanStack Query (React Query) | 5.x |
| Estilização | Tailwind CSS | 3.x |
| Componentes de UI | shadcn/ui | — |
| Build tool (frontend) | Vite | 5.x |
| Linguagem | TypeScript | 5.x (ambos os lados) |
| Testes unitários | Vitest | 1.x |
| Testes de integração (API) | Supertest + Vitest | — |
| Gerenciador de pacotes | pnpm | 9.x |
| Monorepo tooling | pnpm workspaces | — |

---

### Justificativas

#### Node.js + Fastify (backend)

O PRD define "monolito modular" com backend em Node.js. Fastify foi escolhido sobre Express por:

- **Performance:** Fastify é consistentemente 2–3x mais rápido que Express em benchmarks de throughput, relevante para atingir o NFR2 (lista de tarefas em < 2 s para 100 tarefas).
- **TypeScript nativo:** Suporte robusto via tipagem de rotas e schemas JSON (Zod / `@fastify/type-provider-zod`), eliminando erros de contrato entre frontend e backend.
- **Ecossistema de plugins:** `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors` e `@fastify/helmet` cobrem todos os requisitos de segurança sem overhead de configuração.
- **Equipe pequena:** A API de plugins é mais ergonômica e explícita que middleware do Express para projetos de escopo MVP.

#### Drizzle ORM

- **Migrations SQL-first:** Drizzle gera e executa migrations com SQL legível, facilitando auditoria e rollback manual em caso de problema em produção (NFR4 — persistência segura).
- **TypeScript end-to-end:** O schema é a única fonte de verdade — tipos de entidade são inferidos diretamente, eliminando divergência entre schema e código.
- **Suporte a PostgreSQL e SQLite com a mesma API:** Permite usar SQLite em desenvolvimento local e PostgreSQL em produção sem alterar queries (requisito do PRD, seção 4).
- **Leveza:** Drizzle não carrega um runtime pesado como Prisma; ideal para servidores VPS ou instâncias pequenas de cloud.

#### PostgreSQL (produção) / SQLite (dev)

- **PostgreSQL** é o banco relacional mais maduro para produção em cloud (Supabase, Railway, Neon, VPS próprio). Suporta transações ACID, índices parciais e `ON CONFLICT` necessários para upserts de tarefas.
- **SQLite via libsql** acelera o setup local (zero configuração de servidor) e é suportado pelo Drizzle sem mudança de código.

#### React + TanStack Query + Zustand (frontend)

- **React 18** é o padrão de mercado, com vasta documentação e componentes prontos (shadcn/ui).
- **TanStack Query** gerencia cache de requisições HTTP, revalidação automática e estados de loading/error — elimina boilerplate e atende NFR5 (funcionar em 3G) via stale-while-revalidate.
- **Zustand** para estado global leve (usuário autenticado, data selecionada na lista de tarefas). Mais simples que Redux/Context para o escopo do MVP.
- **React Router v6** com rotas protegidas via loader (`requireAuth`) atende o requisito de redirecionamento para login em rotas protegidas (Story 1.3).

#### Tailwind CSS + shadcn/ui

- **Tailwind** permite construir interfaces responsivas rapidamente com classes utilitárias — direto ao ponto para equipe pequena com prazo de 10 semanas.
- **shadcn/ui** fornece componentes acessíveis (WCAG AA, conforme NFR UI do PRD) sem impor um design system rígido. Componentes são copiados para o projeto, não importados de lib — sem lock-in de versão.

#### TypeScript em ambos os lados

TypeScript compartilhado entre frontend e backend permite criar um pacote `packages/shared` com tipos de request/response, eliminando desincronização de contratos de API — crítico para um time pequeno que não tem o luxo de manter documentação manual de tipos.

#### Vite

Build ultra-rápido com HMR (Hot Module Replacement) em < 100 ms. Configuração trivial para projetos React + TypeScript.

---

## 2. Schema do Banco de Dados

### Diagrama de Entidades (ERD textual)

```
users ──< service_records >── service_types
  |               |
  └──< tasks ──< contact_attempts
                     |
              abandonment_reasons
```

---

### DDL Simplificado (PostgreSQL)

```sql
-- ============================================================
-- TABELA: users
-- Consultores e gestores que acessam o sistema
-- ============================================================
CREATE TABLE users (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,         -- bcrypt, custo 12
  role        VARCHAR(20)   NOT NULL DEFAULT 'consultant'
                            CHECK (role IN ('consultant', 'manager')),
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: service_types
-- Tipos de serviço com intervalos configuráveis (FR2, FR12, Story 2.1)
-- ============================================================
CREATE TABLE service_types (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL UNIQUE,
  interval_days   INTEGER      NOT NULL CHECK (interval_days > 0),
  interval_km     INTEGER      NOT NULL CHECK (interval_km > 0),
  contact_lead_days INTEGER    NOT NULL DEFAULT 15,  -- dias antes da previsão para criar tarefa
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Dados seed obrigatórios (Story 2.1, AC4):
-- Troca de Óleo        — 90 dias / 3.000 km
-- Revisão Completa     — 180 dias / 6.000 km
-- Calibração e Pneus   — 60 dias / 2.000 km

-- ============================================================
-- TABELA: customers
-- Clientes da oficina (criados implicitamente no registro de atendimento)
-- ============================================================
CREATE TABLE customers (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120)  NOT NULL,
  phone       VARCHAR(20)   NOT NULL,           -- formato E.164 ou nacional
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================================
-- TABELA: service_records
-- Registro de atendimento realizado na oficina (FR1, Story 2.2)
-- ============================================================
CREATE TABLE service_records (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID         NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service_type_id       UUID         NOT NULL REFERENCES service_types(id) ON DELETE RESTRICT,
  consultant_id         UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_date          DATE         NOT NULL,
  mileage               INTEGER      NOT NULL CHECK (mileage > 0),
  next_service_date     DATE         NOT NULL,  -- calculado pelo sistema (FR2)
  next_service_mileage  INTEGER,                -- quilometragem prevista (opcional)
  notes                 TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_records_customer ON service_records(customer_id);
CREATE INDEX idx_service_records_consultant ON service_records(consultant_id);
CREATE INDEX idx_service_records_date ON service_records(service_date);

-- ============================================================
-- TABELA: tasks
-- Tarefas de prospecção geradas automaticamente (FR3, FR4, Story 3.1)
-- ============================================================
CREATE TABLE tasks (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id UUID         NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  customer_id       UUID         NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  consultant_id     UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scheduled_date    DATE         NOT NULL,       -- data em que a tarefa aparece na lista
  status            VARCHAR(30)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed_scheduled', 'completed_rescheduled', 'abandoned')),
  attempt_count     INTEGER      NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ,
  appointment_date  DATE,                        -- preenchido quando status = 'completed_scheduled'
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_consultant_date ON tasks(consultant_id, scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_customer ON tasks(customer_id);

-- ============================================================
-- TABELA: abandonment_reasons
-- Motivos de desistência configuráveis (FR10, Story 4.3, Story 5.2)
-- ============================================================
CREATE TABLE abandonment_reasons (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  label       VARCHAR(120) NOT NULL UNIQUE,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Dados seed obrigatórios (FR10):
-- "Cliente sem interesse"
-- "Telefone inválido ou não atende"
-- "Cliente foi para outra oficina"
-- "Muitas tentativas sem retorno"
-- "Cliente solicitou não ser contatado"
-- "Outros" (flag especial — exige texto livre)

-- ============================================================
-- TABELA: contact_attempts
-- Histórico de cada tentativa de contato (FR6, FR11, Story 4.x)
-- ============================================================
CREATE TABLE contact_attempts (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id               UUID         NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  consultant_id         UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  attempted_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  outcome               VARCHAR(30)  NOT NULL
                        CHECK (outcome IN ('scheduled', 'rescheduled', 'abandoned')),
  appointment_date      DATE,                    -- preenchido quando outcome = 'scheduled'
  rescheduled_date      DATE,                    -- preenchido quando outcome = 'rescheduled'
  abandonment_reason_id UUID         REFERENCES abandonment_reasons(id),  -- quando outcome = 'abandoned'
  abandonment_notes     TEXT,                    -- texto livre quando reason = "Outros"
  next_task_id          UUID         REFERENCES tasks(id)  -- nova tarefa criada ao reagendar
);

CREATE INDEX idx_contact_attempts_task ON contact_attempts(task_id);
CREATE INDEX idx_contact_attempts_customer
  ON contact_attempts(task_id)
  INCLUDE (attempted_at, outcome);
```

---

### Notas sobre o Schema

| Decisão | Justificativa |
|---------|---------------|
| `customers` separado de `users` | Clientes da oficina não são usuários do sistema; separar evita confusão e permite evoluir CRM independentemente |
| `next_service_date` em `service_records` | A previsão é calculada uma vez na inserção e persiste; se as regras de `service_types` mudarem, previsões históricas não são afetadas |
| `attempt_count` em `tasks` | Desnormalização intencional — evita COUNT(*) na query da lista de tarefas, atingindo NFR2 (< 2 s) |
| `status` em `tasks` com enum restrito | Garante integridade de estado sem lógica de transição no banco; a aplicação é responsável pelas transições |
| `contact_lead_days` em `service_types` | Torna o intervalo de antecedência da tarefa configurável por tipo de serviço, não hardcoded em 15 dias |
| UUID como PK | Permite geração de IDs no frontend antes de persistir (otimistic UI) e facilita migração entre ambientes sem conflito de sequências |

---

## 3. Estrutura de Pastas do Monorepo

```
prospect-moto/                        # Raiz do monorepo
│
├── package.json                      # Root package — scripts de dev/build/test globais
├── pnpm-workspace.yaml               # Declara workspaces: apps/*, packages/*
├── tsconfig.base.json                # Configuração TypeScript base compartilhada
├── .env.example                      # Variáveis de ambiente documentadas (sem valores reais)
├── .gitignore
├── README.md                         # Instruções de instalação e execução local (Story 1.1 AC5)
│
├── apps/
│   │
│   ├── api/                          # Backend — servidor Fastify
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── main.ts               # Entry point — cria e inicia o servidor Fastify
│   │   │   ├── app.ts                # Factory de app — registra plugins e rotas
│   │   │   ├── config.ts             # Leitura de variáveis de ambiente (zod + dotenv)
│   │   │   │
│   │   │   ├── plugins/              # Plugins Fastify (JWT, CORS, Helmet, etc.)
│   │   │   │   ├── auth.ts
│   │   │   │   ├── cors.ts
│   │   │   │   └── sensible.ts       # @fastify/sensible — utilitários de erros HTTP
│   │   │   │
│   │   │   ├── modules/              # Módulos por domínio (cada um: routes + service + schema)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.schema.ts
│   │   │   │   ├── users/
│   │   │   │   ├── customers/
│   │   │   │   ├── service-types/
│   │   │   │   ├── service-records/
│   │   │   │   ├── tasks/
│   │   │   │   ├── contact-attempts/
│   │   │   │   └── abandonment-reasons/
│   │   │   │
│   │   │   ├── db/
│   │   │   │   ├── index.ts          # Instância do cliente Drizzle (singleton)
│   │   │   │   ├── schema.ts         # Re-exporta todas as tabelas Drizzle
│   │   │   │   └── migrations/       # Arquivos SQL de migration gerados pelo Drizzle
│   │   │   │
│   │   │   └── lib/
│   │   │       ├── forecast.ts       # Lógica de cálculo de previsão do próximo serviço (FR2)
│   │   │       └── hash.ts           # Utilitários bcrypt
│   │   │
│   │   └── test/
│   │       ├── unit/                 # Testes unitários (forecast.test.ts, etc.)
│   │       └── integration/          # Testes de integração via Supertest
│   │
│   └── web/                          # Frontend — React + Vite
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── public/
│       │   └── favicon.ico
│       └── src/
│           ├── main.tsx              # Entry point React
│           ├── App.tsx               # Roteador principal (React Router)
│           │
│           ├── pages/                # Componentes de página (1 por rota)
│           │   ├── LoginPage.tsx
│           │   ├── TasksPage.tsx     # Tela principal — Lista de Tarefas do Dia
│           │   ├── NewServicePage.tsx
│           │   ├── ContactResultPage.tsx
│           │   ├── CustomerHistoryPage.tsx
│           │   └── SettingsPage.tsx
│           │
│           ├── components/           # Componentes reutilizáveis de UI
│           │   ├── ui/               # Componentes shadcn/ui copiados
│           │   ├── layout/           # Header, NavBar, Layout wrapper
│           │   ├── tasks/            # TaskCard, TaskList, DayNavigator
│           │   ├── service-record/   # ServiceForm, ForecastDisplay
│           │   └── contact/          # ContactResultForm, AbandonmentDialog
│           │
│           ├── hooks/                # Custom React hooks
│           │   ├── useAuth.ts
│           │   ├── useTasks.ts
│           │   └── useServiceRecord.ts
│           │
│           ├── services/             # Funções de chamada à API (fetch wrappers)
│           │   ├── api.ts            # Cliente axios/fetch base com interceptor de JWT
│           │   ├── tasks.service.ts
│           │   ├── serviceRecords.service.ts
│           │   └── auth.service.ts
│           │
│           ├── store/                # Estado global Zustand
│           │   ├── authStore.ts      # user, token, login(), logout()
│           │   └── uiStore.ts        # selectedDate, loading flags
│           │
│           └── lib/
│               ├── utils.ts          # cn() helper, formatadores de data/telefone
│               └── constants.ts      # Strings de status, labels de motivo, etc.
│
└── packages/
    └── shared/                       # Tipos TypeScript compartilhados entre api e web
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts              # Barrel export
            ├── types/
            │   ├── user.ts
            │   ├── task.ts
            │   ├── serviceRecord.ts
            │   ├── serviceType.ts
            │   ├── customer.ts
            │   └── contactAttempt.ts
            └── schemas/              # Schemas Zod reutilizados (validação frontend + backend)
                ├── task.schema.ts
                ├── serviceRecord.schema.ts
                └── auth.schema.ts
```

---

### Descrição dos diretórios principais

| Diretório | Responsabilidade |
|-----------|-----------------|
| `apps/api` | Servidor HTTP Fastify — recebe requisições, executa regras de negócio, persiste no banco |
| `apps/web` | SPA React — interface do consultor, consome a API REST |
| `packages/shared` | Tipos e schemas Zod compartilhados — única fonte de verdade para contratos de API |
| `apps/api/src/modules/` | Um subdiretório por recurso de domínio com routes, service e schema agrupados |
| `apps/api/src/lib/forecast.ts` | Módulo isolado com a lógica de cálculo de previsão — facilita testes unitários |
| `apps/api/src/db/` | Schema Drizzle e migrations — separados do código de negócio |
| `apps/web/src/pages/` | Uma página por tela do PRD (seção 3, Core Screens and Views) |
| `apps/web/src/services/` | Abstração das chamadas HTTP — isola o frontend das URLs da API |

---

## 4. Estratégia de Autenticação e Sessões

### Mecanismo escolhido: JWT stateless + refresh token em cookie httpOnly

O PRD (Story 1.2 AC5) aceita "token JWT ou sessão server-side". A escolha é JWT com dois tokens:

| Token | Onde fica | TTL | Finalidade |
|-------|-----------|-----|-----------|
| **Access Token** (JWT) | `localStorage` no browser | 15 minutos | Autorização de requisições à API (header `Authorization: Bearer`) |
| **Refresh Token** (opaco, UUID) | Cookie `httpOnly; Secure; SameSite=Strict` | 7 dias | Renovação silenciosa do access token sem novo login |

---

### Fluxo de autenticação

```
1. POST /auth/login  { email, password }
   └─ Servidor valida bcrypt, gera access JWT + refresh token
   └─ Retorna: { accessToken, user } no body
   └─ Seta cookie: refreshToken=<uuid>; httpOnly; Secure; SameSite=Strict; Max-Age=604800

2. Frontend armazena accessToken em memória (Zustand authStore)
   └─ Persiste no localStorage para sobreviver a refresh de página (Story 1.2 AC5)

3. Requisições autenticadas:
   └─ Header: Authorization: Bearer <accessToken>

4. Interceptor do cliente HTTP detecta 401:
   └─ POST /auth/refresh (envia cookie automaticamente)
   └─ Servidor valida refresh token, emite novo accessToken
   └─ Frontend atualiza store e retenta requisição original

5. POST /auth/logout:
   └─ Servidor invalida refresh token no banco (tabela refresh_tokens)
   └─ Limpa cookie
   └─ Frontend limpa localStorage e Zustand store
```

---

### Tabela auxiliar para refresh tokens

```sql
CREATE TABLE refresh_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT         NOT NULL UNIQUE,  -- hash SHA-256 do token opaco
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ                    -- preenchido no logout
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

### Payload do JWT (access token)

```json
{
  "sub": "<user_id (UUID)>",
  "name": "Nome do Consultor",
  "role": "consultant",
  "iat": 1718500000,
  "exp": 1718500900
}
```

---

### Justificativas das escolhas

| Decisão | Motivo |
|---------|--------|
| JWT stateless para access token | Sem consulta ao banco em cada requisição — atende NFR2 (latência < 2 s) |
| TTL curto (15 min) para access token | Limita janela de abuso se o token vazar do localStorage |
| Refresh token em cookie httpOnly | Imune a ataques XSS — JavaScript não consegue ler o cookie |
| Refresh token como UUID opaco (não JWT) | Pode ser revogado imediatamente no banco; JWT de longa duração não pode ser invalidado sem lista de revogação |
| Sem sessão server-side pura | Deploy stateless facilita futuro escalonamento horizontal e não exige sticky sessions |
| bcrypt custo 12 | Balanço entre segurança (resistência a brute force) e tempo de resposta (< 200 ms em hardware moderno) |
| Roles `consultant` / `manager` no JWT | Autorização básica para separar acesso a configurações (gestor) e tarefas (consultor) sem complexidade extra |

---

## 5. Plano de API REST

### Convenções gerais

- Base URL: `/api/v1`
- Autenticação: Header `Authorization: Bearer <accessToken>` em todos os endpoints exceto `POST /auth/login`
- Formato: JSON (Content-Type: application/json)
- Paginação: cursor-based em listas longas (`?cursor=<id>&limit=<n>`); tarefas do dia não paginadas (máximo esperado: ~100 por consultor/dia — NFR2)
- Respostas de erro: `{ "error": { "code": "SNAKE_CASE_CODE", "message": "..." } }`
- Timestamps: ISO 8601 UTC

---

### Agrupamento por recurso

#### 5.1 Autenticação (`/auth`)

| Método | Path | Descrição | Payload / Parâmetros |
|--------|------|-----------|---------------------|
| POST | `/auth/login` | Autentica consultor, retorna access token | `{ email, password }` |
| POST | `/auth/refresh` | Renova access token usando refresh token (cookie) | — (cookie automático) |
| POST | `/auth/logout` | Invalida refresh token e limpa cookie | — |
| GET | `/auth/me` | Retorna dados do usuário autenticado | — |

---

#### 5.2 Usuários (`/users`) — acesso restrito: `manager`

| Método | Path | Descrição | Payload / Parâmetros |
|--------|------|-----------|---------------------|
| GET | `/users` | Lista consultores ativos | `?role=consultant` |
| POST | `/users` | Cria novo consultor | `{ name, email, password, role }` |
| GET | `/users/:id` | Detalhe de um consultor | — |
| PATCH | `/users/:id` | Atualiza nome, email ou status | `{ name?, email?, is_active? }` |

---

#### 5.3 Tipos de Serviço (`/service-types`)

| Método | Path | Descrição | Payload / Parâmetros | Acesso |
|--------|------|-----------|---------------------|--------|
| GET | `/service-types` | Lista tipos de serviço ativos | `?include_inactive=true` | todos |
| POST | `/service-types` | Cria novo tipo de serviço | `{ name, interval_days, interval_km, contact_lead_days }` | manager |
| GET | `/service-types/:id` | Detalhe de um tipo de serviço | — | todos |
| PATCH | `/service-types/:id` | Atualiza intervalo ou nome | `{ name?, interval_days?, interval_km?, contact_lead_days?, is_active? }` | manager |

---

#### 5.4 Clientes (`/customers`)

| Método | Path | Descrição | Payload / Parâmetros |
|--------|------|-----------|---------------------|
| GET | `/customers` | Busca clientes por nome ou telefone | `?q=<string>` |
| GET | `/customers/:id` | Perfil completo do cliente com histórico de serviços e prospecções (Story 5.1) | — |

> Nota: Clientes são criados implicitamente via `POST /service-records` (busca ou cria pelo telefone). Não existe endpoint de criação direta.

---

#### 5.5 Registros de Atendimento (`/service-records`)

| Método | Path | Descrição | Payload / Parâmetros |
|--------|------|-----------|---------------------|
| POST | `/service-records` | Registra novo atendimento, calcula previsão e cria tarefa de prospecção (FR1, FR2, FR3) | `{ customer_name, phone, service_type_id, service_date, mileage, notes? }` |
| GET | `/service-records/:id` | Detalhe de um atendimento | — |

**Resposta de `POST /service-records`:**
```json
{
  "service_record": { "id": "...", "next_service_date": "2026-09-14", ... },
  "customer": { "id": "...", "name": "...", "phone": "..." },
  "task": { "id": "...", "scheduled_date": "2026-08-30", ... }
}
```

**Lógica de cálculo (executada no servidor em `lib/forecast.ts`):**
```
next_service_date = min(
  service_date + interval_days,
  data_estimada_da_quilometragem_alvo  // se km médio diário for conhecido — fallback: service_date + interval_days
)
task.scheduled_date = next_service_date - contact_lead_days
```

---

#### 5.6 Tarefas (`/tasks`)

| Método | Path | Descrição | Payload / Parâmetros |
|--------|------|-----------|---------------------|
| GET | `/tasks` | Lista tarefas do consultor autenticado para uma data | `?date=YYYY-MM-DD` (padrão: hoje) |
| GET | `/tasks/:id` | Detalhe de uma tarefa com tentativas de contato | — |
| GET | `/tasks/overdue` | Lista tarefas pendentes de dias anteriores | — |

**Resposta de `GET /tasks?date=2026-06-16`:**
```json
{
  "date": "2026-06-16",
  "pending_count": 7,
  "tasks": [
    {
      "id": "...",
      "customer": { "id": "...", "name": "...", "phone": "..." },
      "service_type": { "name": "Troca de Óleo" },
      "next_service_date": "2026-07-01",
      "attempt_count": 2,
      "status": "pending",
      "scheduled_date": "2026-06-16"
    }
  ]
}
```

---

#### 5.7 Tentativas de Contato (`/contact-attempts`)

| Método | Path | Descrição | Payload / Parâmetros |
|--------|------|-----------|---------------------|
| POST | `/contact-attempts` | Registra resultado de uma tentativa de contato (FR6, FR7, FR8, FR9, FR10) | ver abaixo |

**Payload — Agendamento confirmado (Story 4.1):**
```json
{
  "task_id": "...",
  "outcome": "scheduled",
  "appointment_date": "2026-06-20"
}
```

**Payload — Reagendar (Story 4.2):**
```json
{
  "task_id": "...",
  "outcome": "rescheduled",
  "rescheduled_date": "2026-06-23"
}
```

**Payload — Desistência (Story 4.3):**
```json
{
  "task_id": "...",
  "outcome": "abandoned",
  "abandonment_reason_id": "...",
  "abandonment_notes": "Cliente pediu para não ligar mais"  // obrigatório se reason = "Outros"
}
```

**Efeitos colaterais (executados em transação):**
- `scheduled`: atualiza `tasks.status = 'completed_scheduled'`, preenche `tasks.appointment_date`
- `rescheduled`: atualiza `tasks.status = 'completed_rescheduled'`, cria nova tarefa com `scheduled_date = rescheduled_date`, incrementa `attempt_count` na nova tarefa
- `abandoned`: atualiza `tasks.status = 'abandoned'`

---

#### 5.8 Motivos de Desistência (`/abandonment-reasons`)

| Método | Path | Descrição | Payload / Parâmetros | Acesso |
|--------|------|-----------|---------------------|--------|
| GET | `/abandonment-reasons` | Lista motivos ativos | `?include_inactive=true` | todos |
| POST | `/abandonment-reasons` | Cria novo motivo | `{ label }` | manager |
| PATCH | `/abandonment-reasons/:id` | Atualiza label ou ativa/desativa | `{ label?, is_active?, sort_order? }` | manager |

---

#### 5.9 Healthcheck

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Retorna status do servidor e conectividade com o banco (Story 1.1 AC2) |

**Resposta:**
```json
{ "status": "ok", "db": "connected", "timestamp": "2026-06-16T12:00:00Z" }
```

---

## 6. Decisões Arquiteturais Relevantes

### 6.1 Monolito modular em vez de microserviços

**Decisão:** Uma única aplicação Fastify com módulos internos por domínio.

**Trade-off:** Microserviços dariam maior independência de deploy por domínio, mas exigiriam orquestração (Kubernetes, service mesh), comunicação inter-serviços e overhead operacional incompatível com a restrição de equipe pequena e prazo de 10 semanas.

**Motivo:** O PRD declara explicitamente "Sem necessidade de microserviços na fase MVP". O monolito modular preserva a separação de responsabilidades interna (cada módulo tem routes/service/schema) sem complexidade de deploy distribuído. A estrutura de pastas permite extrair um módulo para microserviço futuramente se houver necessidade de escalonamento independente.

---

### 6.2 Pnpm Workspaces (monorepo simples sem Turborepo)

**Decisão:** Monorepo com pnpm workspaces nativo, sem Turborepo ou Nx.

**Trade-off:** Turborepo oferece cache de build e pipeline declarativo, mas adiciona uma camada de configuração e curva de aprendizado.

**Motivo:** Para um projeto com dois apps e um pacote compartilhado, o overhead de configurar Turborepo supera os ganhos. Pnpm workspaces nativos são suficientes para o MVP. A transição para Turborepo pode ser feita depois do MVP sem refatoração estrutural.

---

### 6.3 Cálculo de previsão server-side, nunca client-side

**Decisão:** A lógica de cálculo de `next_service_date` e `task.scheduled_date` fica exclusivamente em `apps/api/src/lib/forecast.ts`.

**Trade-off:** O frontend poderia calcular a previsão e exibi-la antes de salvar (feedback imediato). Mas calcular client-side e server-side criaria dois locais para manter a lógica.

**Motivo:** A previsão é uma regra de negócio crítica (FR2). Um único local de cálculo elimina divergências. O PRD (NFR5) aceita conexão 3G; o round-trip para exibir a previsão calculada pelo servidor após submissão do formulário é aceitável. Se feedback imediato for necessário no futuro, pode-se adicionar um endpoint `POST /service-records/preview` sem alterar a lógica principal.

---

### 6.4 `attempt_count` desnormalizado em `tasks`

**Decisão:** Manter `attempt_count` como contador na tabela `tasks`, incrementado a cada nova tentativa.

**Trade-off:** `COUNT(*) FROM contact_attempts WHERE task_id = ?` seria mais "correto" em termos de normalização, mas executaria uma subquery extra em cada linha da lista de tarefas do dia.

**Motivo:** A lista de tarefas pode ter até 100 itens (NFR2). Uma subquery por linha resultaria em 100 queries adicionais ou uma query com GROUP BY que complexifica o índice. O contador desnormalizado é atualizado em transação junto com a inserção da tentativa, garantindo consistência.

---

### 6.5 Busca ou criação de cliente pelo telefone no registro de atendimento

**Decisão:** O endpoint `POST /service-records` recebe `customer_name` e `phone`. O servidor busca cliente por telefone; se existir, reutiliza; se não, cria.

**Trade-off:** Um endpoint separado de cadastro de cliente seria mais RESTful, mas exigiria dois requests do frontend e uma tela de "buscar cliente" antes do formulário de atendimento.

**Motivo:** O consultor está no balcão com o cliente à frente (PRD, seção 3). Reduzir passos é prioritário (NFR3 — máximo 3 cliques). O padrão "find or create" no backend simplifica o fluxo sem sacrificar integridade dos dados.

---

### 6.6 SQLite em desenvolvimento, PostgreSQL em produção

**Decisão:** Drizzle ORM com adaptador dual (libsql para dev, postgres para prod), controlado por variável de ambiente `DATABASE_URL`.

**Trade-off:** Diferenças sutis entre SQLite e PostgreSQL (ex.: tipos de coluna, comportamento de timestamps) podem causar bugs que só aparecem em produção.

**Mitigação:** Os testes de integração do CI rodam contra PostgreSQL (Docker Compose), garantindo que a suite de testes valide o banco de produção. SQLite é apenas para conveniência de setup local sem Docker.

---

### 6.7 PWA em vez de app nativo

**Decisão:** Web responsivo com manifest PWA (add-to-homescreen, offline básico via Service Worker).

**Trade-off:** App nativo (React Native) teria acesso a discagem telefônica nativa e notificações push, mas exigiria manutenção de duas codebases (iOS/Android) e aprovação nas lojas.

**Motivo:** O PRD declara explicitamente "PWA é suficiente para uso mobile". O telefone do cliente já aparece na lista de tarefas como link `tel:` (Story 3.1 AC2), que aciona a discagem nativa no mobile via browser. O MVP não requer notificações push.

---

### 6.8 shadcn/ui + Tailwind CSS em vez de biblioteca de componentes completa (MUI, Chakra)

**Decisão:** Tailwind para estilização utilitária + shadcn/ui para componentes acessíveis.

**Trade-off:** MUI ou Chakra UI entregam mais componentes prontos, mas impõem um design system visual forte (Material Design ou Chakra tokens) difícil de personalizar para a identidade visual de oficina de motos.

**Motivo:** shadcn/ui copia os componentes para o projeto — sem lock-in de versão, sem bundle de componentes não usados. Tailwind permite customização total do tema (cores de oficina: laranja/cinza/azul mecânico, conforme branding do PRD) sem sobrescrever estilos de biblioteca. WCAG AA é atendido pelos componentes Radix UI que fundamentam o shadcn/ui.

---

**Documento gerado por:** Aria — AIOX Architect Agent
**Baseado em:** PRD ProspectMoto v1.0.0
