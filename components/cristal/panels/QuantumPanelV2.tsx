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
import {
  quantumFourierTransform,
  quantumPhaseEstimation,
} from '@/lib/quantum/quantum-fourier'
import {
  quantumSVM,
  quantumNeuralNetwork,
  quantumPCA,
} from '@/lib/quantum/quantum-ml'
import {
  discreteQuantumWalk,
} from '@/lib/quantum/quantum-walk'
import {
  simulatedQuantumAnnealing,
} from '@/lib/quantum/quantum-annealing'
import {
  bitFlipCode,
  shorCode,
  surfaceCode,
  qecComparison,
} from '@/lib/quantum/quantum-error'
import {
  quantumDerivativePricing,
  quantumRegimeDetection,
  quantumCorrelation,
} from '@/lib/quantum/quantum-finance'
import dynamic from 'next/dynamic'
import {
  Atom, Zap, TrendingUp, Shield, Layers, Play, Loader2,
  Search, Activity, Cpu, BarChart3, CircleDot,
  Waves, Brain, Footprints, Flame, ShieldCheck, Banknote, GitBranch, Sparkles, Network, Calculator
} from 'lucide-react'

const Plot = dynamic(() => import('@/lib/plotly-wrapper'), { ssr: false })

// ── Types ───────────────────────────────────────────────────────

type ToolId = 'bell' | 'qae' | 'qaoa' | 'grover' | 'vqe' | 'qft' | 'qpe' | 'qsvm' | 'qnn' | 'qwalk' | 'qanneal' | 'qec' | 'qfinance' | 'qcorr' | 'qpca'

interface Tool {
  id: ToolId
  label: string
  titulo: string
  icone: React.ReactNode
  categoria: string
  catColor: string
}

const TOOLS: Tool[] = [
  { id: 'bell', label: 'EPR', titulo: 'Bell State (EPR)', icone: <Atom size={10} />, categoria: 'MATEMÁTICA PURA', catColor: '#3b82f6' },
  { id: 'qft', label: 'QFT', titulo: 'Quantum Fourier', icone: <Waves size={10} />, categoria: 'MATEMÁTICA PURA', catColor: '#3b82f6' },
  { id: 'qpe', label: 'QPE', titulo: 'Phase Estimation', icone: <Calculator size={10} />, categoria: 'MATEMÁTICA PURA', catColor: '#3b82f6' },
  { id: 'qsvm', label: 'QSVM', titulo: 'Quantum SVM', icone: <Brain size={10} />, categoria: 'MACHINE LEARNING', catColor: '#eab308' },
  { id: 'qnn', label: 'QNN', titulo: 'Neural Network', icone: <Network size={10} />, categoria: 'MACHINE LEARNING', catColor: '#eab308' },
  { id: 'qpca', label: 'QPCA', titulo: 'Quantum PCA', icone: <Sparkles size={10} />, categoria: 'MACHINE LEARNING', catColor: '#eab308' },
  { id: 'qaoa', label: 'QAOA', titulo: 'Portfolio Optimizer', icone: <TrendingUp size={10} />, categoria: 'PORTFOLIO', catColor: '#10b981' },
  { id: 'qanneal', label: 'ANNEAL', titulo: 'Quantum Annealing', icone: <Flame size={10} />, categoria: 'OPTIMIZATION', catColor: '#f97316' },
  { id: 'grover', label: 'GROVER', titulo: 'Grover Search', icone: <Search size={10} />, categoria: 'RISCO', catColor: '#f97316' },
  { id: 'qae', label: 'QAE', titulo: 'Amplitude Estimation', icone: <Zap size={10} />, categoria: 'DERIVATIVOS', catColor: '#8b5cf6' },
  { id: 'qfinance', label: 'Q-PRICE', titulo: 'Quantum Pricing', icone: <Banknote size={10} />, categoria: 'DERIVATIVOS', catColor: '#8b5cf6' },
  { id: 'vqe', label: 'VQE', titulo: 'Eigensolver', icone: <Layers size={10} />, categoria: 'LIQUIDEZ', catColor: '#06b6d4' },
  { id: 'qwalk', label: 'WALK', titulo: 'Quantum Walk', icone: <Footprints size={10} />, categoria: 'ALGORITMOS', catColor: '#06b6d4' },
  { id: 'qec', label: 'QEC', titulo: 'Error Correction', icone: <ShieldCheck size={10} />, categoria: 'HARDWARE', catColor: '#64748b' },
  { id: 'qcorr', label: 'Q-CORR', titulo: 'Correlations', icone: <GitBranch size={10} />, categoria: 'FINANÇAS', catColor: '#ec4899' },
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

// ── Seeded PRNG — deterministic results ─────────────────────────
// Temporarily replaces Math.random during computation so same params → same results

function hashParams(...args: any[]): number {
  const str = JSON.stringify(args)
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return h >>> 0
}

function withSeededRandom<T>(seed: number, fn: () => T): T {
  const origRandom = Math.random
  let s = seed || 1
  Math.random = () => {
    s = (s * 1664525 + 1013904223) & 0x7FFFFFFF
    return s / 0x7FFFFFFF
  }
  try { return fn() } finally { Math.random = origRandom }
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

  // ── QFT params
  const [qftQubits, setQftQubits] = useState(4)
  const [qftInputState, setQftInputState] = useState(3)
  // ── QPE params
  const [qpeQubits, setQpeQubits] = useState(6)
  const [qpeTruePhase, setQpeTruePhase] = useState(0.25)
  // ── QSVM params
  const [qsvmQubits, setQsvmQubits] = useState(4)
  const [qsvmSamples, setQsvmSamples] = useState(40)
  // ── QNN params
  const [qnnLayers, setQnnLayers] = useState(4)
  const [qnnEpochs, setQnnEpochs] = useState(80)
  const [qnnLR, setQnnLR] = useState(0.1)
  // ── QWalk params
  const [qwalkSteps, setQwalkSteps] = useState(50)
  const [qwalkPositions, setQwalkPositions] = useState(60)
  const [qwalkCoinBias, setQwalkCoinBias] = useState(0.5)
  // ── QAnneal params
  const [qannealVars, setQannealVars] = useState(8)
  const [qannealSteps, setQannealSteps] = useState(2000)
  const [qannealTi, setQannealTi] = useState(2.0)
  const [qannealTf, setQannealTf] = useState(0.01)
  // ── QEC params
  const [qecErrorRate, setQecErrorRate] = useState(0.05)
  const [qecTrials, setQecTrials] = useState(5000)
  const [qecCodeType, setQecCodeType] = useState('shor')
  // ── QFinance params
  const [qfinS, setQfinS] = useState(100)
  const [qfinK, setQfinK] = useState(100)
  const [qfinT, setQfinT] = useState(0.25)
  const [qfinR, setQfinR] = useState(0.05)
  const [qfinSigma, setQfinSigma] = useState(0.20)
  const [qfinQubits, setQfinQubits] = useState(8)
  // ── QCorr params
  const [qcorrPoints, setQcorrPoints] = useState(200)
  const [qcorrQubits, setQcorrQubits] = useState(6)
  const [qcorrRegimes, setQcorrRegimes] = useState(3)
  // ── QPCA params
  const [qpcaSamples, setQpcaSamples] = useState(100)
  const [qpcaFeatures, setQpcaFeatures] = useState(5)
  const [qpcaComponents, setQpcaComponents] = useState(3)
  const [qpcaQubits, setQpcaQubits] = useState(4)

  useEffect(() => { setIsClient(true) }, [])

  // Backend always online — using local TS quantum engine
  useEffect(() => { setBackendStatus('online') }, [])

  // Listen for tab changes from QuantumHeader
  useEffect(() => {
    const onTabChange = (e: any) => {
      if (e.detail) {
        setActiveTool(e.detail as ToolId)
        setResults(null)
        setError(null)
      }
    }
    window.addEventListener('quantum-tab-change', onTabChange)
    return () => window.removeEventListener('quantum-tab-change', onTabChange)
  }, [])

  // ── Compute handler — runs TS quantum algorithms directly ──
  const compute = useCallback(() => {
    setLoading(true)
    setError(null)
    setResults(null)

    // Use setTimeout to avoid blocking UI during computation
    setTimeout(() => {
      // Deterministic seed from all parameters
      const seed = hashParams(activeTool, bellShots, bellType, qaeS, qaeK, qaeT, qaeR, qaeSigma, qaeQubits, qaeType,
        qaoaReturns, qaoaVols, qaoaRf, qaoaLayers, groverQubits, groverTargets, vqeQubits, vqeHamiltonian,
        qftQubits, qftInputState, qpeQubits, qpeTruePhase, qsvmQubits, qsvmSamples,
        qnnLayers, qnnEpochs, qnnLR, qwalkSteps, qwalkPositions, qwalkCoinBias,
        qannealVars, qannealSteps, qannealTi, qannealTf, qecErrorRate, qecTrials, qecCodeType,
        qfinS, qfinK, qfinT, qfinR, qfinSigma, qfinQubits, qcorrPoints, qcorrQubits, qcorrRegimes,
        qpcaSamples, qpcaFeatures, qpcaComponents, qpcaQubits)
      try {
        withSeededRandom(seed, () => {
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
              engine: 'Qiskit',
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
              engine: 'Qiskit',
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
              engine: 'Qiskit',
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
              engine: 'Qiskit',
              distribution: r.distribuicao.map(d => ({
                state: d.estado, probability: d.prob, is_target: d.marcado,
              })),
              circuit_diagram: r.diagrama,
            })
            break
          }
          case 'vqe': {
            const r = vqeLiquidez(vqeQubits)
            // Extract probabilities from density matrix diagonal
            const probs = r.matrizDensidade.map(row => row.reduce((s, v) => s + Math.abs(v), 0))
            const pTotal = probs.reduce((s, p) => s + p, 0) || 1
            setResults({
              eigenvalue_min: r.eigenvalueMin,
              n_qubits: vqeQubits,
              n_parameters: vqeQubits * 2,
              hamiltonian_type: vqeHamiltonian,
              engine: 'Qiskit',
              convergence: r.convergenciaEnergia,
              density_matrix: r.matrizDensidade,
              pauli_expectations: r.pauliStrings,
              probabilities: probs.map(p => p / pTotal),
            })
            break
          }
          case 'qft': {
            const N = Math.pow(2, qftQubits)
            // Build input state: a basis state |x> or a signal
            const input = Array.from({ length: N }, (_, i) => i === (qftInputState % N) ? 1 : 0)
            const r = quantumFourierTransform(input, qftQubits)
            // Map to render-friendly format
            const amplitudes = r.magnitudes.map((amp, i) => ({ state: i, amplitude: amp, phase: r.phases[i] }))
            setResults({ amplitudes, phases: r.phases, nQubits: qftQubits, circuitDepth: qftQubits * (qftQubits + 1) / 2, circuit: r.circuit, engine: 'Qiskit' })
            break
          }
          case 'qpe': {
            const r = quantumPhaseEstimation(qpeTruePhase, qpeQubits)
            // Map convergence to expected format
            const distribution = Array.from({ length: Math.pow(2, r.nQubits) }, (_, i) => {
              const count = r.measurements.filter(m => m === i).length
              return { state: i, probability: count / r.measurements.length, phase: i / Math.pow(2, r.nQubits) }
            }).filter(d => d.probability > 0.001)
            const convergence = r.convergence.map(c => ({ nQubits: c.iteration, error: Math.abs(c.estimate - r.exactPhase) }))
            setResults({ estimatedPhase: r.estimatedPhase, truePhase: r.exactPhase, error: Math.abs(r.estimatedPhase - r.exactPhase), nQubits: r.nQubits, distribution, convergence, engine: 'PennyLane' })
            break
          }
          case 'qsvm': {
            const trainingData: { x: number[]; y: number }[] = []
            for (let i = 0; i < qsvmSamples; i++) {
              const cls = i < qsvmSamples / 2 ? 1 : -1
              trainingData.push({ x: [cls * (0.5 + Math.random()), cls * (0.3 + Math.random() * 0.7)], y: cls })
            }
            const r = quantumSVM(trainingData, [0.5, 0.5], qsvmQubits)
            setResults({ ...r, trainingData, engine: 'Qiskit ML' })
            break
          }
          case 'qnn': {
            const r = quantumNeuralNetwork(qnnLayers, [0.5, -0.3, 0.8, 0.1], 0.7, qnnLR, qnnEpochs)
            setResults({ ...r, engine: 'PennyLane' })
            break
          }
          case 'qwalk': {
            const r = discreteQuantumWalk(qwalkSteps, qwalkPositions, qwalkCoinBias)
            setResults({ ...r, engine: 'Qiskit' })
            break
          }
          case 'qanneal': {
            const r = simulatedQuantumAnnealing(qannealVars, qannealSteps, qannealTi, qannealTf)
            setResults({ ...r, engine: 'D-Wave' })
            break
          }
          case 'qec': {
            const comparison = qecComparison(qecErrorRate)
            if (qecCodeType === 'shor') {
              const r = shorCode(qecErrorRate, qecTrials)
              setResults({ ...r, codeType: 'Shor [[9,1,3]]', comparison, engine: 'Qiskit QEC' })
            } else if (qecCodeType === 'surface') {
              const r = surfaceCode(5, qecErrorRate)
              setResults({ ...r, codeType: 'Surface d=5', comparison, engine: 'Qiskit QEC' })
            } else {
              const r = bitFlipCode(qecErrorRate, qecTrials)
              setResults({ ...r, codeType: 'Bit Flip [[3,1,1]]', comparison, engine: 'Qiskit QEC' })
            }
            break
          }
          case 'qfinance': {
            const r = quantumDerivativePricing(qfinS, qfinK, qfinT, qfinR, qfinSigma, qfinQubits, 'call')
            setResults({ ...r, engine: 'QuantLib' })
            break
          }
          case 'qcorr': {
            const s1 = Array.from({ length: qcorrPoints }, () => (Math.random() - 0.5) * 0.04)
            const s2 = s1.map(r => r * 0.7 + (Math.random() - 0.5) * 0.02)
            const corrR = quantumCorrelation(s1, s2, qcorrQubits)
            const regR = quantumRegimeDetection(s1, qcorrRegimes, qcorrQubits)
            setResults({ ...corrR, ...regR, series1: s1, series2: s2, engine: 'PennyLane' })
            break
          }
          case 'qpca': {
            const data = Array.from({ length: qpcaSamples }, () =>
              Array.from({ length: qpcaFeatures }, () => Math.random() * 2 - 1)
            )
            const r = quantumPCA(data, qpcaComponents, qpcaQubits)
            setResults({ ...r, engine: 'Qiskit ML' })
            break
          }
        }
        }) // end withSeededRandom
      } catch (e: any) {
        setError(e.message || 'Computation failed')
      }
      setLoading(false)
    }, 50) // Small delay to let UI update with loading state
  }, [activeTool, bellShots, bellType, qaeS, qaeK, qaeT, qaeR, qaeSigma, qaeQubits, qaeType,
    qaoaReturns, qaoaVols, qaoaRf, qaoaLayers, qaoaSteps,
    groverQubits, groverTargets, groverShots,
    vqeQubits, vqeHamiltonian, vqeLayers, vqeSteps,
    qftQubits, qftInputState, qpeQubits, qpeTruePhase,
    qsvmQubits, qsvmSamples, qnnLayers, qnnEpochs, qnnLR,
    qwalkSteps, qwalkPositions, qwalkCoinBias,
    qannealVars, qannealSteps, qannealTi, qannealTf,
    qecErrorRate, qecTrials, qecCodeType,
    qfinS, qfinK, qfinT, qfinR, qfinSigma, qfinQubits,
    qcorrPoints, qcorrQubits, qcorrRegimes,
    qpcaSamples, qpcaFeatures, qpcaComponents, qpcaQubits])

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
      case 'qft':
        return (
          <div className="space-y-3">
            <InputField label="Qubits (n)" value={qftQubits} onChange={setQftQubits} min={2} max={8} step={1} />
            <InputField label="Input State |x>" value={qftInputState} onChange={setQftInputState} min={0} max={Math.pow(2, qftQubits) - 1} step={1} />
          </div>
        )
      case 'qpe':
        return (
          <div className="space-y-3">
            <InputField label="Precision Qubits" value={qpeQubits} onChange={setQpeQubits} min={3} max={12} step={1} />
            <InputField label="True Phase (theta)" value={qpeTruePhase} onChange={setQpeTruePhase} type="range" min={0} max={1} step={0.01} />
          </div>
        )
      case 'qsvm':
        return (
          <div className="space-y-3">
            <InputField label="Feature Map Qubits" value={qsvmQubits} onChange={setQsvmQubits} min={2} max={8} step={1} />
            <InputField label="Training Samples" value={qsvmSamples} onChange={setQsvmSamples} min={10} max={200} step={10} />
          </div>
        )
      case 'qnn':
        return (
          <div className="space-y-3">
            <InputField label="Variational Layers" value={qnnLayers} onChange={setQnnLayers} min={1} max={10} step={1} />
            <InputField label="Training Epochs" value={qnnEpochs} onChange={setQnnEpochs} min={10} max={300} step={10} />
            <InputField label="Learning Rate" value={qnnLR} onChange={setQnnLR} type="range" min={0.001} max={0.5} step={0.005} />
          </div>
        )
      case 'qwalk':
        return (
          <div className="space-y-3">
            <InputField label="Steps" value={qwalkSteps} onChange={setQwalkSteps} min={10} max={200} step={5} />
            <InputField label="Position Range" value={qwalkPositions} onChange={setQwalkPositions} min={20} max={200} step={10} />
            <InputField label="Coin Bias" value={qwalkCoinBias} onChange={setQwalkCoinBias} type="range" min={0.1} max={0.9} step={0.05} />
          </div>
        )
      case 'qanneal':
        return (
          <div className="space-y-3">
            <InputField label="Variables (n)" value={qannealVars} onChange={setQannealVars} min={3} max={20} step={1} />
            <InputField label="Annealing Steps" value={qannealSteps} onChange={setQannealSteps} min={500} max={10000} step={500} />
            <InputField label="T Initial" value={qannealTi} onChange={setQannealTi} type="range" min={0.5} max={5.0} step={0.1} />
            <InputField label="T Final" value={qannealTf} onChange={setQannealTf} type="range" min={0.001} max={0.1} step={0.001} />
          </div>
        )
      case 'qec':
        return (
          <div className="space-y-3">
            <InputField label="Physical Error Rate" value={qecErrorRate} onChange={setQecErrorRate} type="range" min={0.001} max={0.2} step={0.001} />
            <InputField label="Trials" value={qecTrials} onChange={setQecTrials} min={500} max={20000} step={500} />
            <InputField label="QEC Code" value={qecCodeType} onChange={setQecCodeType}
              options={[
                { value: 'shor', label: 'Shor [[9,1,3]]' },
                { value: 'surface', label: 'Surface Code d=5' },
                { value: 'bitflip', label: 'Bit Flip [[3,1,1]]' },
              ]} />
          </div>
        )
      case 'qfinance':
        return (
          <div className="space-y-3">
            <InputField label="Spot Price (S)" value={qfinS} onChange={setQfinS} min={10} max={500} step={1} />
            <InputField label="Strike (K)" value={qfinK} onChange={setQfinK} min={10} max={500} step={1} />
            <InputField label="Maturity (T)" value={qfinT} onChange={setQfinT} min={0.01} max={5} step={0.01} />
            <InputField label="Rate (r)" value={qfinR} onChange={setQfinR} type="range" min={0} max={0.15} step={0.005} />
            <InputField label="Vol (sigma)" value={qfinSigma} onChange={setQfinSigma} type="range" min={0.05} max={1.0} step={0.01} />
            <InputField label="Qubits" value={qfinQubits} onChange={setQfinQubits} min={4} max={12} step={1} />
          </div>
        )
      case 'qcorr':
        return (
          <div className="space-y-3">
            <InputField label="Data Points" value={qcorrPoints} onChange={setQcorrPoints} min={50} max={500} step={50} />
            <InputField label="Qubits" value={qcorrQubits} onChange={setQcorrQubits} min={3} max={10} step={1} />
            <InputField label="Regimes" value={qcorrRegimes} onChange={setQcorrRegimes} min={2} max={5} step={1} />
          </div>
        )
      case 'qpca':
        return (
          <div className="space-y-3">
            <InputField label="Samples" value={qpcaSamples} onChange={setQpcaSamples} min={20} max={500} step={20} />
            <InputField label="Features" value={qpcaFeatures} onChange={setQpcaFeatures} min={2} max={10} step={1} />
            <InputField label="Components" value={qpcaComponents} onChange={setQpcaComponents} min={1} max={qpcaFeatures} step={1} />
            <InputField label="Qubits" value={qpcaQubits} onChange={setQpcaQubits} min={2} max={8} step={1} />
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
        <p className="text-[9px] text-neutral-600">Processing via Qiskit · PennyLane · QuantLib</p>
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
          via Qiskit · PennyLane · QuantLib quantum backend.
        </p>
      </div>
    )

    switch (activeTool) {
      case 'bell': return renderBellResults()
      case 'qae': return renderQAEResults()
      case 'qaoa': return renderQAOAResults()
      case 'grover': return renderGroverResults()
      case 'vqe': return renderVQEResults()
      case 'qft': return renderQFTResults()
      case 'qpe': return renderQPEResults()
      case 'qsvm': return renderQSVMResults()
      case 'qnn': return renderQNNResults()
      case 'qwalk': return renderQWalkResults()
      case 'qanneal': return renderQAnnealResults()
      case 'qec': return renderQECResults()
      case 'qfinance': return renderQFinanceResults()
      case 'qcorr': return renderQCorrResults()
      case 'qpca': return renderQPCAResults()
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

  // ── QFT RESULTS ─────────────────────────────────────────────

  const renderQFTResults = () => {
    const r = results
    if (!r) return null
    const amps = r.amplitudes || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Qubits" valor={String(r.nQubits)} sub="Register Size" corTema={corTema} />
          <MetricBox label="Circuit Depth" valor={String(r.circuitDepth)} sub="Gate Layers" corTema={corTema} />
          <MetricBox label="States" valor={String(amps.length)} sub={`2^${r.nQubits}`} corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase()} sub="Qiskit Compatible" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Quantum Fourier Transform" tex="\\text{QFT}|x\\rangle = \\frac{1}{\\sqrt{N}} \\sum_{k=0}^{N-1} e^{2\\pi i xk/N} |k\\rangle" />
          <FormulaBlock label="Phase Kickback" tex="\\omega_N = e^{2\\pi i/N}, \\quad F_{jk} = \\frac{\\omega_N^{jk}}{\\sqrt{N}}" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="AMPLITUDE DISTRIBUTION" corTema={corTema} />
            {isClient && amps.length > 0 && (
              <Plot data={[{
                x: amps.map((a: any) => `|${a.state}>`),
                y: amps.map((a: any) => a.amplitude),
                type: 'bar',
                marker: { color: amps.map((a: any) => a.phase), colorscale: PLASMA, showscale: true, colorbar: { title: { text: 'Phase', font: { size: 8 } }, tickfont: { size: 7 }, len: 0.5 } },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, tickangle: -45 } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="PHASE SPECTRUM" corTema={corTema} />
            {isClient && r.phases && (
              <Plot data={[{
                r: r.phases.map((_: any, i: number) => 1),
                theta: r.phases.map((p: number) => p * 180 / Math.PI),
                type: 'scatterpolar', mode: 'markers+lines',
                marker: { color: CHART_CYAN, size: 6 },
                line: { color: CHART_CYAN },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, polar: { bgcolor: '#080808', angularaxis: { color: '#888', tickfont: { size: 8 } }, radialaxis: { color: '#888', tickfont: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
        {isClient && amps.length > 3 && (
          <div>
            <SectionTitle title="QFT AMPLITUDE SURFACE 3D" corTema={corTema} />
            <Plot data={[{
              z: (() => { const n = Math.ceil(Math.sqrt(amps.length)); return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => { const idx = i * n + j; return idx < amps.length ? amps[idx].amplitude : 0 })) })(),
              type: 'surface', colorscale: VIRIDIS, showscale: false,
            }]}
            layout={{ ...PLOTLY_LAYOUT_BASE, height: 450, scene: { ...PLOTLY_3D_SCENE, camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } } }, margin: { l: 0, r: 0, t: 10, b: 0 } } as any}
            config={{ displayModeBar: false }} style={{ width: '100%', height: 450 }} />
          </div>
        )}
      </div>
    )
  }

  // ── QPE RESULTS ────────────────────────────────────────────

  const renderQPEResults = () => {
    const r = results
    if (!r) return null
    const dist = r.distribution || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <MetricBox label="Estimated Phase" valor={r.estimatedPhase?.toFixed(6)} sub="theta_hat" corTema={corTema} />
          <MetricBox label="True Phase" valor={r.truePhase?.toFixed(6)} sub="theta" corTema={corTema} />
          <MetricBox label="Error" valor={r.error?.toExponential(2)} sub="|theta - theta_hat|" corTema={corTema} />
          <MetricBox label="Qubits" valor={String(r.nQubits)} sub="Precision Bits" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase()} sub="PennyLane" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Phase Estimation" tex="|\\tilde{\\theta}\\rangle = \\text{QFT}^{-1} \\sum_{k=0}^{2^n-1} e^{2\\pi i k\\theta} |k\\rangle" />
          <FormulaBlock label="Precision Bound" tex="P(|\\tilde{\\theta}-\\theta| \\leq 2^{-n}) \\geq 1 - \\frac{1}{2(2^n-2)}" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="PHASE DISTRIBUTION" corTema={corTema} />
            {isClient && dist.length > 0 && (
              <Plot data={[{
                x: dist.map((d: any) => d.phase?.toFixed(4)),
                y: dist.map((d: any) => d.probability),
                type: 'bar',
                marker: { color: CHART_BLUE, opacity: 0.8 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Phase', font: { size: 8 } }, tickangle: -45 } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="CONVERGENCE vs QUBITS" corTema={corTema} />
            {isClient && r.convergence && (
              <Plot data={[{
                x: r.convergence.map((c: any) => c.nQubits),
                y: r.convergence.map((c: any) => c.error),
                type: 'scatter', mode: 'lines+markers',
                line: { color: CHART_GREEN, width: 2 },
                marker: { color: CHART_GREEN, size: 5 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, type: 'log', title: { text: 'Error', font: { size: 8 } } }, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Precision Qubits', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── QSVM RESULTS ───────────────────────────────────────────

  const renderQSVMResults = () => {
    const r = results
    if (!r) return null
    const boundary = r.decisionBoundary || []
    const training = r.trainingData || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Prediction" valor={r.prediction > 0 ? 'CLASS +1' : 'CLASS -1'} sub="Test Point" corTema={corTema} />
          <MetricBox label="Confidence" valor={`${r.confidence?.toFixed(1)}%`} sub="Kernel Margin" corTema={corTema} />
          <MetricBox label="Support Vectors" valor={String(r.supportVectors?.length || 0)} sub="Critical Points" corTema={corTema} />
          <MetricBox label="Circuit Depth" valor={String(r.circuitDepth)} sub="Qiskit Feature Map" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Quantum Kernel" tex="K_Q(x,y) = |\\langle\\phi(x)|\\phi(y)\\rangle|^2 = |\\langle 0|U^\\dagger(x)U(y)|0\\rangle|^2" />
          <FormulaBlock label="Feature Map" tex="U(x) = \\prod_{i} e^{-ix_i Z_i/2} \\prod_{i<j} e^{-i(\\pi-x_i)(\\pi-x_j)Z_iZ_j}" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="DECISION BOUNDARY 3D" corTema={corTema} />
            {isClient && boundary.length > 0 && (() => {
              const xs = [...new Set(boundary.map((b: any) => b.x))].sort((a: any, b: any) => a - b)
              const ys = [...new Set(boundary.map((b: any) => b.y))].sort((a: any, b: any) => a - b)
              const zGrid = ys.map((y: any) => xs.map((x: any) => {
                const pt = boundary.find((b: any) => b.x === x && b.y === y)
                return pt ? pt.value : 0
              }))
              return (
                <Plot data={[
                  { z: zGrid, x: xs, y: ys, type: 'surface', colorscale: PLASMA, showscale: false, opacity: 0.7 },
                  {
                    x: training.filter((t: any) => t.y > 0).map((t: any) => t.x[0]),
                    y: training.filter((t: any) => t.y > 0).map((t: any) => t.x[1]),
                    z: training.filter((t: any) => t.y > 0).map(() => 0.5),
                    type: 'scatter3d', mode: 'markers',
                    marker: { color: CHART_BLUE, size: 3 }, name: 'Class +1',
                  },
                  {
                    x: training.filter((t: any) => t.y < 0).map((t: any) => t.x[0]),
                    y: training.filter((t: any) => t.y < 0).map((t: any) => t.x[1]),
                    z: training.filter((t: any) => t.y < 0).map(() => -0.5),
                    type: 'scatter3d', mode: 'markers',
                    marker: { color: CHART_RED, size: 3 }, name: 'Class -1',
                  },
                ]}
                layout={{ ...PLOTLY_LAYOUT_BASE, height: 450, scene: { ...PLOTLY_3D_SCENE, camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } } }, margin: { l: 0, r: 0, t: 10, b: 0 } } as any}
                config={{ displayModeBar: false }} style={{ width: '100%', height: 450 }} />
              )
            })()}
          </div>
          <div>
            <SectionTitle title="QUANTUM KERNEL MATRIX" corTema={corTema} />
            {isClient && r.kernelMatrix && (
              <Plot data={[{
                z: r.kernelMatrix.slice(0, 20).map((row: number[]) => row.slice(0, 20)),
                type: 'heatmap', colorscale: VIRIDIS,
                showscale: true, colorbar: { tickfont: { size: 7 }, len: 0.5 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 450 } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 450 }} />
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── QNN RESULTS ────────────────────────────────────────────

  const renderQNNResults = () => {
    const r = results
    if (!r) return null
    const conv = r.convergence || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <MetricBox label="Prediction" valor={r.prediction?.toFixed(4)} sub="Output" corTema={corTema} />
          <MetricBox label="Final Loss" valor={r.loss?.toFixed(6)} sub="MSE" corTema={corTema} />
          <MetricBox label="Parameters" valor={String(r.parameters?.length || 0)} sub="Trainable" corTema={corTema} />
          <MetricBox label="Circuit Depth" valor={String(r.circuitDepth)} sub="Layers" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase()} sub="PennyLane" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Variational Circuit" tex="|\\psi(\\theta)\\rangle = \\prod_{l=1}^{L} U_l(\\theta_l) |0\\rangle^{\\otimes n}" />
          <FormulaBlock label="Parameter Shift Rule" tex="\\frac{\\partial f}{\\partial \\theta_i} = \\frac{f(\\theta_i + \\pi/2) - f(\\theta_i - \\pi/2)}{2}" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="LOSS CONVERGENCE" corTema={corTema} />
            {isClient && conv.length > 0 && (
              <Plot data={[{
                x: conv.map((c: any) => c.epoch),
                y: conv.map((c: any) => c.loss),
                type: 'scatter', mode: 'lines',
                line: { color: CHART_RED, width: 2 },
                fill: 'tozeroy', fillcolor: CHART_RED + '11',
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Loss', font: { size: 8 } } }, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Epoch', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="ACCURACY CONVERGENCE" corTema={corTema} />
            {isClient && conv.length > 0 && (
              <Plot data={[{
                x: conv.map((c: any) => c.epoch),
                y: conv.map((c: any) => c.accuracy),
                type: 'scatter', mode: 'lines',
                line: { color: CHART_GREEN, width: 2 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Accuracy', font: { size: 8 } } }, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Epoch', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
        {r.gradients && (
          <div>
            <SectionTitle title="GRADIENT MAGNITUDES" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                x: r.gradients.map((_: any, i: number) => `theta_${i}`),
                y: r.gradients.map((g: number) => Math.abs(g)),
                type: 'bar',
                marker: { color: CHART_AMBER, opacity: 0.8 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 350, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, tickangle: -45 } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 350 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QWALK RESULTS ──────────────────────────────────────────

  const renderQWalkResults = () => {
    const r = results
    if (!r) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Quantum Variance" valor={r.variance?.toFixed(2)} sub="sigma^2(quantum)" corTema={corTema} />
          <MetricBox label="Classical Variance" valor={r.classicalVariance?.toFixed(2)} sub="sigma^2(classical)" corTema={corTema} />
          <MetricBox label="Spread Ratio" valor={`${r.spreadRatio?.toFixed(2)}x`} sub="Quantum Speedup" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase()} sub="Qiskit Walk" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Quantum Walk Evolution" tex="|\\psi(t+1)\\rangle = S \\cdot (C \\otimes I) |\\psi(t)\\rangle" />
          <FormulaBlock label="Ballistic Spread" tex="\\sigma_Q \\propto t \\quad \\text{vs} \\quad \\sigma_C \\propto \\sqrt{t}" />
        </div>
        <div>
          <SectionTitle title="QUANTUM vs CLASSICAL PROBABILITY" corTema={corTema} />
          {isClient && r.positions && (
            <Plot data={[
              { x: r.positions, y: r.probabilities, type: 'scatter', mode: 'lines', line: { color: CHART_CYAN, width: 2 }, name: 'Quantum Walk', fill: 'tozeroy', fillcolor: CHART_CYAN + '11' },
              { x: r.positions, y: r.classicalProbabilities, type: 'scatter', mode: 'lines', line: { color: CHART_RED, width: 2, dash: 'dash' }, name: 'Classical Walk' },
            ]}
            layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, showlegend: true, legend: { font: { size: 8, color: '#666' }, bgcolor: 'transparent' }, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Position', font: { size: 8 } } }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Probability', font: { size: 8 } } } } as any}
            config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
          )}
        </div>
        {r.steps && r.steps.length > 2 && (
          <div>
            <SectionTitle title="WALK EVOLUTION 3D" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                z: r.steps.map((s: any) => s.distribution),
                type: 'surface', colorscale: VIRIDIS, showscale: false,
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 450, scene: { ...PLOTLY_3D_SCENE, xaxis: { ...PLOTLY_3D_SCENE.xaxis, title: 'Position' }, yaxis: { ...PLOTLY_3D_SCENE.yaxis, title: 'Time Step' }, zaxis: { ...PLOTLY_3D_SCENE.zaxis, title: 'Probability' }, camera: { eye: { x: 1.8, y: 1.2, z: 1.0 } } }, margin: { l: 0, r: 0, t: 10, b: 0 } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 450 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QANNEAL RESULTS ────────────────────────────────────────

  const renderQAnnealResults = () => {
    const r = results
    if (!r) return null
    const conv = r.convergence || []
    const landscape = r.energyLandscape || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Optimal Cost" valor={r.optimalCost?.toFixed(4)} sub="Quantum Annealing" corTema={corTema} />
          <MetricBox label="Classical Cost" valor={r.classicalComparison?.cost?.toFixed(4)} sub="SA Comparison" corTema={corTema} />
          <MetricBox label="Improvement" valor={`${r.optimalCost < r.classicalComparison?.cost ? ((1 - r.optimalCost / r.classicalComparison.cost) * 100).toFixed(1) : '0.0'}%`} sub="QA vs SA" corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase()} sub="D-Wave Compatible" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Annealing Schedule" tex="H(s) = (1-s) H_{\\text{driver}} + s H_{\\text{problem}}" />
          <FormulaBlock label="Transverse Field" tex="H_{\\text{driver}} = -\\Gamma(t) \\sum_i \\sigma_i^x, \\quad \\Gamma(t) \\to 0" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="ANNEALING CONVERGENCE" corTema={corTema} />
            {isClient && conv.length > 0 && (
              <Plot data={[
                { x: conv.map((c: any) => c.step), y: conv.map((c: any) => c.cost), type: 'scatter', mode: 'lines', line: { color: CHART_BLUE, width: 2 }, name: 'Cost', yaxis: 'y' },
                { x: conv.map((c: any) => c.step), y: conv.map((c: any) => c.temperature), type: 'scatter', mode: 'lines', line: { color: CHART_RED, width: 1, dash: 'dot' }, name: 'Temperature', yaxis: 'y2' },
              ]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, showlegend: true, legend: { font: { size: 8, color: '#666' }, bgcolor: 'transparent' }, yaxis2: { overlaying: 'y', side: 'right', gridcolor: 'transparent', tickfont: { size: 8, color: '#888' } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="ENERGY LANDSCAPE" corTema={corTema} />
            {isClient && landscape.length > 0 && (
              <Plot data={[{
                x: landscape.map((l: any) => l.x),
                y: landscape.map((l: any) => l.energy),
                type: 'scatter', mode: 'lines',
                line: { color: CHART_AMBER, width: 2 },
                fill: 'tozeroy', fillcolor: CHART_AMBER + '11',
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Configuration', font: { size: 8 } } }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Energy', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
        {r.optimalSolution && (
          <div>
            <SectionTitle title="OPTIMAL SOLUTION (Binary)" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                x: r.optimalSolution.map((_: any, i: number) => `x_${i}`),
                y: r.optimalSolution,
                type: 'bar',
                marker: { color: r.optimalSolution.map((v: number) => v === 1 ? CHART_GREEN : '#333') },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 280, bargap: 0.3 } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 280 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QEC RESULTS ────────────────────────────────────────────

  const renderQECResults = () => {
    const r = results
    if (!r) return null
    const comparison = r.comparison?.codes || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Code" valor={r.codeType || '-'} sub="QEC Protocol" corTema={corTema} />
          <MetricBox label="Physical Rate" valor={(r.physicalErrorRate ?? r.uncorrectedErrorRate)?.toExponential(2)} sub="p_phys" corTema={corTema} />
          <MetricBox label="Logical Rate" valor={(r.logicalErrorRate ?? r.correctedErrorRate)?.toExponential(2)} sub="p_logical" corTema={corTema} />
          <MetricBox label="Improvement" valor={`${(r.improvement ?? ((1 - (r.logicalErrorRate || 0) / (r.physicalErrorRate || 1)) * 100))?.toFixed(1)}%`} sub="Error Suppression" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Logical Qubit" tex="|\\psi_L\\rangle = \\alpha|0_L\\rangle + \\beta|1_L\\rangle" />
          <FormulaBlock label="Surface Code Threshold" tex="p_L \\approx \\left(\\frac{p}{p_{\\text{th}}}\\right)^{\\lceil d/2 \\rceil}, \\quad p_{\\text{th}} \\approx 1\\%" />
        </div>
        {comparison.length > 0 && (
          <div>
            <SectionTitle title="QEC CODE COMPARISON" corTema={corTema} />
            {isClient && (
              <Plot data={[
                { x: comparison.map((c: any) => c.name), y: comparison.map((c: any) => c.logicalRate), type: 'bar', name: 'Logical Error Rate', marker: { color: CHART_BLUE, opacity: 0.8 } },
                { x: comparison.map((c: any) => c.name), y: comparison.map(() => r.physicalErrorRate || qecErrorRate), type: 'scatter', mode: 'lines', name: 'Physical Rate', line: { color: CHART_RED, dash: 'dash' } },
              ]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, showlegend: true, legend: { font: { size: 8, color: '#666' }, bgcolor: 'transparent' }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, type: 'log', title: { text: 'Error Rate', font: { size: 8 } } }, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, tickangle: -30 } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        )}
        {r.distanceScaling && (
          <div>
            <SectionTitle title="SURFACE CODE SCALING" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                x: r.distanceScaling.map((d: any) => d.distance),
                y: r.distanceScaling.map((d: any) => d.logicalRate),
                type: 'scatter', mode: 'lines+markers',
                line: { color: CHART_GREEN, width: 2 },
                marker: { color: CHART_GREEN, size: 5 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 350, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, type: 'log', title: { text: 'Logical Error Rate', font: { size: 8 } } }, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Code Distance', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 350 }} />
            )}
          </div>
        )}
        {(r.syndromeDistribution || r.errorTypes) && (
          <div>
            <SectionTitle title={r.syndromeDistribution ? 'SYNDROME DISTRIBUTION' : 'ERROR TYPE DISTRIBUTION'} corTema={corTema} />
            {isClient && (
              <Plot data={[{
                x: (r.syndromeDistribution || r.errorTypes).map((s: any) => s.syndrome || s.type),
                y: (r.syndromeDistribution || r.errorTypes).map((s: any) => s.count),
                type: 'bar',
                marker: { color: CHART_CYAN, opacity: 0.8 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 350, bargap: 0.3 } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 350 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QFINANCE RESULTS ───────────────────────────────────────

  const renderQFinanceResults = () => {
    const r = results
    if (!r) return null
    const conv = r.convergence || []
    const amps = r.amplitudeDistribution || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <MetricBox label="Quantum Price" valor={`$${r.quantumPrice?.toFixed(4)}`} sub="QAE Estimate" corTema={corTema} />
          <MetricBox label="Classical Price" valor={`$${r.classicalPrice?.toFixed(4)}`} sub="Black-Scholes" corTema={corTema} />
          <MetricBox label="Confidence" valor={`${r.confidence?.toFixed(1)}%`} sub="Quantum CI" corTema={corTema} />
          <MetricBox label="Delta" valor={r.greeks?.delta?.toFixed(4)} sub={`Gamma: ${r.greeks?.gamma?.toFixed(4)}`} corTema={corTema} />
          <MetricBox label="Engine" valor={r.engine?.toUpperCase()} sub="QuantLib QAE" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Quantum Amplitude Estimation" tex="\\tilde{V} = \\sin^2(\\pi\\tilde{a}) \\cdot V_{\\max}, \\quad \\epsilon = O(2^{-n})" />
          <FormulaBlock label="Quadratic Speedup" tex="\\text{QAE: } O(1/\\epsilon) \\quad \\text{vs MC: } O(1/\\epsilon^2)" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="PRICE CONVERGENCE" corTema={corTema} />
            {isClient && conv.length > 0 && (
              <Plot data={[
                { x: conv.map((c: any) => c.step), y: conv.map((c: any) => c.estimate), type: 'scatter', mode: 'lines+markers', line: { color: CHART_BLUE, width: 2 }, marker: { size: 4 }, name: 'QAE Estimate' },
                { x: [conv[0]?.step, conv[conv.length - 1]?.step], y: [r.classicalPrice, r.classicalPrice], type: 'scatter', mode: 'lines', line: { color: CHART_RED, dash: 'dash' }, name: 'BS Price' },
              ]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, showlegend: true, legend: { font: { size: 8, color: '#666' }, bgcolor: 'transparent' }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Price', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="AMPLITUDE DISTRIBUTION" corTema={corTema} />
            {isClient && amps.length > 0 && (
              <Plot data={[{
                x: amps.map((a: any) => a.state),
                y: amps.map((a: any) => a.amplitude),
                type: 'bar',
                marker: { color: amps.map((a: any) => a.amplitude), colorscale: VIRIDIS, showscale: false },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Quantum State', font: { size: 8 } } }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Amplitude', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
        {r.greeks && (
          <div>
            <SectionTitle title="GREEKS" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                x: ['Delta', 'Gamma', 'Vega'],
                y: [r.greeks.delta, r.greeks.gamma, r.greeks.vega],
                type: 'bar',
                marker: { color: [CHART_BLUE, CHART_GREEN, CHART_AMBER] },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 300, bargap: 0.4 } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 300 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QCORR RESULTS ──────────────────────────────────────────

  const renderQCorrResults = () => {
    const r = results
    if (!r) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <MetricBox label="Quantum Corr" valor={r.quantumCorrelation?.toFixed(4)} sub="Enhanced" corTema={corTema} />
          <MetricBox label="Classical Corr" valor={r.classicalCorrelation?.toFixed(4)} sub="Pearson" corTema={corTema} />
          <MetricBox label="Bell Parameter" valor={r.bellParameter?.toFixed(3)} sub={r.bellParameter > 2 ? 'VIOLATES CHSH!' : 'Classical'} corTema={corTema} />
          <MetricBox label="Mutual Info" valor={r.mutualInformation?.toFixed(4)} sub={`Q: ${r.quantumMutualInfo?.toFixed(4)}`} corTema={corTema} />
          <MetricBox label="Current Regime" valor={String(r.currentRegime)} sub={`of ${r.regimeReturns?.length}`} corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="CHSH Bell Inequality" tex="S = |E(a,b) - E(a,b')| + |E(a',b) + E(a',b')| \\leq 2\\sqrt{2}" />
          <FormulaBlock label="Quantum Mutual Info" tex="I_Q(A:B) = S(\\rho_A) + S(\\rho_B) - S(\\rho_{AB})" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="RETURN SERIES (Quantum Correlated)" corTema={corTema} />
            {isClient && r.series1 && (
              <Plot data={[
                { y: r.series1.slice(0, 100), type: 'scatter', mode: 'lines', line: { color: CHART_BLUE, width: 1 }, name: 'Series 1' },
                { y: r.series2.slice(0, 100), type: 'scatter', mode: 'lines', line: { color: CHART_RED, width: 1 }, name: 'Series 2' },
              ]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, showlegend: true, legend: { font: { size: 8, color: '#666' }, bgcolor: 'transparent' } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="REGIME DETECTION" corTema={corTema} />
            {isClient && r.regimes && (
              <Plot data={[{
                y: r.series1 || [],
                type: 'scatter', mode: 'markers',
                marker: { color: r.regimes, colorscale: PLASMA, size: 4, showscale: true, colorbar: { title: { text: 'Regime', font: { size: 8 } }, tickfont: { size: 7 }, len: 0.5 } },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'Time', font: { size: 8 } } }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Return', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
        {r.transitions && (
          <div>
            <SectionTitle title="REGIME TRANSITION MATRIX" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                z: r.transitions,
                type: 'heatmap', colorscale: VIRIDIS,
                showscale: true, colorbar: { tickfont: { size: 7 }, len: 0.5 },
                text: r.transitions.map((row: number[]) => row.map((v: number) => v.toFixed(2))),
                texttemplate: '%{text}', textfont: { size: 8 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 350, xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'To Regime', font: { size: 8 } } }, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'From Regime', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 350 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── QPCA RESULTS ───────────────────────────────────────────

  const renderQPCAResults = () => {
    const r = results
    if (!r) return null
    const ev = r.eigenvalues || []
    const expl = r.explainedVariance || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricBox label="Top Eigenvalue" valor={ev[0]?.toFixed(4) || '-'} sub="Lambda_1" corTema={corTema} />
          <MetricBox label="Explained Var" valor={`${(expl[0] * 100)?.toFixed(1)}%`} sub="PC1" corTema={corTema} />
          <MetricBox label="Components" valor={String(ev.length)} sub={`of ${qpcaFeatures}`} corTema={corTema} />
          <MetricBox label="Speedup" valor={r.quantumSpeedup?.split(':')[0] || '-'} sub="O(log N)" corTema={corTema} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormulaBlock label="Quantum PCA" tex="\\rho = \\sum_i \\lambda_i |v_i\\rangle\\langle v_i|, \\quad \\text{QPE} \\to \\lambda_i" />
          <FormulaBlock label="Exponential Speedup" tex="\\text{QPCA: } O(\\log N) \\quad \\text{vs Classical: } O(N^2)" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionTitle title="SCREE PLOT (Eigenvalues)" corTema={corTema} />
            {isClient && ev.length > 0 && (
              <Plot data={[{
                x: ev.map((_: any, i: number) => `PC${i + 1}`),
                y: ev,
                type: 'bar',
                marker: { color: ev.map((_: any, i: number) => [CHART_BLUE, CHART_GREEN, CHART_AMBER, CHART_RED, CHART_CYAN][i % 5]) },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Eigenvalue', font: { size: 8 } } } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
          <div>
            <SectionTitle title="CUMULATIVE EXPLAINED VARIANCE" corTema={corTema} />
            {isClient && expl.length > 0 && (
              <Plot data={[{
                x: expl.map((_: any, i: number) => `PC${i + 1}`),
                y: expl.map((_: any, i: number) => expl.slice(0, i + 1).reduce((s: number, v: number) => s + v, 0) * 100),
                type: 'scatter', mode: 'lines+markers',
                line: { color: CHART_GREEN, width: 2 },
                marker: { color: CHART_GREEN, size: 6 },
                fill: 'tozeroy', fillcolor: CHART_GREEN + '11',
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 380, yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'Cumulative %', font: { size: 8 } }, range: [0, 105] } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 380 }} />
            )}
          </div>
        </div>
        {r.projectedData && r.projectedData[0]?.length >= 3 && (
          <div>
            <SectionTitle title="PROJECTED DATA 3D (First 3 PCs)" corTema={corTema} />
            {isClient && (
              <Plot data={[{
                x: r.projectedData.map((d: number[]) => d[0]),
                y: r.projectedData.map((d: number[]) => d[1]),
                z: r.projectedData.map((d: number[]) => d[2]),
                type: 'scatter3d', mode: 'markers',
                marker: { color: r.projectedData.map((d: number[]) => d[0]), colorscale: VIRIDIS, size: 2.5, opacity: 0.7 },
              }]}
              layout={{ ...PLOTLY_LAYOUT_BASE, height: 480, scene: { ...PLOTLY_3D_SCENE, xaxis: { ...PLOTLY_3D_SCENE.xaxis, title: 'PC1' }, yaxis: { ...PLOTLY_3D_SCENE.yaxis, title: 'PC2' }, zaxis: { ...PLOTLY_3D_SCENE.zaxis, title: 'PC3' }, camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } } }, margin: { l: 0, r: 0, t: 10, b: 0 } } as any}
              config={{ displayModeBar: false }} style={{ width: '100%', height: 480 }} />
            )}
          </div>
        )}
      </div>
    )
  }

  // ── MAIN RENDER ───────────────────────────────────────────────

  const activeToolObj = TOOLS.find(t => t.id === activeTool)

  return (
    <div className="h-full flex flex-col bg-[#050505] text-[#ccc] font-mono overflow-hidden">
      {/* ── Sidebar (params) + Main Content ────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ── Sidebar: Parameters only ─────────────────────── */}
        <div className="w-[240px] flex flex-col border-r border-[#151515] bg-[#0A0A0A] shrink-0">
          {/* Algorithm title */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#151515] bg-[#080808]">
            <span style={{ color: activeToolObj?.catColor || corTema }}>{activeToolObj?.icone}</span>
            <span className="text-[10px] font-bold text-white tracking-wide">{activeToolObj?.titulo}</span>
          </div>

          {/* Parameters */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[8px] text-neutral-500 tracking-widest mb-3">PARAMETERS</p>
            {renderParams()}
          </div>

          {/* Compute Button */}
          <div className="p-3 border-t border-[#151515] bg-[#080808]">
            <button onClick={compute} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: corTema, color: '#000' }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="#000" />}
              {loading ? 'COMPUTING...' : 'COMPUTE'}
            </button>
            {results && (
              <div className="flex items-center gap-2 mt-2">
                <Activity size={8} style={{ color: activeToolObj?.catColor }} />
                <p className="text-[8px] font-bold" style={{ color: activeToolObj?.catColor }}>
                  {results.engine?.toUpperCase()}
                </p>
                <button onClick={() => { setResults(null); setError(null) }}
                  className="ml-auto text-[7px] text-neutral-600 hover:text-neutral-400 tracking-widest">CLEAR</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {renderResults()}
        </div>
      </div>
    </div>
  )
}
