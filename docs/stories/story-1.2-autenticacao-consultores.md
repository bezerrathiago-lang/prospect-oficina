# Story 1.2: Autenticação de Consultores

## Status
InReview

## Story
Como consultor,
eu quero fazer login com e-mail e senha,
para que apenas usuários autorizados acessem o sistema.

## Acceptance Criteria
- [x] Tela de login (`apps/web/src/pages/LoginPage.tsx`) com campos de e-mail e senha renderizando corretamente em mobile (375px) e desktop (1440px)
- [x] Endpoint `POST /api/v1/auth/login` valida credenciais contra a tabela `users` do banco, comparando senha com hash bcrypt (custo 12) armazenado em `password_hash`
- [x] Login bem-sucedido retorna `{ accessToken, user }` no body e seta cookie `refreshToken` com flags `httpOnly; Secure; SameSite=Strict; Max-Age=604800` (7 dias)
- [x] Access token JWT tem TTL de 15 minutos e payload contendo `{ sub, name, role, iat, exp }` conforme especificado na seção 4 do `architecture.md`
- [x] Login com credenciais inválidas retorna HTTP 401 com mensagem de erro clara na tela, sem revelar se o e-mail ou a senha estão errados
- [x] Sessão persiste entre recarregamentos de página: access token armazenado em `localStorage` via Zustand `authStore` (`apps/web/src/store/authStore.ts`)
- [x] Endpoint `POST /api/v1/auth/logout` invalida o refresh token no banco (preenche `revoked_at` na tabela `refresh_tokens`), limpa o cookie e o frontend limpa `localStorage` e store
- [x] Botão de logout visível na interface encerra a sessão e redireciona para `/login`
- [x] Tabela `users` no banco contém ao menos 1 usuário seed com role `consultant` e 1 com role `manager` para testes
- [x] Endpoint `GET /api/v1/auth/me` retorna dados do usuário autenticado (requer access token válido no header `Authorization: Bearer`)

## Technical Notes
- Estratégia de autenticação: JWT stateless (access token) + refresh token opaco em cookie httpOnly (referência: seção 4 do `architecture.md`)
- Tabelas envolvidas: `users` (credenciais, role) e `refresh_tokens` (hash SHA-256 do token opaco, `expires_at`, `revoked_at`)
- Plugin de autenticação Fastify: `apps/api/src/plugins/auth.ts` usando `@fastify/jwt` e `@fastify/cookie`
- Módulo de rotas: `apps/api/src/modules/auth/auth.routes.ts`, `auth.service.ts`, `auth.schema.ts`
- Utilitário de hash: `apps/api/src/lib/hash.ts` para funções bcrypt
- Store de autenticação frontend: `apps/web/src/store/authStore.ts` — campos `user`, `token`, métodos `login()`, `logout()`
- Interceptor HTTP no frontend (`apps/web/src/services/api.ts`) deve detectar HTTP 401 e acionar `POST /auth/refresh` automaticamente antes de repetir a requisição
- Endpoint `POST /api/v1/auth/refresh` recebe refresh token via cookie (sem body), valida no banco e retorna novo access token
- Depende de: Story 1.1 (estrutura base e banco de dados)
- Zod v4 instalado — API diferente do v3: `required_error` → `error`, `ZodError.errors` → `ZodError.issues`
- Flag `Secure` no cookie é condicional: ativa apenas quando `NODE_ENV=production` (HTTP local dev não suporta cookies Secure)

## File List

### Criados
- `apps/api/src/lib/hash.ts` — hashPassword (bcrypt custo 12), verifyPassword, hashToken (SHA-256)
- `apps/api/src/plugins/auth.ts` — plugin JWT + cookie, decorators authenticate e requireRole
- `apps/api/src/modules/auth/auth.schema.ts` — Zod schemas: LoginBodySchema, LoginResponseSchema, MeResponseSchema
- `apps/api/src/modules/auth/auth.service.ts` — funções login, logout, refresh
- `apps/api/src/modules/auth/auth.routes.ts` — rotas POST /login, POST /logout, POST /refresh, GET /me
- `apps/api/src/db/seeds.ts` — seed de usuários de desenvolvimento (manager + consultor)
- `apps/api/src/db/migrations/0001_lucky_reptil.sql` — migration: adiciona coluna revoked_at à tabela refresh_tokens
- `apps/web/src/services/api.ts` — cliente axios com interceptors de Bearer token e refresh automático
- `apps/web/src/store/authStore.ts` — Zustand store com persistência em localStorage
- `apps/web/src/pages/LoginPage.tsx` — tela de login responsiva com Tailwind
- `apps/web/src/components/layout/ProtectedRoute.tsx` — guard de rotas autenticadas
- `apps/web/.env` — VITE_API_URL para desenvolvimento local

### Modificados
- `apps/api/src/db/schema.ts` — adicionada coluna `revokedAt` na tabela `refresh_tokens`
- `apps/api/src/config.ts` — adicionada variável `jwtSecret` (lê JWT_SECRET do env)
- `apps/api/src/app.ts` — registra authPlugin e authRoutes em `/api/v1/auth`
- `apps/api/package.json` — adicionados deps @fastify/jwt, @fastify/cookie, bcrypt, fastify-plugin, zod; script db:seed
- `apps/web/package.json` — adicionados deps axios, react-router-dom, zustand
- `apps/web/tsconfig.json` — adicionado `types: ["vite/client"]` para import.meta.env
- `apps/web/src/App.tsx` — reescrito com BrowserRouter, ProtectedRoute, HomePage com botão logout
- `.env.example` — documentadas VITE_API_URL e aviso sobre credenciais de seed em produção

## Change Log

| Data | Status (de → para) | Agente | Observação |
|------|--------------------|--------|------------|
| 2026-06-16 | Draft → InProgress | Dex (AIOX Developer) | Início da implementação da Story 1.2 |
| 2026-06-16 | InProgress → InReview | Dex (AIOX Developer) | Implementação completa — backend auth + frontend login/logout |
