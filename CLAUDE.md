# CRISTAL CAPITAL TERMINAL — Contexto para Claude

## Visão Geral

Terminal financeiro Bloomberg-clone em Next.js 15 + React 19 + TypeScript.
Estética: **preto + âmbar + IBM Plex Mono**. Interface SPA de uma única rota (`/`).
Público-alvo: profissionais de mercado (traders, analistas, quants, gestores).

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 App Router |
| UI | React 19, Tailwind CSS 3, Lucide React |
| Estado | Zustand 5 (com `subscribeWithSelector` + `devtools`) |
| Base de Dados | **SQLite local** (`cristal.db`) — sem dependências externas |
| Auth | next-auth v5 (Auth.js beta) + bcryptjs + otplib (TOTP/MFA) |
| Gráficos | Recharts, lightweight-charts |
| IA | Ollama/Llama 3 (local) via `services/ollama.ts` |
| Fontes | IBM Plex Mono (monospace) — usada em TUDO |
| Linting | Biome (`biome.json`) |

---

## Base de Dados — SQLite (CRÍTICO)

**Não há dependências externas de BD.** Tudo persiste localmente em `cristal.db`.

### Ficheiros chave

```
lib/db.ts        — getDb(): Database (singleton SQLite, cria tabelas automaticamente)
lib/redis.ts     — Emulador Redis sobre SQLite (compatibilidade com código legado)
lib/users.ts     — CRUD de utilizadores (lê/escreve SQLite directamente)
```

### Tabelas SQLite

```sql
users (email PK, passwordHash, nome, role, mfaEnabled, mfaSecret)
kv    (key PK, value TEXT)            -- emula Redis GET/SET
lists (id PK, key, value, created_at) -- emula Redis RPUSH/LRANGE
```

### Emulador Redis (`lib/redis.ts`)

Implementa: `get`, `set`, `llen`, `lrange`, `rpush`, `del`
Stubs (no-op): `hgetall`, `hset`, `sadd`, `sismember`, `ltrim`, `expire`

> **NUNCA adicionar Upstash, Planetscale, Neon, ou qualquer BD externa.**
> Se for necessária persistência de um novo módulo → usar `getDb()` de `lib/db.ts`.

---

## Arquitectura de Ficheiros

```
cristalterminal/
├── app/
│   ├── (auth)/
│   │   ├── login/          — Página de login (Bloomberg dark, âmbar)
│   │   └── setup-mfa/      — Configuração de TOTP MFA
│   ├── api/
│   │   ├── auth/           — NextAuth handlers + seed de utilizadores demo
│   │   ├── chat/           — SSE stream, envio, histórico, presença
│   │   ├── ai/             — Endpoint IA (Ollama)
│   │   ├── market-data/    — Dados de mercado (Alpha Vantage)
│   │   ├── crypto/live/    — Preços cripto em tempo real
│   │   ├── news/           — Notícias financeiras
│   │   └── seed-redis/     — Seed de dados iniciais
│   └── page.tsx            — Rota única: renderiza <CristalTerminal />
├── components/cristal/
│   ├── panels/             — Um componente por VistaTerminal
│   ├── layout/             — ResizableLayout, PainelContainer
│   ├── CristalTerminal.tsx — Root do terminal (atalhos, layout, modais)
│   ├── TerminalHeader.tsx  — Tabs de navegação, UserButton, LocaleSelector
│   ├── CommandLine.tsx     — Linha de comando estilo Bloomberg
│   ├── CommandPalette.tsx  — Ctrl+K — pesquisa fuzzy de comandos
│   ├── StatusBar.tsx       — Barra de estado inferior
│   ├── UserButton.tsx      — Avatar + role + dropdown auth
│   └── LocaleSelector.tsx  — PT / EN / ES
├── store/
│   └── terminal.store.ts   — Zustand: todo o estado global do terminal
├── types/
│   ├── terminal.ts         — VistaTerminal, EstadoTerminal, etc.
│   ├── market.ts           — ClasseAtivo, MensagemIA, etc.
│   └── next-auth.d.ts      — Augmentação de tipos next-auth (role)
├── lib/
│   ├── db.ts               — SQLite singleton
│   ├── redis.ts            — Emulador Redis/SQLite
│   ├── users.ts            — CRUD utilizadores SQLite
│   ├── utils.ts            — cn(), CORES_TEMA, corParaTema()
│   ├── i18n.ts             — useTranslation() + formatadores Intl
│   ├── command-parser.ts   — Parser de comandos Bloomberg
│   └── mocks/              — Dados mock para painéis sem API real
├── i18n/
│   ├── pt.ts               — Traduções português (base)
│   ├── en.ts               — Traduções inglês
│   └── es.ts               — Traduções espanhol
├── services/
│   └── ollama.ts           — Cliente Ollama/Llama 3 (IA local)
├── auth.config.ts          — Config next-auth edge-compatible (middleware)
├── auth.ts                 — Config next-auth completa (Node.js, bcrypt, TOTP)
├── middleware.ts            — Protecção de rotas (Edge Runtime)
└── cristal.db              — Base de dados SQLite (gerada automaticamente)
```

---

## Padrões Chave

### VistaTerminal

Para adicionar uma nova vista:
1. Adicionar à union em `types/terminal.ts`
2. Adicionar case em `components/cristal/layout/ResizableLayout.tsx`
3. Adicionar ao `MAPA_COMANDOS` em `lib/command-parser.ts`
4. Adicionar à `descreverVista()` em `lib/command-parser.ts`
5. Adicionar à `StatusBar.tsx`
6. Adicionar ao `VISTAS_RAPIDAS` em `CommandPalette.tsx`
7. Adicionar ao `TerminalHeader.tsx` se precisar de tab própria

### Sistema de Temas

8 temas disponíveis: `amber | green | blue | purple | red | cyan | rose | slate`

```ts
// lib/utils.ts
export const CORES_TEMA: Record<string, string> = { amber: '#F59E0B', ... }
export function corParaTema(tema: string): string { return CORES_TEMA[tema] ?? '#F59E0B' }
```

**SEMPRE usar `corParaTema(temaActual)` — NUNCA o ternário hardcoded** (o qual só suportava 3 temas):
```ts
// ERRADO:
const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'
// CORRECTO:
const corTema = corParaTema(temaActual)
```

### i18n

```ts
import { useTranslation, formatarNumero, formatarMoeda } from '@/lib/i18n'
const { t } = useTranslation()
// t.nav.mercado, t.auth.entrar, t.comum.confirmar, etc.
```

Locales: `pt` (pt-PT), `en` (en-US), `es` (es-ES). Estado em Zustand.

### Zustand Store

```ts
import { useTerminalStore } from '@/store/terminal.store'
const { vistaActual, definirVista, temaActual, tickerActivo } = useTerminalStore()
```

### Componente de Painel (template)

```tsx
'use client'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'

export function NomePainel() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)
  // ...
}
```

---

## Autenticação

- **next-auth v5** com Credentials provider
- Utilizadores armazenados em SQLite (`users` table)
- MFA via TOTP (otplib, compatível com Google Authenticator)
- Roles: `ADMIN | ANALYST | TRADER | VIEWER`
- Middleware em `middleware.ts` protege todas as rotas excepto `/login` e `/api/auth/**`

### Utilizadores Demo

| Email | Password | Role |
|-------|----------|------|
| admin@cristal.pt | Admin123! | ADMIN |
| analyst@cristal.pt | Analyst123! | ANALYST |
| trader@cristal.pt | Trader123! | TRADER |
| viewer@cristal.pt | Viewer123! | VIEWER |

Seed: `GET /api/auth/seed`

---

## Chat Institucional

- **SSE** (Server-Sent Events) — polling SQLite a cada 1s, max 44s por conexão
- Mensagens armazenadas em SQLite via emulador Redis (`lists` table)
- Presença online via `kv` table (score = timestamp)
- Canais: `#geral`, `#mercado`, `#cripto`, `#macro`, `#defi`
- API: `/api/chat/messages`, `/api/chat/send`, `/api/chat/stream`, `/api/chat/presence`

---

## Ambiente Quant (IMPLEMENTADO — v2)

### Arquitectura Tri-Camada

| Camada | Tecnologia | Estado |
|--------|-----------|--------|
| TypeScript | Cálculo imediato no browser | ✓ Activo |
| Python | numpy/scipy/pandas via `child_process` server-side | ✓ Activo |
| C++ WASM | Emscripten → `public/wasm/quant.js+wasm` | ✓ Compilado |

### Ficheiros Implementados

```
lib/quant/
├── statistics.ts      — normalCDF, media, covariancia, sharpe, beta, maxDrawdown, percentil
├── black-scholes.ts   — blackScholes (gregas completas), volImplicita, binomialCRR (americanas)
├── monte-carlo.ts     — simularGBM, calcularVaR (3 métodos), opcaoMonteCarlo (exóticas), Nelson-Siegel
├── portfolio.ts       — Markowitz (gradient descent), frontEficiente, capm, blackLitterman
├── volatility.ts      — hestonMC (Milstein), sabrVolImplicita (Hagan), fitGARCH, sviVol, gerarSuperficieHeston
└── fixed-income.ts    — precoBond, ytmBond, zSpread, analiseCenarios, analisarPortfolioBonds

native/quant/           — C++ fonte (compilado com Emscripten)
├── black_scholes.cpp  — bs_call/put, bs_delta/gamma/vega/theta, bs_vol_implicita
├── monte_carlo.cpp    — mc_opcao (5 tipos), var_historico, var_montecarlo, gbm_precos_finais
└── CMakeLists.txt     — Instruções de build Emscripten

public/
├── wasm/quant.js      — Módulo Emscripten compilado (WASM loader)
├── wasm/quant.wasm    — Bytecode WebAssembly compilado
└── quant/init.py      — Preâmbulo Python: bs, mc_gbm, mc_opcao, markowitz, capm,
                          preco_bond, ytm_bond, garch11, superficie_vol + chart()/tabela()

components/cristal/panels/
└── QuantPanel.tsx     — UI completo: editor, output, gráficos recharts, 9 exemplos (6 JS + 3 Python)

app/api/quant/
└── run/route.ts       — POST: executa Python via child_process, timeout 45s, parse CHART: prefix
```

### Vista Quant
- **Comandos**: `QUANT`, `PY`, `PYTHON`, `CALC`, `MATH`, `CPP`, `BS`, `QA`
- **Atalho teclado**: `Ctrl+Q`
- **Ctrl+Enter** no editor executa o código

### Python Server-Side
```python
# Funções disponíveis em init.py (pré-carregado):
bs(S, K, T, r, sigma, q=0, tipo='call')     # Black-Scholes + gregas
vol_implicita(preco_mkt, S, K, T, r)        # IV Newton-Raphson
mc_gbm(S0, mu, sigma, T, n_sim, n_steps)    # GBM vectorizado numpy
mc_opcao(S, K, T, r, sigma, tipo)           # Monte Carlo antithetic
markowitz(retornos_lista, rf, n_portfolios) # Fronteira eficiente MC
capm(ret_activo, ret_mercado, rf)           # Regressão CAPM
preco_bond(nominal, cupao, ytm, maturidade) # Bond + duration + DV01
ytm_bond(preco_mkt, nominal, cupao, mat)    # YTM Newton-Raphson
garch11(retornos)                           # GARCH(1,1) scipy MLE
superficie_vol(S, K_list, T_list, r)        # Vol surface parametrizada

# Output:
chart('line', dados, titulo, xlabel, ylabel) # → CHART: JSON → recharts no painel
tabela(dict_ou_dataframe)                    # Tabela alinhada
fmt(v, casas), pct(v), bps(v), moeda(v)     # Formatadores
```

### Dependências Python (instaladas em WSL)
```
numpy 2.4.2, scipy 1.17.1, pandas 3.0.1
Instaladas em: /usr/lib/python3/ e ~/.local/lib/python3.12/
```

---

## Variáveis de Ambiente (`.env.local`)

```env
# Auth (OBRIGATÓRIO — gerar com: openssl rand -base64 64)
AUTH_SECRET="..."
NEXTAUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Alpha Vantage (dados de mercado)
ALPHA_VANTAGE_API_KEY="..."

# OpenAI (opcional — IA em nuvem)
OPENAI_API_KEY="..."
```

---

## Comandos de Desenvolvimento

```bash
# Iniciar em desenvolvimento
npm run dev

# Build de produção
./node_modules/.bin/next build    # usar este na WSL, não npm run build

# Seed de utilizadores demo (após npm run dev)
curl http://localhost:3000/api/auth/seed

# Gerar AUTH_SECRET seguro
openssl rand -base64 64
```

---

## Notas Importantes

1. **Dependências de peer**: `react-day-picker@8.10.1` conflito com `date-fns@4.1.0` → sempre usar `--legacy-peer-deps`
2. **otplib**: importar dinamicamente `const { authenticator } = await import('otplib') as any`
3. **WSL**: usar `./node_modules/.bin/next` em vez de `npm run build`
4. **`next build` via npm**: falha em UNC paths WSL — usar o binário directamente
5. **TypeScript**: `ignoreBuildErrors: true` em `next.config.mjs` — não deixar erros acumular mesmo assim
6. **i18n types**: `en.ts` e `es.ts` usam `export const en: any = {}` para evitar conflitos de tipos literais com `pt.ts`
7. **SQLite file path**: `./cristal.db` relativo ao working directory do processo Node.js
