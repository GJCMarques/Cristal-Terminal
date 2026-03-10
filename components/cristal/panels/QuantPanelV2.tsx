'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Quant Dashboard v2
// Bloomberg-style interactive financial tools with Plotly.js 3D
// Black-Scholes · Vol Surface · Monte Carlo · Markowitz
// Bond Pricer · Risk Analytics
// ============================================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Loader2, TrendingUp, Activity, BarChart2,
  Layers, ShieldAlert, Calculator, ChevronRight,
} from 'lucide-react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import { MathFormula, FormulaBlock } from '@/components/cristal/MathFormula'

// ── Plotly (SSR-incompatible — must be dynamic) ────────────────
const Plot = dynamic(() => import('@/lib/plotly-wrapper'), { ssr: false })

// ── Types ──────────────────────────────────────────────────────

type ActiveTab = 'bs' | 'vol-surface' | 'monte-carlo' | 'portfolio' | 'bond' | 'risk'
type Engine = 'ts' | 'python' | 'cpp'

interface BSParams {
  S: number
  K: number
  T: number
  r: number
  sigma: number
  q: number
  type: 'call' | 'put'
}

interface VolSurfaceParams {
  S: number
  base_sigma: number
  skew: number
  convexity: number
  term_slope: number
}

interface MonteCarloParams {
  S0: number
  mu: number
  sigma: number
  T: number
  n_simulations: number
  n_steps: number
}

interface PortfolioParams {
  n_assets: number
  expected_returns: number[]
  volatilities: number[]
}

interface BondParams {
  face_value: number
  coupon_rate: number
  maturity: number
  ytm: number
  frequency: number
}

interface RiskParams {
  portfolio_value: number
  confidence_levels: number[]
  horizon: number
  n_simulations: number
}

interface BSResult {
  price: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  error?: string
}

interface VolSurfaceResult {
  strikes: number[]
  maturities: number[]
  surface: number[][]
  error?: string
}

interface MonteCarloResult {
  paths: number[][]
  final_prices: number[]
  var_95: number
  var_99: number
  cvar_95: number
  cvar_99: number
  mean_price: number
  std_price: number
  prob_profit: number
  error?: string
}

interface PortfolioResult {
  weights: number[]
  tickers: string[]
  efficient_frontier: { ret: number; vol: number; sharpe: number }[]
  optimal_return: number
  optimal_vol: number
  optimal_sharpe: number
  correlation_matrix: number[][]
  error?: string
}

interface BondResult {
  clean_price: number
  dirty_price: number
  duration: number
  convexity: number
  dv01: number
  ytm: number
  sensitivity_curve: { yield_shift: number; price: number }[]
  error?: string
}

interface RiskResult {
  var_90: number
  var_95: number
  var_99: number
  cvar_90: number
  cvar_95: number
  cvar_99: number
  stress_scenarios: { name: string; loss: number }[]
  return_distribution: { bucket: number; count: number }[]
  error?: string
}

// ── Plotly dark theme config ──────────────────────────────────

const PLOTLY_DARK_LAYOUT = {
  paper_bgcolor: '#080808',
  plot_bgcolor: '#080808',
  font: { family: 'IBM Plex Mono, monospace', color: '#999', size: 9 },
  scene: {
    xaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' } },
    yaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' } },
    zaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' } },
    bgcolor: '#080808',
  },
  margin: { l: 50, r: 30, t: 40, b: 40 },
}

const PLOTLY_CONFIG = {
  displayModeBar: false,
  responsive: true,
}

// ── Fixed chart colorscales — theme-independent ───────────────

const VIRIDIS_COLORSCALE = [
  [0, '#440154'],
  [0.25, '#31688e'],
  [0.5, '#35b779'],
  [0.75, '#fde725'],
  [1, '#ffffff'],
] as [number, string][]

const PLASMA_COLORSCALE = [
  [0, '#0d0887'],
  [0.25, '#7e03a8'],
  [0.5, '#cc4778'],
  [0.75, '#f89540'],
  [1, '#f0f921'],
] as [number, string][]

// Fixed line colors for data visualisation
const LINE_BLUE = '#3b82f6'
const LINE_RED = '#ef4444'
const LINE_GREEN = '#10b981'
const LINE_AMBER = '#f59e0b'
const BAR_ORANGE = '#f97316'

// ── Utility helpers ───────────────────────────────────────────

function fmt2(v: number, d = 4): string {
  return v.toFixed(d)
}

function fmtPct(v: number, d = 2): string {
  return `${(v * 100).toFixed(d)}%`
}

// Generate normal random samples using Box-Muller
function randn(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

// MathFormula & FormulaBlock imported from @/components/cristal/MathFormula

// ── WASM loader (lazy singleton) ─────────────────────────────

let wasmModule: any = null

async function getWasm(): Promise<any> {
  if (wasmModule) return wasmModule
  // The Emscripten module is served as a static asset from /public/wasm/
  // We load it at runtime via fetch to avoid SSR issues.
  const scriptText = await fetch('/wasm/quant.js').then(r => {
    if (!r.ok) throw new Error('WASM loader not found at /wasm/quant.js')
    return r.text()
  })
  // Emscripten exports the factory function as `CristalQuant`.
  // Wrap in a Function so we can capture the return value.
  // biome-ignore lint/security/noGlobalEval: required to load Emscripten module
  const factory = new Function('module', 'exports', scriptText + '\nreturn typeof CristalQuant !== "undefined" ? CristalQuant : undefined;')
  const CristalQuant = factory({}, {})
  if (typeof CristalQuant !== 'function') throw new Error('CristalQuant factory not found in quant.js')
  wasmModule = await CristalQuant({ locateFile: (f: string) => '/wasm/' + f })
  return wasmModule
}

// ── Local computation fallbacks (used when backend is down) ──

function computeBSLocal(p: BSParams): BSResult {
  const { S, K, T, r, sigma, q, type } = p
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, error: 'Invalid parameters' }
  }
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)

  // Standard normal CDF approximation (Abramowitz & Stegun)
  const normalCDF = (x: number): number => {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
    const a4 = -1.453152027, a5 = 1.061405429, p0 = 0.3275911
    const sign = x < 0 ? -1 : 1
    const t = 1 / (1 + p0 * Math.abs(x))
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    return 0.5 * (1 + sign * y)
  }
  const normalPDF = (x: number): number => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)

  let price: number, delta: number, rho: number
  if (type === 'call') {
    price = S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2)
    delta = Math.exp(-q * T) * normalCDF(d1)
    rho = K * T * Math.exp(-r * T) * normalCDF(d2) / 100
  } else {
    price = K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1)
    delta = -Math.exp(-q * T) * normalCDF(-d1)
    rho = -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100
  }
  const gamma = Math.exp(-q * T) * normalPDF(d1) / (S * sigma * Math.sqrt(T))
  const theta = (-(S * Math.exp(-q * T) * normalPDF(d1) * sigma) / (2 * Math.sqrt(T))
    - r * K * Math.exp(-r * T) * normalCDF(type === 'call' ? d2 : -d2)
    + q * S * Math.exp(-q * T) * normalCDF(type === 'call' ? d1 : -d1)) / 365
  const vega = S * Math.exp(-q * T) * normalPDF(d1) * Math.sqrt(T) / 100

  return { price, delta, gamma, theta, vega, rho }
}

// ── Sub-components ────────────────────────────────────────────

interface MetricBoxProps {
  label: string
  value: string
  corTema: string
  highlight?: boolean
  wide?: boolean
}

function MetricBox({ label, value, corTema, highlight, wide }: MetricBoxProps) {
  return (
    <div
      className={`border border-neutral-800/80 rounded p-3 bg-gradient-to-br from-[#080808] to-[#040404] ${wide ? 'col-span-2' : ''}`}
      style={highlight ? { borderColor: `${corTema}44` } : undefined}
    >
      <p className="text-[9px] text-[#555] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[15px] font-bold font-mono" style={{ color: highlight ? corTema : '#ccc' }}>{value}</p>
    </div>
  )
}

interface SectionTitleProps {
  title: string
  corTema: string
}

function SectionTitle({ title, corTema }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: corTema }} />
      <p className="text-[9px] font-bold tracking-widest text-neutral-300 uppercase">{title}</p>
    </div>
  )
}

interface NumberInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

function NumberInput({ label, value, onChange, min, max, step = 0.01 }: NumberInputProps) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] text-[#888] uppercase tracking-wider">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono hover:border-[#333] focus:border-[#444] outline-none transition-colors"
      />
    </div>
  )
}

interface SliderInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  displayValue: string
  corTema: string
}

function SliderInput({ label, value, onChange, min, max, step, displayValue, corTema }: SliderInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[9px] text-[#888] uppercase tracking-wider">{label}</label>
        <span className="text-[9px] font-mono" style={{ color: corTema }}>{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none rounded bg-[#1a1a1a] cursor-pointer"
        style={{ accentColor: corTema }}
      />
    </div>
  )
}

// ── Engine selector badge ─────────────────────────────────────

interface EngineSelectorProps {
  engine: Engine
  onChange: (e: Engine) => void
  corTema: string
}

function EngineSelector({ engine, onChange, corTema }: EngineSelectorProps) {
  const engines: { id: Engine; label: string }[] = [
    { id: 'ts', label: 'TS' },
    { id: 'python', label: 'PY' },
    { id: 'cpp', label: 'C++' },
  ]

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-[#444] uppercase tracking-wider mr-1">Engine</span>
      {engines.map(e => (
        <button
          key={e.id}
          onClick={() => onChange(e.id)}
          className="flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-bold tracking-wider transition-all"
          style={{
            borderColor: engine === e.id ? corTema : '#1a1a1a',
            color: engine === e.id ? corTema : '#333',
            backgroundColor: engine === e.id ? `${corTema}15` : 'transparent',
          }}
          title={e.id === 'ts' ? 'Local TypeScript (always available)' : e.id === 'python' ? 'Python backend (/api/quant/run)' : 'WebAssembly (C++ via Emscripten)'}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: e.id === 'ts' ? '#10b981' : engine === e.id ? '#f59e0b' : '#2a2a2a' }}
          />
          {e.label}
        </button>
      ))}
    </div>
  )
}

// ── Error banner ──────────────────────────────────────────────

function BackendError({ corTema: _corTema }: { corTema: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded border border-[#EF444433] bg-[#EF444408] mb-4">
      <ShieldAlert size={10} className="text-red-400 shrink-0" />
      <p className="text-[9px] text-red-400">Backend offline — using local TypeScript engine. Results are approximate.</p>
    </div>
  )
}

// ── Math formula block ────────────────────────────────────────


// ── TAB 1: Black-Scholes Pricer ───────────────────────────────

interface BSTabProps {
  corTema: string
  engine: Engine
}

function BSTab({ corTema, engine }: BSTabProps) {
  const [params, setParams] = useState<BSParams>({
    S: 100, K: 100, T: 1, r: 0.05, sigma: 0.20, q: 0, type: 'call',
  })
  const [result, setResult] = useState<BSResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  const setP = useCallback(<K extends keyof BSParams>(key: K, val: BSParams[K]) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)
    try {
      if (engine === 'ts') {
        // Always-available local TypeScript computation
        setBackendDown(false)
        setResult(computeBSLocal(params))
        return
      }

      if (engine === 'python') {
        const pythonCode = `
import json
result = bs(${params.S}, ${params.K}, ${params.T}, ${params.r}, ${params.sigma}, ${params.q}, '${params.type}')
print(json.dumps({
  'price': result['preco'],
  'delta': result['delta'],
  'gamma': result['gamma'],
  'theta': result['theta'],
  'vega':  result['vega'],
  'rho':   result['rho'],
}))
`
        const res = await fetch('/api/quant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: pythonCode }),
        })
        if (!res.ok) throw new Error('Python backend error')
        const data = await res.json()
        if (!data.stdout && data.stderr) throw new Error(data.stderr)
        // stdout may contain the init.py banner lines before the JSON;
        // find the last line that starts with '{' to get the JSON output.
        const jsonLine = data.stdout.trim().split('\n').reverse().find((l: string) => l.trim().startsWith('{'))
        if (!jsonLine) throw new Error('No JSON output from Python')
        const parsed = JSON.parse(jsonLine)
        setBackendDown(false)
        setResult({ price: parsed.price, delta: parsed.delta, gamma: parsed.gamma, theta: parsed.theta, vega: parsed.vega, rho: parsed.rho })
        return
      }

      // C++ / WASM path — load quant.js from /public/wasm/
      if (engine === 'cpp') {
        const wasm = await getWasm()
        const { S, K, T, r, sigma, q } = params
        const isCall = params.type === 'call'
        const price = isCall ? wasm._bs_call(S, K, T, r, sigma) : wasm._bs_put(S, K, T, r, sigma)
        const delta = isCall ? wasm._bs_delta_call(S, K, T, r, sigma) : wasm._bs_delta_put(S, K, T, r, sigma)
        const gamma = wasm._bs_gamma(S, K, T, r, sigma)
        const vega = wasm._bs_vega(S, K, T, r, sigma)
        const theta = isCall ? wasm._bs_theta_call(S, K, T, r, sigma) : wasm._bs_theta_put(S, K, T, r, sigma)
        // q (dividend yield) is not exposed in the C++ WASM interface; results use q=0
        setBackendDown(false)
        setResult({ price, delta, gamma, theta, vega: vega / 100, rho: 0 })
        return
      }
    } catch {
      setBackendDown(engine !== 'ts')
      setResult(computeBSLocal(params))
    } finally {
      setLoading(false)
    }
  }, [params, engine])

  // Price vs spot chart data
  const chartData = useMemo(() => {
    if (!result) return null
    const spots: number[] = []
    const callPrices: number[] = []
    const putPrices: number[] = []
    const deltas: number[] = []
    const S_min = params.S * 0.70
    const S_max = params.S * 1.30
    const steps = 60
    for (let i = 0; i <= steps; i++) {
      const s = S_min + (S_max - S_min) * (i / steps)
      const c = computeBSLocal({ ...params, S: s, type: 'call' })
      const p = computeBSLocal({ ...params, S: s, type: 'put' })
      spots.push(parseFloat(s.toFixed(2)))
      callPrices.push(parseFloat(c.price.toFixed(4)))
      putPrices.push(parseFloat(p.price.toFixed(4)))
      deltas.push(parseFloat(c.delta.toFixed(4)))
    }
    return { spots, callPrices, putPrices, deltas }
  }, [result, params])

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: inputs */}
      <div className="w-[200px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <SectionTitle title="Parameters" corTema={corTema} />

        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Spot (S)" value={params.S} onChange={v => setP('S', v)} min={0.01} step={1} />
          <NumberInput label="Strike (K)" value={params.K} onChange={v => setP('K', v)} min={0.01} step={1} />
          <NumberInput label="Maturity T" value={params.T} onChange={v => setP('T', v)} min={0.001} max={10} step={0.1} />
          <NumberInput label="Rate r" value={params.r} onChange={v => setP('r', v)} min={-0.1} max={0.5} step={0.001} />
          <NumberInput label="Vol σ" value={params.sigma} onChange={v => setP('sigma', v)} min={0.01} max={5} step={0.01} />
          <NumberInput label="Div Yield q" value={params.q} onChange={v => setP('q', v)} min={0} max={0.5} step={0.001} />
        </div>

        {/* Option type */}
        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Option Type</label>
          <div className="flex gap-1">
            {(['call', 'put'] as const).map(t => (
              <button
                key={t}
                onClick={() => setP('type', t)}
                className="flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all"
                style={{
                  borderColor: params.type === t ? corTema : '#222',
                  color: params.type === t ? corTema : '#555',
                  backgroundColor: params.type === t ? `${corTema}15` : 'transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={compute}
          disabled={loading}
          className="w-full py-2 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          style={{ backgroundColor: corTema, color: '#000' }}
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <Calculator size={10} />}
          {loading ? 'COMPUTING...' : 'COMPUTE'}
        </button>
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        {backendDown && <BackendError corTema={corTema} />}

        {/* Formula */}
        <FormulaBlock
          label="Black-Scholes Formula"
          tex={String.raw`C = S e^{-qT} N(d_1) - K e^{-rT} N(d_2)`}
        />

        {result && (
          <>
            <div>
              <SectionTitle title="Option Metrics" corTema={corTema} />
              <div className="grid grid-cols-3 gap-2">
                <MetricBox label={`${params.type.toUpperCase()} Price`} value={`$${fmt2(result.price)}`} corTema={corTema} highlight />
                <MetricBox label="Delta (Δ)" value={fmt2(result.delta)} corTema={corTema} />
                <MetricBox label="Gamma (Γ)" value={fmt2(result.gamma, 6)} corTema={corTema} />
                <MetricBox label="Theta (Θ)" value={fmt2(result.theta, 4)} corTema={corTema} />
                <MetricBox label="Vega (ν)" value={fmt2(result.vega, 4)} corTema={corTema} />
                <MetricBox label="Rho (ρ)" value={fmt2(result.rho, 4)} corTema={corTema} />
              </div>
            </div>

            {chartData && (
              <div>
                <SectionTitle title="Price vs Spot (S±30%)" corTema={corTema} />
                <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                  <Plot
                    data={[
                      {
                        x: chartData.spots,
                        y: chartData.callPrices,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: 'Call',
                        line: { color: LINE_BLUE, width: 2 },
                      },
                      {
                        x: chartData.spots,
                        y: chartData.putPrices,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: 'Put',
                        line: { color: LINE_RED, width: 2, dash: 'dash' as const },
                      },
                      {
                        x: [params.S, params.S],
                        y: [0, Math.max(...chartData.callPrices, ...chartData.putPrices)],
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: 'Spot',
                        line: { color: '#ffffff22', width: 1, dash: 'dot' as const },
                        showlegend: false,
                      },
                    ]}
                    layout={{
                      ...PLOTLY_DARK_LAYOUT,
                      height: 350,
                      xaxis: { title: 'Spot Price', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      yaxis: { title: 'Option Price', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      legend: { x: 0.02, y: 0.98, font: { size: 9, family: 'IBM Plex Mono', color: '#999' }, bgcolor: 'transparent' },
                    }}
                    config={PLOTLY_CONFIG}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-[#333] uppercase tracking-widest">Configure parameters and press COMPUTE</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 2: Vol Surface 3D ─────────────────────────────────────

interface VolSurfaceTabProps {
  corTema: string
  engine: Engine
}

function VolSurfaceTab({ corTema, engine }: VolSurfaceTabProps) {
  const [params, setParams] = useState<VolSurfaceParams>({
    S: 100, base_sigma: 0.20, skew: -0.01, convexity: 0.004, term_slope: 0.002,
  })
  const [result, setResult] = useState<VolSurfaceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  const setP = useCallback(<K extends keyof VolSurfaceParams>(key: K, val: VolSurfaceParams[K]) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }, [])

  const computeLocal = useCallback((p: VolSurfaceParams): VolSurfaceResult => {
    const strikes = [70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130]
    const maturities = [0.08, 0.17, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0]
    const surface: number[][] = maturities.map(T => {
      return strikes.map(K => {
        const m = Math.log(K / p.S)
        const vol = p.base_sigma + p.skew * m + p.convexity * m * m + p.term_slope * Math.sqrt(T)
        return Math.max(vol * 100, 1)
      })
    })
    return { strikes, maturities, surface }
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)
    try {
      if (engine === 'ts' || engine === 'cpp') {
        // TS engine (always available) and C++ engine (no WASM function for vol surface) both use local TS
        setBackendDown(false)
        setResult(computeLocal(params))
        return
      }

      // Python engine — use init.py superficie_vol()
      if (engine === 'python') {
        const strikes = [70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130]
        const maturities = [0.08, 0.17, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0]
        const pythonCode = `
import json
K_list = ${JSON.stringify(strikes)}
T_list = ${JSON.stringify(maturities)}
df = superficie_vol(${params.S}, K_list, T_list, ${params.base_sigma}, skew=${params.skew}, convex=${params.convexity})
surface = []
for T_val in T_list:
    row = []
    for K_val in K_list:
        mask = (df['T'] == T_val) & (df['K'] == K_val)
        row.append(float(df[mask]['vol'].values[0]) * 100)
    surface.append(row)
print(json.dumps({'strikes': K_list, 'maturities': T_list, 'surface': surface}))
`
        const res = await fetch('/api/quant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: pythonCode }),
        })
        if (!res.ok) throw new Error('Python backend error')
        const data = await res.json()
        if (!data.stdout && data.stderr) throw new Error(data.stderr)
        const jsonLine = data.stdout.trim().split('\n').reverse().find((l: string) => l.trim().startsWith('{'))
        if (!jsonLine) throw new Error('No JSON output from Python')
        const parsed = JSON.parse(jsonLine)
        setBackendDown(false)
        setResult(parsed as VolSurfaceResult)
        return
      }
    } catch {
      setBackendDown(engine !== 'ts')
      setResult(computeLocal(params))
    } finally {
      setLoading(false)
    }
  }, [params, engine, computeLocal])

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Inputs */}
      <div className="w-[200px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <SectionTitle title="Surface Parameters" corTema={corTema} />
        <NumberInput label="Spot (S)" value={params.S} onChange={v => setP('S', v)} min={1} step={1} />
        <SliderInput label="ATM Vol (σ)" value={params.base_sigma} onChange={v => setP('base_sigma', v)}
          min={0.05} max={1.0} step={0.01} displayValue={fmtPct(params.base_sigma)} corTema={corTema} />
        <SliderInput label="Skew" value={params.skew} onChange={v => setP('skew', v)}
          min={-0.05} max={0.05} step={0.001} displayValue={params.skew.toFixed(3)} corTema={corTema} />
        <SliderInput label="Convexity" value={params.convexity} onChange={v => setP('convexity', v)}
          min={0} max={0.02} step={0.0005} displayValue={params.convexity.toFixed(4)} corTema={corTema} />
        <SliderInput label="Term Slope" value={params.term_slope} onChange={v => setP('term_slope', v)}
          min={0} max={0.01} step={0.0005} displayValue={params.term_slope.toFixed(4)} corTema={corTema} />
        <button
          onClick={compute}
          disabled={loading}
          className="w-full py-2 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          style={{ backgroundColor: corTema, color: '#000' }}
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <Activity size={10} />}
          {loading ? 'COMPUTING...' : 'COMPUTE'}
        </button>
        <div className="text-[8px] text-[#333] space-y-1 border-t border-[#111] pt-2">
          <p>Drag to rotate the 3D surface.</p>
          <p>Scroll to zoom.</p>
          <p>Double-click to reset view.</p>
        </div>
      </div>

      {/* 3D Surface */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
        {backendDown && <BackendError corTema={corTema} />}

        <FormulaBlock
          label="Parametric Vol Surface"
          tex={String.raw`\sigma(K,T) = \sigma_0 + \alpha \log(K/S) + \beta [\log(K/S)]^2 + \gamma \sqrt{T}`}
        />

        {result && (
          <>
            <SectionTitle title="Implied Volatility Surface — Strikes x Maturities" corTema={corTema} />
            <div className="flex-1 border border-neutral-800/60 rounded overflow-hidden min-h-[450px]">
              <Plot
                data={[
                  {
                    type: 'surface' as const,
                    x: result.strikes,
                    y: result.maturities,
                    z: result.surface,
                    colorscale: VIRIDIS_COLORSCALE,
                    showscale: true,
                    colorbar: {
                      title: { text: 'IV (%)', font: { size: 9, family: 'IBM Plex Mono', color: '#aaa' } },
                      thickness: 10,
                      tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' },
                      bgcolor: '#080808',
                    },
                    contours: {
                      z: { show: true, usecolormap: true, project: { z: true } },
                    },
                  },
                ]}
                layout={{
                  ...PLOTLY_DARK_LAYOUT,
                  height: 450,
                  scene: {
                    ...PLOTLY_DARK_LAYOUT.scene,
                    xaxis: { ...PLOTLY_DARK_LAYOUT.scene.xaxis, title: { text: 'Strike', font: { size: 9, color: '#aaa' } } },
                    yaxis: { ...PLOTLY_DARK_LAYOUT.scene.yaxis, title: { text: 'Maturity (Y)', font: { size: 9, color: '#aaa' } } },
                    zaxis: { ...PLOTLY_DARK_LAYOUT.scene.zaxis, title: { text: 'IV (%)', font: { size: 9, color: '#aaa' } } },
                    camera: { eye: { x: 1.5, y: -1.5, z: 0.8 } },
                  },
                }}
                config={{ ...PLOTLY_CONFIG, displayModeBar: true, modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'] }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </>
        )}

        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-[#333] uppercase tracking-widest">Press COMPUTE to generate 3D surface</p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 size={14} className="animate-spin" style={{ color: corTema }} />
            <p className="text-[10px]" style={{ color: corTema }}>Building vol surface...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 3: Monte Carlo Simulator ──────────────────────────────

interface MonteCarloTabProps {
  corTema: string
  engine: Engine
}

function MonteCarloTab({ corTema, engine }: MonteCarloTabProps) {
  const [params, setParams] = useState<MonteCarloParams>({
    S0: 100, mu: 0.08, sigma: 0.20, T: 1, n_simulations: 1000, n_steps: 252,
  })
  const [result, setResult] = useState<MonteCarloResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  const setP = useCallback(<K extends keyof MonteCarloParams>(key: K, val: MonteCarloParams[K]) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }, [])

  const computeLocal = useCallback((p: MonteCarloParams): MonteCarloResult => {
    const { S0, mu, sigma, T, n_simulations, n_steps } = p
    const dt = T / n_steps
    const samplePaths: number[][] = []
    const finalPrices: number[] = []

    const displaySims = Math.min(n_simulations, 200)
    for (let i = 0; i < displaySims; i++) {
      const path = [S0]
      let S = S0
      for (let j = 0; j < n_steps; j++) {
        const z = randn()
        S = S * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z)
        path.push(S)
      }
      samplePaths.push(path)
      finalPrices.push(S)
    }

    // Fill remaining simulations (without storing paths)
    for (let i = displaySims; i < n_simulations; i++) {
      let S = S0
      for (let j = 0; j < n_steps; j++) {
        const z = randn()
        S = S * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z)
      }
      finalPrices.push(S)
    }

    const sorted = [...finalPrices].sort((a, b) => a - b)
    const var95 = sorted[Math.floor(0.05 * n_simulations)] ?? 0
    const var99 = sorted[Math.floor(0.01 * n_simulations)] ?? 0
    const below95 = sorted.filter(v => v <= var95)
    const below99 = sorted.filter(v => v <= var99)
    const cvar95 = below95.length > 0 ? below95.reduce((a, b) => a + b, 0) / below95.length : var95
    const cvar99 = below99.length > 0 ? below99.reduce((a, b) => a + b, 0) / below99.length : var99
    const mean_price = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length
    const variance = finalPrices.reduce((a, b) => a + (b - mean_price) ** 2, 0) / finalPrices.length
    const std_price = Math.sqrt(variance)
    const prob_profit = finalPrices.filter(v => v > S0).length / n_simulations

    return {
      paths: samplePaths,
      final_prices: finalPrices,
      var_95: var95, var_99: var99,
      cvar_95: cvar95, cvar_99: cvar99,
      mean_price, std_price, prob_profit,
    }
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)
    try {
      if (engine === 'python') {
        const pythonCode = `
import json
result = mc_gbm(${params.S0}, ${params.mu}, ${params.sigma}, ${params.T}, ${params.n_simulations}, 252)
var95 = sorted(result['precos_finais'])[int(0.05*len(result['precos_finais']))]
var99 = sorted(result['precos_finais'])[int(0.01*len(result['precos_finais']))]
b95 = [p for p in result['precos_finais'] if p <= var95]
b99 = [p for p in result['precos_finais'] if p <= var99]
import numpy as np
fps = result['precos_finais']
print(json.dumps({
  "paths": [p[:50] for p in result.get('caminhos', [])[:10]] if 'caminhos' in result else [],
  "final_prices": fps[:2000],
  "var_95": var95, "var_99": var99,
  "cvar_95": float(np.mean(b95)) if b95 else var95,
  "cvar_99": float(np.mean(b99)) if b99 else var99,
  "mean_price": float(np.mean(fps)),
  "std_price": float(np.std(fps)),
  "prob_profit": float(np.sum(np.array(fps) > ${params.S0}) / len(fps))
}))
`
        const res = await fetch('/api/quant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: pythonCode }),
        })
        const data = await res.json()
        if (data.stderr && !data.stdout?.trim()) throw new Error(data.stderr)
        const parsed = JSON.parse(data.stdout.trim())
        setBackendDown(false)
        setResult(parsed)
        return
      }
      throw new Error('Use local TS')
    } catch {
      setBackendDown(engine !== 'ts')
      setResult(computeLocal(params))
    } finally {
      setLoading(false)
    }
  }, [params, engine, computeLocal])

  // Build histogram from final_prices
  const histogramData = useMemo(() => {
    if (!result) return null
    const prices = result.final_prices
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const buckets = 40
    const step = (max - min) / buckets
    const counts = new Array(buckets).fill(0)
    for (const p of prices) {
      const idx = Math.min(Math.floor((p - min) / step), buckets - 1)
      counts[idx]++
    }
    const x = Array.from({ length: buckets }, (_, i) => parseFloat((min + i * step).toFixed(2)))
    return { x, counts, var95: result.var_95, var99: result.var_99 }
  }, [result])

  // Sample paths for chart
  const pathsForChart = useMemo(() => {
    if (!result) return null
    const displayPaths = result.paths.slice(0, 30)
    const steps = displayPaths[0]?.length ?? 0
    const xVals = Array.from({ length: steps }, (_, i) => parseFloat((i * params.T / Math.max(steps - 1, 1)).toFixed(4)))
    return { xVals, paths: displayPaths }
  }, [result, params.T])

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Inputs */}
      <div className="w-[200px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <SectionTitle title="GBM Parameters" corTema={corTema} />
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="S₀" value={params.S0} onChange={v => setP('S0', v)} min={0.01} step={1} />
          <NumberInput label="T (years)" value={params.T} onChange={v => setP('T', v)} min={0.01} step={0.25} />
        </div>
        <SliderInput label="Drift μ" value={params.mu} onChange={v => setP('mu', v)}
          min={-0.5} max={1.0} step={0.01} displayValue={fmtPct(params.mu)} corTema={corTema} />
        <SliderInput label="Vol σ" value={params.sigma} onChange={v => setP('sigma', v)}
          min={0.01} max={2.0} step={0.01} displayValue={fmtPct(params.sigma)} corTema={corTema} />

        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Simulations</label>
          <select
            value={params.n_simulations}
            onChange={e => setP('n_simulations', parseInt(e.target.value))}
            className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono"
          >
            {[100, 500, 1000, 2500, 5000, 10000].map(n => (
              <option key={n} value={n}>{n.toLocaleString()}</option>
            ))}
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Steps</label>
          <select
            value={params.n_steps}
            onChange={e => setP('n_steps', parseInt(e.target.value))}
            className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono"
          >
            {[52, 126, 252, 504].map(n => (
              <option key={n} value={n}>{n} ({n === 52 ? 'weekly' : n === 126 ? 'bi-daily' : n === 252 ? 'daily' : '2x daily'})</option>
            ))}
          </select>
        </div>

        <button
          onClick={compute}
          disabled={loading}
          className="w-full py-2 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          style={{ backgroundColor: corTema, color: '#000' }}
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <TrendingUp size={10} />}
          {loading ? 'SIMULATING...' : 'COMPUTE'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        {backendDown && <BackendError corTema={corTema} />}

        <FormulaBlock
          label="Geometric Brownian Motion"
          tex={String.raw`S_T = S_0 \exp\left[\left(\mu - \frac{\sigma^2}{2}\right)T + \sigma W_T\right]`}
        />

        {result && (
          <>
            {/* Metrics */}
            <div>
              <SectionTitle title="Risk Metrics" corTema={corTema} />
              <div className="grid grid-cols-4 gap-2">
                <MetricBox label="Mean Price" value={`$${fmt2(result.mean_price, 2)}`} corTema={corTema} highlight />
                <MetricBox label="Std Dev" value={`$${fmt2(result.std_price, 2)}`} corTema={corTema} />
                <MetricBox label="Prob Profit" value={fmtPct(result.prob_profit)} corTema={corTema} />
                <MetricBox label="VaR 95%" value={`$${fmt2(result.var_95, 2)}`} corTema={corTema} />
                <MetricBox label="VaR 99%" value={`$${fmt2(result.var_99, 2)}`} corTema={corTema} />
                <MetricBox label="CVaR 95%" value={`$${fmt2(result.cvar_95, 2)}`} corTema={corTema} />
                <MetricBox label="CVaR 99%" value={`$${fmt2(result.cvar_99, 2)}`} corTema={corTema} />
                <MetricBox label="Simulations" value={params.n_simulations.toLocaleString()} corTema={corTema} />
              </div>
            </div>

            {/* Path chart */}
            {pathsForChart && pathsForChart.paths.length > 0 && (
              <div>
                <SectionTitle title="Sample Paths (30 shown)" corTema={corTema} />
                <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                  <Plot
                    data={pathsForChart.paths.map((path, i) => ({
                      x: pathsForChart.xVals,
                      y: path.map(v => parseFloat(v.toFixed(2))),
                      type: 'scatter' as const,
                      mode: 'lines' as const,
                      line: { color: i < 3 ? LINE_BLUE : `${LINE_BLUE}22`, width: i < 3 ? 1.5 : 0.8 },
                      showlegend: false,
                      hoverinfo: 'skip' as const,
                    }))}
                    layout={{
                      ...PLOTLY_DARK_LAYOUT,
                      height: 350,
                      xaxis: { title: 'Time (years)', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      yaxis: { title: 'Price', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                    }}
                    config={PLOTLY_CONFIG}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}

            {/* Histogram */}
            {histogramData && (
              <div>
                <SectionTitle title="Final Price Distribution" corTema={corTema} />
                <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                  <Plot
                    data={[
                      {
                        x: histogramData.x,
                        y: histogramData.counts,
                        type: 'bar' as const,
                        marker: {
                          color: histogramData.x.map(v =>
                            v <= histogramData.var99 ? LINE_RED :
                            v <= histogramData.var95 ? BAR_ORANGE :
                            LINE_BLUE
                          ),
                        },
                        name: 'Frequency',
                      },
                    ]}
                    layout={{
                      ...PLOTLY_DARK_LAYOUT,
                      height: 350,
                      bargap: 0.02,
                      xaxis: { title: 'Final Price', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      yaxis: { title: 'Count', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      annotations: [
                        { x: histogramData.var95, y: Math.max(...histogramData.counts) * 0.8, text: 'VaR95', showarrow: true, arrowhead: 2, arrowcolor: BAR_ORANGE, font: { size: 9, color: BAR_ORANGE, family: 'IBM Plex Mono' } },
                        { x: histogramData.var99, y: Math.max(...histogramData.counts) * 0.6, text: 'VaR99', showarrow: true, arrowhead: 2, arrowcolor: LINE_RED, font: { size: 9, color: LINE_RED, family: 'IBM Plex Mono' } },
                      ],
                    }}
                    config={PLOTLY_CONFIG}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-[#333] uppercase tracking-widest">Configure parameters and press COMPUTE</p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 size={14} className="animate-spin" style={{ color: corTema }} />
            <p className="text-[10px]" style={{ color: corTema }}>Running {params.n_simulations.toLocaleString()} simulations...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 4: Portfolio Optimizer ────────────────────────────────

const ASSET_TICKERS = ['SPX', 'NVDA', 'MSFT', 'EURUSD', 'XAU', 'BTC', 'BND', 'OIL']

interface PortfolioTabProps {
  corTema: string
  engine: Engine
}

function PortfolioTab({ corTema, engine }: PortfolioTabProps) {
  const [params, setParams] = useState<PortfolioParams>({
    n_assets: 4,
    expected_returns: [0.12, 0.35, 0.20, 0.02, 0.06, 0.80, 0.04, 0.08],
    volatilities: [0.16, 0.55, 0.22, 0.08, 0.15, 1.20, 0.06, 0.30],
  })
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  const computeLocal = useCallback((p: PortfolioParams): PortfolioResult => {
    const n = p.n_assets
    const tickers = ASSET_TICKERS.slice(0, n)
    const rets = p.expected_returns.slice(0, n)
    const vols = p.volatilities.slice(0, n)

    // Monte Carlo portfolio simulation
    const nPortfolios = 800
    const frontier: { ret: number; vol: number; sharpe: number; weights: number[] }[] = []

    // Build simple correlation matrix (identity + small off-diagonal)
    const corr: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => i === j ? 1.0 : 0.3)
    )

    for (let p0 = 0; p0 < nPortfolios; p0++) {
      // Random weights via Dirichlet approximation
      const raw = Array.from({ length: n }, () => -Math.log(Math.random() + 1e-10))
      const sum = raw.reduce((a, b) => a + b, 0)
      const weights = raw.map(v => v / sum)

      const portRet = weights.reduce((acc, w, i) => acc + w * rets[i], 0)
      let portVar = 0
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          portVar += weights[i] * weights[j] * vols[i] * vols[j] * corr[i][j]
        }
      }
      const portVol = Math.sqrt(portVar)
      const sharpe = (portRet - 0.05) / portVol

      frontier.push({ ret: portRet, vol: portVol, sharpe, weights })
    }

    // Find max Sharpe portfolio
    const optimal = frontier.reduce((best, curr) => curr.sharpe > best.sharpe ? curr : best)

    return {
      weights: optimal.weights,
      tickers,
      efficient_frontier: frontier.map(f => ({ ret: f.ret, vol: f.vol, sharpe: f.sharpe })),
      optimal_return: optimal.ret,
      optimal_vol: optimal.vol,
      optimal_sharpe: optimal.sharpe,
      correlation_matrix: corr,
    }
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)
    try {
      if (engine === 'python') {
        const n = params.n_assets
        const rets = JSON.stringify(params.expected_returns.slice(0, n))
        const vols = JSON.stringify(params.volatilities.slice(0, n))
        const pythonCode = `
import json, numpy as np
rets = ${rets}
vols = ${vols}
n = ${n}
rf = 0.05
# Generate synthetic return series
series = []
for i in range(n):
    series.append(list(np.random.normal(rets[i]/252, vols[i]/np.sqrt(252), 500)))
result = markowitz(series, rf, ${params.n_portfolios || 5000})
print(json.dumps(result))
`
        const res = await fetch('/api/quant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: pythonCode }),
        })
        const data = await res.json()
        if (data.stderr && !data.stdout?.trim()) throw new Error(data.stderr)
        const parsed = JSON.parse(data.stdout.trim())
        setBackendDown(false)
        setResult(parsed)
        return
      }
      throw new Error('Use local TS')
    } catch {
      setBackendDown(engine !== 'ts')
      setResult(computeLocal(params))
    } finally {
      setLoading(false)
    }
  }, [params, engine, computeLocal])

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Inputs */}
      <div className="w-[210px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <SectionTitle title="Portfolio Setup" corTema={corTema} />

        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Number of Assets</label>
          <input
            type="range" min={2} max={8} step={1}
            value={params.n_assets}
            onChange={e => setParams(prev => ({ ...prev, n_assets: parseInt(e.target.value) }))}
            className="w-full h-1 appearance-none rounded bg-[#1a1a1a] cursor-pointer"
            style={{ accentColor: corTema }}
          />
          <div className="flex justify-between text-[8px] text-[#444] mt-0.5">
            {[2, 3, 4, 5, 6, 7, 8].map(n => (
              <span key={n} style={{ color: n === params.n_assets ? corTema : '#333' }}>{n}</span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] text-[#555] uppercase tracking-wider">Expected Returns (annual)</p>
          {ASSET_TICKERS.slice(0, params.n_assets).map((ticker, i) => (
            <div key={ticker} className="flex items-center gap-2">
              <span className="text-[9px] font-mono w-12 shrink-0" style={{ color: corTema }}>{ticker}</span>
              <input
                type="range" min={-0.3} max={2.0} step={0.01}
                value={params.expected_returns[i] ?? 0.1}
                onChange={e => {
                  const newRets = [...params.expected_returns]
                  newRets[i] = parseFloat(e.target.value)
                  setParams(prev => ({ ...prev, expected_returns: newRets }))
                }}
                className="flex-1 h-0.5 appearance-none rounded bg-[#1a1a1a] cursor-pointer"
                style={{ accentColor: corTema }}
              />
              <span className="text-[9px] font-mono w-10 text-right text-[#888]">
                {fmtPct(params.expected_returns[i] ?? 0.1, 0)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[9px] text-[#555] uppercase tracking-wider">Annual Volatility</p>
          {ASSET_TICKERS.slice(0, params.n_assets).map((ticker, i) => (
            <div key={ticker} className="flex items-center gap-2">
              <span className="text-[9px] font-mono w-12 shrink-0" style={{ color: `${corTema}88` }}>{ticker}</span>
              <input
                type="range" min={0.02} max={2.0} step={0.01}
                value={params.volatilities[i] ?? 0.2}
                onChange={e => {
                  const newVols = [...params.volatilities]
                  newVols[i] = parseFloat(e.target.value)
                  setParams(prev => ({ ...prev, volatilities: newVols }))
                }}
                className="flex-1 h-0.5 appearance-none rounded bg-[#1a1a1a] cursor-pointer"
                style={{ accentColor: `${corTema}88` }}
              />
              <span className="text-[9px] font-mono w-10 text-right text-[#666]">
                {fmtPct(params.volatilities[i] ?? 0.2, 0)}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={compute}
          disabled={loading}
          className="w-full py-2 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          style={{ backgroundColor: corTema, color: '#000' }}
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <TrendingUp size={10} />}
          {loading ? 'OPTIMIZING...' : 'COMPUTE'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        {backendDown && <BackendError corTema={corTema} />}

        {result && (
          <>
            {/* Metrics */}
            <div>
              <SectionTitle title="Optimal Portfolio (Max Sharpe)" corTema={corTema} />
              <div className="grid grid-cols-3 gap-2 mb-3">
                <MetricBox label="Expected Return" value={fmtPct(result.optimal_return)} corTema={corTema} highlight />
                <MetricBox label="Volatility" value={fmtPct(result.optimal_vol)} corTema={corTema} />
                <MetricBox label="Sharpe Ratio" value={fmt2(result.optimal_sharpe, 3)} corTema={corTema} />
              </div>

              {/* Weights bar chart */}
              <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                <Plot
                  data={[{
                    type: 'bar' as const,
                    x: result.tickers,
                    y: result.weights.map(w => parseFloat((w * 100).toFixed(2))),
                    marker: {
                      color: result.weights.map((w, i) => {
                        const palette = [LINE_BLUE, LINE_GREEN, LINE_AMBER, LINE_RED, '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
                        const base = palette[i % palette.length] ?? LINE_BLUE
                        // Vary opacity by weight magnitude
                        const opacity = Math.round(60 + w * 195).toString(16).padStart(2, '0')
                        return `${base}${opacity}`
                      }),
                    },
                    text: result.weights.map(w => `${(w * 100).toFixed(1)}%`),
                    textposition: 'outside' as const,
                    textfont: { size: 9, family: 'IBM Plex Mono', color: '#999' },
                  }]}
                  layout={{
                    ...PLOTLY_DARK_LAYOUT,
                    height: 350,
                    xaxis: { gridcolor: '#1f1f1f', tickfont: { size: 9, family: 'IBM Plex Mono', color: '#888' } },
                    yaxis: { title: 'Weight (%)', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                  }}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>

            {/* 3D Efficient Frontier scatter */}
            <div>
              <SectionTitle title="Efficient Frontier — Return x Vol x Sharpe" corTema={corTema} />
              <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[450px]">
                <Plot
                  data={[{
                    type: 'scatter3d' as const,
                    x: result.efficient_frontier.map(p => parseFloat((p.vol * 100).toFixed(2))),
                    y: result.efficient_frontier.map(p => parseFloat((p.ret * 100).toFixed(2))),
                    z: result.efficient_frontier.map(p => parseFloat(p.sharpe.toFixed(3))),
                    mode: 'markers' as const,
                    marker: {
                      size: 2.5,
                      color: result.efficient_frontier.map(p => p.sharpe),
                      colorscale: PLASMA_COLORSCALE,
                      showscale: true,
                      colorbar: {
                        title: { text: 'Sharpe', font: { size: 9, family: 'IBM Plex Mono', color: '#aaa' } },
                        thickness: 8,
                        tickfont: { size: 7, family: 'IBM Plex Mono', color: '#888' },
                        bgcolor: '#080808',
                      },
                    },
                    hovertemplate: 'Vol: %{x:.1f}%<br>Ret: %{y:.1f}%<br>Sharpe: %{z:.3f}<extra></extra>',
                  }]}
                  layout={{
                    ...PLOTLY_DARK_LAYOUT,
                    height: 450,
                    scene: {
                      ...PLOTLY_DARK_LAYOUT.scene,
                      xaxis: { ...PLOTLY_DARK_LAYOUT.scene.xaxis, title: { text: 'Vol (%)', font: { size: 9, color: '#aaa' } } },
                      yaxis: { ...PLOTLY_DARK_LAYOUT.scene.yaxis, title: { text: 'Return (%)', font: { size: 9, color: '#aaa' } } },
                      zaxis: { ...PLOTLY_DARK_LAYOUT.scene.zaxis, title: { text: 'Sharpe', font: { size: 9, color: '#aaa' } } },
                      camera: { eye: { x: 1.4, y: -1.4, z: 1.0 } },
                    },
                  }}
                  config={{ ...PLOTLY_CONFIG, displayModeBar: true, modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'] }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </>
        )}

        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-[#333] uppercase tracking-widest">Configure assets and press COMPUTE</p>
          </div>
        )}
        {loading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 size={14} className="animate-spin" style={{ color: corTema }} />
            <p className="text-[10px]" style={{ color: corTema }}>Running Markowitz optimization...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 5: Bond Pricer ────────────────────────────────────────

interface BondTabProps {
  corTema: string
  engine: Engine
}

function BondTab({ corTema, engine }: BondTabProps) {
  const [params, setParams] = useState<BondParams>({
    face_value: 1000, coupon_rate: 0.05, maturity: 10, ytm: 0.05, frequency: 2,
  })
  const [result, setResult] = useState<BondResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  const setP = useCallback(<K extends keyof BondParams>(key: K, val: BondParams[K]) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }, [])

  const computeLocal = useCallback((p: BondParams): BondResult => {
    const { face_value, coupon_rate, maturity, ytm, frequency } = p
    const n = maturity * frequency
    const c = face_value * coupon_rate / frequency
    const r = ytm / frequency

    // Price
    let clean_price = 0
    for (let t = 1; t <= n; t++) {
      clean_price += c / Math.pow(1 + r, t)
    }
    clean_price += face_value / Math.pow(1 + r, n)

    // Duration
    let duration_num = 0
    for (let t = 1; t <= n; t++) {
      duration_num += (t / frequency) * c / Math.pow(1 + r, t)
    }
    duration_num += (n / frequency) * face_value / Math.pow(1 + r, n)
    const macaulay_duration = duration_num / clean_price
    const modified_duration = macaulay_duration / (1 + r)

    // Convexity
    let convexity_num = 0
    for (let t = 1; t <= n; t++) {
      const tYr = t / frequency
      convexity_num += tYr * (tYr + 1 / frequency) * c / Math.pow(1 + r, t)
    }
    const nYr = n / frequency
    convexity_num += nYr * (nYr + 1 / frequency) * face_value / Math.pow(1 + r, n)
    const convexity = convexity_num / (clean_price * Math.pow(1 + r, 2))

    const dv01 = modified_duration * clean_price * 0.0001

    // Sensitivity curve
    const sensitivity_curve = Array.from({ length: 21 }, (_, i) => {
      const shift = (i - 10) * 0.01
      const new_ytm = ytm + shift
      const new_r = new_ytm / frequency
      let price = 0
      for (let t = 1; t <= n; t++) price += c / Math.pow(1 + new_r, t)
      price += face_value / Math.pow(1 + new_r, n)
      return { yield_shift: parseFloat((shift * 100).toFixed(1)), price: parseFloat(price.toFixed(4)) }
    })

    return {
      clean_price,
      dirty_price: clean_price,
      duration: macaulay_duration,
      convexity,
      dv01,
      ytm,
      sensitivity_curve,
    }
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)
    try {
      if (engine === 'python') {
        const pythonCode = `
import json
result = preco_bond(${params.face_value}, ${params.coupon_rate}, ${params.ytm}, ${params.maturity})
sens = []
for i in range(21):
    shift = (i - 10) * 0.01
    new_ytm = ${params.ytm} + shift
    r2 = preco_bond(${params.face_value}, ${params.coupon_rate}, new_ytm, ${params.maturity})
    sens.append({"yield_shift": round(shift * 100, 1), "price": round(r2["preco"], 4)})
print(json.dumps({
    "clean_price": result["preco"],
    "dirty_price": result["preco"],
    "duration": result.get("duration", 0),
    "convexity": result.get("convexidade", 0),
    "dv01": result.get("dv01", 0),
    "ytm": ${params.ytm},
    "sensitivity_curve": sens
}))
`
        const res = await fetch('/api/quant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: pythonCode }),
        })
        const data = await res.json()
        if (data.stderr && !data.stdout?.trim()) throw new Error(data.stderr)
        const parsed = JSON.parse(data.stdout.trim())
        setBackendDown(false)
        setResult(parsed)
        return
      }
      throw new Error('Use local TS')
    } catch {
      setBackendDown(engine !== 'ts')
      setResult(computeLocal(params))
    } finally {
      setLoading(false)
    }
  }, [params, engine, computeLocal])

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Inputs */}
      <div className="w-[200px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <SectionTitle title="Bond Parameters" corTema={corTema} />
        <NumberInput label="Face Value ($)" value={params.face_value} onChange={v => setP('face_value', v)} min={100} step={100} />
        <SliderInput label="Coupon Rate" value={params.coupon_rate} onChange={v => setP('coupon_rate', v)}
          min={0} max={0.15} step={0.0025} displayValue={fmtPct(params.coupon_rate)} corTema={corTema} />
        <NumberInput label="Maturity (years)" value={params.maturity} onChange={v => setP('maturity', v)} min={0.25} max={30} step={0.5} />
        <SliderInput label="YTM" value={params.ytm} onChange={v => setP('ytm', v)}
          min={-0.02} max={0.2} step={0.001} displayValue={fmtPct(params.ytm)} corTema={corTema} />

        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Frequency</label>
          <select
            value={params.frequency}
            onChange={e => setP('frequency', parseInt(e.target.value))}
            className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono"
          >
            <option value={1}>Annual</option>
            <option value={2}>Semi-annual</option>
            <option value={4}>Quarterly</option>
            <option value={12}>Monthly</option>
          </select>
        </div>

        <button
          onClick={compute}
          disabled={loading}
          className="w-full py-2 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          style={{ backgroundColor: corTema, color: '#000' }}
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <Layers size={10} />}
          {loading ? 'COMPUTING...' : 'COMPUTE'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        {backendDown && <BackendError corTema={corTema} />}

        <FormulaBlock
          label="Bond Pricing Formula"
          tex={String.raw`P = \sum_{t=1}^{n} \frac{C}{(1+y)^t} + \frac{F}{(1+y)^n}`}
        />

        {result && (
          <>
            <div>
              <SectionTitle title="Bond Analytics" corTema={corTema} />
              <div className="grid grid-cols-3 gap-2">
                <MetricBox label="Clean Price" value={`$${fmt2(result.clean_price, 4)}`} corTema={corTema} highlight />
                <MetricBox label="Price (% par)" value={`${(result.clean_price / params.face_value * 100).toFixed(4)}%`} corTema={corTema} />
                <MetricBox label="YTM" value={fmtPct(result.ytm)} corTema={corTema} />
                <MetricBox label="Macaulay Dur." value={`${fmt2(result.duration, 4)} yrs`} corTema={corTema} />
                <MetricBox label="Convexity" value={fmt2(result.convexity, 4)} corTema={corTema} />
                <MetricBox label="DV01 ($/bp)" value={`$${fmt2(result.dv01, 4)}`} corTema={corTema} />
              </div>
            </div>

            {result.sensitivity_curve.length > 0 && (
              <div>
                <SectionTitle title="Price Sensitivity (yield shift ±10%)" corTema={corTema} />
                <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                  <Plot
                    data={[
                      {
                        x: result.sensitivity_curve.map(d => d.yield_shift),
                        y: result.sensitivity_curve.map(d => d.price),
                        type: 'scatter' as const,
                        mode: 'lines+markers' as const,
                        line: { color: LINE_GREEN, width: 2 },
                        marker: { size: 4, color: LINE_GREEN },
                        fill: 'tozeroy' as const,
                        fillcolor: `${LINE_GREEN}11`,
                      },
                      {
                        x: [0, 0],
                        y: [Math.min(...result.sensitivity_curve.map(d => d.price)), Math.max(...result.sensitivity_curve.map(d => d.price))],
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        line: { color: '#ffffff22', width: 1, dash: 'dot' as const },
                        showlegend: false,
                        hoverinfo: 'skip' as const,
                      },
                    ]}
                    layout={{
                      ...PLOTLY_DARK_LAYOUT,
                      height: 350,
                      xaxis: { title: 'Yield Shift (%)', gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      yaxis: { title: 'Price ($)', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      showlegend: false,
                    }}
                    config={PLOTLY_CONFIG}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-[#333] uppercase tracking-widest">Configure bond parameters and press COMPUTE</p>
          </div>
        )}
        {loading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 size={14} className="animate-spin" style={{ color: corTema }} />
            <p className="text-[10px]" style={{ color: corTema }}>Pricing bond...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 6: Risk Analytics ─────────────────────────────────────

interface RiskTabProps {
  corTema: string
  engine: Engine
}

function RiskTab({ corTema, engine }: RiskTabProps) {
  const [params, setParams] = useState<RiskParams>({
    portfolio_value: 1_000_000,
    confidence_levels: [0.90, 0.95, 0.99],
    horizon: 1,
    n_simulations: 10000,
  })
  const [result, setResult] = useState<RiskResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  const setP = useCallback(<K extends keyof RiskParams>(key: K, val: RiskParams[K]) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }, [])

  const computeLocal = useCallback((p: RiskParams): RiskResult => {
    // Generate 300-day return series
    const dailyReturns = Array.from({ length: 300 }, () => randn() * 0.012 + 0.0003)

    // Historical VaR
    const sortedRets = [...dailyReturns].sort((a, b) => a - b)
    const n = dailyReturns.length

    const var90 = -sortedRets[Math.floor(0.10 * n)] * p.portfolio_value * Math.sqrt(p.horizon)
    const var95 = -sortedRets[Math.floor(0.05 * n)] * p.portfolio_value * Math.sqrt(p.horizon)
    const var99 = -sortedRets[Math.floor(0.01 * n)] * p.portfolio_value * Math.sqrt(p.horizon)

    const cvar90 = -(sortedRets.slice(0, Math.floor(0.10 * n)).reduce((a, b) => a + b, 0) / Math.floor(0.10 * n)) * p.portfolio_value * Math.sqrt(p.horizon)
    const cvar95 = -(sortedRets.slice(0, Math.floor(0.05 * n)).reduce((a, b) => a + b, 0) / Math.floor(0.05 * n)) * p.portfolio_value * Math.sqrt(p.horizon)
    const cvar99 = -(sortedRets.slice(0, Math.floor(0.01 * n)).reduce((a, b) => a + b, 0) / Math.floor(0.01 * n)) * p.portfolio_value * Math.sqrt(p.horizon)

    // Stress scenarios
    const stress_scenarios = [
      { name: '2008 GFC', loss: p.portfolio_value * 0.52 },
      { name: 'COVID-19', loss: p.portfolio_value * 0.34 },
      { name: 'Dot-com', loss: p.portfolio_value * 0.49 },
      { name: 'Black Monday', loss: p.portfolio_value * 0.22 },
      { name: 'EU Debt Crisis', loss: p.portfolio_value * 0.19 },
      { name: 'Rate Shock +3%', loss: p.portfolio_value * 0.08 },
    ]

    // Return distribution histogram
    const minR = Math.min(...dailyReturns)
    const maxR = Math.max(...dailyReturns)
    const buckets = 35
    const step = (maxR - minR) / buckets
    const counts = new Array(buckets).fill(0)
    for (const r of dailyReturns) {
      const idx = Math.min(Math.floor((r - minR) / step), buckets - 1)
      counts[idx]++
    }
    const return_distribution = Array.from({ length: buckets }, (_, i) => ({
      bucket: parseFloat((minR + i * step).toFixed(4)),
      count: counts[i],
    }))

    return { var_90: var90, var_95: var95, var_99: var99, cvar_90: cvar90, cvar_95: cvar95, cvar_99: cvar99, stress_scenarios, return_distribution }
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)
    try {
      if (engine === 'python') {
        const pythonCode = `
import json, numpy as np
mu = ${params.annual_return}
sigma = ${params.annual_volatility}
val = ${params.portfolio_value}
h = ${params.horizon}
n = 10000
rets = np.random.normal(mu/252, sigma/np.sqrt(252), n)
sorted_r = np.sort(rets)
sqrt_h = np.sqrt(h)
var90 = float(-sorted_r[int(0.10*n)] * val * sqrt_h)
var95 = float(-sorted_r[int(0.05*n)] * val * sqrt_h)
var99 = float(-sorted_r[int(0.01*n)] * val * sqrt_h)
cvar90 = float(-np.mean(sorted_r[:int(0.10*n)]) * val * sqrt_h)
cvar95 = float(-np.mean(sorted_r[:int(0.05*n)]) * val * sqrt_h)
cvar99 = float(-np.mean(sorted_r[:int(0.01*n)]) * val * sqrt_h)
stress = [
    {"name": "2008 GFC", "loss": val * 0.52},
    {"name": "COVID-19", "loss": val * 0.34},
    {"name": "Dot-com", "loss": val * 0.49},
    {"name": "Black Monday", "loss": val * 0.22},
    {"name": "EU Debt Crisis", "loss": val * 0.19},
    {"name": "Rate Shock +3%", "loss": val * 0.08},
]
hist, edges = np.histogram(rets, bins=35)
dist = [{"bucket": round(float(edges[i]), 4), "count": int(hist[i])} for i in range(len(hist))]
print(json.dumps({
    "var_90": var90, "var_95": var95, "var_99": var99,
    "cvar_90": cvar90, "cvar_95": cvar95, "cvar_99": cvar99,
    "stress_scenarios": stress, "return_distribution": dist
}))
`
        const res = await fetch('/api/quant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: pythonCode }),
        })
        const data = await res.json()
        if (data.stderr && !data.stdout?.trim()) throw new Error(data.stderr)
        const parsed = JSON.parse(data.stdout.trim())
        setBackendDown(false)
        setResult(parsed)
        return
      }
      throw new Error('Use local TS')
    } catch {
      setBackendDown(engine !== 'ts')
      setResult(computeLocal(params))
    } finally {
      setLoading(false)
    }
  }, [params, engine, computeLocal])

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Inputs */}
      <div className="w-[200px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <SectionTitle title="Risk Parameters" corTema={corTema} />
        <NumberInput label="Portfolio Value ($)" value={params.portfolio_value} onChange={v => setP('portfolio_value', v)} min={1000} step={10000} />

        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Horizon (days)</label>
          <select
            value={params.horizon}
            onChange={e => setP('horizon', parseInt(e.target.value))}
            className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono"
          >
            <option value={1}>1 day</option>
            <option value={5}>5 days (1 week)</option>
            <option value={10}>10 days (2 weeks)</option>
            <option value={21}>21 days (1 month)</option>
            <option value={63}>63 days (1 quarter)</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Simulations</label>
          <select
            value={params.n_simulations}
            onChange={e => setP('n_simulations', parseInt(e.target.value))}
            className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono"
          >
            {[1000, 5000, 10000, 50000].map(n => (
              <option key={n} value={n}>{n.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <button
          onClick={compute}
          disabled={loading}
          className="w-full py-2 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          style={{ backgroundColor: corTema, color: '#000' }}
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <ShieldAlert size={10} />}
          {loading ? 'COMPUTING...' : 'COMPUTE'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        {backendDown && <BackendError corTema={corTema} />}

        {result && (
          <>
            <div>
              <SectionTitle title={`Value at Risk — ${params.horizon}d horizon`} corTema={corTema} />
              <div className="grid grid-cols-3 gap-2">
                <MetricBox label="VaR 90%" value={fmtCurrency(result.var_90)} corTema={corTema} />
                <MetricBox label="VaR 95%" value={fmtCurrency(result.var_95)} corTema={corTema} highlight />
                <MetricBox label="VaR 99%" value={fmtCurrency(result.var_99)} corTema={corTema} />
                <MetricBox label="CVaR 90%" value={fmtCurrency(result.cvar_90)} corTema={corTema} />
                <MetricBox label="CVaR 95%" value={fmtCurrency(result.cvar_95)} corTema={corTema} />
                <MetricBox label="CVaR 99%" value={fmtCurrency(result.cvar_99)} corTema={corTema} />
              </div>
            </div>

            {/* Return distribution chart */}
            {result.return_distribution.length > 0 && (
              <div>
                <SectionTitle title="Return Distribution with VaR Lines" corTema={corTema} />
                <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                  <Plot
                    data={[
                      {
                        x: result.return_distribution.map(d => (d.bucket * 100).toFixed(3)),
                        y: result.return_distribution.map(d => d.count),
                        type: 'bar' as const,
                        marker: {
                          color: result.return_distribution.map(d => {
                            const r = d.bucket
                            if (r < -0.028) return LINE_RED
                            if (r < -0.019) return BAR_ORANGE
                            if (r < -0.012) return LINE_AMBER
                            return LINE_BLUE
                          }),
                        },
                        name: 'Returns',
                      },
                    ]}
                    layout={{
                      ...PLOTLY_DARK_LAYOUT,
                      height: 350,
                      bargap: 0.02,
                      xaxis: { title: 'Daily Return (%)', gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      yaxis: { title: 'Frequency', gridcolor: '#1f1f1f', zerolinecolor: '#222', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      showlegend: false,
                    }}
                    config={PLOTLY_CONFIG}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}

            {/* Stress scenarios */}
            {result.stress_scenarios.length > 0 && (
              <div>
                <SectionTitle title="Stress Scenarios" corTema={corTema} />
                <div className="border border-neutral-800/60 rounded overflow-hidden min-h-[350px]">
                  <Plot
                    data={[{
                      type: 'bar' as const,
                      x: result.stress_scenarios.map(s => s.name),
                      y: result.stress_scenarios.map(s => -s.loss),
                      marker: {
                        color: result.stress_scenarios.map(s => {
                          const pct = s.loss / params.portfolio_value
                          if (pct > 0.4) return LINE_RED
                          if (pct > 0.25) return BAR_ORANGE
                          return LINE_AMBER
                        }),
                      },
                      text: result.stress_scenarios.map(s => fmtCurrency(-s.loss)),
                      textposition: 'outside' as const,
                      textfont: { size: 9, family: 'IBM Plex Mono', color: '#999' },
                    }]}
                    layout={{
                      ...PLOTLY_DARK_LAYOUT,
                      height: 350,
                      xaxis: { gridcolor: '#1f1f1f', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' } },
                      yaxis: { title: 'P&L ($)', gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, family: 'IBM Plex Mono', color: '#888' }, titlefont: { size: 9, color: '#aaa' } },
                      showlegend: false,
                    }}
                    config={PLOTLY_CONFIG}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-[#333] uppercase tracking-widest">Configure parameters and press COMPUTE</p>
          </div>
        )}
        {loading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 size={14} className="animate-spin" style={{ color: corTema }} />
            <p className="text-[10px]" style={{ color: corTema }}>Running risk calculations...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab definitions ───────────────────────────────────────────

interface TabDef {
  id: ActiveTab
  label: string
  short: string
  icon: React.ReactNode
  description: string
}

const TABS: TabDef[] = [
  { id: 'bs', label: 'Black-Scholes', short: 'B-S', icon: <Calculator size={10} />, description: 'Option pricing + Greeks' },
  { id: 'vol-surface', label: 'Vol Surface', short: 'VOL', icon: <Activity size={10} />, description: '3D implied vol surface' },
  { id: 'monte-carlo', label: 'Monte Carlo', short: 'MC', icon: <TrendingUp size={10} />, description: 'GBM path simulation + VaR' },
  { id: 'portfolio', label: 'Portfolio', short: 'PORT', icon: <BarChart2 size={10} />, description: 'Markowitz optimizer' },
  { id: 'bond', label: 'Bond Pricer', short: 'FI', icon: <Layers size={10} />, description: 'Fixed income analytics' },
  { id: 'risk', label: 'Risk', short: 'RISK', icon: <ShieldAlert size={10} />, description: 'VaR · CVaR · Stress' },
]

// ── Root Component ────────────────────────────────────────────

export function QuantPanelV2() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [activeTab, setActiveTab] = useState<ActiveTab>('bs')
  const [engine, setEngine] = useState<Engine>('ts')

  const activeTabDef = TABS.find(t => t.id === activeTab) ?? TABS[0]

  return (
    <div className="flex h-full bg-[#050505] font-mono overflow-hidden" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div className="w-[120px] shrink-0 flex flex-col border-r border-neutral-900 bg-[#080808]">

        {/* Header */}
        <div className="px-3 py-2.5 border-b border-neutral-900">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: corTema }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: corTema }}>QUANT v2</span>
          </div>
          <p className="text-[8px] text-[#333]">Financial Tools</p>
        </div>

        {/* Tool list */}
        <nav className="flex-1 overflow-y-auto py-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full text-left px-3 py-2.5 border-b border-neutral-900/50 transition-all group"
              style={{
                backgroundColor: activeTab === tab.id ? `${corTema}0D` : 'transparent',
                borderLeft: activeTab === tab.id ? `2px solid ${corTema}` : '2px solid transparent',
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5" style={{ color: activeTab === tab.id ? corTema : '#444' }}>
                {tab.icon}
                <span className="text-[9px] font-bold tracking-wider">{tab.short}</span>
                {activeTab === tab.id && <ChevronRight size={7} className="ml-auto" />}
              </div>
              <p className="text-[8px] leading-tight" style={{ color: activeTab === tab.id ? '#999' : '#333' }}>
                {tab.description}
              </p>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-neutral-900">
          <p className="text-[7px] text-[#222] leading-tight">Powered by</p>
          <p className="text-[7px] text-[#333]">Plotly.js · TS</p>
          <p className="text-[7px] text-[#222]">+ Python backend</p>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Tab header bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-900 bg-[#080808] shrink-0">
          <div className="flex items-center gap-2" style={{ color: corTema }}>
            {activeTabDef?.icon}
            <span className="text-[10px] font-bold tracking-widest uppercase">{activeTabDef?.label}</span>
          </div>
          <div className="h-3 w-px bg-neutral-800" />
          <p className="text-[9px] text-[#444]">{activeTabDef?.description}</p>

          {/* Engine selector — right-aligned */}
          <div className="ml-auto flex items-center gap-3">
            <EngineSelector engine={engine} onChange={setEngine} corTema={corTema} />

            <div className="h-3 w-px bg-neutral-800" />

            {/* Quick tab switcher */}
            <div className="flex items-center gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-2 py-0.5 rounded text-[8px] font-bold tracking-wider border transition-all"
                  style={{
                    borderColor: activeTab === tab.id ? corTema : '#1a1a1a',
                    color: activeTab === tab.id ? corTema : '#333',
                    backgroundColor: activeTab === tab.id ? `${corTema}15` : 'transparent',
                  }}
                  title={tab.label}
                >
                  {tab.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          {activeTab === 'bs' && <BSTab corTema={corTema} engine={engine} />}
          {activeTab === 'vol-surface' && <VolSurfaceTab corTema={corTema} engine={engine} />}
          {activeTab === 'monte-carlo' && <MonteCarloTab corTema={corTema} engine={engine} />}
          {activeTab === 'portfolio' && <PortfolioTab corTema={corTema} engine={engine} />}
          {activeTab === 'bond' && <BondTab corTema={corTema} engine={engine} />}
          {activeTab === 'risk' && <RiskTab corTema={corTema} engine={engine} />}
        </div>
      </div>
    </div>
  )
}

/*
 * Usage Example:
 *
 * import { QuantPanelV2 } from '@/components/cristal/panels/QuantPanelV2'
 *
 * // In ResizableLayout.tsx, add:
 * case 'quant':
 *   return <QuantPanelV2 />
 *
 * The component self-manages all state per tab.
 * Engine selector in the header bar switches between:
 *   TS  — local TypeScript computation (always available, green dot)
 *   PY  — Python backend via /api/quant/run (yellow dot)
 *   C++ — WebAssembly via /wasm/quant.js (yellow dot)
 * Falls back to local TS if backend/WASM is unavailable.
 */
