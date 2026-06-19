# Sistema de Prospecção de Oficina de Motos — Product Requirements Document (PRD)

**Produto:** ProspectMoto — Sistema de Gestão de Prospecção de Clientes para Oficina de Motos
**Versão:** 1.0.0
**Autor:** Thiago Cirne
**Data:** 2026-06-16
**Status:** Draft

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-06-16 | 1.0.0 | Criação inicial do PRD com base na descrição do produto | Thiago Cirne |

---

## 1. Goals e Background Context

### Goals

- Calcular automaticamente a previsão da data do próximo serviço de manutenção de uma moto com base nas informações inseridas pelo consultor
- Gerar agendamentos de contato com clientes de forma organizada e rastreável
- Apresentar ao consultor uma lista de tarefas diária com os contatos a realizar naquele dia
- Registrar o resultado de cada tentativa de contato (agendou serviço, não conseguiu agendar)
- Permitir reagendar um novo contato em caso de insucesso, com data definida pelo consultor
- Registrar motivo de desistência quando o consultor decide encerrar a tentativa de prospecção
- Reduzir a perda de oportunidades de serviço por falta de acompanhamento sistemático

### Background Context

Oficinas de motos dependem da recorrência de clientes para manutenções periódicas (troca de óleo, revisão, etc.). Atualmente, o acompanhamento pós-serviço costuma ser feito de forma manual ou inexistente, resultando em perda de clientes que simplesmente não retornam quando deveriam. O consultor de serviços precisa de uma ferramenta que o ajude a prever quando cada cliente deve retornar e que organize proativamente o trabalho de contato com esses clientes dia a dia.

O ProspectMoto resolve esse problema criando um ciclo estruturado: a partir dos dados do último serviço (tipo de serviço, quilometragem, data), o sistema calcula quando o cliente provavelmente precisará do próximo serviço e agenda automaticamente uma tarefa de contato para o consultor. A partir daí, o consultor tem uma fila de trabalho diária e registra cada desfecho, mantendo o histórico de prospecção organizado.

---

## 2. Requirements

### Functional Requirements

**FR1:** O sistema deve permitir que o consultor registre os dados de um atendimento realizado, incluindo: nome do cliente, telefone de contato, tipo de serviço realizado, data do último serviço, quilometragem no último serviço, quilometragem atual (hoje) e quilometragem prevista para o próximo serviço. A data de hoje é preenchida automaticamente pelo sistema.

**FR2:** Com base nas informações inseridas, o sistema deve calcular a data prevista do próximo serviço usando a seguinte lógica:
- Média diária percorrida = (km atual − km no último serviço) ÷ (data de hoje − data do último serviço em dias)
- Km restantes = km do próximo serviço − km atual
- Dias até o próximo serviço = km restantes ÷ média diária
- Data prevista = data de hoje + dias até o próximo serviço

O sistema deve exibir ao consultor a data prevista calculada e a média diária antes de confirmar o registro.

**FR3:** O sistema deve gerar automaticamente um agendamento de contato (tarefa de prospecção) vinculado ao cliente e à data prevista calculada no FR2, com uma data de ligação sugerida (ex.: X dias antes da previsão do serviço, configurável por tipo de serviço).

**FR4:** O sistema deve apresentar ao consultor uma tela de lista de tarefas do dia, exibindo todos os contatos previstos para a data atual, ordenados por prioridade.

**FR5:** A lista de tarefas deve exibir, para cada item: nome do cliente, telefone, tipo de serviço previsto, data prevista do serviço e número de tentativas de contato já realizadas.

**FR6:** O consultor deve poder registrar o resultado de uma tentativa de contato com duas opções principais: "Agendamento confirmado" ou "Não conseguiu agendar".

**FR7:** Quando o resultado for "Agendamento confirmado", o sistema deve registrar a data do agendamento e marcar a tarefa como concluída, encerrando o ciclo de prospecção daquele cliente para aquele serviço.

**FR8:** Quando o resultado for "Não conseguiu agendar", o sistema deve apresentar ao consultor duas opções: "Reagendar contato" ou "Desistir da prospecção".

**FR9:** Ao escolher "Reagendar contato", o consultor deve poder definir uma nova data para a próxima tentativa de ligação, e o sistema deve criar uma nova tarefa com essa data.

**FR10:** Ao escolher "Desistir da prospecção", o sistema deve exigir que o consultor selecione um motivo de desistência entre opções pré-definidas (ex.: cliente sem interesse, telefone inválido, cliente já foi em outra oficina, sem retorno após X tentativas, outros) e registrar esse motivo junto ao histórico do cliente.

**FR11:** O sistema deve manter um histórico completo de todas as tentativas de contato para cada cliente, incluindo data, resultado e consultor responsável.

**FR12:** O sistema deve permitir configurar, por tipo de serviço, o número de dias de antecedência para criação da tarefa de prospecção (ex.: ligar 15 dias antes da data prevista do próximo serviço).

**FR13:** O sistema deve suportar múltiplos consultores, com cada um vendo apenas as tarefas atribuídas a si.

### Non-Functional Requirements

**NFR1:** O sistema deve ser acessível via navegador web responsivo, funcionando em desktop e dispositivos móveis (smartphones), pois consultores podem usá-lo em balcão ou em movimento.

**NFR2:** A tela de lista de tarefas do dia deve carregar em menos de 2 segundos para até 100 tarefas do dia.

**NFR3:** O sistema deve ser simples e direto — o consultor deve conseguir registrar o resultado de um contato em no máximo 3 cliques/toques a partir da lista de tarefas.

**NFR4:** Os dados dos clientes e histórico de contatos devem ser persistidos de forma segura e não devem ser perdidos em caso de reinicialização do sistema.

**NFR5:** O sistema deve funcionar em conexão de internet básica (3G) sem degradação de funcionalidade crítica.

**NFR6:** A interface deve estar em português brasileiro.

---

## 3. User Interface Design Goals

### Overall UX Vision

Interface limpa, operacional e direta ao ponto. O consultor não é um usuário técnico — ele está no balcão, muitas vezes com clientes à frente. A UX deve minimizar fricção: tela inicial = lista do dia. Cada ação deve ser óbvia e confirmável com um toque.

### Key Interaction Paradigms

- Lista de tarefas como ponto de entrada principal (estilo checklist de trabalho diário)
- Formulário de registro de atendimento guiado por etapas simples
- Feedback visual imediato após cada ação (ex.: tarefa concluída some ou muda de cor)
- Confirmação explícita antes de ações irreversíveis (desistir de prospecção)

### Core Screens and Views

1. **Tela Principal — Lista de Tarefas do Dia:** exibe todos os contatos a realizar hoje, com nome, telefone, serviço previsto e status
2. **Tela de Registro de Novo Atendimento:** formulário para inserir dados do serviço realizado e calcular a previsão do próximo
3. **Tela de Resultado de Contato:** após ligar, consultor registra resultado — agendou, reagendou (com nova data) ou desistiu (com motivo)
4. **Tela de Histórico do Cliente:** linha do tempo de todos os contatos e serviços do cliente
5. **Tela de Configurações de Intervalos:** onde o gestor configura as regras de previsão por tipo de serviço

### Accessibility

WCAG AA — interface operacional em contexto de uso intenso.

### Branding

A definir — por ora, interface limpa com identidade visual relacionada a motos/oficina (tons de cinza, laranja ou azul mecânico). Sem identidade corporativa definida ainda.

### Target Device and Platforms

Web Responsivo — desktop para registro de atendimentos pós-serviço e mobile para consultores em campo ou no balcão.

---

## 4. Technical Assumptions

### Repository Structure

Monorepo — frontend e backend no mesmo repositório para facilitar o desenvolvimento inicial por equipe pequena.

### Service Architecture

Monolito modular — aplicação web com backend em Node.js (ou similar) e banco de dados relacional. Sem necessidade de microserviços na fase MVP. Frontend React ou similar com renderização client-side.

### Testing Requirements

Unit + Integration — testes unitários nas regras de cálculo de previsão e integração nas rotas de API. Testes manuais para fluxos de UX na fase MVP.

### Additional Technical Assumptions

- Banco de dados relacional (PostgreSQL ou SQLite para MVP local)
- Autenticação simples por login/senha para múltiplos consultores
- Sem necessidade de app nativo (PWA é suficiente para uso mobile)
- Deploy inicial pode ser local na oficina ou em cloud simples (ex.: VPS, Vercel + Supabase)
- As regras de intervalo de serviço devem ser configuráveis via interface de administração, não hardcoded

---

## 5. Epic List

**Epic 1 — Fundação e Infraestrutura:** Configurar o projeto base (repositório, banco de dados, autenticação básica) e entregar a estrutura navegável com tela de login e área autenticada.

**Epic 2 — Registro de Atendimento e Cálculo de Previsão:** Permitir que o consultor registre um serviço realizado e visualize a previsão do próximo serviço calculada pelo sistema.

**Epic 3 — Gestão de Tarefas Diárias de Prospecção:** Gerar automaticamente tarefas de contato e exibir a lista de tarefas do dia para o consultor, com navegação entre dias.

**Epic 4 — Registro de Resultado de Contato e Fluxo de Desistência:** Permitir que o consultor registre o resultado de cada tentativa de contato, incluindo reagendamento e desistência com motivo.

**Epic 5 — Histórico do Cliente e Configurações:** Exibir o histórico completo de um cliente e permitir que o gestor configure os intervalos de previsão por tipo de serviço.

---

## 6. Epic Details

### Epic 1: Fundação e Infraestrutura

**Objetivo:** Estabelecer a base técnica do projeto — repositório, banco de dados com schema inicial, sistema de autenticação e navegação entre telas — garantindo que todos os epics seguintes tenham fundação estável para construir. Ao final deste epic, um consultor já consegue fazer login e ver a estrutura da aplicação.

#### Story 1.1 — Setup do Projeto e Estrutura Base

Como desenvolvedor,
eu quero ter o repositório configurado com frontend, backend e banco de dados funcionando localmente,
para que o desenvolvimento possa começar com base estável.

**Acceptance Criteria:**
1. Repositório criado com estrutura de pastas para frontend e backend
2. Backend com servidor HTTP rodando e retornando resposta de healthcheck em `/health`
3. Banco de dados PostgreSQL (ou SQLite para dev) conectado e com migrations rodando via comando
4. Frontend com página inicial renderizando sem erros
5. README com instruções de instalação e execução local

#### Story 1.2 — Autenticação de Consultores

Como consultor,
eu quero fazer login com e-mail e senha,
para que apenas usuários autorizados acessem o sistema.

**Acceptance Criteria:**
1. Tela de login com campos de e-mail e senha
2. Autenticação valida credenciais contra banco de dados (senha com hash bcrypt ou similar)
3. Login bem-sucedido redireciona para a tela principal
4. Login com credenciais inválidas exibe mensagem de erro clara
5. Sessão persiste entre recarregamentos de página (token JWT ou sessão server-side)
6. Botão de logout encerra a sessão e redireciona para o login
7. Tabela `users` no banco com pelo menos um usuário seed para testes

#### Story 1.3 — Estrutura de Navegação Autenticada

Como consultor autenticado,
eu quero ter acesso à estrutura de navegação principal do sistema,
para que eu possa me orientar entre as seções do app.

**Acceptance Criteria:**
1. Menu ou barra de navegação visível após login com links para: "Tarefas de Hoje", "Novo Atendimento" e "Configurações"
2. Rotas protegidas redirecionam para login quando acessadas sem autenticação
3. Layout responsivo funciona em telas de 375px (mobile) até 1440px (desktop)
4. Telas placeholder para cada seção do menu já existem e são navegáveis

---

### Epic 2: Registro de Atendimento e Cálculo de Previsão

**Objetivo:** Permitir que o consultor registre os dados de um serviço realizado na oficina e visualize imediatamente a previsão calculada do próximo serviço, criando a base de dados de clientes e histórico de serviços que alimentará o sistema de prospecção.

#### Story 2.1 — Cadastro de Tipos de Serviço com Intervalos

Como gestor,
eu quero cadastrar os tipos de serviço com seus intervalos de retorno esperados,
para que o sistema calcule previsões corretas para cada tipo de manutenção.

**Acceptance Criteria:**
1. Tela de configuração lista os tipos de serviço cadastrados
2. Formulário permite adicionar novo tipo de serviço com: nome, intervalo em dias e intervalo em quilômetros
3. Tipos de serviço podem ser editados e desativados (não deletados)
4. Sistema inicia com pelo menos 3 tipos de serviço seed: Troca de Óleo (90 dias / 3.000 km), Revisão Completa (180 dias / 6.000 km), Calibração e Pneus (60 dias / 2.000 km)
5. API REST com endpoints CRUD para tipos de serviço

#### Story 2.2 — Registro de Atendimento e Previsão do Próximo Serviço

Como consultor,
eu quero registrar os dados de um serviço realizado em uma moto,
para que o sistema calcule automaticamente quando o cliente precisará do próximo serviço.

**Acceptance Criteria:**
1. Formulário de novo atendimento com campos: nome do cliente, telefone, tipo de serviço, data do serviço e quilometragem atual
2. Ao selecionar o tipo de serviço, o sistema exibe o intervalo configurado (ex.: "Próximo em ~90 dias ou 3.000 km")
3. Após submissão, o sistema calcula e exibe a data prevista do próximo serviço (menor entre data + intervalo em dias e quilometragem + intervalo em km convertido para data estimada)
4. O atendimento é salvo no banco com todos os dados e a previsão calculada
5. O sistema cria automaticamente uma tarefa de prospecção com data = previsão do serviço menos 15 dias
6. Confirmação de sucesso exibida ao consultor com a data prevista calculada
7. Validação: todos os campos obrigatórios, telefone com formato válido, quilometragem numérica positiva

---

### Epic 3: Gestão de Tarefas Diárias de Prospecção

**Objetivo:** Apresentar ao consultor uma lista organizada de contatos a realizar no dia corrente, com todas as informações necessárias para a ligação, e permitir navegação para dias futuros e passados, tornando o fluxo de trabalho diário de prospecção visível e gerenciável.

#### Story 3.1 — Lista de Tarefas do Dia

Como consultor,
eu quero ver a lista de todos os contatos que devo realizar hoje,
para que eu saiba exatamente com quem ligar sem precisar procurar as informações.

**Acceptance Criteria:**
1. Tela "Tarefas de Hoje" é a tela inicial após o login
2. Lista exibe, para cada tarefa: nome do cliente, telefone (clicável para ligar em mobile), tipo de serviço previsto, data prevista do serviço e número de tentativas anteriores
3. Tarefas são ordenadas por: maior número de tentativas anteriores primeiro (prioridade para clientes com mais follow-ups)
4. Tarefas já concluídas no dia aparecem em seção separada ou com visual diferenciado (ex.: riscadas)
5. Contador de tarefas pendentes exibido no topo ("X contatos para hoje")
6. Estado vazio com mensagem amigável quando não há tarefas para o dia
7. Tarefas pertencem ao consultor logado (cada consultor vê apenas as suas)

#### Story 3.2 — Navegação entre Dias

Como consultor,
eu quero poder navegar entre os dias da semana para ver tarefas passadas e futuras,
para que eu possa me planejar e acompanhar contatos que ficaram pendentes.

**Acceptance Criteria:**
1. Seletores de data (anterior/próximo) permitem navegar entre dias
2. Tarefas do dia selecionado são carregadas e exibidas corretamente
3. Tarefas de dias passados não concluídas aparecem com indicador visual de "atrasada"
4. O título da tela exibe a data atual ou selecionada de forma legível (ex.: "Hoje, 16 jun" ou "Quinta, 18 jun")
5. Botão "Hoje" retorna rapidamente para o dia atual

---

### Epic 4: Registro de Resultado de Contato e Fluxo de Desistência

**Objetivo:** Completar o ciclo de prospecção permitindo que o consultor registre o desfecho de cada tentativa de contato — seja confirmando agendamento, reagendando nova tentativa ou encerrando a prospecção com um motivo documentado — mantendo histórico íntegro e alimentando o fluxo de trabalho continuamente.

#### Story 4.1 — Registrar Agendamento Confirmado

Como consultor,
eu quero registrar que consegui agendar o serviço com o cliente,
para que a tarefa seja encerrada e o agendamento fique documentado.

**Acceptance Criteria:**
1. Botão "Ligar" ou "Registrar Resultado" acessível diretamente da lista de tarefas
2. Opção "Agendamento Confirmado" disponível na tela de resultado
3. Ao confirmar, campo para informar data do agendamento (obrigatório)
4. A tarefa de prospecção é marcada como concluída com status "Agendado"
5. O atendimento retorna ao histórico do cliente como "Agendamento confirmado em [data]"
6. A tarefa desaparece da lista de pendentes do dia

#### Story 4.2 — Registrar Não Conseguiu Agendar — Reagendar Contato

Como consultor,
eu quero registrar que não consegui contato com o cliente e definir uma nova data para tentar de novo,
para que a tentativa seja documentada e uma nova tarefa seja criada automaticamente.

**Acceptance Criteria:**
1. Opção "Não conseguiu agendar" disponível na tela de resultado de contato
2. Ao selecionar essa opção, sistema apresenta duas escolhas: "Reagendar contato" e "Desistir"
3. Ao escolher "Reagendar contato", campo de data para nova tentativa é exibido (obrigatório)
4. A tentativa atual é registrada no histórico com status "Sem contato — reagendado para [data]"
5. Nova tarefa de prospecção é criada com a data informada pelo consultor
6. Número de tentativas do cliente é incrementado e visível na próxima exibição da tarefa
7. A tarefa original é marcada como concluída (a nova tarefa substituirá na data correta)

#### Story 4.3 — Registrar Desistência com Motivo

Como consultor,
eu quero registrar a desistência de uma prospecção e informar o motivo,
para que o histórico do cliente reflita por que paramos de tentar contatá-lo.

**Acceptance Criteria:**
1. Ao escolher "Desistir", sistema exibe lista de motivos para seleção (radio buttons)
2. Motivos disponíveis: "Cliente sem interesse", "Telefone inválido ou não atende", "Cliente foi para outra oficina", "Muitas tentativas sem retorno", "Cliente solicitou não ser contatado", "Outros (especificar)"
3. Opção "Outros" exibe campo de texto livre obrigatório
4. Confirmação de desistência exige clique em botão "Confirmar Desistência" (evitar acionamento acidental)
5. A prospecção é encerrada com status "Desistência — [motivo]" e data do encerramento
6. Tarefa some da lista de pendentes e não gera novas tarefas
7. O histórico do cliente registra o encerramento com motivo visível

---

### Epic 5: Histórico do Cliente e Configurações

**Objetivo:** Dar ao consultor e ao gestor visibilidade completa sobre o histórico de cada cliente (serviços realizados, tentativas de contato e desfechos) e permitir que o gestor gerencie as configurações do sistema, encerrando o conjunto mínimo de funcionalidades do ProspectMoto MVP.

#### Story 5.1 — Histórico Completo do Cliente

Como consultor,
eu quero visualizar o histórico de um cliente específico,
para que eu tenha contexto completo antes de ligar ou para consultar o histórico de atendimentos.

**Acceptance Criteria:**
1. Perfil do cliente acessível a partir da lista de tarefas (clique no nome do cliente)
2. Tela exibe: dados do cliente (nome, telefone), lista de serviços realizados em ordem cronológica inversa, e para cada serviço: data, tipo, quilometragem e histórico de tentativas de prospecção
3. Cada tentativa de prospecção exibe: data, resultado (agendado, reagendado, desistência + motivo)
4. Indicador visual do status atual da prospecção do cliente (ativa, agendada, encerrada)
5. Botão de voltar para a lista de tarefas

#### Story 5.2 — Gestão de Motivos de Desistência

Como gestor,
eu quero poder configurar os motivos de desistência disponíveis,
para que a lista reflita as razões reais da nossa operação.

**Acceptance Criteria:**
1. Tela de configurações inclui seção "Motivos de Desistência"
2. Lista exibe motivos cadastrados com opções de editar e desativar
3. Formulário permite adicionar novo motivo com nome
4. Sistema inicia com os motivos seed descritos no FR10
5. Motivos desativados não aparecem nas opções de desistência para o consultor

---

## 7. Success Metrics

| Métrica | Meta | Método de Medição |
|---------|------|--------------------|
| Taxa de tarefas do dia executadas | >= 80% das tarefas do dia registradas com resultado | Contagem de tarefas com resultado / total de tarefas geradas por dia |
| Redução na perda de clientes por falta de follow-up | Redução de 30% nos clientes sem retorno em 6 meses | Comparação histórica de retorno de clientes antes/depois do sistema |
| Tempo médio para registrar resultado de contato | <= 30 segundos por registro | Medição de tempo entre abertura da tela e confirmação |
| Taxa de agendamentos confirmados por prospecção | >= 25% das prospecções resultam em agendamento | Contagem de status "Agendado" / total de prospecções encerradas |
| Adoção por consultores | 100% dos consultores usando diariamente após 30 dias | Login diário por consultor |

---

## 8. Timeline & Milestones

- **M1 — Epic 1 concluído (Fundação):** Semana 2
- **M2 — Epic 2 concluído (Registro e Previsão):** Semana 4
- **M3 — Epic 3 concluído (Lista de Tarefas):** Semana 6
- **M4 — Epic 4 concluído (Resultado de Contato):** Semana 8
- **M5 — MVP completo — Epic 5 concluído:** Semana 10
- **M6 — Teste piloto com consultores reais:** Semana 11-12
- **M7 — Go-live produção:** Semana 14

---

## 9. Risks & Mitigations

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Consultores não adotarem o sistema por hábito | Alto | Alto | Treinamento presencial + interface extremamente simples + acompanhamento nos primeiros 30 dias |
| Dados de quilometragem imprecisos levarem a previsões erradas | Médio | Médio | Tornar previsão editável pelo consultor + usar intervalo em dias como fallback primário |
| Múltiplos consultores atualizando o mesmo cliente simultaneamente | Médio | Baixo | Atribuição de clientes por consultor + lock otimista na edição |
| Perda de dados sem backup | Alto | Baixo | Backup automático diário + deploy em cloud com snapshot |
| Escopo crescente após MVP (relatórios, integração WhatsApp, etc.) | Médio | Alto | Fixar escopo do MVP com stakeholders e documentar backlog de próximas fases separadamente |

---

## 10. Next Steps

### Prompt para Arquiteto

Com base neste PRD do ProspectMoto, crie a arquitetura técnica da aplicação definindo: stack tecnológica detalhada (linguagem, framework backend, framework frontend, banco de dados), schema de banco de dados com todas as entidades e relacionamentos, estrutura de pastas do monorepo, estratégia de autenticação e sessões, e plano de API REST com os principais endpoints. O sistema é uma aplicação web responsiva para uso por consultores de oficina de motos, com foco em simplicidade operacional e baixa latência. Inicie pelo Epic 1.

### Prompt para UX Expert

Com base neste PRD do ProspectMoto, crie o design de UX/UI da aplicação focando nas 5 telas core: (1) Lista de Tarefas do Dia, (2) Formulário de Novo Atendimento, (3) Tela de Resultado de Contato com fluxo de reagendamento e desistência, (4) Histórico do Cliente e (5) Configurações. A interface deve ser simples, operacional e otimizada para uso em balcão de oficina — o consultor deve conseguir registrar um resultado em 3 toques. Plataforma: web responsivo, WCAG AA.

---

**Gerado por:** AIOX Template Engine v2.0
**Template Version:** prd-v2.0 / prd-tmpl.yaml
