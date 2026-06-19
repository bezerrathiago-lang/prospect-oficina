# Story 1.1: Setup do Projeto e Estrutura Base

## Status
InReview

## Story
Como desenvolvedor,
eu quero ter o repositório configurado com frontend, backend e banco de dados funcionando localmente,
para que o desenvolvimento possa começar com base estável.

## Acceptance Criteria
- [x] Repositório criado com estrutura de monorepo usando `pnpm workspaces`, contendo os pacotes `apps/api`, `apps/web` e `packages/shared`, conforme a estrutura de pastas definida na arquitetura
- [x] Backend Fastify iniciando na porta configurada por variável de ambiente e respondendo `{ "status": "ok", "db": "connected", "timestamp": "..." }` no endpoint `GET /health`
- [x] Banco de dados SQLite (via libsql para desenvolvimento local) conectado, com Drizzle ORM configurado e comando de migration (`pnpm db:migrate`) executando sem erros
- [x] Schema inicial do banco criado via migration, contemplando ao menos as tabelas `users` e `refresh_tokens` definidas no `architecture.md`
- [x] Frontend React + Vite iniciando sem erros (`pnpm dev` em `apps/web`), renderizando página inicial sem tela em branco
- [x] Arquivo `tsconfig.base.json` na raiz compartilhando configuração TypeScript entre `apps/api`, `apps/web` e `packages/shared`
- [x] Arquivo `.env.example` na raiz documentando todas as variáveis de ambiente necessárias (`DATABASE_URL`, `JWT_SECRET`, `PORT`, etc.) sem valores reais
- [x] `README.md` na raiz com instruções claras de instalação (`pnpm install`) e execução local (`pnpm dev`)

## Technical Notes
- Stack: Node.js 20 LTS + Fastify 4.x no backend; React 18 + Vite 5.x no frontend; TypeScript 5.x em ambos os lados
- Gerenciador de pacotes: pnpm 9.x com `pnpm-workspace.yaml` declarando `apps/*` e `packages/*`
- ORM: Drizzle ORM 0.30+ com adaptador dual — libsql para desenvolvimento local, postgres para produção (controlado por `DATABASE_URL`)
- O endpoint `GET /health` deve verificar conectividade com o banco além de retornar status do servidor (referência: seção 5.9 do `architecture.md`)
- Entry point do backend: `apps/api/src/main.ts` (inicia o servidor) e `apps/api/src/app.ts` (factory que registra plugins e rotas)
- Entry point do frontend: `apps/web/src/main.tsx` e `apps/web/index.html`
- Schema Drizzle fica em `apps/api/src/db/schema.ts`; migrations geradas em `apps/api/src/db/migrations/`
- Pacote `packages/shared` deve ter barrel export em `src/index.ts` para tipos compartilhados entre API e Web
- Esta story não inclui autenticação — apenas estrutura base funcional

## File List

### Raiz do monorepo
- `package.json` — root package com scripts `dev`, `build`, `db:migrate`
- `pnpm-workspace.yaml` — declara workspaces `apps/*` e `packages/*`
- `tsconfig.base.json` — configuração TypeScript base compartilhada
- `.env.example` — variáveis de ambiente documentadas (seção ProspectMoto adicionada)
- `README.md` — instruções de instalação e execução local

### apps/api
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/drizzle.config.ts`
- `apps/api/.env` — arquivo local (não commitado)
- `apps/api/src/main.ts` — entry point do servidor Fastify
- `apps/api/src/app.ts` — factory de plugins e rotas (inclui `GET /health`)
- `apps/api/src/config.ts` — leitura e validação de variáveis de ambiente
- `apps/api/src/db/index.ts` — singleton do cliente Drizzle
- `apps/api/src/db/schema.ts` — schema Drizzle: tabelas `users` e `refresh_tokens`
- `apps/api/src/db/migrate.ts` — runner de migrations (tsx)
- `apps/api/src/db/migrations/0000_goofy_blonde_phantom.sql` — migration inicial gerada
- `apps/api/src/plugins/cors.ts` — documentação do plugin CORS
- `apps/api/dev.db` — banco SQLite local gerado após `db:migrate` (não commitado)

### apps/web
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/tailwind.config.js`
- `apps/web/postcss.config.js`
- `apps/web/index.html`
- `apps/web/src/main.tsx` — entry point React
- `apps/web/src/App.tsx` — componente raiz com página inicial
- `apps/web/src/index.css` — diretivas Tailwind CSS

### packages/shared
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts` — barrel export
- `packages/shared/src/types/health.ts` — tipo `HealthResponse`
- `packages/shared/src/types/user.ts` — tipos `User` e `UserRole`

## Change Log

| Data | Versão | Status Anterior | Status Novo | Descrição | Autor |
|------|--------|-----------------|-------------|-----------|-------|
| 2026-06-16 | — | Draft | InProgress | Início da implementação da Story 1.1 | Dex (AIOX Developer) |
| 2026-06-16 | — | InProgress | InReview | Implementação completa: monorepo pnpm, Fastify + /health, Drizzle migrations, React + Vite + Tailwind, shared types | Dex (AIOX Developer) |
