# CRISTAL CAPITAL TERMINAL — Backend & Computation Guide

## Architecture Overview

The Cristal Terminal uses a **tri-layer computation architecture** that allows calculations to run locally without any external server dependencies. Each tab in the Quant and Quantum panels can compute results via three engines:

```
+------------------+     +------------------+     +------------------+
|  TypeScript (TS)  |     |   Python (PY)    |     |    C++ (WASM)    |
|  Browser-side     |     |  Server-side     |     |  Browser-side    |
|  Always available |     |  Needs python3   |     |  Needs compile   |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
    Local functions         /api/quant/run           /wasm/quant.js
    in lib/quant/*           (child_process)        (Emscripten WASM)
```

---

## 1. TypeScript Engine (Default — Always Works)

**No setup needed.** This is the primary computation engine. All Quant functions are implemented in TypeScript and execute directly in the browser.

### How to use

Just run the terminal:

```bash
npm run dev
```

Open `http://localhost:3000`, navigate to the Quant panel (`Ctrl+Q` or type `QUANT`), and click **COMPUTE** on any tab. The TypeScript engine is always active.

### Key files

| File | Functions |
|------|-----------|
| `lib/quant/black-scholes.ts` | `blackScholes()`, `volImplicita()`, `binomialCRR()` |
| `lib/quant/monte-carlo.ts` | `simularGBM()`, `calcularVaR()`, `opcaoMonteCarlo()` |
| `lib/quant/portfolio.ts` | `optimizarMarkowitz()`, `capm()`, `frontEficiente()` |
| `lib/quant/volatility.ts` | `hestonMC()`, `sabrVolImplicita()`, `fitGARCH()` |
| `lib/quant/fixed-income.ts` | `precoBond()`, `ytmBond()`, `zSpread()` |
| `lib/quant/statistics.ts` | `normalCDF()`, `sharpe()`, `beta()`, `maxDrawdown()` |

### Limitations

- Single-threaded (no Web Workers)
- No numpy/scipy optimizations
- Approximate results for iterative solvers (Newton-Raphson convergence may differ)

---

## 2. Python Engine (Server-Side)

Executes Python code on the Node.js server via `child_process.spawn('python3', ...)`.

### Prerequisites

```bash
# Install Python 3 + scientific libraries
sudo apt install python3 python3-pip
pip3 install numpy scipy pandas
```

### Verify installation

```bash
python3 -c "import numpy; import scipy; import pandas; print('OK')"
```

### How it works

1. The Quant panel sends code to `POST /api/quant/run`
2. The API prepends `public/quant/init.py` (pre-built functions: `bs()`, `mc_gbm()`, `markowitz()`, etc.)
3. Python executes server-side with a 45-second timeout
4. Lines prefixed with `CHART:` are parsed as JSON and rendered as Plotly charts

### Available Python functions (via init.py)

```python
bs(S, K, T, r, sigma, q=0, tipo='call')      # Black-Scholes + all greeks
vol_implicita(preco_mkt, S, K, T, r)          # Implied volatility
mc_gbm(S0, mu, sigma, T, n_sim, n_steps)      # GBM Monte Carlo
mc_opcao(S, K, T, r, sigma, tipo)             # Monte Carlo option pricing
markowitz(retornos_lista, rf, n_portfolios)    # Efficient frontier
capm(ret_activo, ret_mercado, rf)              # CAPM regression
preco_bond(nominal, cupao, ytm, maturidade)    # Bond pricing
ytm_bond(preco_mkt, nominal, cupao, mat)       # YTM calculation
garch11(retornos)                              # GARCH(1,1) estimation
superficie_vol(S, K_list, T_list, r)           # Vol surface

# Output helpers:
chart('line', data, title, xlabel, ylabel)     # Render chart in panel
tabela(dict_or_dataframe)                      # Print aligned table
fmt(v, decimals), pct(v), bps(v), moeda(v)    # Formatters
```

### API endpoint

```
POST /api/quant/run
Content-Type: application/json

{
  "code": "result = bs(100, 100, 1, 0.05, 0.2)\nprint(result)",
  "language": "python"
}
```

### Security

- Requires authentication (next-auth session)
- 50KB code size limit
- 45-second execution timeout
- Feature flag: disable via `feature_quant` in SQLite kv table

---

## 3. C++ WASM Engine (Browser-Side)

Compiled C++ running as WebAssembly in the browser via Emscripten.

### Prerequisites

```bash
# Install Emscripten
cd /home
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### Compile

```bash
cd cristalterminal
./scripts/compile.sh
```

This produces:
- `public/wasm/quant.js` — Emscripten loader module
- `public/wasm/quant.wasm` — Compiled WebAssembly binary

### Available C++ functions (via WASM)

```cpp
bs_call(S, K, T, r, sigma)    // Black-Scholes call price
bs_put(S, K, T, r, sigma)     // Black-Scholes put price
bs_delta(S, K, T, r, sigma)   // Delta greek
bs_gamma(S, K, T, r, sigma)   // Gamma greek
bs_vega(S, K, T, r, sigma)    // Vega greek
bs_theta(S, K, T, r, sigma)   // Theta greek
bs_vol_implicita(price, S, K, T, r)  // Implied volatility

mc_opcao(S, K, T, r, sigma, tipo, n_sim)  // Monte Carlo option
var_historico(returns[], n, confidence)      // Historical VaR
var_montecarlo(mu, sigma, value, n_sim, confidence)  // MC VaR
gbm_precos_finais(S0, mu, sigma, T, n_sim, n_steps)  // GBM simulation
```

### Source files

```
native/quant/
├── black_scholes.cpp   — Option pricing + greeks
├── monte_carlo.cpp     — MC simulation + VaR
└── CMakeLists.txt      — Emscripten build config
```

---

## Choosing an Engine

In the Quant panel, use the engine selector buttons (TS / PY / C++) in the top toolbar:

| Engine | Speed | Precision | Setup |
|--------|-------|-----------|-------|
| **TS** | Fast | Good | None (always works) |
| **PY** | Medium | Best (numpy/scipy) | `pip3 install numpy scipy pandas` |
| **C++** | Fastest | Good | Emscripten + `./scripts/compile.sh` |

- **TS** is recommended for most use cases
- **PY** is recommended for GARCH fitting, complex optimization, and when you need pandas DataFrames
- **C++** is recommended for high-frequency repeated calculations (e.g., generating vol surfaces)

---

## Running the Full Stack

```bash
# 1. Start the development server (includes TS + PY engines)
npm run dev

# 2. Seed demo users (first time only)
curl http://localhost:3000/api/auth/seed

# 3. Login at http://localhost:3000
#    Email: admin@cristal.pt
#    Password: Admin123!

# 4. Navigate to Quant: Ctrl+Q or type QUANT in command line
# 5. Navigate to Quantum: type QUANTUM in command line
```

### Environment variables (.env.local)

```env
# Required
AUTH_SECRET="<generate with: openssl rand -base64 64>"
NEXTAUTH_SECRET="<same as AUTH_SECRET>"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Optional — for market data
ALPHA_VANTAGE_API_KEY="your_key"

# Optional — for cloud AI features
OPENAI_API_KEY="your_key"
```

---

## Troubleshooting

### "Backend offline — using local TypeScript engine"

This is **normal behavior**. The system tries to reach `/api/quantum-bridge/quant/*` endpoints first. If they're not available, it falls back to local TypeScript computation. Results are functionally equivalent.

### Python errors

```bash
# Check Python is installed
python3 --version

# Check libraries
python3 -c "import numpy, scipy, pandas; print('All OK')"

# If missing:
pip3 install numpy scipy pandas
```

### WASM not loading

```bash
# Check files exist
ls public/wasm/quant.js public/wasm/quant.wasm

# If missing, compile:
./scripts/compile.sh
```

### Port 3000 already in use

```bash
npx kill-port 3000
npm run dev
```
Here's the status:
                                                                                                                                                                                                          
  Python Engine - WORKS in WSL:
  - python3 with numpy 2.4.2, scipy 1.17.1, pandas 3.0.1 all installed
  - The health check (print("OK")) succeeds — includes('OK') correctly matches even with the init.py banner
  - BS, MC, Portfolio, Bond, Vol Surface, Risk computations all produce valid JSON
  - The frontend correctly extracts the last JSON line from stdout (skipping banner)

  C++ WASM Engine - WORKS:
  - quant.wasm (26KB) and quant.js (12KB) both exist in /public/wasm/
  - Fixed: The middleware was blocking .wasm files (302 redirect to login). Added wasm to the excluded extensions in middleware.ts. Now returns 200.

  Quantum Panel - WORKS:
  - Uses TS quantum simulator directly (lib/quantum/algorithms.ts)
  - Status is always "online" (green dot) — no external API needed
  - All 5 algorithms (Bell, QAE, QAOA, Grover, VQE) run locally

  The middleware fix was the key missing piece. The .wasm extension wasn't in the exclusion list, so WASM files were getting auth-redirected. This has been fixed.

  When you open the QUANT panel after logging in:
  - TS — always green (local computation)
  - PY — should show green after ~2-3 seconds (health check via /api/quant/run)
  - C++ — should show green immediately (HEAD request to /wasm/quant.wasm returns 200)

  Make sure you're running npm run dev from WSL terminal (not Windows PowerShell), so the Node.js process spawns python3 from WSL's /usr/bin/python3.