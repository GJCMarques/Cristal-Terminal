'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Ambiente Quant v2
// JS (TypeScript) | Python (numpy/scipy server-side) | C++ WASM
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import {
  Play, RotateCcw, BookOpen, ChevronRight, Loader2,
  FlaskConical, Activity, TrendingUp, Calculator, Code2,
  Cpu, BarChart2, Terminal, Circle, Layers,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// TS quant libs
import { blackScholes, volImplicita, binomialCRR } from '@/lib/quant/black-scholes'
import { calcularVaR, simularGBM, fitNelsonSiegel, opcaoMonteCarlo } from '@/lib/quant/monte-carlo'
import { retornosLog, sharpe, maxDrawdown, correlacao, desvioPadrao, media, normalCDF } from '@/lib/quant/statistics'
import { precoBond, ytmBond, analiseCenarios } from '@/lib/quant/fixed-income'
import { optimizarMarkowitz, matrizCorrelacao, capm, frontEficiente } from '@/lib/quant/portfolio'
import { hestonMC, sabrVolImplicita, fitGARCH, gerarSmileSVI } from '@/lib/quant/volatility'

// ── Tipos ─────────────────────────────────────────────────────

type Linguagem = 'js' | 'python'

interface LinhaOutput {
  id: number
  tipo: 'stdout' | 'stderr' | 'resultado' | 'info' | 'sistema' | 'chart'
  texto: string
  chartData?: ChartOutput
  ts: string
}

interface ChartOutput {
  tipo: 'line' | 'bar' | 'scatter' | 'area'
  dados: Record<string, number | string>[]
  titulo?: string
  xlabel?: string
  ylabel?: string
}

// ── Exemplos ──────────────────────────────────────────────────

interface Exemplo {
  id: string
  titulo: string
  desc: string
  icone: React.ReactNode
  lang: Linguagem
  codigo: string
}

const EXEMPLOS: Exemplo[] = [
  // ── JS ──
  {
    id: 'bs-surface',
    titulo: 'Superfície de Volatilidade',
    desc: 'Grid de IVs: strikes × maturidades',
    icone: <Activity size={11} />,
    lang: 'js',
    codigo: `// Superfície de Vol Implícita (BS inverso)
const S = 100, r = 0.05
const strikes = [85, 90, 95, 100, 105, 110, 115]
const mats    = [0.1, 0.25, 0.5, 1.0, 2.0]

// Skew parametrizado simples
const volATM = 0.20, skew = -0.01, convex = 0.004

const dados = strikes.map(K => {
  const m = Math.log(K / S)
  const row = { strike: K }
  for (const T of mats) {
    const vol = volATM + skew * m + convex * m * m + 0.002 * Math.sqrt(T)
    row['T=' + T] = fmt(Math.max(vol, 0.01) * 100, 1) + '%'
  }
  return row
})

print('── Superfície de Volatilidade Implícita ──')
print('Strike  | ' + mats.map(t => 'T='+t).join(' | '))
dados.forEach(row => {
  print(String(row.strike).padEnd(7) + ' | ' + mats.map(t => String(row['T='+t]).padEnd(6)).join(' | '))
})

// Gráfico: vol por strike para cada maturidade
const chartData = strikes.map(K => {
  const m = Math.log(K / S)
  const entry = { strike: K }
  for (const T of mats) entry['T='+T] = Math.max(volATM + skew*m + convex*m*m + 0.002*Math.sqrt(T), 0.01) * 100
  return entry
})
outputChart({ tipo: 'line', dados: chartData, titulo: 'Vol Smile por Maturidade', xlabel: 'Strike', ylabel: 'Vol Implícita (%)' })`,
  },
  {
    id: 'heston',
    titulo: 'Modelo Heston (MC)',
    desc: 'Stochastic vol: preço + vol implícita + skew',
    icone: <FlaskConical size={11} />,
    lang: 'js',
    codigo: `// Heston Model — Monte Carlo
// Parâmetros calibrados a activos de alta vol (ex: NVDA)
const params = {
  S: 100, K: 100, T: 0.25, r: 0.05,
  v0: 0.04,      // vol inicial: 20%
  kappa: 2.0,    // reversão à média (rápida)
  theta: 0.04,   // vol longo prazo: 20%
  xi: 0.5,       // vol-of-vol: 50%
  rho: -0.70,    // correlação spot-vol (negativa = skew)
  simulacoes: 15000,
  passos: 100,
}

print('A simular Heston MC (pode demorar alguns segundos)…')
const call = hestonMC({ ...params, tipo: 'call' })
const put  = hestonMC({ ...params, tipo: 'put' })
const bs_ref = blackScholes({ S: 100, K: 100, T: 0.25, r: 0.05, sigma: Math.sqrt(params.v0) })

tabela({
  "Heston Call":          fmt(call.preco, 4),
  "Heston Put":           fmt(put.preco, 4),
  "BS Call (vol0=20%)":   fmt(bs_ref.call, 4),
  "Vol Impl. Call":       fmtPct(call.volImplicita),
  "Skew (90%-110% strike)": fmt(call.skew * 100, 2) + " vol pts",
})

// Smile: IV para diferentes strikes
const strikes = [80, 85, 90, 95, 100, 105, 110, 115, 120]
const smileData = strikes.map(K => {
  const h = hestonMC({ ...params, K, simulacoes: 3000 })
  return { strike: K, vol: h.volImplicita * 100 }
})
outputChart({ tipo: 'line', dados: smileData, titulo: 'Smile Heston', xlabel: 'Strike', ylabel: 'Vol Impl. (%)' })`,
  },
  {
    id: 'markowitz',
    titulo: 'Fronteira Eficiente',
    desc: 'Markowitz + Sharpe máximo + CAPM',
    icone: <TrendingUp size={11} />,
    lang: 'js',
    codigo: `// Portfolio Markowitz — Fronteira Eficiente
// Simulamos retornos de 5 activos
function gerarRets(mu, sigma, rho_base, n=500) {
  const rets = []
  for (let i=0; i<n; i++) {
    const z = Math.sqrt(-2*Math.log(Math.random()+1e-10))*Math.cos(2*Math.PI*Math.random())
    rets.push(mu/252 + sigma/Math.sqrt(252)*z)
  }
  return rets
}
const activos = [
  { ticker:'SPX',    retornos: gerarRets(0.12, 0.16) },
  { ticker:'NVDA',   retornos: gerarRets(0.35, 0.55) },
  { ticker:'EURUSD', retornos: gerarRets(0.02, 0.08) },
  { ticker:'XAU',    retornos: gerarRets(0.06, 0.15) },
  { ticker:'BTC',    retornos: gerarRets(0.80, 1.20) },
]

// Portoflio de Sharpe máximo
const opt = optimizarMarkowitz({ activos, taxaLivreRisco: 0.05 })

print('── Portfolio Sharpe Máximo ──')
tabela(Object.fromEntries(activos.map((a,i) => [a.ticker, fmtPct(opt.pesos[i])])))
tabela({
  'Retorno Anualizado': fmtPct(opt.retornoEsperado),
  'Volatilidade':       fmtPct(opt.volatilidade),
  'Sharpe':             fmt(opt.sharpe, 3),
  'Max Drawdown':       fmtPct(opt.maxDrawdown),
})

// Fronteira eficiente (pontos)
const front = frontEficiente(activos, 20)
const chartData = front.map(p => ({ vol: +(p.volatilidade*100).toFixed(2), retorno: +(p.retornoEsperado*100).toFixed(2), sharpe: +p.sharpe.toFixed(2) }))
outputChart({ tipo: 'scatter', dados: chartData, titulo: 'Fronteira Eficiente', xlabel: 'Vol (%)', ylabel: 'Retorno (%)' })`,
  },
  {
    id: 'garch',
    titulo: 'GARCH(1,1) + VaR',
    desc: 'Volatilidade condicional + VaR dinâmico',
    icone: <BarChart2 size={11} />,
    lang: 'js',
    codigo: `// GARCH(1,1) — Volatilidade Condicional
// Série de retornos simulada com clustering de vol
const n = 750
const retornos = []
let vol_t = 0.012
for (let i=0; i<n; i++) {
  const z = Math.sqrt(-2*Math.log(Math.random()+1e-10))*Math.cos(2*Math.PI*Math.random())
  const r = vol_t * z
  retornos.push(r)
  vol_t = Math.sqrt(0.00001 + 0.08*r*r + 0.88*vol_t*vol_t)
}

const g = fitGARCH(retornos)
tabela({
  'omega':                fmt(g.parametros.omega * 1e6, 4) + 'e-6',
  'alpha (ARCH)':         fmt(g.parametros.alpha, 4),
  'beta  (GARCH)':        fmt(g.parametros.beta, 4),
  'alpha + beta':         fmt(g.parametros.alpha + g.parametros.beta, 4),
  'Vol LP anualizada':    fmtPct(g.volAnualizada),
  'Vol actual (ann.)':    fmtPct(Math.sqrt(g.variancias[g.variancias.length-1]*252)),
})

// VaR dinâmico baseado na vol GARCH
const var95 = calcularVaR({ retornos, confianca: 0.95 })
tabela({ 'VaR 95% (histórico)': fmtPct(var95.var), 'CVaR 95%': fmtPct(var95.cvar) })

// Gráfico: vol condicional GARCH
const chartData = g.variancias.slice(-200).map((v,i) => ({
  dia: i+1,
  vol: +(Math.sqrt(v*252)*100).toFixed(2)
}))
outputChart({ tipo: 'area', dados: chartData, titulo: 'Vol Condicional GARCH(1,1) — últimos 200 dias', xlabel: 'Dia', ylabel: 'Vol Anualizada (%)' })`,
  },
  {
    id: 'fixed-income',
    titulo: 'Fixed Income — Cenários',
    desc: 'Bond pricing, duration, DV01, yield shocks',
    icone: <Layers size={11} />,
    lang: 'js',
    codigo: `// Fixed Income — OT Português 10 Anos
const ot = { valorNominal: 1000, cupao: 0.03, ytm: 0.039, maturidade: 10, frequencia: 2 }
const res = precoBond(ot)

tabela({
  'Preço (% par)':        fmt(res.preco/10, 4) + '%',
  'Preço (€)':            fmt(res.preco, 4),
  'Duration Macaulay':    fmt(res.duracaoMacaulay, 4) + ' anos',
  'Duration Modificada':  fmt(res.duracaoModificada, 4),
  'Convexidade':          fmt(res.convexidade, 4),
  'DV01 (€/bp)':          fmt(res.dv01, 4),
})

// Análise de cenários de taxa
const cenarios = analiseCenarios(ot, [
  { nome: 'Choque +300bp', choque: +300 },
  { nome: 'Choque +200bp', choque: +200 },
  { nome: 'Choque +100bp', choque: +100 },
  { nome: 'Base',          choque:    0 },
  { nome: 'Choque -100bp', choque: -100 },
  { nome: 'Choque -200bp', choque: -200 },
  { nome: 'Rally  -300bp', choque: -300 },
])

print('\\n── Análise de Cenários ──')
cenarios.forEach(c => {
  const pct = c.variacaoPct >= 0 ? '+' + fmtPct(c.variacaoPct) : fmtPct(c.variacaoPct)
  print('  ' + c.cenario.padEnd(16) + fmt(c.preco, 2).padStart(8) + '   ' + pct)
})

const chartData = cenarios.map(c => ({ cenario: c.nome, preco: +c.preco.toFixed(2) }))
outputChart({ tipo: 'bar', dados: chartData, titulo: 'Preço do Bond por Cenário de Taxa', xlabel: 'Cenário', ylabel: 'Preço (€)' })`,
  },
  {
    id: 'capm',
    titulo: 'CAPM + Alpha',
    desc: 'Beta, Jensen alpha, R², Information Ratio',
    icone: <Calculator size={11} />,
    lang: 'js',
    codigo: `// CAPM — Regressão em relação ao S&P 500
function gerarSeries(mu_a, beta_a, vol_idio, n=500) {
  const rm = [], ra = []
  let mkt_prev = 0
  for (let i=0; i<n; i++) {
    const zm = Math.sqrt(-2*Math.log(Math.random()+1e-10))*Math.cos(2*Math.PI*Math.random())
    const zi = Math.sqrt(-2*Math.log(Math.random()+1e-10))*Math.cos(2*Math.PI*Math.random())
    const r_mkt = 0.0004 + 0.010*zm
    const r_act = mu_a/252 + beta_a*r_mkt + vol_idio/Math.sqrt(252)*zi
    rm.push(r_mkt); ra.push(r_act)
  }
  return { rm, ra }
}

const activos_capm = [
  { nome: 'NVDA', mu:0.35, beta:1.8, vol_i:0.35 },
  { nome: 'MSFT', mu:0.20, beta:1.1, vol_i:0.15 },
  { nome: 'XAU',  mu:0.06, beta:0.1, vol_i:0.12 },
  { nome: 'BTC',  mu:0.80, beta:1.2, vol_i:0.90 },
]

const rf = 0.05
print('Activo   Beta    Alpha     R²      Sharpe  Treynor  IR')
activos_capm.forEach(a => {
  const { rm, ra } = gerarSeries(a.mu, a.beta, a.vol_i)
  const res = capm(ra, rm, rf)
  print(
    a.nome.padEnd(8) +
    fmt(res.beta,2).padStart(6) +
    (res.alpha >= 0 ? '+' : '') + fmtPct(res.alpha,1).padStart(8) +
    fmtPct(res.rSquared,1).padStart(8) +
    fmt(res.sharpe,2).padStart(8) +
    fmt(res.treynor,2).padStart(9) +
    fmt(res.informationRatio,2).padStart(5)
  )
})`,
  },
  // ── Python ──
  {
    id: 'py-montecarlo',
    titulo: '[Python] Monte Carlo GBM',
    desc: 'numpy vectorizado — 5000 trajectórias',
    icone: <Code2 size={11} />,
    lang: 'python',
    codigo: `# Monte Carlo GBM vectorizado com numpy
res = mc_gbm(S0=100, mu=0.10, sigma=0.22, T=1, n_sim=5000, n_steps=252)

tabela({
    'Percentil  5%': fmt(res['p5']),
    'Percentil 25%': fmt(res['p25']),
    'Mediana   50%': fmt(res['p50']),
    'Percentil 75%': fmt(res['p75']),
    'Percentil 95%': fmt(res['p95']),
    'Média Final':   fmt(res['media']),
    'Desvio Padrão': fmt(res['std']),
    'Prob Ganho':    pct(res['prob_ganho']),
})

# Gráfico: 5 trajectórias de amostra
from_paths = res['paths_sample']
dados_chart = [{'dia': i+1, **{f'Path{j+1}': round(from_paths[j][i],2) for j in range(min(5,len(from_paths)))}} for i in range(0, 252, 5)]
chart('line', dados_chart, 'Trajectórias GBM (amostra)', 'Dia', 'Preço')`,
  },
  {
    id: 'py-markowitz',
    titulo: '[Python] Markowitz + CAPM',
    desc: 'scipy optimization + pandas output',
    icone: <TrendingUp size={11} />,
    lang: 'python',
    codigo: `# Portfolio Markowitz com scipy
import numpy as np

np.random.seed(42)
n_obs = 500
# Retornos diários simulados para 4 activos
R = np.array([
    np.random.normal(0.0005, 0.010, n_obs),  # SPX
    np.random.normal(0.0014, 0.022, n_obs),  # NVDA
    np.random.normal(0.0001, 0.005, n_obs),  # EUR/USD
    np.random.normal(0.0002, 0.008, n_obs),  # XAU
])

# Fronteira eficiente Monte Carlo
df = markowitz(R.tolist(), rf=0.05, n_portfolios=1000)

# Portfolio máximo Sharpe
best = df.loc[df.sharpe.idxmax()]
print('── Portfolio Sharpe Máximo ──')
tickers = ['SPX', 'NVDA', 'EUR/USD', 'XAU']
for i, t in enumerate(tickers):
    print(f"  {t:<8} {best.pesos[i]*100:.1f}%")
tabela({'Retorno anual': pct(best['retorno']), 'Volatilidade': pct(best['vol']), 'Sharpe': fmt(best['sharpe'])})

# CAPM de cada activo vs SPX (benchmark = R[0])
print('\\n── CAPM vs SPX ──')
for i, t in enumerate(tickers[1:], 1):
    res = capm(R[i].tolist(), R[0].tolist(), rf=0.05)
    print(f"  {t:<8} beta={res['beta']:.2f}  alpha={pct(res['alpha'])}  R²={pct(res['r2'])}")

# Gráfico fronteira eficiente
sorted_df = df.sort_values('vol')
dados_fe = [{'vol': round(r['vol']*100,2), 'retorno': round(r['retorno']*100,2)} for _,r in sorted_df.iterrows()]
chart('scatter', dados_fe, 'Fronteira Eficiente', 'Vol (%)', 'Retorno (%)')`,
  },
  {
    id: 'py-garch',
    titulo: '[Python] GARCH(1,1) + VaR',
    desc: 'scipy MLE + vol condicional diária',
    icone: <BarChart2 size={11} />,
    lang: 'python',
    codigo: `# GARCH(1,1) com scipy MLE + VaR dinâmico
import numpy as np

np.random.seed(0)
# Simular série com clustering de volatilidade
n = 1000
rets = []; vol_t = 0.012
for i in range(n):
    z = np.random.normal()
    r = vol_t * z
    rets.append(r)
    vol_t = np.sqrt(1e-5 + 0.08*r**2 + 0.88*vol_t**2)

res = garch11(rets)
tabela({
    'omega':              f"{res['omega']*1e6:.4f}e-6",
    'alpha (ARCH term)':  fmt(res['alpha']),
    'beta  (GARCH term)': fmt(res['beta']),
    'alpha + beta':       fmt(res['alpha'] + res['beta']),
    'Vol LP anualizada':  pct(res['vol_lp_anualizada']),
    'Vol actual (ann.)':  pct(res['vols_condicionais'][-1]),
})

# VaR condicional baseado na vol GARCH (scaling)
vol_atual = res['vols_condicionais'][-1]  # vol anualizada atual
var_1d = vol_atual / np.sqrt(252) * 1.645  # VaR 95% paramétrico
print(f'\\nVaR 95% 1-dia (GARCH): {pct(var_1d)}')

# Gráfico: vol condicional
vols = res['vols_condicionais'][-200:]
dados = [{'dia': i+1, 'vol': round(v*100, 3)} for i,v in enumerate(vols)]
chart('area', dados, 'Vol Condicional GARCH(1,1)', 'Dia', 'Vol Ann. (%)')`,
  },
]

// ── WASM Loader ───────────────────────────────────────────────

let wasmMod: Record<string, (...args: number[]) => number> | null = null

async function carregarWASM(): Promise<boolean> {
  if (wasmMod) return true
  try {
    const resp = await fetch('/wasm/quant.js')
    if (!resp.ok) return false
    const texto = await resp.text()
    const blob = new Blob([texto], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const mod = await import(/* webpackIgnore: true */ url)
    const inst = await (mod.default || mod)({ locateFile: (f: string) => '/wasm/' + f })
    wasmMod = inst
    return true
  } catch { return false }
}

// ── Contexto JS ────────────────────────────────────────────────

function criarContextoJS(
  addLinha: (l: Omit<LinhaOutput, 'id' | 'ts'>) => void,
) {
  const fmt = (v: number, c = 2) => v.toFixed(c)
  const fmtPct = (v: number, c = 2) => `${(v * 100).toFixed(c)}%`
  const fmtMoeda = (v: number, s = '$') => `${s}${v.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`

  const tabela = (dados: Record<string, string | number>) => {
    const maxK = Math.max(...Object.keys(dados).map(k => k.length))
    const linhas = Object.entries(dados).map(([k, v]) => `  ${k.padEnd(maxK)}  ${v}`)
    addLinha({ tipo: 'resultado', texto: linhas.join('\n') })
  }

  const outputChart = (data: ChartOutput) => {
    addLinha({ tipo: 'chart', texto: '', chartData: data })
  }

  return {
    // Math libs
    blackScholes, volImplicita, binomialCRR,
    calcularVaR, simularGBM, fitNelsonSiegel, opcaoMonteCarlo,
    hestonMC, sabrVolImplicita, fitGARCH, gerarSmileSVI,
    precoBond, ytmBond, analiseCenarios,
    optimizarMarkowitz, matrizCorrelacao, capm, frontEficiente,
    retornosLog, sharpe, maxDrawdown, correlacao, desvioPadrao, media, normalCDF,
    // Formatadores
    fmt, fmtPct, fmtMoeda,
    // Output
    tabela, outputChart,
    print: (v: unknown) => addLinha({ tipo: 'stdout', texto: String(v) }),
    // WASM
    wasm: wasmMod,
    // JS nativo
    Math, JSON, Array, Object, Number, String, Date, parseInt, parseFloat,
  }
}

// ── Componente ─────────────────────────────────────────────────

export function QuantPanel() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [lang, setLang]         = useState<Linguagem>('js')
  const [codigo, setCodigo]     = useState(EXEMPLOS[0].codigo)
  const [output, setOutput]     = useState<LinhaOutput[]>([])
  const [loading, setLoading]   = useState(false)
  const [wasmOK, setWasmOK]     = useState(false)
  const [exId, setExId]         = useState(EXEMPLOS[0].id)
  const [abaEsq, setAbaEsq]     = useState<'ex' | 'ref'>('ex')

  const idRef  = useRef(0)
  const outRef = useRef<HTMLDivElement>(null)

  // Carregar WASM na montagem
  useEffect(() => {
    carregarWASM().then(ok => setWasmOK(ok))
  }, [])

  const addLinha = useCallback((linha: Omit<LinhaOutput, 'id' | 'ts'>) => {
    const l: LinhaOutput = {
      ...linha,
      id: ++idRef.current,
      ts: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setOutput(prev => [...prev.slice(-800), l])
  }, [])

  // Mensagem de boas-vindas
  useEffect(() => {
    addLinha({
      tipo: 'sistema',
      texto:
        '╔═══════════════════════════════════════════════════════╗\n' +
        '║  CRISTAL CAPITAL TERMINAL — Ambiente Quant v2        ║\n' +
        '║  JS: Black-Scholes · Heston · GARCH · Markowitz     ║\n' +
        '║  Python: numpy 2.4 · scipy 1.17 · pandas 3.0        ║\n' +
        '║  C++: WASM ' + (wasmOK ? '✓ carregado' : '(a carregar…)').padEnd(12) + '                          ║\n' +
        '╚═══════════════════════════════════════════════════════╝',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: 'smooth' })
  }, [output])

  // ── Executar JS ────────────────────────────────────────────
  const executarJS = useCallback(async () => {
    addLinha({ tipo: 'info', texto: '▶ JS' })
    try {
      const ctx = criarContextoJS(addLinha)
      const fn = new Function(...Object.keys(ctx), `"use strict";\n${codigo}`)
      const res = fn(...Object.values(ctx))
      if (res !== undefined && res !== null) {
        const txt = typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res)
        if (txt !== 'undefined') addLinha({ tipo: 'resultado', texto: txt })
      }
    } catch (e: unknown) {
      addLinha({ tipo: 'stderr', texto: e instanceof Error ? e.message : String(e) })
    }
  }, [codigo, addLinha])

  // ── Executar Python ────────────────────────────────────────
  const executarPython = useCallback(async () => {
    addLinha({ tipo: 'info', texto: '▶ Python (server-side)' })
    const resp = await fetch('/api/quant/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ erro: resp.statusText }))
      addLinha({ tipo: 'stderr', texto: err.erro ?? 'Erro desconhecido' })
      return
    }
    const { stdout, stderr, duracaoMs } = await resp.json()

    if (stdout) {
      // Processar linhas — detectar CHART: prefix
      for (const linha of stdout.split('\n')) {
        if (linha.startsWith('CHART:')) {
          try {
            const cd: ChartOutput = JSON.parse(linha.slice(6))
            addLinha({ tipo: 'chart', texto: '', chartData: cd })
          } catch {
            addLinha({ tipo: 'stdout', texto: linha })
          }
        } else if (linha.trim()) {
          addLinha({ tipo: 'stdout', texto: linha })
        }
      }
    }
    if (stderr) addLinha({ tipo: 'stderr', texto: stderr })
    addLinha({ tipo: 'info', texto: `✓ ${duracaoMs}ms` })
  }, [codigo, addLinha])

  const executar = useCallback(async () => {
    if (loading || !codigo.trim()) return
    setLoading(true)
    if (lang === 'js') await executarJS()
    else await executarPython()
    setLoading(false)
  }, [loading, codigo, lang, executarJS, executarPython])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); executar() }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const s = ta.selectionStart
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd)
      ta.selectionStart = ta.selectionEnd = s + 2
      setCodigo(ta.value)
    }
  }

  const carregarEx = (ex: Exemplo) => { setExId(ex.id); setCodigo(ex.codigo); setLang(ex.lang) }

  // ── Render do Chart ────────────────────────────────────────
  const renderChart = (cd: ChartOutput) => {
    const keys = cd.dados.length > 0
      ? Object.keys(cd.dados[0]).filter(k => k !== (cd.xlabel || 'x') && k !== 'strike' && k !== 'dia' && k !== 'cenario')
      : []
    const xKey = cd.dados.length > 0
      ? (Object.keys(cd.dados[0]).find(k => ['x','strike','dia','vol','cenario'].includes(k)) ?? Object.keys(cd.dados[0])[0])
      : 'x'
    const CORES = [corTema, '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

    return (
      <div style={{ background: '#0A0A0A', border: `1px solid ${corTema}33`, borderRadius: 4, padding: '12px 4px 8px', marginTop: 4 }}>
        {cd.titulo && <p className="text-center font-mono text-[10px] mb-2" style={{ color: corTema }}>{cd.titulo}</p>}
        <ResponsiveContainer width="100%" height={180}>
          {cd.tipo === 'bar' ? (
            <BarChart data={cd.dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey={xKey} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip contentStyle={{ background: '#111', border: `1px solid ${corTema}44`, fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              {keys.map((k, i) => <Bar key={k} dataKey={k} fill={CORES[i % CORES.length]} />)}
            </BarChart>
          ) : cd.tipo === 'scatter' ? (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey={xKey} name={cd.xlabel} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <YAxis dataKey={keys[0]} name={cd.ylabel} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#111', border: `1px solid ${corTema}44`, fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Scatter data={cd.dados} fill={corTema} fillOpacity={0.6} />
            </ScatterChart>
          ) : cd.tipo === 'area' ? (
            <AreaChart data={cd.dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey={xKey} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip contentStyle={{ background: '#111', border: `1px solid ${corTema}44`, fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              {keys.slice(0, 4).map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stroke={CORES[i % CORES.length]} fill={CORES[i % CORES.length] + '22'} strokeWidth={1.5} dot={false} />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={cd.dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey={xKey} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip contentStyle={{ background: '#111', border: `1px solid ${corTema}44`, fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              {keys.slice(0, 6).map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={CORES[i % CORES.length]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
        {cd.xlabel && cd.ylabel && (
          <p className="text-center font-mono text-[9px] text-neutral-700 mt-1">{cd.xlabel} → {cd.ylabel}</p>
        )}
      </div>
    )
  }

  const corLinha = (tipo: LinhaOutput['tipo']) => {
    if (tipo === 'stderr') return '#EF4444'
    if (tipo === 'resultado') return corTema
    if (tipo === 'info') return corTema + '70'
    if (tipo === 'sistema') return '#4B5563'
    return '#D1D5DB'
  }

  const exFiltrados = EXEMPLOS.filter(e => e.lang === lang || lang === 'js' && !e.id.startsWith('py-') || lang === 'python' && e.id.startsWith('py-'))

  return (
    <div className="flex h-full bg-[#050505] font-mono overflow-hidden">

      {/* ── Sidebar esquerda ───────────────────────────────── */}
      <div className="flex flex-col w-64 shrink-0 border-r border-neutral-900">

        {/* Linguagem */}
        <div className="flex border-b border-neutral-900">
          {(['js', 'python'] as Linguagem[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors"
              style={{
                color: lang === l ? corTema : '#374151',
                borderBottom: lang === l ? `1px solid ${corTema}` : '1px solid transparent',
                backgroundColor: lang === l ? corTema + '0A' : 'transparent',
              }}>
              {l === 'js' ? <><Terminal size={9} className="inline mr-1" />JS</> : <><Code2 size={9} className="inline mr-1" />Python</>}
            </button>
          ))}
        </div>

        {/* WASM status */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-900 bg-[#080808]">
          <Circle size={6} fill={wasmOK ? '#10B981' : '#374151'} color={wasmOK ? '#10B981' : '#374151'} />
          <span className="text-[9px]" style={{ color: wasmOK ? '#10B981' : '#374151' }}>
            C++ WASM {wasmOK ? 'carregado' : 'indisponível'}
          </span>
          <span className="text-[9px] text-neutral-700 ml-auto">
            {lang === 'python' ? 'numpy/scipy' : 'TypeScript'}
          </span>
        </div>

        {/* Tabs Exemplos / Referência */}
        <div className="flex border-b border-neutral-900">
          {[['ex', 'Exemplos'], ['ref', 'Referência']] .map(([k, lbl]) => (
            <button key={k} onClick={() => setAbaEsq(k as 'ex' | 'ref')}
              className="flex-1 py-1.5 text-[9px] tracking-widest uppercase transition-colors"
              style={{ color: abaEsq === k ? corTema : '#374151', borderBottom: abaEsq === k ? `1px solid ${corTema}` : '1px solid transparent' }}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {abaEsq === 'ex' ? (
            EXEMPLOS.filter(e => lang === 'js' ? !e.id.startsWith('py-') : e.id.startsWith('py-')).map(ex => (
              <button key={ex.id} onClick={() => carregarEx(ex)}
                className="w-full text-left px-3 py-2 border-b border-neutral-900 transition-colors"
                style={{
                  backgroundColor: exId === ex.id ? corTema + '10' : 'transparent',
                  borderLeft: exId === ex.id ? `2px solid ${corTema}` : '2px solid transparent',
                }}>
                <div className="flex items-center gap-1.5 mb-0.5" style={{ color: exId === ex.id ? corTema : '#6B7280' }}>
                  {ex.icone}
                  <span className="text-[9px] font-bold truncate">{ex.titulo}</span>
                </div>
                <p className="text-[8px] text-neutral-600 pl-4 truncate">{ex.desc}</p>
              </button>
            ))
          ) : (
            <div className="p-3 space-y-3">
              {lang === 'js' ? (
                <>
                  {[
                    ['blackScholes(opts)', 'BS europeia + gregas'],
                    ['volImplicita(mkt,opts)', 'IV Newton-Raphson'],
                    ['binomialCRR(opts)', 'CRR americanas'],
                    ['hestonMC(params)', 'Heston Monte Carlo'],
                    ['sabrVolImplicita(p)', 'SABR approx.'],
                    ['fitGARCH(rets)', 'GARCH(1,1) MLE'],
                    ['simularGBM(params)', 'GBM simulação'],
                    ['opcaoMonteCarlo(opts)', 'MC exóticas'],
                    ['calcularVaR(params)', 'VaR/CVaR (3 métodos)'],
                    ['precoBond(p)', 'Bond + duration + DV01'],
                    ['ytmBond(preco,p)', 'YTM Newton-Raphson'],
                    ['analiseCenarios(b,c)', 'Yield shock análise'],
                    ['optimizarMarkowitz(o)', 'Max Sharpe portfolio'],
                    ['frontEficiente(a,n)', 'Efficient frontier'],
                    ['capm(ra,rm,rf)', 'CAPM regressão'],
                    ['fitNelsonSiegel(p)', 'Yield curve fitting'],
                    ['sharpe(rets)', 'Sharpe ratio'],
                    ['maxDrawdown(precos)', 'Max drawdown'],
                  ].map(([fn, d]) => (
                    <div key={fn} className="mb-1">
                      <div className="text-[9px]" style={{ color: corTema }}>{fn}</div>
                      <div className="text-[8px] text-neutral-600 pl-1">{d}</div>
                    </div>
                  ))}
                  <div className="border-t border-neutral-900 pt-2 mt-2">
                    <p className="text-[8px] text-neutral-600 mb-1 uppercase tracking-widest">Output</p>
                    {[['tabela({...})', 'Dict alinhado'], ['outputChart({tipo,dados})', 'Gráfico recharts'], ['print(v)', 'Texto']].map(([f,d]) => (
                      <div key={f} className="mb-1">
                        <div className="text-[9px]" style={{ color: corTema + 'BB' }}>{f}</div>
                        <div className="text-[8px] text-neutral-600 pl-1">{d}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {[
                    ['bs(S,K,T,r,sigma)', 'Black-Scholes + gregas'],
                    ['vol_implicita(mkt,S,K,T,r)', 'Volatilidade implícita'],
                    ['mc_gbm(S0,mu,sigma,T)', 'Monte Carlo GBM numpy'],
                    ['mc_opcao(S,K,T,r,sigma)', 'MC opção antithetic'],
                    ['var_historico(rets)', 'VaR histórico'],
                    ['markowitz(R_list)', 'Fronteira eficiente MC'],
                    ['capm(ra,rm,rf)', 'CAPM regressão'],
                    ['preco_bond(nom,c,ytm,T)', 'Bond pricing'],
                    ['ytm_bond(preco,...)', 'YTM Newton-Raphson'],
                    ['garch11(rets)', 'GARCH(1,1) scipy MLE'],
                    ['superficie_vol(S,K_list,...)', 'Vol surface'],
                  ].map(([fn, d]) => (
                    <div key={fn} className="mb-1">
                      <div className="text-[9px]" style={{ color: corTema }}>{fn}</div>
                      <div className="text-[8px] text-neutral-600 pl-1">{d}</div>
                    </div>
                  ))}
                  <div className="border-t border-neutral-900 pt-2 mt-2">
                    <p className="text-[8px] text-neutral-600 mb-1 uppercase tracking-widest">Output</p>
                    {[['tabela(dict|df)', 'Tabela alinhada'], ["chart('line',dados)", 'Gráfico recharts'], ['print(v)', 'stdout'], ['fmt/pct/bps', 'Formatadores']].map(([f,d]) => (
                      <div key={f} className="mb-1">
                        <div className="text-[9px]" style={{ color: corTema + 'BB' }}>{f}</div>
                        <div className="text-[8px] text-neutral-600 pl-1">{d}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Editor + Output ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-900 bg-[#080808]">
          <div className="flex items-center gap-2">
            <FlaskConical size={11} style={{ color: corTema }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: corTema }}>QUANT</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold"
              style={{ color: lang === 'js' ? '#F59E0B' : '#3B82F6', borderColor: lang === 'js' ? '#F59E0B44' : '#3B82F644' }}>
              {lang === 'js' ? 'JAVASCRIPT' : 'PYTHON'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-700">Ctrl+Enter</span>
            <button onClick={() => setOutput([])} className="flex items-center gap-1 px-2 py-1 text-[9px] text-neutral-600 hover:text-neutral-400 border border-neutral-800 rounded">
              <RotateCcw size={9} /> Limpar
            </button>
            <button onClick={executar} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold tracking-widest disabled:opacity-50"
              style={{ backgroundColor: corTema, color: '#000' }}>
              {loading ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
              {loading ? 'A calcular…' : 'EXECUTAR'}
            </button>
          </div>
        </div>

        {/* Editor (55%) */}
        <div className="relative overflow-hidden" style={{ height: '55%' }}>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#080808] border-r border-neutral-900 overflow-hidden pointer-events-none z-10">
            {codigo.split('\n').map((_, i) => (
              <div key={i} className="text-right pr-2 text-[9px] leading-5" style={{ color: '#374151' }}>{i + 1}</div>
            ))}
          </div>
          <textarea value={codigo} onChange={e => setCodigo(e.target.value)} onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 pl-10 pr-3 py-1 w-full h-full bg-transparent resize-none outline-none text-[11px] leading-5 text-neutral-200"
            style={{ caretColor: corTema, fontFamily: 'IBM Plex Mono, monospace', tabSize: 2 }} />
        </div>

        {/* Output (45%) */}
        <div className="border-t border-neutral-900 flex flex-col" style={{ height: '45%' }}>
          <div className="flex items-center gap-2 px-3 py-1 border-b border-neutral-900 bg-[#080808] shrink-0">
            <ChevronRight size={10} style={{ color: corTema }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: corTema }}>OUTPUT</span>
            <span className="text-[9px] text-neutral-700">{output.length} linhas</span>
          </div>
          <div ref={outRef} className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {output.map(l => (
              l.tipo === 'chart' && l.chartData ? (
                <div key={l.id}>{renderChart(l.chartData)}</div>
              ) : (
                <pre key={l.id} className="text-[10px] leading-[1.6] whitespace-pre-wrap break-all"
                  style={{ color: corLinha(l.tipo), fontFamily: 'IBM Plex Mono, monospace' }}>
                  {l.tipo === 'info' && <span style={{ color: corTema + '50' }}>{l.ts} </span>}
                  {l.texto}
                </pre>
              )
            ))}
            {loading && (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 size={10} className="animate-spin" style={{ color: corTema }} />
                <span className="text-[10px]" style={{ color: corTema + '88' }}>
                  {lang === 'python' ? 'A executar Python (numpy/scipy)…' : 'A calcular…'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
