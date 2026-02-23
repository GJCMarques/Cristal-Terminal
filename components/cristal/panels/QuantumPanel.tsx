'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Painel de Finança Quântica
// QAE · QAOA · Grover · Bell State · Quantum VaR
// ============================================================

import { useState, useCallback } from 'react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import { Atom, Zap, TrendingUp, Shield, BarChart2, Play, Loader2, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts'
import {
  bellState, qaeOpcaoCall, qaoa, grover, quantumVaR,
  type ResultadoBellState, type ResultadoQAE,
  type ResultadoQAOA, type ResultadoGrover, type ResultadoQuantumVaR,
} from '@/lib/quantum/algorithms'

// ── Tipos ─────────────────────────────────────────────────────

type DemoId = 'bell' | 'qae-opcao' | 'qaoa' | 'grover' | 'quantum-var'

interface Demo {
  id:        DemoId
  titulo:    string
  sub:       string
  icone:     React.ReactNode
  categoria: string
}

const DEMOS: Demo[] = [
  { id:'bell',       titulo:'Bell State',        sub:'Superposição + Emaranhamento quântico',    icone:<Atom size={11}/>,      categoria:'FUNDAMENTOS' },
  { id:'qae-opcao',  titulo:'QAE — Derivativos', sub:'Precificação quântica vs Monte Carlo',     icone:<Zap size={11}/>,       categoria:'DERIVATIVOS' },
  { id:'qaoa',       titulo:'QAOA — Portfolio',  sub:'Optimização de portfolio via qubits',      icone:<TrendingUp size={11}/>, categoria:'PORTFOLIO' },
  { id:'grover',     titulo:'Grover — Anomalias',sub:'Detecção O(√N) vs O(N) clássico',         icone:<Shield size={11}/>,    categoria:'RISCO' },
  { id:'quantum-var',titulo:'Quantum VaR',        sub:'Value at Risk via amplitude quântica',    icone:<BarChart2 size={11}/>, categoria:'RISCO' },
]

// ── Componentes auxiliares ────────────────────────────────────

function MetricaBox({ label, valor, sub, corTema }: { label: string; valor: string; sub?: string; corTema: string }) {
  return (
    <div className="border border-neutral-800 rounded p-3 bg-[#080808]">
      <p className="text-[8px] text-neutral-300 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[15px] font-bold leading-tight" style={{ color: corTema }}>{valor}</p>
      {sub && <p className="text-[8px] text-neutral-300 mt-0.5">{sub}</p>}
    </div>
  )
}

function SecTitulo({ titulo, corTema }: { titulo: string; corTema: string }) {
  return (
    <p className="text-[9px] font-bold tracking-widest mt-4 mb-2 first:mt-0" style={{ color: corTema + 'AA' }}>
      {titulo}
    </p>
  )
}

const TT_STYLE = (cor: string) => ({
  background: '#111',
  border: `1px solid ${cor}44`,
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 10,
})
const TICK_STYLE = { fill: '#6B7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }

// ── Renders de cada demo ──────────────────────────────────────

function RenderBell({ r, corTema }: { r: ResultadoBellState; corTema: string }) {
  const chartData = r.probabilidades.map(p => ({ estado: p.estado, prob: +(p.prob * 100).toFixed(1) }))
  const amostraData = Object.entries(r.amostras)
    .map(([k, v]) => ({ estado: '|' + k + '⟩', contagem: v }))
    .sort((a, b) => a.estado.localeCompare(b.estado))

  return (
    <div className="space-y-1">
      <SecTitulo titulo="CIRCUITO QUÂNTICO — ESTADO DE BELL |Φ⁺⟩" corTema={corTema} />
      <pre className="text-[11px] leading-relaxed p-3 rounded border border-neutral-800 bg-[#080808] overflow-x-auto"
        style={{ color: corTema, fontFamily: 'IBM Plex Mono, monospace' }}>
        {r.diagrama}
      </pre>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <MetricaBox label="Estado Quântico" valor="|Φ⁺⟩" sub="Estado de Bell máx. emaranhado" corTema={corTema} />
        <MetricaBox label="Correlação" valor="100%" sub="Medir q₀=0 → q₁=0 sempre" corTema={corTema} />
      </div>

      <SecTitulo titulo="AMPLITUDES TEÓRICAS (PROBABILIDADE)" corTema={corTema} />
      <div className="grid grid-cols-4 gap-2">
        {r.probabilidades.map(p => (
          <div key={p.estado} className="border border-neutral-800 rounded p-3 text-center bg-[#080808]">
            <p className="text-[13px] font-bold" style={{ color: corTema }}>{p.estado}</p>
            <p className="text-[10px] text-neutral-400 mt-1">{(p.prob * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>

      <SecTitulo titulo="MEDIÇÕES SIMULADAS — 1024 SHOTS" corTema={corTema} />
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={amostraData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="estado" tick={TICK_STYLE} />
          <YAxis tick={TICK_STYLE} />
          <Tooltip contentStyle={TT_STYLE(corTema)} />
          <Bar dataKey="contagem" fill={corTema} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>

      <div className="p-3 rounded border border-neutral-800 bg-[#080808] mt-3">
        <p className="text-[8px] text-neutral-300 uppercase tracking-widest mb-1">Explicação</p>
        {r.descricao.split('\n').map((linha, i) => (
          <p key={i} className="text-[9px] text-neutral-200 leading-relaxed">{linha}</p>
        ))}
      </div>
    </div>
  )
}

function RenderQAE({ r, corTema }: { r: ResultadoQAE; corTema: string }) {
  const barData = [
    { label: 'QAE Quântico', valor: r.avaliacoesQuanticas, cor: corTema },
    { label: 'Monte Carlo', valor: Math.min(r.avaliacoesClassicas, r.avaliacoesQuanticas * r.speedupFator), cor: '#374151' },
  ]
  return (
    <div className="space-y-1">
      <SecTitulo titulo="QAE — QUANTUM AMPLITUDE ESTIMATION" corTema={corTema} />
      <p className="text-[9px] text-neutral-300 -mt-1 mb-3">
        Opção Call: S=170 K=175 T=3m r=5% σ=28% | {r.avaliacoesQuanticas.toLocaleString()} avaliações quânticas (2⁸)
      </p>

      <div className="grid grid-cols-2 gap-3">
        <MetricaBox label="Preço QAE" valor={`$${r.valorEstimado.toFixed(4)}`} sub="Quantum Amplitude Estimation" corTema={corTema} />
        <MetricaBox label="Preço Black-Scholes" valor={`$${r.comparacaoClassica.toFixed(4)}`} sub="Analítico (referência exacta)" corTema={corTema} />
        <MetricaBox label="Erro vs BS" valor={`${r.erroPct.toFixed(3)}%`} sub={`Precisão: ε = ${r.precisao.toExponential(2)}`} corTema={corTema} />
        <MetricaBox label="Speedup Quântico" valor={`${r.speedupFator.toLocaleString()}×`} sub="QAE vs Monte Carlo clássico" corTema={corTema} />
      </div>

      <SecTitulo titulo="AVALIAÇÕES NECESSÁRIAS (MESMA PRECISÃO)" corTema={corTema} />
      <div className="space-y-3 p-3 border border-neutral-800 rounded bg-[#080808]">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[9px]" style={{ color: corTema }}>QAE Quântico — O(1/ε)</span>
            <span className="text-[9px] font-bold" style={{ color: corTema }}>{r.avaliacoesQuanticas.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-sm overflow-hidden bg-[#111]">
            <div className="h-full rounded-sm transition-all" style={{ width: '1%', background: corTema }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-neutral-200">Monte Carlo Clássico — O(1/ε²)</span>
            <span className="text-[9px] font-bold text-neutral-200">{r.avaliacoesClassicas.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-sm overflow-hidden bg-neutral-800">
            <div className="h-full rounded-sm bg-neutral-600" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-1">
        <MetricaBox label="Avaliações QAE" valor={r.avaliacoesQuanticas.toLocaleString()} sub="O(1/ε) — quadrático" corTema={corTema} />
        <MetricaBox label="Avaliações MC" valor={r.avaliacoesClassicas.toLocaleString()} sub="O(1/ε²) — clássico" corTema={corTema} />
        <MetricaBox label="Amplitude" valor={r.amplitudeEstimada.toFixed(5)} sub="Estimativa quântica" corTema={corTema} />
      </div>

      <div className="p-3 rounded border border-neutral-800 bg-[#080808] mt-1">
        <p className="text-[9px] text-neutral-200 leading-relaxed">
          <span style={{ color: corTema }}>Quantum Amplitude Estimation</span> usa estimativa de fase quântica
          para avaliar E[f(X)] com precisão ε em apenas O(1/ε) chamadas ao oráculo —
          uma <span style={{ color: corTema }}>vantagem quadrática</span> sobre o Monte Carlo clássico que precisa de O(1/ε²) amostras.
          Para ε≈0.012: QAE usa {r.avaliacoesQuanticas} avaliações vs {r.avaliacoesClassicas.toLocaleString()} do MC — speedup de {r.speedupFator.toLocaleString()}×.
        </p>
      </div>
    </div>
  )
}

function RenderQAOA({ r, corTema }: { r: ResultadoQAOA; corTema: string }) {
  const tickers = ['SPX', 'NVDA', 'EUR/USD', 'MSFT', 'XAU', 'BTC']
  const pesosData = tickers.slice(0, r.pesosOtimos.length).map((t, i) => ({
    activo: t, peso: +(r.pesosOtimos[i] * 100).toFixed(1),
  }))
  const convData = r.convergencia
    .filter((_, i) => i % 4 === 0)
    .map((e, i) => ({ iter: i * 4, energia: +e.toFixed(4) }))
  const distData = r.distribuicao.slice(0, 6).map(d => ({
    estado: d.estado, prob: +(d.prob * 100).toFixed(2), sharpe: +d.sharpe.toFixed(2),
  }))

  return (
    <div className="space-y-1">
      <SecTitulo titulo={`QAOA — ${r.nQubits} QUBITS → ${r.nPortfoliosPossiveis.toLocaleString()} PORTFOLIOS POSSÍVEIS`} corTema={corTema} />

      <div className="grid grid-cols-4 gap-2">
        <MetricaBox label="Sharpe Óptimo" valor={r.sharpe.toFixed(3)} sub="QAOA optimizado" corTema={corTema} />
        <MetricaBox label="Retorno" valor={`${(r.retornoEsperado * 100).toFixed(1)}%`} sub="Anualizado" corTema={corTema} />
        <MetricaBox label="Volatilidade" valor={`${(r.volatilidade * 100).toFixed(1)}%`} sub="Anualizada" corTema={corTema} />
        <MetricaBox label="P(óptimo medido)" valor={`${(r.probabilidade * 100).toFixed(1)}%`} sub="Após QAOA" corTema={corTema} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-1">
        <div>
          <SecTitulo titulo="PESOS ÓPTIMOS (PORTFOLIO QUÂNTICO)" corTema={corTema} />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pesosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="activo" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} unit="%" />
              <Tooltip contentStyle={TT_STYLE(corTema)} />
              <Bar dataKey="peso" fill={corTema} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <SecTitulo titulo="CONVERGÊNCIA QAOA (ENERGIA)" corTema={corTema} />
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={convData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="iter" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip contentStyle={TT_STYLE(corTema)} />
              <Line type="monotone" dataKey="energia" stroke={corTema} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SecTitulo titulo="DISTRIBUIÇÃO DE PROBABILIDADE — TOP PORTFOLIOS (ESTADOS QUÂNTICOS)" corTema={corTema} />
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={distData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="estado" tick={{ ...TICK_STYLE, fontSize: 8 }} />
          <YAxis tick={TICK_STYLE} unit="%" />
          <Tooltip contentStyle={TT_STYLE(corTema)} />
          <Bar dataKey="prob">
            {distData.map((_, i) => <Cell key={i} fill={i === 0 ? corTema : corTema + '44'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[8px] text-neutral-300">
        Cada estado binário (ex: 110100) representa um portfolio onde 1=incluir activo, 0=excluir.
        O QAOA amplifica a probabilidade do portfolio de Sharpe máximo.
      </p>
    </div>
  )
}

function RenderGrover({ r, corTema }: { r: ResultadoGrover; corTema: string }) {
  const chartData = r.distribuicao.slice(0, 10).map(d => ({
    estado: d.estado.slice(-6),
    prob: +(d.prob * 100).toFixed(2),
    marcado: d.marcado,
  }))

  return (
    <div className="space-y-1">
      <SecTitulo titulo="GROVER — DETECÇÃO QUÂNTICA DE ANOMALIAS" corTema={corTema} />
      <p className="text-[9px] text-neutral-300 -mt-1 mb-3">
        Espaço: 2⁸ = 256 padrões de transacção | Anomalias: bits 6+7 activos (horário + valor suspeito)
      </p>

      <div className="grid grid-cols-4 gap-2">
        <MetricaBox label="Anomalia Detectada" valor={r.estadoBinario} sub={`Índice #${r.estadoEncontrado}`} corTema={corTema} />
        <MetricaBox label="Probabilidade" valor={`${(r.probabilidade * 100).toFixed(1)}%`} sub="Após amplificação Grover" corTema={corTema} />
        <MetricaBox label="Iter. Quânticas" valor={String(r.iteracoesQuanticas)} sub={`O(√256) ≈ ${r.iteracoesQuanticas}`} corTema={corTema} />
        <MetricaBox label="Speedup" valor={`${r.speedup}×`} sub={`Clássico: ${r.iteracoesClassicas} verificações`} corTema={corTema} />
      </div>

      <SecTitulo titulo="AMPLIFICAÇÃO DE AMPLITUDE (TOP 10 ESTADOS)" corTema={corTema} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="estado" tick={{ ...TICK_STYLE, fontSize: 8 }} />
          <YAxis tick={TICK_STYLE} unit="%" />
          <Tooltip contentStyle={TT_STYLE(corTema)} />
          <Bar dataKey="prob">
            {chartData.map((d, i) => <Cell key={i} fill={d.marcado ? '#EF4444' : corTema + '44'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[8px] text-neutral-300">
        <span className="text-red-500">■</span> Estados marcados como anómalos &nbsp;|&nbsp;
        <span style={{ color: corTema + '88' }}>■</span> Padrões normais
      </p>

      <SecTitulo titulo="CIRCUITO ILUSTRATIVO (4 QUBITS)" corTema={corTema} />
      <pre className="text-[11px] leading-relaxed p-3 rounded border border-neutral-800 bg-[#080808] overflow-x-auto"
        style={{ color: corTema, fontFamily: 'IBM Plex Mono, monospace' }}>
        {r.diagrama}
      </pre>

      <div className="p-3 rounded border border-neutral-800 bg-[#080808]">
        <p className="text-[9px] text-neutral-200 leading-relaxed">
          O <span style={{ color: corTema }}>Algoritmo de Grover</span> amplifica a amplitude dos estados marcados
          (anomalias/fraudes) em apenas O(√N) iterações. Para 256 padrões: {r.iteracoesQuanticas} iter. quânticas
          vs {r.iteracoesClassicas} verificações clássicas — <span style={{ color: corTema }}>speedup de {r.speedup}×</span>.
          Aplicação: detecção de fraude, padrões off-market, transacções suspeitas.
        </p>
      </div>
    </div>
  )
}

function RenderQuantumVaR({ r, corTema }: { r: ResultadoQuantumVaR; corTema: string }) {
  const chartData = r.distribuicao.map(d => ({
    retorno: +d.retorno.toFixed(2),
    prob: +(d.prob * 1000).toFixed(3),
    perda: d.retorno < -r.var95,
  }))

  return (
    <div className="space-y-1">
      <SecTitulo titulo="QUANTUM VaR — RISK MEASUREMENT VIA QAE" corTema={corTema} />
      <p className="text-[9px] text-neutral-300 -mt-1 mb-3">
        Portfolio: μ=8%/ano σ=20%/ano | Horizonte: 10 dias | 2⁸={r.avaliacoesQuanticas} pontos quânticos
      </p>

      <div className="grid grid-cols-4 gap-2">
        <MetricaBox label="VaR 95% (10d)" valor={`${r.var95.toFixed(2)}%`} sub="Quantum Amplitude Est." corTema={corTema} />
        <MetricaBox label="VaR 99% (10d)" valor={`${r.var99.toFixed(2)}%`} sub="Cauda extrema" corTema={corTema} />
        <MetricaBox label="P(perda)" valor={`${(r.amplitudeEstimada * 100).toFixed(1)}%`} sub="Amplitude quântica" corTema={corTema} />
        <MetricaBox label="Speedup vs MC" valor={`${r.speedupFator.toLocaleString()}×`} sub="Vantagem quadrática" corTema={corTema} />
      </div>

      <SecTitulo titulo="DISTRIBUIÇÃO DE RETORNOS (10 DIAS) — CAUDA DE RISCO" corTema={corTema} />
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="retorno" tick={{ ...TICK_STYLE, fontSize: 8 }} unit="%" />
          <YAxis tick={TICK_STYLE} />
          <Tooltip contentStyle={TT_STYLE(corTema)} formatter={(v: number) => [(v / 1000).toFixed(4), 'Probabilidade']} />
          <Bar dataKey="prob">
            {chartData.map((d, i) => <Cell key={i} fill={d.perda ? '#EF4444' : corTema + '66'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[8px] text-neutral-300">
        <span className="text-red-500">■</span> Cauda de risco (perda &gt; VaR 95%) &nbsp;|&nbsp;
        <span style={{ color: corTema + '88' }}>■</span> Distribuição normal dos retornos
      </p>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <MetricaBox label="Avaliações QAE" valor={r.avaliacoesQuanticas.toLocaleString()} sub="O(1/ε) — quântico" corTema={corTema} />
        <MetricaBox label="MC Equivalente" valor={r.avaliacoesClassicas.toLocaleString()} sub="O(1/ε²) — clássico" corTema={corTema} />
      </div>

      <div className="p-3 rounded border border-neutral-800 bg-[#080808]">
        <p className="text-[9px] text-neutral-200 leading-relaxed">
          O <span style={{ color: corTema }}>Quantum VaR</span> usa QAE para estimar a probabilidade da cauda de risco
          com precisão ε em O(1/ε) avaliações. O computador quântico discretiza a distribuição em {r.avaliacoesQuanticas} pontos
          e usa estimativa de fase para calcular a amplitude de probabilidade — {r.speedupFator.toLocaleString()}× mais eficiente
          que MC clássico para a mesma precisão.
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

type DemoResultado =
  | { tipo: 'bell';        dados: ResultadoBellState }
  | { tipo: 'qae-opcao';  dados: ResultadoQAE }
  | { tipo: 'qaoa';       dados: ResultadoQAOA }
  | { tipo: 'grover';     dados: ResultadoGrover }
  | { tipo: 'quantum-var';dados: ResultadoQuantumVaR }
  | { tipo: 'erro';        dados: string }

export function QuantumPanel() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [demoActiva, setDemoActiva] = useState<DemoId>('bell')
  const [resultado, setResultado]   = useState<DemoResultado | null>(null)
  const [loading, setLoading]       = useState(false)

  const executar = useCallback(async (id: DemoId) => {
    setLoading(true)
    setDemoActiva(id)
    await new Promise(r => setTimeout(r, 50))  // yield ao UI
    try {
      let res: DemoResultado
      if (id === 'bell') {
        res = { tipo: 'bell', dados: bellState() }
      } else if (id === 'qae-opcao') {
        res = { tipo: 'qae-opcao', dados: qaeOpcaoCall(170, 175, 0.25, 0.05, 0.28) }
      } else if (id === 'qaoa') {
        const retornos  = [0.12, 0.35, 0.08, 0.22, 0.06, 0.45]
        const vols      = [0.15, 0.50, 0.08, 0.30, 0.12, 0.80]
        const rhos      = [
          [1,.3,.1,.2,.0,.1],[.3,1,.0,.4,.1,.6],[.1,.0,1,.1,.2,.0],
          [.2,.4,.1,1,.1,.3],[.0,.1,.2,.1,1,.0],[.1,.6,.0,.3,.0,1],
        ]
        const cov = Array.from({ length: 6 }, (_, i) =>
          Array.from({ length: 6 }, (_, j) => rhos[i][j] * vols[i] * vols[j])
        )
        res = { tipo: 'qaoa', dados: qaoa(retornos, cov, 0.05, 4) }
      } else if (id === 'grover') {
        // Anomalia: transacção com bits 6 E 7 activos (horário + valor suspeito)
        res = { tipo: 'grover', dados: grover(8, x => (x & 0b11000000) === 0b11000000) }
      } else {
        // quantum-var: mu=8%/ano, sigma=20%/ano, horizonte=10 dias
        res = { tipo: 'quantum-var', dados: quantumVaR(0.08 / 252, 0.20 / Math.sqrt(252), 10) }
      }
      setResultado(res)
    } catch (e) {
      setResultado({ tipo: 'erro', dados: String(e) })
    }
    setLoading(false)
  }, [])

  const renderResultado = () => {
    if (!resultado) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
        <Atom size={48} strokeWidth={0.8} style={{ color: corTema }} />
        <p className="text-[11px] font-mono text-neutral-300">Selecciona um algoritmo quântico</p>
      </div>
    )
    if (resultado.tipo === 'erro') return (
      <div className="p-4 font-mono text-[11px] text-red-400">{resultado.dados}</div>
    )
    if (resultado.tipo === 'bell')        return <RenderBell        r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'qae-opcao')  return <RenderQAE          r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'qaoa')       return <RenderQAOA         r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'grover')     return <RenderGrover       r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'quantum-var') return <RenderQuantumVaR  r={resultado.dados} corTema={corTema} />
    return null
  }

  return (
    <div className="flex h-full bg-[#050505] font-mono overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div className="flex flex-col w-60 shrink-0 border-r border-neutral-900">

        <div className="px-3 py-2.5 border-b border-neutral-900 bg-[#080808]">
          <div className="flex items-center gap-2 mb-0.5">
            <Atom size={11} style={{ color: corTema }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: corTema }}>FINANÇA QUÂNTICA</span>
          </div>
          <p className="text-[8px] text-neutral-400">Simulador de algoritmos quânticos financeiros</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(() => {
            let lastCat = ''
            return DEMOS.map(d => {
              const showCat = d.categoria !== lastCat
              lastCat = d.categoria
              return (
                <div key={d.id}>
                  {showCat && (
                    <p className="px-3 pt-3 pb-1 text-[8px] tracking-widest text-neutral-400">{d.categoria}</p>
                  )}
                  <button
                    onClick={() => executar(d.id)}
                    className="w-full text-left px-3 py-2 border-b border-neutral-900 transition-colors"
                    style={{
                      backgroundColor: demoActiva === d.id ? corTema + '10' : 'transparent',
                      borderLeft: demoActiva === d.id ? `2px solid ${corTema}` : '2px solid transparent',
                    }}>
                    <div className="flex items-center gap-1.5 mb-0.5" style={{ color: demoActiva === d.id ? corTema : '#6B7280' }}>
                      {d.icone}
                      <span className="text-[9px] font-bold">{d.titulo}</span>
                    </div>
                    <p className="text-[8px] text-neutral-300 pl-4">{d.sub}</p>
                  </button>
                </div>
              )
            })
          })()}
        </div>

        {/* Vantagem quântica */}
        <div className="border-t border-neutral-900 p-3">
          <p className="text-[8px] text-neutral-400 uppercase tracking-widest mb-2">Vantagem Quântica</p>
          {[['QAE', 'O(1/ε) vs O(1/ε²)'], ['QAOA', 'Optimiz. combinatória'], ['Grover', 'O(√N) vs O(N)']].map(([a, v]) => (
            <div key={a} className="flex justify-between mb-1">
              <span className="text-[8px]" style={{ color: corTema + '99' }}>{a}</span>
              <span className="text-[8px] text-neutral-300">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Área principal ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-900 bg-[#080808] shrink-0">
          <div className="flex items-center gap-2">
            <ChevronRight size={10} style={{ color: corTema }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: corTema }}>
              {DEMOS.find(d => d.id === demoActiva)?.titulo.toUpperCase()}
            </span>
            <span className="text-[9px] text-neutral-300">
              {DEMOS.find(d => d.id === demoActiva)?.sub}
            </span>
          </div>
          <button
            onClick={() => executar(demoActiva)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold tracking-widest disabled:opacity-50"
            style={{ backgroundColor: corTema, color: '#000' }}>
            {loading ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
            {loading ? 'A simular…' : 'EXECUTAR'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: corTema }} />
              <p className="text-[11px]" style={{ color: corTema + '88' }}>A simular circuito quântico…</p>
            </div>
          ) : renderResultado()}
        </div>
      </div>
    </div>
  )
}
