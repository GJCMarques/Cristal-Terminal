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
  Diamond, Grid3X3, Waves, Landmark, AlertTriangle,
  LineChart, PieChart, Link2, Radio, Flame,
} from 'lucide-react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import { MathFormula, FormulaBlock } from '@/components/cristal/MathFormula'
import { normalCDF as _normalCDF, normalPDF as _normalPDF } from '@/lib/quant/statistics'

// ── Plotly (SSR-incompatible — must be dynamic) ────────────────
const Plot = dynamic(() => import('@/lib/plotly-wrapper'), { ssr: false })

// ── Types ──────────────────────────────────────────────────────

type ActiveTab = 'bs' | 'vol-surface' | 'monte-carlo' | 'portfolio' | 'bond' | 'risk' | 'exotic' | 'greeks' | 'stoch-vol' | 'rates' | 'credit' | 'econ' | 'factor' | 'copula' | 'signal' | 'stress'
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

  // High-precision normal CDF (Cody 1969, matches scipy to ~1e-16)
  const normalCDF = _normalCDF
  const normalPDF = _normalPDF

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

// ── Engine selector badge with live health check ─────────────

interface EngineStatus {
  ts: 'online'
  python: 'checking' | 'online' | 'offline'
  cpp: 'checking' | 'online' | 'offline'
}

interface EngineSelectorProps {
  engine: Engine
  onChange: (e: Engine) => void
  corTema: string
  status: EngineStatus
}

function EngineSelector({ engine, onChange, corTema, status }: EngineSelectorProps) {
  const engines: { id: Engine; label: string }[] = [
    { id: 'ts', label: 'TS' },
    { id: 'python', label: 'PY' },
    { id: 'cpp', label: 'C++' },
  ]

  const statusColor = (s: 'checking' | 'online' | 'offline') =>
    s === 'online' ? '#10b981' : s === 'checking' ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-[#444] uppercase tracking-wider mr-1">Engine</span>
      {engines.map(e => {
        const s = status[e.id]
        return (
          <button
            key={e.id}
            onClick={() => onChange(e.id)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-bold tracking-wider transition-all"
            style={{
              borderColor: engine === e.id ? corTema : '#1a1a1a',
              color: engine === e.id ? corTema : '#333',
              backgroundColor: engine === e.id ? `${corTema}15` : 'transparent',
            }}
            title={
              e.id === 'ts' ? 'Local TypeScript (always available)' :
              e.id === 'python' ? `Python via child_process (${s})` :
              `C++ WebAssembly (${s})`
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${s === 'checking' ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: statusColor(s) }}
            />
            {e.label}
          </button>
        )
      })}
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
df = superficie_vol(${params.S}, K_list, T_list, 0.05, sigma_base=${params.base_sigma}, skew=${params.skew}, convex=${params.convexity})
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
rng = np.random.default_rng(42)
S0, mu, sigma, T = ${params.S0}, ${params.mu}, ${params.sigma}, ${params.T}
n_sim, n_steps = ${params.n_simulations}, 252
dt = T / n_steps
Z = rng.standard_normal((n_sim, n_steps))
inc = (mu - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
paths = S0 * np.exp(np.cumsum(inc, axis=1))
fps = paths[:, -1].tolist()
sorted_fps = sorted(fps)
n = len(fps)
var95 = sorted_fps[int(0.05*n)]
var99 = sorted_fps[int(0.01*n)]
b95 = [p for p in fps if p <= var95]
b99 = [p for p in fps if p <= var99]
sample_paths = paths[:8, ::max(1,n_steps//50)].tolist()
print(json.dumps({
  "paths": sample_paths,
  "final_prices": fps[:2000],
  "var_95": var95, "var_99": var99,
  "cvar_95": float(np.mean(b95)) if b95 else var95,
  "cvar_99": float(np.mean(b99)) if b99 else var99,
  "mean_price": float(np.mean(fps)),
  "std_price": float(np.std(fps)),
  "prob_profit": float(np.sum(np.array(fps) > S0) / n)
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
        const tickers = JSON.stringify(params.tickers?.slice(0, n) || Array.from({length: n}, (_, i) => `Asset ${i+1}`))
        const pythonCode = `
import json, numpy as np
rets_ann = ${rets}
vols_ann = ${vols}
tickers = ${tickers}
n = ${n}
rf = 0.05
rng = np.random.default_rng(42)
# Generate synthetic daily return series
series = [list(rng.normal(rets_ann[i]/252, vols_ann[i]/np.sqrt(252), 500)) for i in range(n)]
df = markowitz(series, rf, ${params.n_portfolios || 5000})
# DataFrame -> find optimal
best_idx = df['sharpe'].idxmax()
best = df.iloc[best_idx]
# Correlation matrix
R = np.array(series)
corr = np.corrcoef(R).tolist()
# Build frontier
frontier = [{"ret": float(r['retorno']), "vol": float(r['vol']), "sharpe": float(r['sharpe'])} for _, r in df.iterrows()]
print(json.dumps({
  "weights": best['pesos'],
  "tickers": tickers,
  "efficient_frontier": frontier[:500],
  "optimal_return": float(best['retorno']),
  "optimal_vol": float(best['vol']),
  "optimal_sharpe": float(best['sharpe']),
  "correlation_matrix": corr
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
    if new_ytm > 0:
        r2 = preco_bond(${params.face_value}, ${params.coupon_rate}, new_ytm, ${params.maturity})
        sens.append({"yield_shift": round(shift * 100, 1), "price": round(r2["preco"], 4)})
print(json.dumps({
    "clean_price": result["preco"],
    "dirty_price": result["preco"],
    "duration": result.get("dur_mac", 0),
    "convexity": result.get("convex", 0),
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

// ── TAB 7: Exotic Options ─────────────────────────────────────

function ExoticTab({ corTema }: { corTema: string }) {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T, setT] = useState(1)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.2)
  const [barrier, setBarrier] = useState(120)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const N = _normalCDF
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
      const d2 = d1 - sigma * Math.sqrt(T)
      const bsCall = S * N(d1) - K * Math.exp(-r * T) * N(d2)
      const bsPut = K * Math.exp(-r * T) * N(-d2) - S * N(-d1)
      // Asian geometric (closed-form)
      const sigmaA = sigma / Math.sqrt(3)
      const rA = 0.5 * (r - 0.5 * sigma * sigma + r + 0.5 * sigmaA * sigmaA)
      const d1a = (Math.log(S / K) + (rA + 0.5 * sigmaA * sigmaA) * T) / (sigmaA * Math.sqrt(T))
      const d2a = d1a - sigmaA * Math.sqrt(T)
      const asianCall = Math.exp(-r * T) * (S * Math.exp(rA * T) * N(d1a) - K * N(d2a))
      // Digital cash-or-nothing
      const digitalCall = Math.exp(-r * T) * N(d2)
      const digitalPut = Math.exp(-r * T) * N(-d2)
      // Barrier: up-and-out call
      const lambda = (r + 0.5 * sigma * sigma) / (sigma * sigma)
      const x1 = Math.log(S / K) / (sigma * Math.sqrt(T)) + lambda * sigma * Math.sqrt(T)
      const y1 = Math.log(barrier * barrier / (S * K)) / (sigma * Math.sqrt(T)) + lambda * sigma * Math.sqrt(T)
      const barrierCall = barrier > S ? bsCall - S * Math.pow(barrier / S, 2 * lambda) * N(y1) + K * Math.exp(-r * T) * Math.pow(barrier / S, 2 * lambda - 2) * N(y1 - sigma * Math.sqrt(T)) : 0
      // Lookback (floating strike call)
      const a1 = (Math.log(S / (S * 0.9)) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
      const a2 = a1 - sigma * Math.sqrt(T)
      const lookbackCall = S * N(a1) - S * 0.9 * Math.exp(-r * T) * N(a2) + S * Math.exp(-r * T) * sigma * sigma / (2 * r) * (Math.pow(S / (S * 0.9), -2 * r / (sigma * sigma)) * N(-a1 + 2 * r * Math.sqrt(T) / sigma) - Math.exp(r * T) * N(-a1))
      // Chooser option
      const chooserT = 0.5
      const d1c = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
      const d2c = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * chooserT) / (sigma * Math.sqrt(chooserT))
      const chooser = S * N(d1c) - K * Math.exp(-r * T) * N(d1c - sigma * Math.sqrt(T)) - S * N(-d2c) + K * Math.exp(-r * chooserT) * N(-d2c + sigma * Math.sqrt(chooserT))
      // Payoff curves
      const spots = Array.from({ length: 80 }, (_, i) => S * 0.5 + (S * 1.5 - S * 0.5) * i / 79)
      const payoffs = {
        call: spots.map(s => Math.max(s - K, 0)),
        put: spots.map(s => Math.max(K - s, 0)),
        digital: spots.map(s => s > K ? 1 : 0),
        barrier: spots.map(s => s > barrier ? 0 : Math.max(s - K, 0)),
      }
      setResult({ bsCall, bsPut, asianCall, digitalCall, digitalPut, barrierCall: Math.max(barrierCall, 0), lookbackCall: Math.abs(lookbackCall), chooser: Math.max(chooser, 0), spots, payoffs })
      setLoading(false)
    }, 50)
  }, [S, K, T, r, sigma, barrier])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex gap-4">
        <div className="w-[200px] shrink-0 space-y-2">
          <SectionTitle title="Parameters" corTema={corTema} />
          <NumberInput label="Spot S" value={S} onChange={setS} min={1} step={1} />
          <NumberInput label="Strike K" value={K} onChange={setK} min={1} step={1} />
          <NumberInput label="Maturity T" value={T} onChange={setT} min={0.01} step={0.1} />
          <NumberInput label="Rate r" value={r} onChange={setR} step={0.005} />
          <NumberInput label="Vol σ" value={sigma} onChange={setSigma} min={0.01} step={0.01} />
          <NumberInput label="Barrier H" value={barrier} onChange={setBarrier} min={1} step={1} />
          <button onClick={compute} disabled={loading} className="w-full py-2 rounded text-[9px] font-bold tracking-widest" style={{ backgroundColor: corTema, color: '#000' }}>
            {loading ? 'COMPUTING...' : 'COMPUTE'}
          </button>
          <FormulaBlock label="Asian Geometric" tex="C_{asian} = e^{-rT}[Se^{r_AT}N(d_1^A) - KN(d_2^A)]" />
          <FormulaBlock label="Digital Cash-or-Nothing" tex="C_{dig} = e^{-rT}N(d_2)" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {!result && !loading && <div className="flex items-center justify-center h-64 text-[#333] text-[10px]">Configure parameters and press COMPUTE</div>}
          {result && (
            <>
              <div className="grid grid-cols-4 gap-2">
                <MetricBox label="BS Call" value={`$${fmt2(result.bsCall)}`} corTema={corTema} />
                <MetricBox label="Asian Geometric" value={`$${fmt2(result.asianCall)}`} corTema={corTema} highlight />
                <MetricBox label="Digital Call" value={`$${fmt2(result.digitalCall)}`} corTema={corTema} />
                <MetricBox label="Barrier (U&O)" value={`$${fmt2(result.barrierCall)}`} corTema={corTema} />
                <MetricBox label="BS Put" value={`$${fmt2(result.bsPut)}`} corTema={corTema} />
                <MetricBox label="Lookback" value={`$${fmt2(result.lookbackCall)}`} corTema={corTema} highlight />
                <MetricBox label="Digital Put" value={`$${fmt2(result.digitalPut)}`} corTema={corTema} />
                <MetricBox label="Chooser" value={`$${fmt2(result.chooser)}`} corTema={corTema} />
              </div>
              <Plot data={[
                { x: result.spots, y: result.payoffs.call, type: 'scatter', mode: 'lines', name: 'Call', line: { color: LINE_BLUE, width: 2 } },
                { x: result.spots, y: result.payoffs.put, type: 'scatter', mode: 'lines', name: 'Put', line: { color: LINE_RED, width: 2 } },
                { x: result.spots, y: result.payoffs.digital, type: 'scatter', mode: 'lines', name: 'Digital', line: { color: LINE_GREEN, width: 2 } },
                { x: result.spots, y: result.payoffs.barrier, type: 'scatter', mode: 'lines', name: 'Barrier', line: { color: LINE_AMBER, width: 2 } },
              ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'Exotic Payoff Profiles', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TAB 8: Greeks Laboratory ──────────────────────────────────

function GreeksTab({ corTema }: { corTema: string }) {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T, setT] = useState(1)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.2)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const N = _normalCDF, n = _normalPDF
      const spots = Array.from({ length: 40 }, (_, i) => S * 0.6 + (S * 1.4 - S * 0.6) * i / 39)
      const maturities = Array.from({ length: 20 }, (_, i) => 0.05 + 2.0 * i / 19)
      const deltaSurface: number[][] = []
      const gammaSurface: number[][] = []
      const vegaSurface: number[][] = []
      const thetaSurface: number[][] = []
      for (const mat of maturities) {
        const dRow: number[] = [], gRow: number[] = [], vRow: number[] = [], tRow: number[] = []
        for (const s of spots) {
          const d1 = (Math.log(s / K) + (r + 0.5 * sigma * sigma) * mat) / (sigma * Math.sqrt(mat))
          dRow.push(N(d1))
          gRow.push(n(d1) / (s * sigma * Math.sqrt(mat)))
          vRow.push(s * n(d1) * Math.sqrt(mat) / 100)
          tRow.push(-(s * n(d1) * sigma) / (2 * Math.sqrt(mat)) / 365)
        }
        deltaSurface.push(dRow)
        gammaSurface.push(gRow)
        vegaSurface.push(vRow)
        thetaSurface.push(tRow)
      }
      // Cross-sections at current T
      const crossSection = spots.map(s => {
        const d1 = (Math.log(s / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
        return { spot: s, delta: N(d1), gamma: n(d1) / (s * sigma * Math.sqrt(T)), vega: s * n(d1) * Math.sqrt(T) / 100, theta: -(s * n(d1) * sigma) / (2 * Math.sqrt(T)) / 365 }
      })
      setResult({ spots, maturities, deltaSurface, gammaSurface, vegaSurface, thetaSurface, crossSection })
      setLoading(false)
    }, 50)
  }, [S, K, T, r, sigma])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex gap-3 items-end">
        <NumberInput label="Spot" value={S} onChange={setS} min={1} step={1} />
        <NumberInput label="Strike" value={K} onChange={setK} min={1} step={1} />
        <NumberInput label="T" value={T} onChange={setT} min={0.01} step={0.1} />
        <NumberInput label="r" value={r} onChange={setR} step={0.005} />
        <NumberInput label="σ" value={sigma} onChange={setSigma} min={0.01} step={0.01} />
        <button onClick={compute} disabled={loading} className="px-4 py-2 rounded text-[9px] font-bold tracking-widest shrink-0" style={{ backgroundColor: corTema, color: '#000' }}>COMPUTE</button>
      </div>
      <FormulaBlock label="Greeks" tex="\Delta = N(d_1), \quad \Gamma = \frac{n(d_1)}{S\sigma\sqrt{T}}, \quad \mathcal{V} = S\,n(d_1)\sqrt{T}, \quad \Theta = -\frac{S\,n(d_1)\sigma}{2\sqrt{T}}" />
      {result && (
        <div className="grid grid-cols-2 gap-3">
          <Plot data={[{ z: result.deltaSurface, x: result.spots, y: result.maturities, type: 'surface', colorscale: VIRIDIS_COLORSCALE, showscale: false }]}
            layout={{ ...PLOTLY_DARK_LAYOUT, height: 400, scene: { ...PLOTLY_DARK_LAYOUT.scene, xaxis: { ...PLOTLY_DARK_LAYOUT.scene.xaxis, title: { text: 'Spot', font: { size: 8 } } }, yaxis: { ...PLOTLY_DARK_LAYOUT.scene.yaxis, title: { text: 'T', font: { size: 8 } } }, zaxis: { ...PLOTLY_DARK_LAYOUT.scene.zaxis, title: { text: 'Delta', font: { size: 8 } } } }, title: { text: 'Delta Surface', font: { size: 10, color: '#888' } }, margin: { l: 0, r: 0, t: 30, b: 0 } } as any}
            config={PLOTLY_CONFIG} style={{ width: '100%', height: 400 }} />
          <Plot data={[{ z: result.gammaSurface, x: result.spots, y: result.maturities, type: 'surface', colorscale: PLASMA_COLORSCALE, showscale: false }]}
            layout={{ ...PLOTLY_DARK_LAYOUT, height: 400, scene: { ...PLOTLY_DARK_LAYOUT.scene, xaxis: { ...PLOTLY_DARK_LAYOUT.scene.xaxis, title: { text: 'Spot', font: { size: 8 } } }, yaxis: { ...PLOTLY_DARK_LAYOUT.scene.yaxis, title: { text: 'T', font: { size: 8 } } }, zaxis: { ...PLOTLY_DARK_LAYOUT.scene.zaxis, title: { text: 'Gamma', font: { size: 8 } } } }, title: { text: 'Gamma Surface', font: { size: 10, color: '#888' } }, margin: { l: 0, r: 0, t: 30, b: 0 } } as any}
            config={PLOTLY_CONFIG} style={{ width: '100%', height: 400 }} />
          <Plot data={[{ z: result.vegaSurface, x: result.spots, y: result.maturities, type: 'surface', colorscale: VIRIDIS_COLORSCALE, showscale: false }]}
            layout={{ ...PLOTLY_DARK_LAYOUT, height: 400, scene: { ...PLOTLY_DARK_LAYOUT.scene, xaxis: { ...PLOTLY_DARK_LAYOUT.scene.xaxis, title: { text: 'Spot', font: { size: 8 } } }, yaxis: { ...PLOTLY_DARK_LAYOUT.scene.yaxis, title: { text: 'T', font: { size: 8 } } }, zaxis: { ...PLOTLY_DARK_LAYOUT.scene.zaxis, title: { text: 'Vega', font: { size: 8 } } } }, title: { text: 'Vega Surface', font: { size: 10, color: '#888' } }, margin: { l: 0, r: 0, t: 30, b: 0 } } as any}
            config={PLOTLY_CONFIG} style={{ width: '100%', height: 400 }} />
          <Plot data={[
            { x: result.crossSection.map((c: any) => c.spot), y: result.crossSection.map((c: any) => c.delta), type: 'scatter', mode: 'lines', name: 'Delta', line: { color: LINE_BLUE, width: 2 } },
            { x: result.crossSection.map((c: any) => c.spot), y: result.crossSection.map((c: any) => c.gamma * 100), type: 'scatter', mode: 'lines', name: 'Gamma×100', line: { color: LINE_RED, width: 2 } },
            { x: result.crossSection.map((c: any) => c.spot), y: result.crossSection.map((c: any) => c.vega), type: 'scatter', mode: 'lines', name: 'Vega', line: { color: LINE_GREEN, width: 2 } },
          ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 400, title: { text: `Greeks @ T=${T}`, font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any}
            config={PLOTLY_CONFIG} style={{ width: '100%', height: 400 }} />
        </div>
      )}
    </div>
  )
}

// ── TAB 9: Stochastic Volatility ──────────────────────────────

function StochVolTab({ corTema }: { corTema: string }) {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T, setT] = useState(1)
  const [r, setR] = useState(0.05)
  const [v0, setV0] = useState(0.04)
  const [kappa, setKappa] = useState(2)
  const [theta, setTheta] = useState(0.04)
  const [xi, setXi] = useState(0.3)
  const [rho, setRho] = useState(-0.7)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const N = _normalCDF
      const nPaths = 2000; const nSteps = 100; const dt = T / nSteps
      let sumPayoff = 0
      const volPaths: number[][] = []; const pricePaths: number[][] = []
      for (let p = 0; p < nPaths; p++) {
        let s = S, v = v0
        const vPath = [Math.sqrt(v)]; const sPath = [s]
        for (let i = 0; i < nSteps; i++) {
          const z1 = randn(); const z2 = rho * z1 + Math.sqrt(1 - rho * rho) * randn()
          v = Math.max(v + kappa * (theta - v) * dt + xi * Math.sqrt(Math.max(v, 0) * dt) * z1, 0.0001)
          s = s * Math.exp((r - 0.5 * v) * dt + Math.sqrt(v * dt) * z2)
          if (p < 8) { vPath.push(Math.sqrt(v)); sPath.push(s) }
        }
        sumPayoff += Math.max(s - K, 0)
        if (p < 8) { volPaths.push(vPath); pricePaths.push(sPath) }
      }
      const hestonPrice = Math.exp(-r * T) * sumPayoff / nPaths
      // BS price for comparison
      const bsSigma = Math.sqrt(v0)
      const d1 = (Math.log(S / K) + (r + 0.5 * v0) * T) / (bsSigma * Math.sqrt(T))
      const d2 = d1 - bsSigma * Math.sqrt(T)
      const bsPrice = S * N(d1) - K * Math.exp(-r * T) * N(d2)
      // Vol smile (strike range)
      const strikes = Array.from({ length: 30 }, (_, i) => S * 0.7 + (S * 1.3 - S * 0.7) * i / 29)
      const hestonSmile: number[] = []; const bsSmile: number[] = []
      for (const k of strikes) {
        const moneyness = Math.log(k / S)
        const skew = rho * xi / kappa * moneyness * 0.8
        const smile = Math.sqrt(v0) + skew + 0.5 * xi * xi / (kappa * kappa) * moneyness * moneyness
        hestonSmile.push(Math.max(smile, 0.05))
        bsSmile.push(Math.sqrt(v0))
      }
      const times = Array.from({ length: nSteps + 1 }, (_, i) => i * dt)
      setResult({ hestonPrice, bsPrice, pricePaths, volPaths, strikes, hestonSmile, bsSmile, times })
      setLoading(false)
    }, 100)
  }, [S, K, T, r, v0, kappa, theta, xi, rho])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex gap-4">
        <div className="w-[200px] shrink-0 space-y-2">
          <SectionTitle title="Heston Parameters" corTema={corTema} />
          <NumberInput label="Spot S" value={S} onChange={setS} min={1} step={1} />
          <NumberInput label="Strike K" value={K} onChange={setK} min={1} step={1} />
          <NumberInput label="v₀" value={v0} onChange={setV0} min={0.001} step={0.005} />
          <NumberInput label="κ (mean rev)" value={kappa} onChange={setKappa} min={0.1} step={0.1} />
          <NumberInput label="θ (long-run)" value={theta} onChange={setTheta} min={0.001} step={0.005} />
          <NumberInput label="ξ (vol-of-vol)" value={xi} onChange={setXi} min={0.01} step={0.05} />
          <NumberInput label="ρ (correlation)" value={rho} onChange={setRho} min={-1} max={1} step={0.05} />
          <button onClick={compute} disabled={loading} className="w-full py-2 rounded text-[9px] font-bold tracking-widest" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
          <FormulaBlock label="Heston SDE" tex="dv_t = \kappa(\theta - v_t)dt + \xi\sqrt{v_t}dW_t^v" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {result && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <MetricBox label="Heston MC Price" value={`$${fmt2(result.hestonPrice)}`} corTema={corTema} highlight />
                <MetricBox label="BS Price (flat vol)" value={`$${fmt2(result.bsPrice)}`} corTema={corTema} />
                <MetricBox label="Skew Effect" value={`${((result.hestonPrice - result.bsPrice) / result.bsPrice * 100).toFixed(2)}%`} corTema={corTema} />
              </div>
              <Plot data={result.pricePaths.map((path: number[], i: number) => ({ x: result.times, y: path, type: 'scatter', mode: 'lines', line: { color: [LINE_BLUE, LINE_RED, LINE_GREEN, LINE_AMBER, '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'][i], width: 1 }, showlegend: false }))}
                layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Heston Price Paths', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
              <div className="grid grid-cols-2 gap-3">
                <Plot data={result.volPaths.map((path: number[], i: number) => ({ x: result.times, y: path, type: 'scatter', mode: 'lines', line: { color: [LINE_BLUE, LINE_RED, LINE_GREEN, LINE_AMBER, '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'][i], width: 1 }, showlegend: false }))}
                  layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Stochastic Vol Paths (√v)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
                <Plot data={[
                  { x: result.strikes, y: result.hestonSmile, type: 'scatter', mode: 'lines', name: 'Heston', line: { color: LINE_BLUE, width: 2 } },
                  { x: result.strikes, y: result.bsSmile, type: 'scatter', mode: 'lines', name: 'BS (flat)', line: { color: '#555', width: 1, dash: 'dot' } },
                ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Volatility Smile', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TAB 10: Interest Rates ────────────────────────────────────

function RatesTab({ corTema }: { corTema: string }) {
  const [r0, setR0] = useState(0.05)
  const [kappa, setKappa] = useState(0.5)
  const [theta, setTheta] = useState(0.05)
  const [sigma, setSigma] = useState(0.02)
  const [T, setT] = useState(10)
  const [model, setModel] = useState<'vasicek' | 'cir'>('vasicek')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const nPaths = 12; const dt = 0.01; const nSteps = Math.round(T / dt)
      const times = Array.from({ length: nSteps + 1 }, (_, i) => i * dt)
      const paths: number[][] = []
      for (let p = 0; p < nPaths; p++) {
        const path = [r0]
        for (let i = 1; i <= nSteps; i++) {
          const rPrev = Math.max(path[i - 1], 0)
          const z = randn()
          if (model === 'vasicek') {
            path.push(rPrev + kappa * (theta - rPrev) * dt + sigma * Math.sqrt(dt) * z)
          } else {
            path.push(Math.max(rPrev + kappa * (theta - rPrev) * dt + sigma * Math.sqrt(Math.max(rPrev, 0) * dt) * z, 0))
          }
        }
        paths.push(path.filter((_, i) => i % 10 === 0))
      }
      const sampledTimes = times.filter((_, i) => i % 10 === 0)
      // Yield curve
      const maturities = Array.from({ length: 40 }, (_, i) => 0.25 + i * 0.5)
      const yieldCurve = maturities.map(m => {
        let price: number
        if (model === 'vasicek') {
          const B = (1 - Math.exp(-kappa * m)) / kappa
          const A = (theta - sigma * sigma / (2 * kappa * kappa)) * (B - m) - sigma * sigma * B * B / (4 * kappa)
          price = Math.exp(A - B * r0)
        } else {
          const h = Math.sqrt(kappa * kappa + 2 * sigma * sigma)
          const An = 2 * h * Math.exp((kappa + h) * m / 2)
          const Ad = 2 * h + (kappa + h) * (Math.exp(h * m) - 1)
          const Af = Math.pow(An / Ad, 2 * kappa * theta / (sigma * sigma))
          const Bf = 2 * (Math.exp(h * m) - 1) / (2 * h + (kappa + h) * (Math.exp(h * m) - 1))
          price = Af * Math.exp(-Bf * r0)
        }
        return { T: m, yield: -Math.log(Math.max(price, 1e-10)) / m, price }
      })
      // Rate distribution at final time
      const finalRates = paths.map(p => p[p.length - 1])
      setResult({ paths, sampledTimes, yieldCurve, finalRates })
      setLoading(false)
    }, 100)
  }, [r0, kappa, theta, sigma, T, model])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex gap-4">
        <div className="w-[200px] shrink-0 space-y-2">
          <SectionTitle title="Model Parameters" corTema={corTema} />
          <div className="space-y-0.5">
            <label className="text-[9px] text-[#888] uppercase tracking-wider">Model</label>
            <select value={model} onChange={e => setModel(e.target.value as any)} className="w-full bg-[#0a0a0a] border border-neutral-800 text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono">
              <option value="vasicek">Vasicek</option>
              <option value="cir">Cox-Ingersoll-Ross</option>
            </select>
          </div>
          <NumberInput label="r₀ (initial)" value={r0} onChange={setR0} step={0.005} />
          <NumberInput label="κ (mean rev)" value={kappa} onChange={setKappa} min={0.01} step={0.1} />
          <NumberInput label="θ (long-run)" value={theta} onChange={setTheta} step={0.005} />
          <NumberInput label="σ (vol)" value={sigma} onChange={setSigma} min={0.001} step={0.005} />
          <NumberInput label="T (horizon)" value={T} onChange={setT} min={1} max={30} step={1} />
          <button onClick={compute} disabled={loading} className="w-full py-2 rounded text-[9px] font-bold tracking-widest" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
          <FormulaBlock label={model === 'vasicek' ? 'Vasicek SDE' : 'CIR SDE'} tex={model === 'vasicek' ? 'dr_t = \\kappa(\\theta - r_t)dt + \\sigma\\,dW_t' : 'dr_t = \\kappa(\\theta - r_t)dt + \\sigma\\sqrt{r_t}\\,dW_t'} />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {result && (
            <>
              <Plot data={result.paths.map((path: number[], i: number) => ({ x: result.sampledTimes, y: path, type: 'scatter', mode: 'lines', line: { color: `hsl(${i * 30}, 70%, 60%)`, width: 1 }, showlegend: false }))}
                layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: `${model.toUpperCase()} Short Rate Paths`, font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
              <div className="grid grid-cols-2 gap-3">
                <Plot data={[{ x: result.yieldCurve.map((y: any) => y.T), y: result.yieldCurve.map((y: any) => y.yield * 100), type: 'scatter', mode: 'lines', line: { color: LINE_BLUE, width: 2 } }]}
                  layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Zero-Coupon Yield Curve (%)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
                <Plot data={[{ x: result.finalRates, type: 'histogram', nbinsx: 25, marker: { color: LINE_GREEN + '88' } }]}
                  layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: `Rate Distribution at T=${T}`, font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TAB 11: Credit Risk ───────────────────────────────────────

function CreditTab({ corTema }: { corTema: string }) {
  const [V, setV] = useState(100)
  const [D, setD] = useState(80)
  const [T, setT] = useState(5)
  const [r, setR] = useState(0.05)
  const [sigmaV, setSigmaV] = useState(0.25)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const N = _normalCDF
      const d1 = (Math.log(V / D) + (r + 0.5 * sigmaV * sigmaV) * T) / (sigmaV * Math.sqrt(T))
      const d2 = d1 - sigmaV * Math.sqrt(T)
      const equity = V * N(d1) - D * Math.exp(-r * T) * N(d2)
      const defaultProb = N(-d2)
      const dd = d2
      const debtValue = V - equity
      const yieldDebt = -Math.log(debtValue / D) / T
      const creditSpread = Math.max(yieldDebt - r, 0)
      // Term structure of PD and spread
      const termStructure = Array.from({ length: 40 }, (_, i) => {
        const t = (i + 1) * 0.25
        const d2t = (Math.log(V / D) + (r - 0.5 * sigmaV * sigmaV) * t) / (sigmaV * Math.sqrt(t))
        return { T: t, pd: N(-d2t), spread: Math.max(-Math.log((V - V * N((Math.log(V / D) + (r + 0.5 * sigmaV * sigmaV) * t) / (sigmaV * Math.sqrt(t))) + D * Math.exp(-r * t) * N(d2t)) / D) / t - r, 0) * 10000 }
      })
      // Firm value paths with default barrier
      const nPaths = 10; const nSteps = 100; const dt = T / nSteps
      const firmPaths: number[][] = []
      for (let p = 0; p < nPaths; p++) {
        const path = [V]
        for (let i = 1; i <= nSteps; i++) {
          const prev = path[i - 1]
          path.push(prev * Math.exp((r - 0.5 * sigmaV * sigmaV) * dt + sigmaV * Math.sqrt(dt) * randn()))
        }
        firmPaths.push(path)
      }
      const firmTimes = Array.from({ length: nSteps + 1 }, (_, i) => i * dt)
      // CDS spread from hazard rate
      const hazardRate = creditSpread / (1 - 0.4) // assume 40% recovery
      const recovery = 0.4
      const cdsDt = 0.25; const cdsN = Math.round(T / cdsDt)
      let protLeg = 0, premLeg = 0
      for (let i = 1; i <= cdsN; i++) {
        const t = i * cdsDt
        const sp = Math.exp(-hazardRate * t); const sp_prev = Math.exp(-hazardRate * (t - cdsDt))
        const df = Math.exp(-r * t)
        protLeg += (1 - recovery) * (sp_prev - sp) * df
        premLeg += cdsDt * sp * df
      }
      const cdsSpread = premLeg > 0 ? protLeg / premLeg * 10000 : 0
      setResult({ equity, defaultProb, dd, creditSpread: creditSpread * 10000, debtValue, termStructure, firmPaths, firmTimes, cdsSpread })
      setLoading(false)
    }, 100)
  }, [V, D, T, r, sigmaV])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex gap-4">
        <div className="w-[200px] shrink-0 space-y-2">
          <SectionTitle title="Merton Model" corTema={corTema} />
          <NumberInput label="Firm Value V" value={V} onChange={setV} min={1} step={5} />
          <NumberInput label="Debt D" value={D} onChange={setD} min={1} step={5} />
          <NumberInput label="T (maturity)" value={T} onChange={setT} min={0.5} step={0.5} />
          <NumberInput label="Rate r" value={r} onChange={setR} step={0.005} />
          <NumberInput label="σ_V (asset vol)" value={sigmaV} onChange={setSigmaV} min={0.01} step={0.01} />
          <button onClick={compute} disabled={loading} className="w-full py-2 rounded text-[9px] font-bold tracking-widest" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
          <FormulaBlock label="Distance-to-Default" tex="DD = \frac{\ln(V/D) + (\mu - \frac{1}{2}\sigma_V^2)T}{\sigma_V\sqrt{T}}" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {result && (
            <>
              <div className="grid grid-cols-4 gap-2">
                <MetricBox label="Equity Value" value={`$${fmt2(result.equity, 2)}`} corTema={corTema} />
                <MetricBox label="Default Prob" value={fmtPct(result.defaultProb)} corTema={corTema} highlight />
                <MetricBox label="Distance-to-Default" value={fmt2(result.dd, 2)} corTema={corTema} />
                <MetricBox label="Credit Spread" value={`${result.creditSpread.toFixed(0)} bps`} corTema={corTema} highlight />
                <MetricBox label="Debt Value" value={`$${fmt2(result.debtValue, 2)}`} corTema={corTema} />
                <MetricBox label="CDS Spread" value={`${result.cdsSpread.toFixed(0)} bps`} corTema={corTema} />
              </div>
              <Plot data={[
                ...result.firmPaths.map((path: number[], i: number) => ({ x: result.firmTimes, y: path, type: 'scatter', mode: 'lines', line: { color: `hsl(${i * 36}, 70%, 60%)`, width: 1 }, showlegend: false })),
                { x: [0, T], y: [D, D], type: 'scatter', mode: 'lines', name: 'Default Barrier', line: { color: LINE_RED, width: 2, dash: 'dash' } },
              ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'Firm Value Paths vs Default Barrier', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
              <div className="grid grid-cols-2 gap-3">
                <Plot data={[{ x: result.termStructure.map((t: any) => t.T), y: result.termStructure.map((t: any) => t.pd * 100), type: 'scatter', mode: 'lines', line: { color: LINE_RED, width: 2 } }]}
                  layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Default Probability Term Structure (%)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
                <Plot data={[{ x: result.termStructure.map((t: any) => t.T), y: result.termStructure.map((t: any) => t.spread), type: 'scatter', mode: 'lines', line: { color: LINE_AMBER, width: 2 } }]}
                  layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Credit Spread Term Structure (bps)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TAB 12: Econometrics ──────────────────────────────────────

function EconTab({ corTema }: { corTema: string }) {
  const [nObs, setNObs] = useState(500)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(async () => {
    setLoading(true)
    setTimeout(() => {
      const { acf: acfFn, pacf: pacfFn, hurstExponent: hurstFn, garchFit: garchFn, regimeDetection: regimeFn, spectralDensity: spectralFn } = require('@/lib/quant/econometrics')
      // Generate regime-switching data
      const data: number[] = []; let regime = 0
      for (let i = 0; i < nObs; i++) {
        if (Math.random() < 0.02) regime = 1 - regime
        const mu = regime === 0 ? 0.0005 : -0.001
        const vol = regime === 0 ? 0.01 : 0.025
        data.push(mu + vol * randn())
      }
      const acfValues = acfFn(data, 30)
      const pacfValues = pacfFn(data, 30)
      const hurst = hurstFn(data)
      const garch = garchFn(data)
      const regimes = regimeFn(data, 2)
      const spectrum = spectralFn(data)
      setResult({ data, acfValues, pacfValues, hurst, garch, regimes, spectrum })
      setLoading(false)
    }, 100)
  }, [nObs])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex items-end gap-3">
        <NumberInput label="Observations" value={nObs} onChange={setNObs} min={100} max={2000} step={100} />
        <button onClick={compute} disabled={loading} className="px-4 py-2 rounded text-[9px] font-bold tracking-widest shrink-0" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
        <FormulaBlock label="GARCH(1,1)" tex="\sigma_t^2 = \omega + \alpha\,\varepsilon_{t-1}^2 + \beta\,\sigma_{t-1}^2" />
        <FormulaBlock label="Hurst" tex="H = \frac{\log(R/S)}{\log(n)}, \quad H > 0.5 \Rightarrow \text{long memory}" />
      </div>
      {result && (
        <>
          <div className="grid grid-cols-5 gap-2">
            <MetricBox label="Hurst Exponent" value={fmt2(result.hurst.H, 3)} corTema={corTema} highlight />
            <MetricBox label={result.hurst.isLongMemory ? 'Long Memory' : 'Short Memory'} value={result.hurst.isLongMemory ? 'PERSISTENT' : 'ANTIPERSIST'} corTema={corTema} />
            <MetricBox label="GARCH α" value={fmt2(result.garch.alpha, 3)} corTema={corTema} />
            <MetricBox label="GARCH β" value={fmt2(result.garch.beta, 3)} corTema={corTema} />
            <MetricBox label="Persistence" value={fmt2(result.garch.persistence, 3)} corTema={corTema} highlight />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Plot data={[
              { y: result.data, type: 'scatter', mode: 'lines', line: { color: LINE_BLUE, width: 1 }, showlegend: false },
              { y: result.garch.conditionalVol.map((v: number) => v * 2), type: 'scatter', mode: 'lines', name: '±2σ GARCH', line: { color: LINE_RED, width: 1 }, showlegend: false },
              { y: result.garch.conditionalVol.map((v: number) => -v * 2), type: 'scatter', mode: 'lines', line: { color: LINE_RED, width: 1 }, showlegend: false },
            ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Returns + GARCH Vol Bands', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={[
              { y: result.regimes.regimes, type: 'scatter', mode: 'lines', name: 'Regime', line: { color: LINE_AMBER, width: 2 } },
            ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Detected Regimes (0=calm, 1=volatile)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={[
              { x: Array.from({ length: result.acfValues.length }, (_, i) => i), y: result.acfValues, type: 'bar', marker: { color: LINE_BLUE } },
            ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'ACF', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={[
              { x: result.spectrum.freq.slice(0, 100), y: result.spectrum.power.slice(0, 100), type: 'scatter', mode: 'lines', line: { color: LINE_GREEN, width: 1 } },
            ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Power Spectral Density', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
          </div>
        </>
      )}
    </div>
  )
}

// ── TAB 13: Factor Models ─────────────────────────────────────

function FactorTab({ corTema }: { corTema: string }) {
  const [nAssets, setNAssets] = useState(8)
  const [nFactors, setNFactors] = useState(3)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const { pcaFactors, generateCorrelatedReturns } = require('@/lib/quant/factor-models')
      const means = Array.from({ length: nAssets }, (_, i) => 0.05 + i * 0.02)
      const vols = Array.from({ length: nAssets }, (_, i) => 0.15 + i * 0.03)
      const returns = generateCorrelatedReturns(nAssets, 252, means, vols)
      const pca = pcaFactors(returns, nFactors)
      setResult({ pca, nAssets, nFactors })
      setLoading(false)
    }, 100)
  }, [nAssets, nFactors])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex items-end gap-3">
        <NumberInput label="Assets" value={nAssets} onChange={setNAssets} min={3} max={20} step={1} />
        <NumberInput label="Factors" value={nFactors} onChange={setNFactors} min={1} max={10} step={1} />
        <button onClick={compute} disabled={loading} className="px-4 py-2 rounded text-[9px] font-bold tracking-widest shrink-0" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
        <FormulaBlock label="Factor Model" tex="r_i = \alpha_i + \sum_{k=1}^{K}\beta_{ik}f_k + \varepsilon_i" />
      </div>
      {result && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {result.pca.explainedVariance.map((ev: number, i: number) => (
              <MetricBox key={i} label={`Factor ${i + 1} Variance`} value={fmtPct(ev)} corTema={corTema} highlight={i === 0} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Plot data={[{ x: Array.from({ length: result.pca.eigenvalues.length }, (_, i) => `F${i + 1}`), y: result.pca.eigenvalues, type: 'bar', marker: { color: LINE_BLUE } }]}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Scree Plot (Eigenvalues)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={[{ x: Array.from({ length: result.pca.cumulativeVariance.length }, (_, i) => `F${i + 1}`), y: result.pca.cumulativeVariance.map((v: number) => v * 100), type: 'scatter', mode: 'lines+markers', line: { color: LINE_GREEN, width: 2 }, marker: { color: LINE_GREEN, size: 6 } }]}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Cumulative Explained Variance (%)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={[{ z: result.pca.loadings, type: 'heatmap', colorscale: VIRIDIS_COLORSCALE, showscale: true }]}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Factor Loadings Heatmap', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={result.pca.factorReturns.slice(0, 3).map((fr: number[], i: number) => ({ y: fr.slice(0, 100), type: 'scatter', mode: 'lines', name: `Factor ${i + 1}`, line: { color: [LINE_BLUE, LINE_RED, LINE_GREEN][i], width: 1 } }))}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Factor Returns (first 100 obs)', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
          </div>
        </>
      )}
    </div>
  )
}

// ── TAB 14: Copulas ───────────────────────────────────────────

function CopulaTab({ corTema }: { corTema: string }) {
  const [copulaType, setCopulaType] = useState<'gaussian' | 'clayton' | 'frank' | 'gumbel' | 't'>('gaussian')
  const [param, setParam] = useState(0.7)
  const [nSamples, setNSamples] = useState(2000)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const { copulaSample, tailDependence, copulaContourGrid } = require('@/lib/quant/copulas')
      const params = copulaType === 'gaussian' || copulaType === 't' ? { rho: param, nu: 5 } : { theta: param }
      const samples = copulaSample(copulaType, params, nSamples)
      const tail = tailDependence(copulaType, params)
      const contour = copulaContourGrid(copulaType === 't' ? 'gaussian' : copulaType, param, 30)
      // Compare all copula types
      const types = ['gaussian', 'clayton', 'frank', 'gumbel'] as const
      const comparison = types.map(t => {
        const td = tailDependence(t, t === 'gaussian' ? { rho: param } : { theta: Math.max(param, 0.5) })
        return { type: t, lower: td.lower, upper: td.upper }
      })
      setResult({ samples, tail, contour, comparison })
      setLoading(false)
    }, 100)
  }, [copulaType, param, nSamples])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-0.5">
          <label className="text-[9px] text-[#888] uppercase tracking-wider">Copula</label>
          <select value={copulaType} onChange={e => setCopulaType(e.target.value as any)} className="w-full bg-[#0a0a0a] border border-neutral-800 text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono">
            <option value="gaussian">Gaussian</option>
            <option value="t">Student-t</option>
            <option value="clayton">Clayton</option>
            <option value="frank">Frank</option>
            <option value="gumbel">Gumbel</option>
          </select>
        </div>
        <NumberInput label={copulaType === 'gaussian' || copulaType === 't' ? 'ρ' : 'θ'} value={param} onChange={setParam} min={-0.99} max={copulaType === 'gaussian' ? 0.99 : 10} step={0.05} />
        <NumberInput label="Samples" value={nSamples} onChange={setNSamples} min={500} max={10000} step={500} />
        <button onClick={compute} disabled={loading} className="px-4 py-2 rounded text-[9px] font-bold tracking-widest shrink-0" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
        <FormulaBlock label="Gaussian Copula" tex="C(u,v) = \Phi_2(\Phi^{-1}(u), \Phi^{-1}(v); \rho)" />
      </div>
      {result && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <MetricBox label="Lower Tail Dep" value={fmt2(result.tail.lower, 4)} corTema={corTema} highlight />
            <MetricBox label="Upper Tail Dep" value={fmt2(result.tail.upper, 4)} corTema={corTema} highlight />
            <MetricBox label="Copula Type" value={copulaType.toUpperCase()} corTema={corTema} />
            <MetricBox label="Samples" value={`${nSamples}`} corTema={corTema} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Plot data={[{ x: result.samples.u, y: result.samples.v, type: 'scatter', mode: 'markers', marker: { color: LINE_BLUE, size: 2, opacity: 0.4 } }]}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 400, title: { text: `${copulaType} Copula Samples`, font: { size: 10, color: '#888' } }, xaxis: { ...PLOTLY_DARK_LAYOUT.margin, title: { text: 'U', font: { size: 8 } } }, yaxis: { title: { text: 'V', font: { size: 8 } } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 400 }} />
            <Plot data={[{ z: result.contour.z, x: result.contour.x, y: result.contour.y, type: 'contour', colorscale: VIRIDIS_COLORSCALE, showscale: false }]}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 400, title: { text: 'Copula Density Contour', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 400 }} />
            <Plot data={[
              { x: result.comparison.map((c: any) => c.type), y: result.comparison.map((c: any) => c.lower), type: 'bar', name: 'Lower', marker: { color: LINE_BLUE } },
              { x: result.comparison.map((c: any) => c.type), y: result.comparison.map((c: any) => c.upper), type: 'bar', name: 'Upper', marker: { color: LINE_RED } },
            ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Tail Dependence Comparison', font: { size: 10, color: '#888' } }, barmode: 'group', showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
          </div>
        </>
      )}
    </div>
  )
}

// ── TAB 15: Signal Analysis ───────────────────────────────────

function SignalTab({ corTema }: { corTema: string }) {
  const [nObs, setNObs] = useState(300)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const { bollingerBands, rsi: rsiFn, macd: macdFn, fftSpectrum, decompose } = require('@/lib/quant/signal-processing')
      // Generate price-like signal
      const prices: number[] = [100]
      for (let i = 1; i < nObs; i++) {
        const trend = 0.0002
        const seasonal = 2 * Math.sin(2 * Math.PI * i / 50)
        prices.push(prices[i - 1] * Math.exp(trend + 0.015 * randn()) + seasonal * 0.01)
      }
      const bb = bollingerBands(prices, 20, 2)
      const rsiValues = rsiFn(prices, 14)
      const macdValues = macdFn(prices, 12, 26, 9)
      const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]))
      const fft = fftSpectrum(returns)
      const decomp = decompose(prices, 20)
      setResult({ prices, bb, rsi: rsiValues, macd: macdValues, fft, decomp })
      setLoading(false)
    }, 100)
  }, [nObs])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex items-end gap-3">
        <NumberInput label="Data Points" value={nObs} onChange={setNObs} min={100} max={1000} step={50} />
        <button onClick={compute} disabled={loading} className="px-4 py-2 rounded text-[9px] font-bold tracking-widest shrink-0" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
        <FormulaBlock label="RSI" tex="RSI = 100 - \frac{100}{1 + RS}, \quad RS = \frac{\overline{Gain}}{\overline{Loss}}" />
        <FormulaBlock label="Bollinger" tex="BB_{\pm} = SMA_{20} \pm 2\sigma_{20}" />
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-3">
          <Plot data={[
            { y: result.prices, type: 'scatter', mode: 'lines', name: 'Price', line: { color: LINE_BLUE, width: 1.5 } },
            { y: result.bb.upper, type: 'scatter', mode: 'lines', name: 'BB Upper', line: { color: LINE_RED, width: 1, dash: 'dot' } },
            { y: result.bb.middle, type: 'scatter', mode: 'lines', name: 'SMA20', line: { color: LINE_AMBER, width: 1 } },
            { y: result.bb.lower, type: 'scatter', mode: 'lines', name: 'BB Lower', line: { color: LINE_GREEN, width: 1, dash: 'dot' } },
          ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'Bollinger Bands', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 7, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
          <Plot data={[
            { y: result.rsi, type: 'scatter', mode: 'lines', line: { color: LINE_GREEN, width: 1.5 } },
            { y: new Array(result.rsi.length).fill(70), type: 'scatter', mode: 'lines', line: { color: LINE_RED, width: 1, dash: 'dot' }, showlegend: false },
            { y: new Array(result.rsi.length).fill(30), type: 'scatter', mode: 'lines', line: { color: LINE_GREEN, width: 1, dash: 'dot' }, showlegend: false },
          ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'RSI (14)', font: { size: 10, color: '#888' } }, yaxis: { range: [0, 100] } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
          <Plot data={[
            { y: result.macd.macd, type: 'scatter', mode: 'lines', name: 'MACD', line: { color: LINE_BLUE, width: 1.5 } },
            { y: result.macd.signal, type: 'scatter', mode: 'lines', name: 'Signal', line: { color: LINE_RED, width: 1.5 } },
            { y: result.macd.histogram, type: 'bar', name: 'Histogram', marker: { color: result.macd.histogram.map((h: number) => h >= 0 ? LINE_GREEN : LINE_RED) } },
          ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'MACD', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 7, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
          <Plot data={[{ x: result.fft.frequencies.slice(1, 80), y: result.fft.magnitudes.slice(1, 80), type: 'scatter', mode: 'lines', line: { color: LINE_AMBER, width: 1.5 } }]}
            layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'FFT Frequency Spectrum', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
          <Plot data={[
            { y: result.decomp.trend, type: 'scatter', mode: 'lines', name: 'Trend', line: { color: LINE_BLUE, width: 2 } },
          ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Trend Component', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
          <Plot data={[
            { y: result.decomp.seasonal, type: 'scatter', mode: 'lines', name: 'Seasonal', line: { color: LINE_GREEN, width: 1 } },
            { y: result.decomp.residual, type: 'scatter', mode: 'lines', name: 'Residual', line: { color: LINE_RED, width: 1, opacity: 0.6 } },
          ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Seasonal + Residual', font: { size: 10, color: '#888' } }, showlegend: true, legend: { font: { size: 7, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
        </div>
      )}
    </div>
  )
}

// ── TAB 16: Stress Testing ────────────────────────────────────

function StressTab({ corTema }: { corTema: string }) {
  const [portfolioValue, setPortfolioValue] = useState(10000000)
  const [nAssets, setNAssets] = useState(5)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const { componentVaR: cvFn, riskParity: rpFn, cornishFisherVaR: cfFn, drawdownAnalysis: ddFn, stressTest: stFn } = require('@/lib/quant/risk-models')
      // Generate portfolio
      const weights = Array.from({ length: nAssets }, () => 1 / nAssets)
      const vols = Array.from({ length: nAssets }, (_, i) => 0.15 + i * 0.05)
      const cov = Array.from({ length: nAssets }, (_, i) => Array.from({ length: nAssets }, (_, j) => {
        if (i === j) return vols[i] * vols[i]
        return 0.3 * vols[i] * vols[j]
      }))
      const returns: number[] = []
      for (let i = 0; i < 500; i++) {
        let ret = 0
        for (let a = 0; a < nAssets; a++) ret += weights[a] * (0.0003 + vols[a] / Math.sqrt(252) * randn())
        returns.push(ret)
      }
      const cv = cvFn(weights, cov, 0.95)
      const rp = rpFn(cov)
      const cf = cfFn(returns, 0.95)
      const dd = ddFn(returns)
      const stress = stFn(portfolioValue, weights, vols)
      setResult({ cv, rp, cf, dd, stress, returns })
      setLoading(false)
    }, 100)
  }, [portfolioValue, nAssets])

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex items-end gap-3">
        <NumberInput label="Portfolio ($)" value={portfolioValue} onChange={setPortfolioValue} min={100000} step={1000000} />
        <NumberInput label="Assets" value={nAssets} onChange={setNAssets} min={2} max={10} step={1} />
        <button onClick={compute} disabled={loading} className="px-4 py-2 rounded text-[9px] font-bold tracking-widest shrink-0" style={{ backgroundColor: corTema, color: '#000' }}>{loading ? 'COMPUTING...' : 'COMPUTE'}</button>
        <FormulaBlock label="Cornish-Fisher" tex="VaR_{CF} = \mu - z_{CF}\sigma, \quad z_{CF} = z + \frac{z^2-1}{6}S + \frac{z^3-3z}{24}K" />
      </div>
      {result && (
        <>
          <div className="grid grid-cols-5 gap-2">
            <MetricBox label="Portfolio VaR 95%" value={`$${(result.cv.portfolioVaR * portfolioValue).toFixed(0)}`} corTema={corTema} highlight />
            <MetricBox label="Normal VaR" value={`$${(result.cf.normalVaR * portfolioValue).toFixed(0)}`} corTema={corTema} />
            <MetricBox label="CF VaR (adj)" value={`$${(result.cf.cfVaR * portfolioValue).toFixed(0)}`} corTema={corTema} highlight />
            <MetricBox label="Max Drawdown" value={fmtPct(result.dd.maxDrawdown)} corTema={corTema} />
            <MetricBox label="Skew / Kurtosis" value={`${result.cf.skew.toFixed(2)} / ${result.cf.kurtosis.toFixed(2)}`} corTema={corTema} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Plot data={[{
              x: result.stress.scenarios.map((s: any) => s.name),
              y: result.stress.scenarios.map((s: any) => -s.portfolioLoss),
              type: 'bar',
              marker: { color: result.stress.scenarios.map((s: any) => s.portfolioLoss > 0 ? LINE_RED : LINE_GREEN) },
            }]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'Stress Scenario P&L', font: { size: 10, color: '#888' } }, xaxis: { tickangle: -45, tickfont: { size: 7 } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
            <Plot data={[{
              x: Array.from({ length: nAssets }, (_, i) => `Asset ${i + 1}`),
              y: result.cv.percentContribution,
              type: 'bar',
              marker: { color: [LINE_BLUE, LINE_RED, LINE_GREEN, LINE_AMBER, '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'].slice(0, nAssets) },
            }]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 380, title: { text: 'VaR Risk Contribution (%)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 380 }} />
            <Plot data={[{ y: result.dd.underwaterSeries.map((v: number) => v * 100), type: 'scatter', mode: 'lines', fill: 'tozeroy', line: { color: LINE_RED, width: 1 }, fillcolor: LINE_RED + '33' }]}
              layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Underwater Chart (Drawdown %)', font: { size: 10, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
            <Plot data={[
              { x: Array.from({ length: nAssets }, (_, i) => `Asset ${i + 1}`), y: result.rp.weights.map((w: number) => w * 100), type: 'bar', name: 'Risk Parity', marker: { color: LINE_BLUE } },
              { x: Array.from({ length: nAssets }, (_, i) => `Asset ${i + 1}`), y: Array.from({ length: nAssets }, () => 100 / nAssets), type: 'bar', name: 'Equal Weight', marker: { color: '#555' } },
            ]} layout={{ ...PLOTLY_DARK_LAYOUT, height: 350, title: { text: 'Risk Parity vs Equal Weight (%)', font: { size: 10, color: '#888' } }, barmode: 'group', showlegend: true, legend: { font: { size: 8, color: '#888' } } } as any} config={PLOTLY_CONFIG} style={{ width: '100%', height: 350 }} />
          </div>
        </>
      )}
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
  { id: 'exotic', label: 'Exotic Options', short: 'EXOT', icon: <Diamond size={10} />, description: 'Asian · Barrier · Digital' },
  { id: 'greeks', label: 'Greeks Lab', short: 'GRK', icon: <Grid3X3 size={10} />, description: '3D Greeks surfaces' },
  { id: 'stoch-vol', label: 'Stochastic Vol', short: 'SVOL', icon: <Waves size={10} />, description: 'Heston · SABR · Jump' },
  { id: 'rates', label: 'Interest Rates', short: 'RATE', icon: <Landmark size={10} />, description: 'Vasicek · CIR · NSS' },
  { id: 'credit', label: 'Credit Risk', short: 'CRD', icon: <AlertTriangle size={10} />, description: 'Merton · CDS · KMV' },
  { id: 'econ', label: 'Econometrics', short: 'ECN', icon: <LineChart size={10} />, description: 'GARCH · Hurst · Regime' },
  { id: 'factor', label: 'Factor Models', short: 'FAC', icon: <PieChart size={10} />, description: 'PCA · FF3 · Attribution' },
  { id: 'copula', label: 'Copulas', short: 'COP', icon: <Link2 size={10} />, description: 'Gaussian · Clayton · Tail' },
  { id: 'signal', label: 'Signal Analysis', short: 'SIG', icon: <Radio size={10} />, description: 'FFT · RSI · MACD · Bollinger' },
  { id: 'stress', label: 'Stress Testing', short: 'STR', icon: <Flame size={10} />, description: 'Scenarios · CVaR · Drawdown' },
]

// ── Root Component ────────────────────────────────────────────

export function QuantPanelV2() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [activeTab, setActiveTab] = useState<ActiveTab>('bs')
  const [engine, setEngine] = useState<Engine>('ts')
  const [engineStatus, setEngineStatus] = useState<EngineStatus>({
    ts: 'online',
    python: 'checking',
    cpp: 'checking',
  })

  // Health check Python and WASM on mount
  useEffect(() => {
    // Check Python: send a trivial computation
    fetch('/api/quant/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: 'print("OK")' }),
    })
      .then(r => r.json())
      .then(d => {
        setEngineStatus(prev => ({
          ...prev,
          python: d.stdout?.includes('OK') ? 'online' : 'offline',
        }))
      })
      .catch(() => setEngineStatus(prev => ({ ...prev, python: 'offline' })))

    // Check WASM: try to fetch quant.wasm
    fetch('/wasm/quant.wasm', { method: 'HEAD' })
      .then(r => {
        setEngineStatus(prev => ({
          ...prev,
          cpp: r.ok ? 'online' : 'offline',
        }))
      })
      .catch(() => setEngineStatus(prev => ({ ...prev, cpp: 'offline' })))
  }, [])

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
            <EngineSelector engine={engine} onChange={setEngine} corTema={corTema} status={engineStatus} />

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
          {activeTab === 'exotic' && <ExoticTab corTema={corTema} />}
          {activeTab === 'greeks' && <GreeksTab corTema={corTema} />}
          {activeTab === 'stoch-vol' && <StochVolTab corTema={corTema} />}
          {activeTab === 'rates' && <RatesTab corTema={corTema} />}
          {activeTab === 'credit' && <CreditTab corTema={corTema} />}
          {activeTab === 'econ' && <EconTab corTema={corTema} />}
          {activeTab === 'factor' && <FactorTab corTema={corTema} />}
          {activeTab === 'copula' && <CopulaTab corTema={corTema} />}
          {activeTab === 'signal' && <SignalTab corTema={corTema} />}
          {activeTab === 'stress' && <StressTab corTema={corTema} />}
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
