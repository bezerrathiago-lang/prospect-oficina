# ProspectMoto

Sistema de Gestão de Prospecção de Clientes para Oficina de Motos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js 20 + Fastify 4 + TypeScript 5 |
| Frontend | React 18 + Vite 5 + TypeScript 5 + Tailwind CSS |
| ORM | Drizzle ORM (libsql/SQLite em dev, PostgreSQL em prod) |
| Monorepo | pnpm workspaces |

## Pré-requisitos

- **Node.js** 20 LTS ou superior
- **pnpm** 9.x — instale com: `npm install -g pnpm@9`

## Instalação

```bash
# 1. Clone o repositório e entre na pasta
cd Prospect_Oficina

# 2. Configure as variáveis de ambiente
# Edite .env e preencha os valores (DATABASE_URL, JWT_SECRET, etc.)

# 3. Instale todas as dependências do monorepo
pnpm install
```

## Configuração do Banco de Dados

```bash
# Gera os arquivos SQL de migration a partir do schema Drizzle
pnpm --filter api db:generate

# Executa as migrations no banco (cria as tabelas)
pnpm db:migrate
```

## Execução Local

```bash
# Inicia API (porta 3000) e Web (porta 5173) em paralelo
pnpm dev

# Ou individualmente:
pnpm --filter api dev     # Apenas o backend
pnpm --filter web dev     # Apenas o frontend
```

## Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `http://localhost:3000/health` | Healthcheck — status da API e do banco |

## Estrutura do Monorepo

```
Prospect_Oficina/
├── apps/
│   ├── api/       # Backend Fastify
│   └── web/       # Frontend React + Vite
├── packages/
│   └── shared/    # Tipos TypeScript compartilhados
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── README.md
```

## Build para Produção

```bash
pnpm build
```
