# ProspectMoto — Documento de UX/UI Design

**Produto:** ProspectMoto — Sistema de Gestão de Prospecção de Clientes para Oficina de Motos
**Versão:** 1.0.0
**Autora:** Uma (AIOX UX Design Expert)
**Data:** 2026-06-16
**Baseado em:** PRD v1.0.0

---

## Índice

1. [Princípios de Design](#1-princípios-de-design)
2. [Fluxo de Navegação](#2-fluxo-de-navegação)
3. [Wireframes das 5 Telas Core](#3-wireframes-das-5-telas-core)
4. [Especificações de Interação](#4-especificações-de-interação)
5. [Design Tokens Sugeridos](#5-design-tokens-sugeridos)
6. [Considerações Mobile-First](#6-considerações-mobile-first)

---

## 1. Princípios de Design

### P1 — Operacional Antes de Bonito

O consultor está no balcão com clientes à frente. Cada elemento da interface deve justificar sua presença com utilidade direta. Decoração que não informa ou não guia a ação deve ser eliminada. Hierarquia visual serve ao fluxo de trabalho, não à estética.

### P2 — Três Toques, Resultado Registrado

O caminho crítico — da lista de tarefas ao registro do resultado de um contato — deve ser completado em no máximo 3 interações:

1. Toque na tarefa
2. Seleção do resultado
3. Confirmação

Qualquer desvio desse caminho (reagendar, desistir) pode ter passos adicionais, mas o fluxo principal deve permanecer no limite de 3.

### P3 — Estado Visível, Nunca Implícito

O consultor deve saber, sem precisar pensar, em qual etapa do fluxo está e qual é a próxima ação esperada. Contadores, indicadores de progresso, badges de status e feedback imediato após cada ação são obrigatórios. O sistema nunca deve deixar o usuário em dúvida sobre se sua ação foi registrada.

### P4 — Erros São Raros, Mas Devem Ser Claramente Comunicados

Validações acontecem em linha, próximas ao campo com erro, com linguagem direta em português ("Telefone inválido — use o formato (11) 99999-9999"). Nunca bloquear com modal de erro genérico. Erros de conexão devem oferecer alternativa clara (retentar).

### P5 — Ações Destrutivas Exigem Confirmação Explícita

Desistir de uma prospecção é irreversível. O fluxo deve colocar fricção intencional: seleção obrigatória de motivo + botão de confirmação com label inequívoco ("Confirmar Desistência"). Botões de ação primária (confirmar agendamento) e ação destrutiva (desistir) nunca devem ser adjacentes sem separação visual clara.

### P6 — Mobile É o Ambiente Principal

A tela principal é um smartphone na mão do consultor. Touch targets mínimos de 44x44 px. Nenhuma informação crítica deve exigir scroll horizontal. Telefone do cliente deve ser link `tel:` nativo. Formulários devem usar o teclado correto para cada campo (numérico para quilometragem, telefone para contato, datepicker nativo para datas).

### P7 — Consistência Reduz Carga Cognitiva

Ações primárias sempre na mesma posição (botão principal no rodapé fixo). Cores com significado fixo: vermelho = marca/ação primária (identidade Cirne Motos), verde = sucesso/concluído, âmbar = alerta, cinza = inativo/secundário. Ações destrutivas (desistência) também usam vermelho, porém sempre acompanhadas de aviso âmbar e confirmação explícita para diferenciá-las das ações primárias.

---

## 2. Fluxo de Navegação

### Mapa Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         TELA DE LOGIN                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Login bem-sucedido
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              LISTA DE TAREFAS DO DIA  [Tela 1]                  │
│              [Tela inicial após autenticação]                   │
└───────┬─────────────────────┬──────────────────────┬────────────┘
        │                     │                      │
        │ Tap no nome         │ Tap em "+ Novo       │ Tab/Menu
        │ do cliente          │  Atendimento"        │ Configurações
        ▼                     ▼                      ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────────────┐
│ HISTÓRICO DO  │    │  NOVO          │    │   CONFIGURAÇÕES      │
│ CLIENTE       │    │  ATENDIMENTO   │    │   [Tela 5]           │
│ [Tela 4]      │    │  [Tela 2]      │    │                      │
└───────┬───────┘    └────────┬───────┘    │  ┌─────────────────┐ │
        │                     │            │  │ Tipos de Serviço│ │
        │ Botão Voltar         │ Submissão  │  └─────────────────┘ │
        │                     │ com sucesso│  ┌─────────────────┐ │
        └──────────┐          │            │  │ Motivos Desist. │ │
                   │          ▼            │  └─────────────────┘ │
                   │    ┌─────────────┐   └──────────────────────┘
                   │    │ Confirmação │
                   │    │ de Previsão │
                   │    │ (toast/card)│
                   │    └─────────────┘
                   │
                   │ Tap em "Registrar Resultado" (a partir da lista)
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              RESULTADO DE CONTATO  [Tela 3]                     │
└──────────────┬─────────────────────────┬───────────────────────┘
               │                         │
               │ "Agendamento            │ "Não conseguiu agendar"
               │  Confirmado"            │
               ▼                         ▼
┌──────────────────────┐     ┌───────────────────────────────────┐
│ Campo: Data do       │     │  Escolha sub-fluxo:               │
│ Agendamento          │     │  [Reagendar] ou [Desistir]        │
│ → Confirmar          │     └──────────┬──────────────┬─────────┘
│ → Tarefa encerrada   │               │              │
│ → Volta para lista   │               ▼              ▼
└──────────────────────┘  ┌────────────────┐  ┌──────────────────┐
                          │ Campo: Nova    │  │ Seleção de       │
                          │ Data de        │  │ Motivo           │
                          │ Contato        │  │ + Confirmação    │
                          │ → Confirmar    │  │ → Desistência    │
                          │ → Nova tarefa  │  │   encerrada      │
                          │   criada       │  │ → Volta p/ lista │
                          │ → Volta p/lista│  └──────────────────┘
                          └────────────────┘
```

### Navegação Principal (Bottom Tab Bar — Mobile)

```
┌─────────────────────────────────────────────┐
│  [Hoje]    [+ Novo]    [Histórico]   [Menu] │
│    ●                                        │
└─────────────────────────────────────────────┘
```

- **Hoje:** Lista de Tarefas do Dia (tab padrão)
- **+ Novo:** Formulário de Novo Atendimento
- **Histórico:** Busca de clientes (acesso alternativo ao histórico)
- **Menu:** Configurações, Sair

---

## 3. Wireframes das 5 Telas Core

### Tela 1 — Lista de Tarefas do Dia

```
┌─────────────────────────────────────────┐  375px
│ ← Seg, 16 jun 2026              Hoje → │  Header com nav de data
│─────────────────────────────────────────│
│  📋  8 contatos pendentes               │  Contador de tarefas
│─────────────────────────────────────────│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ● CARLOS FERREIRA          3 tent. ││  Badge vermelho: 3+ tentativas
│  │   (11) 98765-4321   📞             ││  Ícone tel: link nativo
│  │   Troca de Óleo · Previsto 20 jun  ││
│  │                [Registrar Resultado]││  Botão CTA principal
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ● MARCOS SOUZA             2 tent. ││
│  │   (11) 91234-5678   📞             ││
│  │   Revisão Completa · Previsto 22 jun││
│  │                [Registrar Resultado]││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ● ANA PAULA LIMA            1 tent. ││
│  │   (11) 94567-8901   📞             ││
│  │   Calibração · Previsto 25 jun     ││
│  │                [Registrar Resultado]││
│  └─────────────────────────────────────┘│
│                                         │
│  ── Concluídas hoje (2) ──────────────  │  Seção colapsável
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ✓ JOÃO PEDRO ALVES         Agendado││  Visual: texto riscado, fundo verde claro
│  │   Agendamento: 25 jun 2026         ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ✓ BRUNA SANTOS         Reagendada  ││  Visual: fundo cinza
│  │   Próximo contato: 19 jun          ││
│  └─────────────────────────────────────┘│
│                                         │
│─────────────────────────────────────────│
│  [Hoje]   [+ Novo]  [Histórico] [Menu] │  Bottom Tab Bar
└─────────────────────────────────────────┘
```

**Notas estruturais:**
- Cards ordenados por número de tentativas (maior primeiro = mais urgente)
- Tarefas atrasadas (dias anteriores não concluídas) aparecem no topo com badge vermelho "ATRASADA"
- Telefone é link `tel:` — tap abre discagem nativa
- Seção "Concluídas" colapsada por padrão para não poluir a lista principal
- Estado vazio: ilustração simples + "Nenhum contato para hoje. Bom descanso!" com botão "+ Novo Atendimento"

---

### Tela 2 — Formulário de Novo Atendimento

```
┌─────────────────────────────────────────┐
│ ←  Novo Atendimento                     │  Header com voltar
│─────────────────────────────────────────│
│                                         │
│  Dados do Cliente                       │  Seção label
│  ┌─────────────────────────────────────┐│
│  │ Nome do cliente *                   ││
│  │ ┌───────────────────────────────┐  ││
│  │ │ Ex.: Carlos Ferreira          │  ││
│  │ └───────────────────────────────┘  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Telefone *                          ││
│  │ ┌───────────────────────────────┐  ││
│  │ │ (11) 99999-9999               │  ││  Teclado telefone
│  │ └───────────────────────────────┘  ││
│  └─────────────────────────────────────┘│
│                                         │
│  Dados do Serviço                       │  Seção label
│  ┌─────────────────────────────────────┐│
│  │ Tipo de Serviço *                   ││
│  │ ┌───────────────────────────────┐  ││
│  │ │ Selecione o serviço       ▼  │  ││  Dropdown nativo
│  │ └───────────────────────────────┘  ││
│  │                                     ││
│  │ ℹ Próximo em ~90 dias ou 3.000 km  ││  Aparece ao selecionar serviço
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Data do Serviço *                   ││
│  │ ┌───────────────────────────────┐  ││
│  │ │ 16/06/2026              📅   │  ││  Date picker, padrão = hoje
│  │ └───────────────────────────────┘  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Quilometragem Atual *               ││
│  │ ┌───────────────────────────────┐  ││
│  │ │ 12.500 km                     │  ││  Teclado numérico
│  │ └───────────────────────────────┘  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Previsão do próximo serviço:        ││  Card de preview (calculado em tempo real)
│  │ 📅  14 de setembro de 2026          ││
│  │ (90 dias ou quando atingir 15.500km)││
│  └─────────────────────────────────────┘│
│                                         │
│─────────────────────────────────────────│
│          [Salvar Atendimento]           │  Botão fixo no rodapé, vermelho
└─────────────────────────────────────────┘
```

**Notas estruturais:**
- Preview de previsão atualiza em tempo real conforme campos são preenchidos
- Campo quilometragem usa separador de milhar automático (12.500, não 12500)
- Ao salvar com sucesso: toast no topo "Atendimento salvo! Prospecção agendada para 30 ago 2026" + retorno para Lista de Tarefas
- Validação inline: erro aparece abaixo do campo imediatamente ao perder foco (blur)

---

### Tela 3 — Resultado de Contato

#### 3a — Tela Principal de Resultado

```
┌─────────────────────────────────────────┐
│ ←  Resultado do Contato                 │
│─────────────────────────────────────────│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Carlos Ferreira                     ││  Card de contexto
│  │ (11) 98765-4321                     ││
│  │ Troca de Óleo · Previsto 20 jun     ││
│  │ 3ª tentativa                        ││  Badge destacado
│  └─────────────────────────────────────┘│
│                                         │
│  O que aconteceu na ligação?            │  Label de ação principal
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ✅  Agendamento Confirmado          ││  Botão grande, borda verde
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ❌  Não consegui agendar            ││  Botão grande, borda cinza
│  └─────────────────────────────────────┘│
│                                         │
│─────────────────────────────────────────│
│  [Hoje]   [+ Novo]  [Histórico] [Menu] │
└─────────────────────────────────────────┘
```

#### 3b — Sub-fluxo: Agendamento Confirmado

```
┌─────────────────────────────────────────┐
│ ←  Agendamento Confirmado               │
│─────────────────────────────────────────│
│                                         │
│  Carlos Ferreira — Troca de Óleo        │
│                                         │
│  Data do agendamento *                  │
│  ┌───────────────────────────────────┐  │
│  │ 20/06/2026                   📅  │  │  Date picker
│  └───────────────────────────────────┘  │
│                                         │
│                                         │
│─────────────────────────────────────────│
│         [Confirmar Agendamento]         │  Botão verde, fixo no rodapé
└─────────────────────────────────────────┘
```

Após confirmação: toast verde "Agendamento registrado para 20 jun!" + animação de check na tarefa + tarefa move para seção "Concluídas".

#### 3c — Sub-fluxo: Não Conseguiu Agendar

```
┌─────────────────────────────────────────┐
│ ←  Não Conseguiu Agendar               │
│─────────────────────────────────────────│
│                                         │
│  Carlos Ferreira — 3ª tentativa         │
│                                         │
│  O que deseja fazer?                    │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📅  Reagendar contato               ││  Botão vermelho/primário
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🚫  Desistir desta prospecção       ││  Botão cinza/secundário
│  └─────────────────────────────────────┘│
│                                         │
│─────────────────────────────────────────│
│  [Hoje]   [+ Novo]  [Histórico] [Menu] │
└─────────────────────────────────────────┘
```

#### 3d — Sub-fluxo: Reagendar Contato

```
┌─────────────────────────────────────────┐
│ ←  Reagendar Contato                    │
│─────────────────────────────────────────│
│                                         │
│  Carlos Ferreira — Troca de Óleo        │
│                                         │
│  Nova data para ligar *                 │
│  ┌───────────────────────────────────┐  │
│  │ 19/06/2026                   📅  │  │  Date picker, mín = amanhã
│  └───────────────────────────────────┘  │
│                                         │
│  ℹ Tentativa atual será registrada      │
│    como "sem contato"                   │
│                                         │
│─────────────────────────────────────────│
│         [Confirmar Reagendamento]       │  Botão vermelho, fixo no rodapé
└─────────────────────────────────────────┘
```

#### 3e — Sub-fluxo: Desistência com Motivo

```
┌─────────────────────────────────────────┐
│ ←  Encerrar Prospecção                  │
│─────────────────────────────────────────│
│                                         │
│  Carlos Ferreira — Troca de Óleo        │
│  ⚠ Esta ação encerrará definitivamente  │  Aviso visual, cor âmbar
│    a prospecção deste cliente           │
│                                         │
│  Motivo da desistência *                │
│                                         │
│  ○  Cliente sem interesse               │
│  ○  Telefone inválido ou não atende     │
│  ○  Cliente foi para outra oficina      │
│  ○  Muitas tentativas sem retorno       │
│  ○  Cliente solicitou não ser contatado │
│  ○  Outros                             │
│                                         │
│  [Especifique o motivo]  ← aparece      │  Campo texto, aparece só se "Outros"
│  somente ao selecionar "Outros"         │  selecionado
│                                         │
│─────────────────────────────────────────│
│         [Confirmar Desistência]         │  Botão vermelho, habilitado só após
│                                         │  seleção de motivo
└─────────────────────────────────────────┘
```

---

### Tela 4 — Histórico do Cliente

```
┌─────────────────────────────────────────┐
│ ←  Histórico do Cliente                 │
│─────────────────────────────────────────│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Carlos Ferreira                     ││  Card de dados do cliente
│  │ (11) 98765-4321  📞                 ││
│  │ Status: Prospecção Ativa — 3 tent.  ││  Badge de status
│  └─────────────────────────────────────┘│
│                                         │
│  Serviços e Prospecções                 │  Label da seção
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Troca de Óleo                       ││  Card do serviço mais recente
│  │ Realizado em: 01/06/2026            ││
│  │ Quilometragem: 12.500 km            ││
│  │ Previsão próximo: 20/06/2026        ││
│  │                                     ││
│  │ Tentativas de prospecção:           ││
│  │  • 03/06  —  Sem contato (Reagend.) ││  Lista de tentativas
│  │  • 10/06  —  Sem contato (Reagend.) ││
│  │  • 16/06  —  Em andamento          ││  Status atual
│  └─────────────────────────────────────┘│
│                                         │
│  ─────────────────────────────────────  │  Separador entre serviços
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Revisão Completa                    ││  Serviço anterior (colapsado)
│  │ Realizado em: 15/01/2026       ▶   ││  Seta para expandir
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Troca de Óleo                       ││
│  │ Realizado em: 10/10/2025       ▶   ││
│  └─────────────────────────────────────┘│
│                                         │
│─────────────────────────────────────────│
│  [Hoje]   [+ Novo]  [Histórico] [Menu] │
└─────────────────────────────────────────┘
```

**Notas estruturais:**
- Serviço mais recente aparece expandido; anteriores colapsados (tap para expandir)
- Status da prospecção usa badge colorido: Ativa (vermelho), Agendada (verde), Encerrada (cinza), Desistência (vermelho)
- Acesso via: tap no nome do cliente na lista de tarefas

---

### Tela 5 — Configurações

```
┌─────────────────────────────────────────┐
│ ≡  Configurações                        │
│─────────────────────────────────────────│
│                                         │
│  Tipos de Serviço                       │  Seção 1
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Troca de Óleo                 [Editar]│  Row com ação
│  │ 90 dias · 3.000 km                  ││
│  │ ● Ativo                             ││  Badge de status
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Revisão Completa              [Editar]│
│  │ 180 dias · 6.000 km                 ││
│  │ ● Ativo                             ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Calibração e Pneus            [Editar]│
│  │ 60 dias · 2.000 km                  ││
│  │ ● Ativo                             ││
│  └─────────────────────────────────────┘│
│                                         │
│  [+ Adicionar Tipo de Serviço]          │  Botão secundário
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Motivos de Desistência                 │  Seção 2
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Cliente sem interesse         [Editar]│
│  │ ● Ativo                             ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Telefone inválido ou não atende [Editar]│
│  │ ● Ativo                             ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Outros — motivos desativados  ▶     ││  Colapsado: mostra inativos
│  └─────────────────────────────────────┘│
│                                         │
│  [+ Adicionar Motivo]                   │  Botão secundário
│                                         │
│─────────────────────────────────────────│
│  [Hoje]   [+ Novo]  [Histórico] [Menu] │
└─────────────────────────────────────────┘
```

#### 5a — Modal de Edição de Tipo de Serviço (bottom sheet)

```
┌─────────────────────────────────────────┐
│▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄│  Handle bar
│                                         │
│  Editar Tipo de Serviço                 │
│                                         │
│  Nome *                                 │
│  ┌───────────────────────────────────┐  │
│  │ Troca de Óleo                     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Intervalo em dias *                    │
│  ┌───────────────────────────────────┐  │
│  │ 90                                │  │  Teclado numérico
│  └───────────────────────────────────┘  │
│                                         │
│  Intervalo em quilômetros *             │
│  ┌───────────────────────────────────┐  │
│  │ 3000                              │  │  Teclado numérico
│  └───────────────────────────────────┘  │
│                                         │
│  Status                                 │
│  [● Ativo] [○ Inativo]                  │  Toggle
│                                         │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │   Cancelar   │  │     Salvar       │ │  Dois botões lado a lado
│  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 4. Especificações de Interação

### 4.1 Lista de Tarefas — Comportamentos

| Elemento | Estado | Comportamento |
|----------|--------|---------------|
| Card de tarefa | Padrão | Fundo branco, borda sutil, sombra leve |
| Card de tarefa | Hover/Press | Fundo cinza-claro (#F5F5F5), escala leve (transform: scale 0.99) |
| Badge de tentativas | 1 tentativa | Cinza neutro |
| Badge de tentativas | 2 tentativas | Âmbar (#F59E0B) |
| Badge de tentativas | 3+ tentativas | Vermelho (#EF4444) |
| Tarefa atrasada | Dias anteriores | Banner âmbar "ATRASADA" no topo do card |
| Tarefa concluída | Agendada | Fundo verde-claro (#F0FDF4), texto verde, ícone check |
| Tarefa concluída | Reagendada | Fundo cinza-claro (#F9FAFB), texto cinza |
| Botão "Registrar Resultado" | Padrão | Vermelho (#DC2626), texto branco, bordas arredondadas 8px |
| Telefone | Tap | Abre discadora nativa (link `tel:`) |
| Navegação de data | Tap anterior/próximo | Slide suave para novo dia, spinner se carregando |
| Estado vazio | Sem tarefas | Ilustração simples (clipboard vazio) + texto amigável |

### 4.2 Formulário de Novo Atendimento — Comportamentos

| Elemento | Estado | Comportamento |
|----------|--------|---------------|
| Campo texto | Vazio | Placeholder cinza-claro |
| Campo texto | Foco | Borda vermelho (#DC2626), label sobe (floating label) |
| Campo texto | Preenchido | Borda cinza-escuro |
| Campo texto | Erro | Borda vermelha + mensagem de erro inline abaixo |
| Dropdown serviço | Após seleção | Exibe card de informação "Próximo em ~X dias ou Y km" |
| Preview previsão | Campos incompletos | Oculto |
| Preview previsão | Campos suficientes | Fade in com data calculada |
| Botão Salvar | Formulário inválido | Desabilitado, opacidade 50% |
| Botão Salvar | Formulário válido | Habilitado, vermelho sólido |
| Botão Salvar | Loading | Spinner inline, texto "Salvando..." |
| Botão Salvar | Sucesso | Toast verde no topo por 3 segundos + redirect |

### 4.3 Tela de Resultado de Contato — Comportamentos

| Elemento | Estado | Comportamento |
|----------|--------|---------------|
| Botão "Agendamento Confirmado" | Padrão | Borda verde, fundo branco, texto verde |
| Botão "Agendamento Confirmado" | Press | Fundo verde-claro |
| Botão "Não consegui agendar" | Padrão | Borda cinza, fundo branco, texto cinza-escuro |
| Botão "Não consegui agendar" | Press | Fundo cinza-claro |
| Transição entre sub-telas | Tap em botão | Slide da direita para a esquerda (navegação progressiva) |
| Botão Voltar | Tap | Slide da esquerda para a direita (retorno) |
| Date picker "reagendar" | Validação | Não permite data anterior a amanhã |
| Radio buttons (motivo) | Seleção | Checkmark vermelho, label em negrito |
| Botão "Confirmar Desistência" | Sem motivo selecionado | Desabilitado, cinza |
| Botão "Confirmar Desistência" | Motivo selecionado | Habilitado, vermelho (#DC2626) |
| Todos confirmações | Loading | Spinner + label "Registrando..." |
| Confirmação bem-sucedida | Após registro | Toast de confirmação + animação na tarefa + retorno à lista |

### 4.4 Histórico do Cliente — Comportamentos

| Elemento | Estado | Comportamento |
|----------|--------|---------------|
| Card de serviço | Padrão (mais recente) | Expandido |
| Card de serviço | Anteriores | Colapsado, tap para expandir com animação |
| Badge de status | Ativa | Fundo vermelho-claro, texto vermelho-escuro |
| Badge de status | Agendada | Fundo verde-claro, texto verde-escuro |
| Badge de status | Encerrada/Desistência | Fundo cinza-claro, texto cinza-escuro |
| Tentativa com desistência | Exibição | Ícone vermelho + motivo em texto |

### 4.5 Configurações — Comportamentos

| Elemento | Estado | Comportamento |
|----------|--------|---------------|
| Row de serviço/motivo | Tap em "Editar" | Abre bottom sheet com formulário de edição |
| Bottom sheet | Abertura | Slide de baixo para cima com backdrop escuro |
| Bottom sheet | Fechar | Swipe down ou tap no backdrop |
| Toggle Ativo/Inativo | Ativo | Verde |
| Toggle Ativo/Inativo | Inativo | Cinza |
| Item inativo | Na lista | Texto cinza, badge "Inativo", não aparece para consultores |
| Botão Salvar no bottom sheet | Loading | Spinner, botão desabilitado |

### 4.6 Validações de Formulário

| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| Nome do cliente | Obrigatório, mín. 3 caracteres | "Nome é obrigatório" / "Nome muito curto" |
| Telefone | Obrigatório, formato (XX) XXXXX-XXXX | "Telefone inválido — use (11) 99999-9999" |
| Tipo de serviço | Obrigatório | "Selecione um tipo de serviço" |
| Data do serviço | Obrigatório, não-futuro | "Data inválida" / "Data não pode ser futura" |
| Quilometragem | Obrigatório, numérico positivo | "Informe a quilometragem" / "Valor inválido" |
| Data de agendamento | Obrigatório | "Informe a data do agendamento" |
| Data de reagendamento | Obrigatório, mín. amanhã | "A nova data deve ser a partir de amanhã" |
| Motivo "Outros" | Obrigatório se "Outros" selecionado | "Descreva o motivo" |
| Intervalo em dias | Numérico positivo | "Informe um número válido de dias" |
| Intervalo em km | Numérico positivo | "Informe um número válido de quilômetros" |

### 4.7 Feedback de Ações Globais

| Ação | Feedback |
|------|----------|
| Salvar atendimento | Toast verde: "Atendimento salvo! Prospecção agendada para [data]" |
| Confirmar agendamento | Toast verde: "Agendamento registrado para [data]!" |
| Confirmar reagendamento | Toast azul: "Novo contato agendado para [data]" |
| Confirmar desistência | Toast cinza: "Prospecção encerrada" |
| Erro de rede | Banner vermelho no topo: "Sem conexão. Tente novamente." com botão "Tentar novamente" |
| Sessão expirada | Redirect para login com mensagem: "Sua sessão expirou. Faça login novamente." |

---

## 5. Design Tokens Sugeridos

### 5.1 Paleta de Cores

```
-- Cores Primárias --
--color-primary-500:    #DC2626  /* Vermelho — ação principal, CTA */
--color-primary-600:    #B91C1C  /* Vermelho escuro — hover/press */
--color-primary-50:     #FEF2F2  /* Vermelho muito claro — fundo informativo */

-- Cores de Status --
--color-success-500:    #22C55E  /* Verde — agendado, confirmado */
--color-success-50:     #F0FDF4  /* Verde claro — fundo de tarefa concluída */
--color-warning-500:    #F59E0B  /* Âmbar — 2 tentativas, atenção */
--color-warning-50:     #FFFBEB  /* Âmbar claro — fundo de aviso */
--color-danger-500:     #EF4444  /* Vermelho — 3+ tentativas, erro, desistência */
--color-danger-600:     #DC2626  /* Vermelho escuro — botão confirmar desistência */
--color-danger-50:      #FEF2F2  /* Vermelho claro — fundo de erro */

-- Neutros --
--color-gray-900:       #111827  /* Texto principal */
--color-gray-700:       #374151  /* Texto secundário */
--color-gray-500:       #6B7280  /* Placeholder, label inativo */
--color-gray-300:       #D1D5DB  /* Borda de input, separadores */
--color-gray-100:       #F3F4F6  /* Fundo de card hover, seções */
--color-gray-50:        #F9FAFB  /* Fundo de página */
--color-white:          #FFFFFF  /* Fundo de cards, modais */

-- Superfícies --
--color-surface-default: #FFFFFF
--color-surface-subtle:  #F9FAFB
--color-surface-overlay: rgba(0, 0, 0, 0.4)  /* Backdrop de bottom sheet */
```

### 5.2 Tipografia

```
-- Família --
--font-family-sans: 'Inter', system-ui, -apple-system, sans-serif
/* Inter: legível em telas pequenas, excelente peso para leitura rápida */

-- Escala de tamanhos --
--font-size-xs:   12px  /* Labels de status, badges secundários */
--font-size-sm:   14px  /* Corpo de texto em cards, labels de campo */
--font-size-base: 16px  /* Corpo padrão — nunca menor em mobile */
--font-size-lg:   18px  /* Nome do cliente na lista, títulos de seção */
--font-size-xl:   20px  /* Título de tela */
--font-size-2xl:  24px  /* Contador de tarefas (destaque) */

-- Pesos --
--font-weight-regular: 400
--font-weight-medium:  500  /* Labels, subtítulos */
--font-weight-semibold: 600  /* Nome do cliente, títulos de card */
--font-weight-bold:    700  /* Contadores, destaque crítico */

-- Altura de linha --
--line-height-tight:   1.25  /* Títulos */
--line-height-normal:  1.5   /* Corpo de texto */
--line-height-relaxed: 1.75  /* Texto de apoio, instrução */
```

### 5.3 Espaçamento

```
-- Escala base: 4px --
--spacing-1:   4px
--spacing-2:   8px
--spacing-3:   12px
--spacing-4:   16px   /* Padding interno padrão de cards */
--spacing-5:   20px
--spacing-6:   24px   /* Espaçamento entre seções */
--spacing-8:   32px
--spacing-10:  40px   /* Altura mínima de elementos de separação */
--spacing-12:  48px   /* Altura mínima de botões principais */
--spacing-16:  64px   /* Altura da bottom tab bar */

-- Touch Target Mínimo --
--touch-target-min: 44px  /* WCAG 2.5.5 AAA / Apple HIG */
```

### 5.4 Bordas e Sombras

```
-- Border Radius --
--radius-sm:   4px   /* Badges, chips */
--radius-md:   8px   /* Botões, inputs */
--radius-lg:   12px  /* Cards */
--radius-xl:   16px  /* Bottom sheets, modais */
--radius-full: 9999px /* Tags redondas, avatares */

-- Sombras --
--shadow-xs:   0 1px 2px rgba(0,0,0,0.05)            /* Input, subtle */
--shadow-sm:   0 1px 3px rgba(0,0,0,0.1)             /* Cards em repouso */
--shadow-md:   0 4px 6px rgba(0,0,0,0.07)            /* Cards elevados */
--shadow-lg:   0 10px 15px rgba(0,0,0,0.1)           /* Bottom sheets */

-- Bordas de input --
--border-input-default: 1px solid var(--color-gray-300)
--border-input-focus:   2px solid var(--color-primary-500)
--border-input-error:   2px solid var(--color-danger-500)
```

### 5.5 Animações e Transições

```
-- Duração --
--duration-fast:    150ms  /* Hover, press feedback */
--duration-normal:  250ms  /* Transições de estado */
--duration-slow:    350ms  /* Slide entre telas, bottom sheet */
--duration-toast:   3000ms /* Tempo de exibição do toast */

-- Easing --
--ease-default:     cubic-bezier(0.4, 0, 0.2, 1)  /* Material standard */
--ease-out:         cubic-bezier(0, 0, 0.2, 1)    /* Elementos entrando */
--ease-in:          cubic-bezier(0.4, 0, 1, 1)    /* Elementos saindo */

-- Toast --
Entrada: slide de cima com fade, 250ms ease-out
Saída: fade-out, 200ms ease-in, após 3s
```

---

## 6. Considerações Mobile-First

### 6.1 Layout e Grid

- **Base:** Layout de coluna única, sem grid complexo em mobile
- **Padding horizontal padrão:** 16px (--spacing-4) em cada lado
- **Largura máxima do conteúdo:** 480px (centralizado em desktop)
- **Bottom Tab Bar:** Fixa na base, 64px de altura, safe area respeitada (iOS notch/home indicator)
- **Rodapé com botão de ação:** Fixo, 80px de altura, fundo branco com sombra superior sutil

### 6.2 Inputs e Formulários Mobile

| Campo | Tipo de teclado (`inputmode`) | Observação |
|-------|------------------------------|------------|
| Nome | `text` | Autocomplete `name` |
| Telefone | `tel` | Autocomplete `tel`, máscara automática |
| Quilometragem | `numeric` | Sem decimais, separador de milhar visual |
| Data | `date` (input type=date nativo) | Datepicker nativo do SO |
| Texto livre (Outros) | `text` | Autocomplete off |

### 6.3 Touch Targets

- Todos os elementos interativos: mínimo 44x44 px (WCAG 2.5.5)
- Botões de ação primária na lista de tarefas: largura total do card, altura 48px
- Links de telefone: área de tap expandida com padding
- Radio buttons na tela de desistência: área de tap full-width (toda a linha, não só o radio)
- Seletores de data de navegação (anterior/próximo): 44px de largura mínima

### 6.4 Orientação

- Interface projetada para **modo retrato** como primário
- Em modo paisagem (comum quando o consultor está digitando): formulários compactam em 2 colunas quando largura > 600px
- Bottom tab bar se transforma em sidebar lateral em telas > 768px (tablet/desktop)

### 6.5 Performance em Conexão Lenta (3G)

- Skeleton screens durante carregamento (placeholder de card animado)
- Lista de tarefas: carrega no máximo 50 tarefas por vez (paginação virtual)
- Imagens: não há imagens críticas — apenas ícones SVG inline
- Formulário de novo atendimento: preview de previsão calcula localmente (zero rede)
- Otimistic UI: tarefa marcada como concluída visualmente antes da confirmação do servidor; rollback se erro

### 6.6 PWA (Progressive Web App)

- Ícone na tela inicial do smartphone
- Tela de splash com logo e cor primária
- Service Worker: cacheia assets estáticos e última lista de tarefas para acesso offline
- Offline: exibe banner "Você está offline. Os dados serão sincronizados quando a conexão retornar."
- Manifest: `display: standalone` para remover chrome do browser e parecer app nativo

### 6.7 Acessibilidade (WCAG AA)

| Critério | Implementação |
|----------|---------------|
| Contraste de texto | Mín. 4.5:1 para texto normal, 3:1 para texto grande (verificado para vermelho #DC2626 sobre branco) |
| Rótulos de formulário | Todos os inputs com `<label>` associado via `for`/`id` |
| Mensagens de erro | `role="alert"` para anúncio automático por leitores de tela |
| Botões | `aria-label` quando ícone sem texto visível |
| Foco de teclado | Outline visível em todos os elementos interativos (desktop) |
| Hierarquia de headings | H1 (título da tela) → H2 (seções) → H3 (sub-seções) |
| Toast notifications | `role="status"` e `aria-live="polite"` |
| Bottom sheet | Foco preso no modal (`focus trap`) enquanto aberto; fecha com Escape (desktop) |
| Cores de status | Nunca dependem exclusivamente de cor — sempre acompanham ícone ou texto |

### 6.8 Adaptações para Uso em Balcão

- **Brilho/legibilidade:** Contraste alto suficiente para uso sob luz fluorescente ou luz solar indireta
- **Mãos ocupadas:** Ações críticas (registrar resultado) acessíveis com polegar direito em telas de até 6.5"
- **Interrupções:** Estado do formulário preservado se o usuário sair da tela (localStorage temporário)
- **Chamada ativa:** Detectar `visibilitychange` — quando o consultor voltar da ligação, a tela de resultado deve estar pronta na frente
- **Modo noturno:** Suporte a `prefers-color-scheme: dark` para uso em ambientes com pouca luz

---

**Gerado por:** AIOX UX Design Expert — Uma
**Template Version:** ux-design-v1.0
**Baseado em:** PRD ProspectMoto v1.0.0
