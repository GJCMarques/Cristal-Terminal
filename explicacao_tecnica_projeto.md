# Documentação Técnica do Projeto: Cristal Capital Terminal

Este documento detalha a arquitetura atual, o ecossistema tecnológico e o funcionamento interno do projeto, adotando uma perspetiva estritamente técnica (backend, frontend, infraestrutura, fluxos de dados e integração de linguagens). O projeto funciona como uma aplicação Web "Single Page Application" (SPA) baseada em simulação do conceito Bloomberg Terminal, renderizada através de uma única rota (`/`).

---

## 1. Stack Tecnológico Principal

O projeto assenta numa arquitetura moderna baseada em Node.js e React, complementada por módulos em Python e C++ (compilado para WebAssembly) para máxima performance em cálculos financeiros.

### Base do Ecossistema:
- **Framework Principal:** Next.js 15 (App Router).
- **Frontend/UI:** React 19 com uso extensivo de concorrência e Hooks nativos.
- **Linguagem:** TypeScript em todo o código estrutural (frontend e endpoints do servidor).
- **Estilização:** Tailwind CSS 3 (embora a componente visual deva ser omitida, vale mencionar tecnicamente o uso de classes utilitárias compiladas) e animações Radix UI / Vaul.
- **Linting & Code Formatting:** Biome (substituindo ESLint/Prettier).

### Bibliotecas Essenciais:
- **Gestão de Estado:** Zustand v5 (com suporte `subscribeWithSelector`).
- **Data Fetching/Mutations:** `@tanstack/react-query` v5.
- **Gráficos e Visualização de Dados:** `recharts` e `lightweight-charts`.
- **Inteligência Artificial:** SDK da Vercel (`ai` e `@ai-sdk`) com integração a **Ollama (Llama 3)** de execução local via `services/ollama.ts`.

---

## 2. Persistência de Dados e Base de Dados (Sistema CRÍTICO)

Um dos pilares arquitetónicos mais invulgares e críticos do projeto é a **completa ausência de dependências externas de bases de dados (ex: PostgreSQL remoto, Redis, MongoDB)**. Todo o sistema assenta em bases de dados locais por motivos de latência, portabilidade e segurança.

- **Motor de Base de Dados Principal:** SQLite estritamente através do driver `better-sqlite3`.
- **Ficheiro Físico:** Os dados são persistidos no ficheiro local `data/cristal.db`. A base de dados gera automaticamente as tabelas aquando do arranque através do singleton contido em `lib/db.ts`.

### O Emulador de Redis (Em cima de SQLite)
Para gerir fluxos de tempo-real e caching sem introduzir Redis real na stack, foi construída uma **Camada de Emulação do Redis** (`lib/redis.ts`):
- Implementa comandos Redis (ex: `get`, `set`, `llen`, `lrange`, `rpush`) convertendo-os em querys operadas diretamente sobre tabelas SQLite (`kv` para pares chave-valor e `lists` para listas e filas).

### Modelos/Tabelas Principais no SQLite:
1. **`users`**: Gere os utilizadores (`email` [PK], `passwordHash`, `role`, detalhes de 2FA/MFA).
2. **`kv`**: Instanciação global simples de chaves únicas e respetivos valores estruturados. Utilizada para telemetria de presença atual dos utilizadores (online state).
3. **`lists`**: Construção e manutenção de arrays temporais (para gerir filas de mensagens em tempo real).

---

## 3. Ambiente Quantitativo (Sistema Tri-Camada)

A secção de finanças quantitativas ("Quant") representa o pico da complexidade técnica, utilizando uma estrutura agnóstica de três pipelines, mediante o custo e a exigência do cálculo.

### Camada 1: C++ / WebAssembly (WASM)
- **Local:** `native/quant/` e `public/wasm/`.
- **Objetivo:** Cálculos extremamente massivos em theads de browser (ex: simulações intensivas matemáticas tipo Monte Carlo, opções exóticas, modelo Black-Scholes).
- **Técnica:** Foi construída uma pipeline de CMake em C++ compilada com Emscripten (`scripts/compile.sh`), que emite outputs como `quant.js` + `quant.wasm` introduzidos no cliente de forma síncrona/assíncrona sem overhead de transferências de rede.

### Camada 2: Servidor Python (`child_process`)
- **Objetivo:** Manipulação avançada de DataFrames e estatísticas que requerem `NumPy`, `SciPy` e `Pandas`.
- **Técnica:** O Next.js (`app/api/quant/run/route.ts`) recebe o pedido de cálculo quantitativo a partir do frontend e invoca nativamente os scripts python (via `child_process.exec` no SO anfitrião - ambiente na WSL). Um preâmbulo padrão (`quant/init.py`) carrega funções prontas em runtime como `garch11`, `capm`, regressões e parametrizações complexas. O output JSON (ou matrizes re-formatadas via macro de tabela `chart("line", ...)` em Python) é injetado no terminal.

### Camada 3: TypeScript (Browser-Side)
- **Local:** `lib/quant/*.ts`.
- **Objetivo:** Álgebra e calculadoras de portfólios síncronas para interface gráfica na hora (ex: Matriz covariância, modelos yield bond, Beta).

---

## 4. Estrutura de Diretórios da Arquitetura

O projeto divide os componentes através das seguintes macro-pastas:

- `/app/`
  É onde decorre o *App Router* do Next.js.
  - O entry-point global está em `page.tsx` (que arranca efetivamente o SPA inteiro do `CristalTerminal`).
  - Rotas de autenticação (`/login`, `/setup-mfa`).
  - `/api/*`: Onde vive o "Backend". Contém a API do NextAuth (`auth`), SSE (`chat`), endpoints de LLM local (`ai`), e o proxy Python (`quant`).
- `/components/cristal/`
  Armazena todas as ferramentas ativas do terminal em estado puro: `CommandLine` (interface de pesquisa principal estilo Bloomberg), `TerminalHeader`, Layout de painéis resizable e a subpasta `/panels` (onde reside o output de renderização da Vistas. ex: `YieldCurvePanel`, `CorrelacaoPanel`).
- `/store/`
  Zustand store manager. O cérebro do estado volátil (`terminal.store.ts`), conservando histórico da consola, estado das views redimensionáveis, tema ativo, etc.
- `/lib/`
  Motores e parseadores independentes (`db.ts`, `command-parser.ts`, etc).
- `/services/ollama.ts`
  Driver de interface REST para interação com o demónio de LLM na máquina.

---

## 5. Sistemas de Middleware e Lógica de Domínio

### Motor de Eventos em Tempo Real (Chat e Feed)
Em vez de depender do *WebSockets*, foi implementada uma solução baseia em **Server-Sent Events (SSE)**.
- O Frontend consome um fluxo SSE apontado a `/api/chat/stream`.
- Cada thread no NextJS fará rotineiramente *polling* da base relacional local via emulador Redis para empurrar novos registos lidos à instância do cliente que está a escutar, forçando timeouts cíclicos (~44 segundos) para evitar rebentar limites standard de infraestrutura e conexões abertas mortas.

### Command Parser (Brainstorming da Navegação)
Visto não existirem páginas "verdadeiras", todas a navegação traduz-se através do componente de comando que engole strings (`/lib/command-parser.ts`). Quando o utilizador introduz por exemplo o comando *QUANT* ou faz `Ctrl+Q` o motor de abstração devolte o `Dispatch` à Store para desocultar e montar ativamente o React Component atrelado àquela "vista".

### Autenticação e Segurança 
O sistema de segurança está arquitetado sobre a biblioteca híbrida **next-auth v5 / Auth.js (Edge-Compatible)**:
- Middleware global (`middleware.ts`) que vigia interceções de rota via Edge Runtime e insere uma camada protetora forçada.
- Provider baseado em estritas `Credentials`, em detrimento de Oauth2. O matching de sessões ataca diretamente a store de `users.ts` onde são executadas as rotinas algoritmicas de check em `bcryptjs`.
- Segurança Multi-Actor (**MFA/TOTP**) usando a dependência `otplib`, gerando fluxos para aplicações de autenticação como o *Google Authenticator*.
- Roles de utilizador bem definidos ao nível de Base de dados para condutas RBAC (Role Based Access Control): `ADMIN`, `ANALYST`, `TRADER`, `VIEWER`.

---

## 6. Ambiente de Infraestrutura e Execução.
- O workflow real decorre obrigatoriamente num ambiente **Linux/WSL**.
- Na compilação (devido a peculiaridades locais relativas a *UNC paths* na WSL em MS Windows), o deploy e construção (`next build`) requer a injeção local pelo runtime cru em Node  `./node_modules/.bin/next build` em detrimento de scripts habituais CLI, validando a total desconexão de clouds complexas.
- O Sistema de traduções i18n (`/i18n/*.ts`) trabalha puramente com injeções a partir de objetos dicionário com formatadores *Intl* integrados com Zustand. 
