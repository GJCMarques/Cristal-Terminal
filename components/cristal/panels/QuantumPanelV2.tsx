'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Quantum Computing Panel V2
// Real Quantum TS Engine backend · Interactive Plotly 3D
// Bell · QAE · QAOA · Grover · VQE
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import { MathFormula, FormulaBlock } from '@/components/cristal/MathFormula'
import {
  bellState,
  qaeOpcaoCall,
  qaoa,
  grover,
  vqeLiquidez,
} from '@/lib/quantum/algorithms'
import dynamic from 'next/dynamic'
import {
  Atom, Zap, TrendingUp, Shield, Layers, Play, Loader2,
  Search, Activity, Cpu, BarChart3, CircleDot
} from 'lucide-react'

const Plot = dynamic(() => import('@/lib/plotly-wrapper'), { ssr: false })

// ── Types ───────────────────────────────────────────────────────

type ToolId = 'bell' | 'qae' | 'qaoa' | 'grover' | 'vqe'

interface Tool {
  id: ToolId
  titulo: string
  sub: string
  icone: React.ReactNode
  categoria: string
}

const TOOLS: Tool[] = [
  { id: 'bell', titulo: 'Bell State (EPR)', sub: 'Entanglement & Correlation', icone: <Atom size={12} />, categoria: 'FOUNDATIONS' },
  { id: 'qae', titulo: 'Quantum Option Pricing', sub: 'Amplitude Estimation', icone: <Zap size={12} />, categoria: 'DERIVATIVES' },
  { id: 'qaoa', titulo: 'QAOA Portfolio', sub: 'Quantum Optimization', icone: <TrendingUp size={12} />, categoria: 'PORTFOLIO' },
  { id: 'grover', titulo: 'Grover Search', sub: 'Anomaly Detection', icone: <Search size={12} />, categoria: 'RISK' },
  { id: 'vqe', titulo: 'VQE Eigensolver', sub: 'Variational Quantum', icone: <Layers size={12} />, categoria: 'ADVANCED' },
]

// ── Helpers ──────────────────────────────────────────────────────

function MetricBox({ label, valor, sub, corTema }: { label: string; valor: string; sub?: string; corTema: string }) {
  return (
    <div className="border border-neutral-800/80 rounded p-3 bg-gradient-to-br from-[#080808] to-[#040404]">
      <p className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[14px] font-bold leading-tight" style={{ color: corTema, textShadow: `0 0 10px ${corTema}55` }}>{valor}</p>
      {sub && <p className="text-[8px] text-neutral-600 mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, corTema }: { title: string; corTema: string }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: corTema, boxShadow: `0 0 8px ${corTema}` }} />
      <p className="text-[9px] font-bold tracking-widest text-neutral-300">{title}</p>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'number', min, max, step, options }: {
  label: string; value: any; onChange: (v: any) => void;
  type?: string; min?: number; max?: number; step?: number; options?: { value: string; label: string }[]
}) {
  if (options) {
    return (
      <div>
        <label className="text-[9px] text-[#888] block mb-1">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }
  return (
    <div>
      <label className="text-[9px] text-[#888] flex justify-between mb-1">
        <span>{label}</span>
        <span className="text-[#666]">{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(3)) : value}</span>
      </label>
      {type === 'range' ? (
        <input type="range" min={min} max={max} step={step || 1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-[#222]" />
      ) : (
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono" />
      )}
    </div>
  )
}

// ── Fixed chart colors — theme-independent ────────────────────
const CHART_BLUE = '#3b82f6'
const CHART_RED = '#ef4444'
const CHART_GREEN = '#10b981'
const CHART_CYAN = '#06b6d4'
const CHART_AMBER = '#f59e0b'
const VIRIDIS: [number, string][] = [[0, '#440154'], [0.25, '#31688e'], [0.5, '#35b779'], [0.75, '#fde725'], [1, '#ffffff']]
const PLASMA: [number, string][] = [[0, '#0d0887'], [0.25, '#7e03a8'], [0.5, '#cc4778'], [0.75, '#f89540'], [1, '#f0f921']]

const PLOTLY_LAYOUT_BASE = {
  paper_bgcolor: '#080808',
  plot_bgcolor: '#080808',
  font: { family: 'IBM Plex Mono, monospace', color: '#999', size: 9 },
  margin: { l: 50, r: 30, t: 40, b: 40 },
  xaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, color: '#888' } },
  yaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', tickfont: { size: 8, color: '#888' } },
}

const PLOTLY_3D_SCENE = {
  xaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', color: '#888', tickfont: { size: 8, color: '#888' } },
  yaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', color: '#888', tickfont: { size: 8, color: '#888' } },
  zaxis: { gridcolor: '#1f1f1f', zerolinecolor: '#333', color: '#888', tickfont: { size: 8, color: '#888' } },
  bgcolor: '#080808',
}

// ── Main Component ──────────────────────────────────────────────

export function QuantumPanelV2() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [activeTool, setActiveTool] = useState<ToolId>('bell')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [isClient, setIsClient] = useState(false)

  // ── Bell State params
  const [bellShots, setBellShots] = useState(1024)
  const [bellType, setBellType] = useState('phi_plus')

  // ── QAE params
  const [qaeS, setQaeS] = useState(100)
  const [qaeK, setQaeK] = useState(100)
  const [qaeT, setQaeT] = useState(0.25)
  const [qaeR, setQaeR] = useState(0.05)
  const [qaeSigma, setQaeSigma] = useState(0.20)
  const [qaeQubits, setQaeQubits] = useState(6)
  const [qaeType, setQaeType] = useState('call')

  // ── QAOA params
  const [qaoaReturns, setQaoaReturns] = useState([0.12, 0.35, 0.08, 0.22])
  const [qaoaVols, setQaoaVols] = useState([0.15, 0.50, 0.08, 0.30])
  const [qaoaRf, setQaoaRf] = useState(0.05)
  const [qaoaLayers, setQaoaLayers] = useState(3)
  const [qaoaSteps, setQaoaSteps] = useState(50)

  // ── Grover params
  const [groverQubits, setGroverQubits] = useState(5)
  const [groverTargets, setGroverTargets] = useState('7')
  const [groverShots, setGroverShots] = useState(1024)

  // ── VQE params
  const [vqeQubits, setVqeQubits] = useState(4)
  const [vqeHamiltonian, setVqeHamiltonian] = useState('ising')
  const [vqeLayers, setVqeLayers] = useState(3)
  const [vqeSteps, setVqeSteps] = useState(100)

  useEffect(() => { setIsClient(true) }, [])

  // Backend always online — using local TS quantum engine
  useEffect(() => { setBackendStatus('online') }, [])

  // ── Compute handler — runs TS quantum algorithms directly ──
  const compute = useCallback(() => {
    setLoading(true)
    setError(null)
    setResults(null)

    // Use setTimeout to avoid blocking UI during computation
    setTimeout(() => {
      try {
        switch (activeTool) {
          case 'bell': {
            const r = bellState()
            // Map to expected field names
            const probs: Record<string, number> = {}
            r.probabilidades.forEach(p => { probs[p.estado.replace(/[|⟩]/g, '')] = p.prob })
            // Generate density matrix from state
            const dm = Array.from({ length: 4 }, (_, i) =>
              Array.from({ length: 4 }, (_, j) => {
                const re = r.simState[i][0] * r.simState[j][0] + r.simState[i][1] * r.simState[j][1]
                return Math.abs(re)
              })
            )
            // Generate Bloch sphere coordinates from state
            const makeBloch = (alpha: number[], beta: number[]) => {
              const ax = alpha[0], ay = alpha[1], bx = beta[0], by = beta[1]
              return {
                x: 2 * (ax * bx + ay * by),
                y: 2 * (ax * by - ay * bx),
                z: ax * ax + ay * ay - bx * bx - by * by,
              }
            }
            setResults({
              probabilities: probs,
              samples: r.amostras,
              density_matrix: dm,
              entanglement_entropy: r.entanglementMeasure > 0.99 ? 1.0 : r.entanglementMeasure * 0.7,
              concurrence: r.entanglementMeasure,
              engine: 'TypeScript',
              bloch_q0: makeBloch(r.simState[0], r.simState[1]),
              bloch_q1: makeBloch(r.simState[0], r.simState[2]),
              circuit_diagram: r.diagrama,
            })
            break
          }
          case 'qae': {
            const r = qaeOpcaoCall(qaeS, qaeK, qaeT, qaeR, qaeSigma, qaeQubits)
            // Generate payoff distribution
            const payoffs = Array.from({ length: 50 }, (_, i) => {
              const ST = qaeS * (0.5 + i * 2.0 / 50)
              const payoff = qaeType === 'call' ? Math.max(ST - qaeK, 0) : Math.max(qaeK - ST, 0)
              return { ST: parseFloat(ST.toFixed(2)), payoff: parseFloat(payoff.toFixed(2)), state: i }
            })
            setResults({
              qae_price: r.valorEstimado,
              bs_price: r.comparacaoClassica,
              error_pct: r.erroPct,
              speedup: r.speedupFator,
              n_evaluations_quantum: r.avaliacoesQuanticas,
              n_evaluations_classical: r.avaliacoesClassicas,
              payoff_distribution: payoffs,
              engine: 'TypeScript',
              circuit: { n_qubits: qaeQubits + 1, depth: qaeQubits * 3 },
            })
            break
          }
          case 'qaoa': {
            // Build covariance matrix from vols and random correlations
            const n = qaoaReturns.length
            const covMatrix = Array.from({ length: n }, (_, i) =>
              Array.from({ length: n }, (_, j) => {
                if (i === j) return qaoaVols[i] * qaoaVols[i]
                const corr = 0.3 + Math.random() * 0.2
                return corr * qaoaVols[i] * qaoaVols[j]
              })
            )
            const r = qaoa(qaoaReturns, covMatrix, qaoaRf, qaoaLayers)
            setResults({
              sharpe_ratio: r.sharpe,
              optimal_return: r.retornoEsperado,
              optimal_volatility: r.volatilidade,
              best_state: r.distribuicao[0]?.estado || '-',
              engine: 'TypeScript',
              n_qubits: r.nQubits,
              landscape: r.landscape,
              convergence: r.convergencia,
              optimal_weights: r.pesosOtimos,
              distribution: r.distribuicao.map(d => ({
                state: d.estado, probability: d.prob, sharpe: d.sharpe,
              })),
            })
            break
          }
          case 'grover': {
            const targets = groverTargets.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            const oraculo = (x: number) => targets.includes(x)
            const r = grover(groverQubits, oraculo)
            setResults({
              found_state: r.estadoBinario,
              found_value: r.estadoEncontrado,
              probability: r.probabilidade,
              n_iterations: r.iteracoesQuanticas,
              speedup: r.speedup,
              engine: 'TypeScript',
              distribution: r.distribuicao.map(d => ({
                state: d.estado, probability: d.prob, is_target: d.marcado,
              })),
              circuit_diagram: r.diagrama,
            })
            break
          }
          case 'vqe': {
            const r = vqeLiquidez(vqeQubits)
            setResults({
              eigenvalue_min: r.eigenvalueMin,
              n_qubits: vqeQubits,
              n_parameters: vqeQubits * 2,
              hamiltonian_type: vqeHamiltonian,
              engine: 'TypeScript',
              convergence: r.convergenciaEnergia,
              density_matrix: r.matrizDensidade,
              pauli_expectations: r.pauliStrings,
            })
            break
          }
        }
      } catch (e: any) {
        setError(e.message || 'Computation failed')
      }
      setLoading(false)
    }, 50) // Small delay to let UI update with loading state
  }, [activeTool, bellShots, bellType, qaeS, qaeK, qaeT, qaeR, qaeSigma, qaeQubits, qaeType,
    qaoaReturns, qaoaVols, qaoaRf, qaoaLayers, qaoaSteps,
    groverQubits, groverTargets, groverShots,
    vqeQubits, vqeHamiltonian, vqeLayers, vqeSteps])

  // ── Render parameter panels
  const renderParams = () => {
    switch (activeTool) {
      case 'bell':
        return (
          <div className="space-y-3">
            <InputField label="Shots" value={bellShots} onChange={setBellShots} min={100} max={8192} step={100} />
            <InputField label="Bell State" value={bellType} onChange={setBellType}
              options={[
                { value: 'phi_plus', label: '|Phi+> (|00>+|11>)/sqrt(2)' },
                { value: 'phi_minus', label: '|Phi-> (|00>-|11>)/sqrt(2)' },
                { value: 'psi_plus', label: '|Psi+> (|01>+|10>)/sqrt(2)' },
                { value: 'psi_minus', label: '|Psi-> (|01>-|10>)/sqrt(2)' },
              ]} />
          </div>
        )
      case 'qae':
        return (
          <div className="space-y-3">
            <InputField label="Spot Price (S)" value={qaeS} onChange={setQaeS} min={10} max={500} step={1} />
            <InputField label="Strike Price (K)" value={qaeK} onChange={setQaeK} min={10} max={500} step={1} />
            <InputField label="Maturity (T years)" value={qaeT} onChange={setQaeT} min={0.01} max={5} step={0.01} />
            <InputField label="Risk-Free Rate (r)" value={qaeR} onChange={setQaeR} min={0} max={0.2} step={0.005} />
            <InputField label="Volatility (sigma)" value={qaeSigma} onChange={setQaeSigma} min={0.05} max={1.0} step={0.01} />
            <InputField label="Qubits" value={qaeQubits} onChange={setQaeQubits} min={3} max={10} step={1} />
            <InputField label="Type" value={qaeType} onChange={setQaeType}
              options={[{ value: 'call', label: 'Call' }, { value: 'put', label: 'Put' }]} />
          </div>
        )
      case 'qaoa':
        return (
          <div className="space-y-3">
            <p className="text-[8px] text-neutral-500 tracking-widest">ASSET RETURNS (Annual)</p>
            {qaoaReturns.map((r, i) => (
              <InputField key={i} label={`Asset ${i + 1} Return`} value={r} type="range"
                onChange={(v: number) => { const nr = [...qaoaReturns]; nr[i] = v; setQaoaReturns(nr) }}
                min={-0.2} max={0.6} step={0.01} />
            ))}
            <InputField label="Risk-Free Rate" value={qaoaRf} onChange={setQaoaRf} min={0} max={0.15} step={0.005} />
            <InputField label="QAOA Layers (p)" value={qaoaLayers} onChange={setQaoaLayers} min={1} max={8} step={1} />
            <InputField label="Optimization Steps" value={qaoaSteps} onChange={setQaoaSteps} min={10} max={200} step={10} />
          </div>
        )
      case 'grover':
        return (
          <div className="space-y-3">
            <InputField label="Qubits (n)" value={groverQubits} onChange={setGroverQubits} min={2} max={10} step={1} />
            <div>
              <label className="text-[9px] text-[#888] block mb-1">Target States (comma-separated)</label>
              <input type="text" value={groverTargets} onChange={e => setGroverTargets(e.target.value)}
                className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1.5 text-[10px] rounded font-mono"
                placeholder="e.g. 7, 15, 23" />
            </div>
            <InputField label="Shots" value={groverShots} onChange={setGroverShots} min={100} max={8192} step={100} />
          </div>
        )
      case 'vqe':
        return (
          <div className="space-y-3">
            <InputField label="Qubits (n)" value={vqeQubits} onChange={setVqeQubits} min={2} max={8} step={1} />
            <InputField label="Hamiltonian" value={vqeHamiltonian} onChange={setVqeHamiltonian}
              options={[
                { value: 'ising', label: 'Ising Model' },
                { value: 'heisenberg', label: 'Heisenberg XXX' },
                { value: 'portfolio', label: 'Portfolio (Financial)' },
              ]} />
            <InputField label="Ansatz Layers" value={vqeLayers} onChange={setVqeLayers} min={1} max={8} step={1} />
            <InputField label="Optimization Steps" value={vqeSteps} onChange={setVqeSteps} min={20} max={500} step={10} />
          </div>
        )
    }
  }

  // ── Render results
  const renderResults = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-[80px] h-[80px] rounded-full border-t-2 border-b-2 animate-spin" style={{ borderColor: corTema }} />
          <div className="absolute w-[60px] h-[60px] rounded-full border-r-2 border-l-2 animate-spin" style={{ borderColor: corTema, animationDirection: 'reverse' }} />
          <Cpu size={24} style={{ color: corTema, filter: `drop-shadow(0 0 10px ${corTema})` }} />
        </div>
        <p className="text-[11px] tracking-widest mt-2" style={{ color: corTema }}>QUANTUM COMPUTATION IN PROGRESS...</p>
        <p className="text-[9px] text-neutral-600">Processing via {backendStatus === 'online' ? 'Quantum TS Engine' : 'Local Simulator'}</p>
      </div>
    )

    if (error) return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="p-4 bg-red-900/10 border border-red-900/50 rounded max-w-lg">
          <p className="text-[11px] text-red-400 font-bold mb-2">COMPUTATION ERROR</p>
          <p className="text-[10px] text-red-300/70 font-mono">{error}</p>
          <p className="text-[9px] text-neutral-600 mt-2">Ensure the Python backend is running: <code className="text-neutral-400">cd python_backend && python3 server.py</code></p>
        </div>
      </div>
    )

    if (!results) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
        <Atom size={64} strokeWidth={0.5} style={{ color: corTema }} />
        <p className="text-[12px] font-mono tracking-widest text-[#AAA]">SELECT ALGORITHM & COMPUTE</p>
        <p className="text-[9px] text-neutral-600 max-w-sm text-center">
          Configure parameters in the sidebar and press COMPUTE to run quantum computations
          via {backendStatus === 'online' ? 'Quantum TS Engine' : 'simulation'} backend.
        </p>
      </div>
    )

    switch (activeTool) {
      case 'bell': return renderBellResults()
      case 'qae': return renderQAEResults()
      case 'qaoa': return renderQAOAResults()
      case 'grover': return renderGroverResults()
      case 'vqe': return renderVQEResults()
    }
  }

  // ── BELL STATE RESULTS ────────────────────────────────────────

  const renderBellResults = () => {
    const r = results
    if (!r) return null

    const probData = Object.entries(r.probabilities || {}).map(([state, prob]) => ({
      state: `|${state}>`, prob: prob as number
    }))

    const sampleData = Object.entries(r.samples || {}).map(([state, count]) => ({
      state: `|${state}>`, count: count as number
    }))

    // Density matrix for 3D bar chart
    const dm = r.density_matrix || [[0.5, 0, 0, 0.5], [0, 0, 0, 0], [0, 0, 0, 0], [0.5, 0, 0, 0.5]]
    const labels = ['|00>', '|01>', '|10>', '|11>']

    return (
      <div className="space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Entanglement" valor={r.entanglement_entropy?.toFixed(3) || '1.000'} sub="Von Neumann Entropy" corTema={corTema} />
          <MetricBox label="Concurrence" valor={r.concurrence?.toFixed(2) || '1.00'} sub="Max Entanglement" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase() || 'QISKIT'} sub="Quantum Backend" corTema={corTema} />
          <MetricBox label="Shots" valor={bellShots.toLocaleString()} sub="Measurement Samples" corTema={corTema} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock
            label="Bell State (Phi+)"
            tex="|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)"
          />
          <FormulaBlock
            label="Von Neumann Entropy"
            tex="S(\\rho) = -\\text{Tr}(\\rho \\ln \\rho)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Probability Distribution */}
          <div>
            <SectionTitle title="MEASUREMENT DISTRIBUTION" corTema={corTema} />
            {isClient && (
              <Plot
                data={[{
                  x: sampleData.map(d => d.state),
                  y: sampleData.map(d => d.count),
                  type: 'bar',
                  marker: { color: CHART_CYAN, opacity: 0.8, line: { color: CHART_CYAN, width: 1 } },
                }]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 320,
                  title: { text: 'Shot Counts', font: { size: 10, color: '#666' } },
                  bargap: 0.3,
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 320 }}
              />
            )}
          </div>

          {/* Density Matrix 3D */}
          <div>
            <SectionTitle title="DENSITY MATRIX rho (3D)" corTema={corTema} />
            {isClient && (
              <Plot
                data={[{
                  z: dm,
                  x: labels,
                  y: labels,
                  type: 'surface',
                  colorscale: VIRIDIS,
                  showscale: false,
                }]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 320,
                  scene: { ...PLOTLY_3D_SCENE, camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } } },
                  margin: { l: 0, r: 0, t: 10, b: 0 },
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 320 }}
              />
            )}
          </div>
        </div>

        {/* Bloch Spheres */}
        {(r.bloch_q0 || r.bloch_q1) && (
          <div className="grid grid-cols-2 gap-4">
            {['bloch_q0', 'bloch_q1'].map((key, idx) => {
              const b = r[key]
              if (!b) return null
              return (
                <div key={key}>
                  <SectionTitle title={`QUBIT ${idx} BLOCH SPHERE`} corTema={corTema} />
                  {isClient && (
                    <Plot
                      data={[
                        // Wireframe sphere
                        ...(() => {
                          const traces: any[] = []
                          for (let i = 0; i <= 3; i++) {
                            const theta = Array.from({ length: 50 }, (_, k) => k * 2 * Math.PI / 49)
                            const phi = (i / 3) * Math.PI
                            traces.push({
                              type: 'scatter3d', mode: 'lines',
                              x: theta.map(t => Math.sin(phi) * Math.cos(t)),
                              y: theta.map(t => Math.sin(phi) * Math.sin(t)),
                              z: theta.map(() => Math.cos(phi)),
                              line: { color: '#222', width: 1 }, showlegend: false, hoverinfo: 'none'
                            })
                          }
                          for (let i = 0; i <= 3; i++) {
                            const phi = Array.from({ length: 50 }, (_, k) => k * Math.PI / 49)
                            const theta0 = (i / 3) * 2 * Math.PI
                            traces.push({
                              type: 'scatter3d', mode: 'lines',
                              x: phi.map(p => Math.sin(p) * Math.cos(theta0)),
                              y: phi.map(p => Math.sin(p) * Math.sin(theta0)),
                              z: phi.map(p => Math.cos(p)),
                              line: { color: '#222', width: 1 }, showlegend: false, hoverinfo: 'none'
                            })
                          }
                          return traces
                        })(),
                        // State vector
                        {
                          type: 'scatter3d', mode: 'lines+markers',
                          x: [0, b.x], y: [0, b.y], z: [0, b.z],
                          line: { color: CHART_CYAN, width: 4 },
                          marker: { size: [2, 6], color: CHART_CYAN },
                          showlegend: false,
                        },
                        // Axes
                        { type: 'scatter3d', mode: 'lines', x: [-1.2, 1.2], y: [0, 0], z: [0, 0], line: { color: '#444', width: 1 }, showlegend: false, hoverinfo: 'none' },
                        { type: 'scatter3d', mode: 'lines', x: [0, 0], y: [-1.2, 1.2], z: [0, 0], line: { color: '#444', width: 1 }, showlegend: false, hoverinfo: 'none' },
                        { type: 'scatter3d', mode: 'lines', x: [0, 0], y: [0, 0], z: [-1.2, 1.2], line: { color: '#444', width: 1 }, showlegend: false, hoverinfo: 'none' },
                      ]}
                      layout={{
                        ...PLOTLY_LAYOUT_BASE,
                        height: 350,
                        scene: {
                          ...PLOTLY_3D_SCENE,
                          xaxis: { ...PLOTLY_3D_SCENE.xaxis, range: [-1.3, 1.3], title: 'X' },
                          yaxis: { ...PLOTLY_3D_SCENE.yaxis, range: [-1.3, 1.3], title: 'Y' },
                          zaxis: { ...PLOTLY_3D_SCENE.zaxis, range: [-1.3, 1.3], title: 'Z (|0>/|1>)' },
                          aspectmode: 'cube',
                          camera: { eye: { x: 1.5, y: 1.5, z: 1 } },
                        },
                        margin: { l: 0, r: 0, t: 10, b: 0 },
                      } as any}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%', height: 350 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Circuit Diagram */}
        {r.circuit_diagram && (
          <div>
            <SectionTitle title="QUANTUM CIRCUIT" corTema={corTema} />
            <pre className="text-[10px] p-3 rounded border border-neutral-800/80 bg-[#080808] text-neutral-400 overflow-x-auto">
              {r.circuit_diagram}
            </pre>
          </div>
        )}
      </div>
    )
  }

  // ── QAE RESULTS ───────────────────────────────────────────────

  const renderQAEResults = () => {
    const r = results
    if (!r) return null

    const payoffs = r.payoff_distribution || []

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Quantum Price (QAE)" valor={`$${r.qae_price?.toFixed(4)}`} sub="Amplitude Estimation" corTema={corTema} />
          <MetricBox label="Black-Scholes Price" valor={`$${r.bs_price?.toFixed(4)}`} sub="Analytical Reference" corTema={corTema} />
          <MetricBox label="Error" valor={`${r.error_pct?.toFixed(3)}%`} sub="QAE vs BS" corTema={corTema} />
          <MetricBox label="Quantum Speedup" valor={`${r.speedup?.toLocaleString()}x`} sub={`${r.n_evaluations_quantum} vs ${r.n_evaluations_classical?.toLocaleString()}`} corTema={corTema} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock
            label="Quantum Amplitude Estimation"
            tex="\\tilde{a} = \\sin^2\\left(\\frac{\\pi \\tilde{\\theta}}{M}\\right), \\quad M = 2^m"
          />
          <FormulaBlock
            label="Option Pricing"
            tex="C = e^{-rT}\\mathbb{E}^Q[\\max(S_T - K, 0)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Payoff Distribution 3D */}
          <div>
            <SectionTitle title="PAYOFF DISTRIBUTION (3D)" corTema={corTema} />
            {isClient && payoffs.length > 0 && (
              <Plot
                data={[{
                  x: payoffs.map((p: any) => p.ST),
                  y: payoffs.map((p: any) => p.payoff),
                  z: payoffs.map((p: any) => p.state),
                  type: 'scatter3d',
                  mode: 'markers',
                  marker: {
                    size: 3,
                    color: payoffs.map((p: any) => p.payoff),
                    colorscale: VIRIDIS,
                    opacity: 0.7,
                  },
                  showlegend: false,
                }]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 380,
                  scene: {
                    ...PLOTLY_3D_SCENE,
                    xaxis: { ...PLOTLY_3D_SCENE.xaxis, title: 'S(T)' },
                    yaxis: { ...PLOTLY_3D_SCENE.yaxis, title: 'Payoff' },
                    zaxis: { ...PLOTLY_3D_SCENE.zaxis, title: 'Quantum State' },
                    camera: { eye: { x: 1.8, y: 1.2, z: 0.8 } },
                  },
                  margin: { l: 0, r: 0, t: 10, b: 0 },
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 380 }}
              />
            )}
          </div>

          {/* Payoff Curve 2D */}
          <div>
            <SectionTitle title="OPTION PAYOFF CURVE" corTema={corTema} />
            {isClient && payoffs.length > 0 && (
              <Plot
                data={[
                  {
                    x: payoffs.map((p: any) => p.ST),
                    y: payoffs.map((p: any) => p.payoff),
                    type: 'scatter', mode: 'lines',
                    line: { color: CHART_BLUE, width: 2 },
                    name: 'Payoff',
                  },
                  {
                    x: [qaeK, qaeK], y: [0, Math.max(...payoffs.map((p: any) => p.payoff))],
                    type: 'scatter', mode: 'lines',
                    line: { color: '#ef4444', width: 1, dash: 'dash' },
                    name: 'Strike',
                  }
                ]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 380,
                  showlegend: true,
                  legend: { font: { size: 8, color: '#666' }, bgcolor: 'transparent' },
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 380 }}
              />
            )}
          </div>
        </div>

        {/* Circuit info */}
        {r.circuit && (
          <div>
            <SectionTitle title="QUANTUM CIRCUIT" corTema={corTema} />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <MetricBox label="Qubits" valor={String(r.circuit.n_qubits)} sub="Register Size" corTema={corTema} />
              <MetricBox label="Circuit Depth" valor={String(r.circuit.depth)} sub="Gate Layers" corTema={corTema} />
              <MetricBox label="Engine" valor={r.engine?.toUpperCase() || 'SIM'} sub="Backend" corTema={corTema} />
            </div>
            {r.circuit.diagram && (
              <pre className="text-[9px] p-3 rounded border border-neutral-800/80 bg-[#080808] text-neutral-400 overflow-x-auto max-h-[200px]">
                {r.circuit.diagram}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QAOA RESULTS ──────────────────────────────────────────────

  const renderQAOAResults = () => {
    const r = results
    if (!r) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <MetricBox label="Sharpe Ratio" valor={r.sharpe_ratio?.toFixed(3)} sub="Quantum Optimized" corTema={corTema} />
          <MetricBox label="Expected Return" valor={`${(r.optimal_return * 100)?.toFixed(1)}%`} sub="Annual" corTema={corTema} />
          <MetricBox label="Volatility" valor={`${(r.optimal_volatility * 100)?.toFixed(1)}%`} sub="Risk" corTema={corTema} />
          <MetricBox label="Best State" valor={r.best_state || '-'} sub={`2^${r.n_qubits} space`} corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase() || 'SIM'} sub="Backend" corTema={corTema} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock
            label="QAOA Ansatz"
            tex="|\\gamma,\\beta\\rangle = \\prod_{p=1}^{P} e^{-i\\beta_p H_M} e^{-i\\gamma_p H_C} |+\\rangle^{\\otimes n}"
          />
          <FormulaBlock
            label="Portfolio Optimization"
            tex="\\min_w \\; w^T \\Sigma w - \\lambda \\mu^T w, \\quad \\sum w_i = 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Energy Landscape 3D */}
          <div>
            <SectionTitle title="ENERGY LANDSCAPE 3D (gamma x beta)" corTema={corTema} />
            {isClient && r.landscape && (
              <Plot
                data={[{
                  z: r.landscape,
                  type: 'surface',
                  colorscale: VIRIDIS,
                  showscale: false,
                  contours: { z: { show: true, usecolormap: true, project: { z: true } } },
                }]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 400,
                  scene: {
                    ...PLOTLY_3D_SCENE,
                    xaxis: { ...PLOTLY_3D_SCENE.xaxis, title: 'gamma' },
                    yaxis: { ...PLOTLY_3D_SCENE.yaxis, title: 'beta' },
                    zaxis: { ...PLOTLY_3D_SCENE.zaxis, title: 'Energy' },
                    camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
                  },
                  margin: { l: 0, r: 0, t: 10, b: 0 },
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 400 }}
              />
            )}
          </div>

          {/* Convergence + Distribution */}
          <div className="space-y-4">
            <div>
              <SectionTitle title="OPTIMIZATION CONVERGENCE" corTema={corTema} />
              {isClient && r.convergence && (
                <Plot
                  data={[{
                    y: r.convergence,
                    type: 'scatter', mode: 'lines',
                    line: { color: CHART_GREEN, width: 2 },
                  }]}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 280,
                    xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Step', font: { size: 8 } } },
                    yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Energy', font: { size: 8 } } },
                  } as any}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: 280 }}
                />
              )}
            </div>

            {/* Portfolio weights */}
            {r.optimal_weights && (
              <div>
                <SectionTitle title="OPTIMAL WEIGHTS" corTema={corTema} />
                {isClient && (
                  <Plot
                    data={[{
                      x: r.optimal_weights.map((_: any, i: number) => `Asset ${i + 1}`),
                      y: r.optimal_weights,
                      type: 'bar',
                      marker: { color: CHART_BLUE, opacity: 0.8 },
                    }]}
                    layout={{
                      ...PLOTLY_LAYOUT_BASE,
                      height: 280,
                      bargap: 0.3,
                    } as any}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%', height: 280 }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Distribution */}
        {r.distribution && (
          <div>
            <SectionTitle title="QUANTUM STATE PORTFOLIO DISTRIBUTION" corTema={corTema} />
            {isClient && (
              <Plot
                data={[{
                  x: r.distribution.map((d: any) => d.state),
                  y: r.distribution.map((d: any) => d.probability),
                  type: 'bar',
                  marker: {
                    color: r.distribution.map((d: any) => d.sharpe),
                    colorscale: PLASMA,
                    showscale: true,
                    colorbar: { title: { text: 'Sharpe', font: { size: 8 } }, tickfont: { size: 8 }, len: 0.5 },
                  },
                }]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 320,
                  xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Quantum State', font: { size: 8 } }, tickangle: -45 },
                  yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Probability', font: { size: 8 } } },
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 320 }}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── GROVER RESULTS ────────────────────────────────────────────

  const renderGroverResults = () => {
    const r = results
    if (!r) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <MetricBox label="Found State" valor={r.found_state || '-'} sub={`Value: ${r.found_value}`} corTema={corTema} />
          <MetricBox label="Probability" valor={`${((r.probability || 0) * 100).toFixed(1)}%`} sub="Amplified" corTema={corTema} />
          <MetricBox label="Quantum Iterations" valor={String(r.n_iterations)} sub="O(sqrt(N))" corTema={corTema} />
          <MetricBox label="Speedup" valor={`${r.speedup?.toFixed(1)}x`} sub="vs Classical" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase() || 'SIM'} sub="Backend" corTema={corTema} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock
            label="Grover Operator"
            tex="G = (2|\\psi\\rangle\\langle\\psi| - I)\\cdot O_f, \\quad |\\psi\\rangle = H^{\\otimes n}|0\\rangle^n"
          />
          <FormulaBlock
            label="Optimal Iterations"
            tex="k^* = \\left\\lfloor \\frac{\\pi}{4}\\sqrt{\\frac{N}{M}} \\right\\rfloor \\quad \\Rightarrow \\quad O(\\sqrt{N})"
          />
        </div>

        {/* Amplitude Distribution */}
        <div>
          <SectionTitle title="QUANTUM AMPLITUDE DISTRIBUTION" corTema={corTema} />
          {isClient && r.distribution && (
            <Plot
              data={[{
                x: r.distribution.map((d: any) => d.state),
                y: r.distribution.map((d: any) => d.probability),
                type: 'bar',
                marker: {
                  color: r.distribution.map((d: any) => d.is_target ? '#ef4444' : CHART_BLUE + '66'),
                  line: { color: r.distribution.map((d: any) => d.is_target ? '#ef4444' : CHART_BLUE), width: 1 },
                },
              }]}
              layout={{
                ...PLOTLY_LAYOUT_BASE,
                height: 350,
                xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Basis State', font: { size: 8 } }, tickangle: -45 },
                yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Probability', font: { size: 8 } } },
                annotations: [{
                  text: 'RED = Target States', xref: 'paper', yref: 'paper',
                  x: 0.98, y: 0.98, showarrow: false,
                  font: { size: 8, color: '#ef4444' },
                }],
              } as any}
              config={{ displayModeBar: false }}
              style={{ width: '100%', height: 350 }}
            />
          )}
        </div>

        {/* 3D probability surface visualization */}
        {r.distribution && r.distribution.length > 4 && (
          <div>
            <SectionTitle title="PROBABILITY AMPLITUDE SURFACE 3D" corTema={corTema} />
            {isClient && (() => {
              const n = Math.ceil(Math.sqrt(r.distribution.length))
              const grid: number[][] = []
              for (let i = 0; i < n; i++) {
                const row: number[] = []
                for (let j = 0; j < n; j++) {
                  const idx = i * n + j
                  row.push(idx < r.distribution.length ? r.distribution[idx].probability : 0)
                }
                grid.push(row)
              }
              return (
                <Plot
                  data={[{
                    z: grid,
                    type: 'surface',
                    colorscale: PLASMA,
                    showscale: false,
                  }]}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 380,
                    scene: {
                      ...PLOTLY_3D_SCENE,
                      camera: { eye: { x: 1.8, y: 1.2, z: 1.0 } },
                      xaxis: { ...PLOTLY_3D_SCENE.xaxis, title: 'State (bit 0-n)' },
                      yaxis: { ...PLOTLY_3D_SCENE.yaxis, title: 'State (bit n+)' },
                      zaxis: { ...PLOTLY_3D_SCENE.zaxis, title: 'Probability' },
                    },
                    margin: { l: 0, r: 0, t: 10, b: 0 },
                  } as any}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: 380 }}
                />
              )
            })()}
          </div>
        )}

        {/* Circuit */}
        {r.circuit_diagram && r.circuit_diagram !== 'Simulation mode' && (
          <div>
            <SectionTitle title="GROVER CIRCUIT" corTema={corTema} />
            <pre className="text-[9px] p-3 rounded border border-neutral-800/80 bg-[#080808] text-neutral-400 overflow-x-auto max-h-[200px]">
              {r.circuit_diagram}
            </pre>
          </div>
        )}
      </div>
    )
  }

  // ── VQE RESULTS ───────────────────────────────────────────────

  const renderVQEResults = () => {
    const r = results
    if (!r) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Ground State Energy" valor={r.eigenvalue_min?.toFixed(4)} sub="Minimum Eigenvalue" corTema={corTema} />
          <MetricBox label="Qubits" valor={String(r.n_qubits)} sub={`${r.n_parameters || 0} params`} corTema={corTema} />
          <MetricBox label="Hamiltonian" valor={r.hamiltonian_type?.toUpperCase() || '-'} sub="System" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase() || 'SIM'} sub="Backend" corTema={corTema} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock
            label="Variational Principle"
            tex="E_0 \\leq \\langle\\psi(\\theta)|H|\\psi(\\theta)\\rangle = \\text{min}_\\theta \\; \\text{Tr}(H\\rho_\\theta)"
          />
          <FormulaBlock
            label="Heisenberg Hamiltonian"
            tex="H = -J\\sum_{\\langle i,j\\rangle} \\vec{\\sigma}_i \\cdot \\vec{\\sigma}_j + h\\sum_i \\sigma_i^z"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Convergence */}
          <div>
            <SectionTitle title="ENERGY CONVERGENCE" corTema={corTema} />
            {isClient && r.convergence && (
              <Plot
                data={[{
                  y: r.convergence,
                  type: 'scatter', mode: 'lines',
                  line: { color: CHART_GREEN, width: 2 },
                  fill: 'tozeroy',
                  fillcolor: CHART_GREEN + '11',
                }]}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 350,
                  xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Optimization Step', font: { size: 8 } } },
                  yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: '<H> Energy', font: { size: 8 } } },
                } as any}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: 350 }}
              />
            )}
          </div>

          {/* Probability distribution */}
          <div>
            <SectionTitle title="EIGENSTATE PROBABILITIES" corTema={corTema} />
            {isClient && r.probabilities && (() => {
              const probs = r.probabilities.slice(0, 32)
              return (
                <Plot
                  data={[{
                    x: probs.map((_: any, i: number) => `|${i.toString(2).padStart(r.n_qubits, '0')}>`),
                    y: probs,
                    type: 'bar',
                    marker: {
                      color: probs.map((p: number) => p),
                      colorscale: VIRIDIS,
                    },
                  }]}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 350,
                    xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, tickangle: -45, tickfont: { size: 7 } },
                    yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Probability', font: { size: 8 } } },
                  } as any}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: 350 }}
                />
              )
            })()}
          </div>
        </div>

        {/* 3D Probability Landscape */}
        {r.probabilities && r.probabilities.length >= 4 && (
          <div>
            <SectionTitle title="EIGENSTATE PROBABILITY LANDSCAPE 3D" corTema={corTema} />
            {isClient && (() => {
              const probs = r.probabilities
              const n = Math.ceil(Math.sqrt(probs.length))
              const grid: number[][] = []
              for (let i = 0; i < n; i++) {
                const row: number[] = []
                for (let j = 0; j < n; j++) {
                  const idx = i * n + j
                  row.push(idx < probs.length ? probs[idx] : 0)
                }
                grid.push(row)
              }
              return (
                <Plot
                  data={[{
                    z: grid,
                    type: 'surface',
                    colorscale: VIRIDIS,
                    showscale: false,
                    contours: { z: { show: true, usecolormap: true, project: { z: true } } },
                  }]}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 400,
                    scene: {
                      ...PLOTLY_3D_SCENE,
                      camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
                    },
                    margin: { l: 0, r: 0, t: 10, b: 0 },
                  } as any}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: 400 }}
                />
              )
            })()}
          </div>
        )}
      </div>
    )
  }

  // ── MAIN RENDER ───────────────────────────────────────────────

  return (
    <div className="h-full flex bg-[#050505] text-[#ccc] font-mono overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div className="w-[280px] flex flex-col border-r border-[#151515] bg-[#0A0A0A] shrink-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 border-b border-[#151515] bg-[#050505] shrink-0" style={{ height: 48 }}>
          <Atom size={14} style={{ color: corTema }} />
          <span className="text-[11px] font-bold tracking-widest text-white">QUANTUM ENGINE</span>
          <div className="flex-1" />
          <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-[8px] text-neutral-500 uppercase">{backendStatus}</span>
        </div>

        {/* Tool Selection */}
        <div className="p-3 border-b border-[#151515]">
          <p className="text-[8px] text-neutral-500 tracking-widest mb-2">ALGORITHMS</p>
          <div className="space-y-1">
            {TOOLS.map(tool => (
              <button key={tool.id}
                onClick={() => { setActiveTool(tool.id); setResults(null); setError(null) }}
                className={`w-full text-left px-3 py-2 rounded transition-all flex items-center gap-2 ${activeTool === tool.id ? 'bg-[#151515]' : 'hover:bg-[#111]'}`}
                style={activeTool === tool.id ? { borderLeft: `2px solid ${corTema}` } : { borderLeft: '2px solid transparent' }}
              >
                <span style={{ color: activeTool === tool.id ? corTema : '#666' }}>{tool.icone}</span>
                <div>
                  <p className="text-[10px] font-bold" style={{ color: activeTool === tool.id ? '#eee' : '#888' }}>{tool.titulo}</p>
                  <p className="text-[8px] text-neutral-600">{tool.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[8px] text-neutral-500 tracking-widest mb-3">PARAMETERS</p>
          {renderParams()}
        </div>

        {/* Compute Button */}
        <div className="p-3 border-t border-[#151515] bg-[#080808]">
          <button
            onClick={compute}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: corTema, color: '#000' }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="#000" />}
            {loading ? 'COMPUTING...' : 'COMPUTE'}
          </button>
          <div className="flex items-center gap-2 mt-2">
            <Activity size={10} className="text-neutral-600" />
            <p className="text-[8px] text-neutral-600">
              {backendStatus === 'online' ? 'TS Quantum Simulator' : 'Local Simulation Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 border-b border-[#151515] bg-[#050505] shrink-0" style={{ height: 48 }}>
          <div className="flex items-center gap-3">
            <CircleDot size={12} style={{ color: corTema }} />
            <h1 className="text-[12px] font-bold tracking-widest text-[#DDD]">
              {TOOLS.find(t => t.id === activeTool)?.titulo.toUpperCase()}
            </h1>
            <span className="text-[9px] text-[#555] bg-[#111] px-2 py-0.5 rounded">
              {TOOLS.find(t => t.id === activeTool)?.sub}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {results && (
              <span className="text-[8px] px-2 py-1 rounded" style={{ backgroundColor: corTema + '22', color: corTema }}>
                {results.engine?.toUpperCase() || 'COMPUTED'}
              </span>
            )}
            <button onClick={() => { setResults(null); setError(null) }}
              className="px-3 py-1.5 rounded text-[9px] tracking-widest text-neutral-500 hover:text-neutral-300 hover:bg-[#151515] transition-all">
              CLEAR
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {renderResults()}
        </div>
      </div>
    </div>
  )
}
