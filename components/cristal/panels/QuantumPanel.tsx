'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Painel de Finança Quântica [V2]
// QAE · QAOA · Grover · Bell State · Quantum VaR · VQE
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import { Atom, Zap, TrendingUp, Shield, BarChart2, Play, Loader2, ChevronRight, Layers } from 'lucide-react'
import {
  bellState, qaeOpcaoCall, qaoa, grover, quantumVaR, vqeLiquidez,
  type ResultadoBellState, type ResultadoQAE, type ResultadoVQE,
  type ResultadoQAOA, type ResultadoGrover, type ResultadoQuantumVaR,
} from '@/lib/quantum/algorithms'

import { RenderBell, RenderGrover, RenderQAE, RenderQAOA, RenderVQE, RenderVaR } from './quantum/QuantumAlgorithms'
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels'
import { QuantumCommandPalette } from './quantum/QuantumCommandPalette'

// ── Tipos ─────────────────────────────────────────────────────

type DemoId = 'bell' | 'qae-opcao' | 'qaoa' | 'grover' | 'quantum-var' | 'vqe-liquidez'

interface Demo {
  id: DemoId
  titulo: string
  sub: string
  icone: React.ReactNode
  categoria: string
}

const DEMOS: Demo[] = [
  { id: 'bell', titulo: 'Bell State (EPR)', sub: 'Superposição e Correlação Exata', icone: <Atom size={11} />, categoria: 'MATEMÁTICA PURA' },
  { id: 'qaoa', titulo: 'Markowitz QAOA', sub: 'Optimização Quântica Isings', icone: <TrendingUp size={11} />, categoria: 'PORTFOLIO' },
  { id: 'quantum-var', titulo: 'Quantum Monte Carlo VaR', sub: 'QAE Amplitude Estimation', icone: <BarChart2 size={11} />, categoria: 'RISCO' },
  { id: 'grover', titulo: 'Grover Search', sub: 'Wave Interference Anomalies', icone: <Shield size={11} />, categoria: 'RISCO' },
  { id: 'qae-opcao', titulo: 'Derivativos via Integração', sub: 'Black-Scholes Quântico', icone: <Zap size={11} />, categoria: 'DERIVATIVOS' },
  { id: 'vqe-liquidez', titulo: 'VQE Liquidez', sub: 'Ry-CZ Hardware Ansatz', icone: <Layers size={11} />, categoria: 'LIQUIDEZ' },
]

type DemoResultado =
  | { tipo: 'bell'; dados: ResultadoBellState }
  | { tipo: 'qae-opcao'; dados: ResultadoQAE }
  | { tipo: 'qaoa'; dados: ResultadoQAOA }
  | { tipo: 'vqe-liquidez'; dados: ResultadoVQE }
  | { tipo: 'grover'; dados: ResultadoGrover }
  | { tipo: 'quantum-var'; dados: ResultadoQuantumVaR }
  | { tipo: 'erro'; dados: string }

export function QuantumPanel() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [demoActiva, setDemoActiva] = useState<DemoId>('bell')
  const [resultado, setResultado] = useState<DemoResultado | null>(null)
  const [loading, setLoading] = useState(false)
  const [cfg, setCfg] = useState({
    qaeS: 170, qaeK: 175, qaeSigma: 0.28,
    qaoaN: 6, qaoaRf: 0.05,
    varHorizon: 10, varSigma: 0.20,
    groverTarget: 91,
    vqeN: 6
  })

  const [sidebarAberta, setSidebarAberta] = useState(true)
  // null = a carregar do DB, true = ligado, false = desligado
  const [engineLigado, setEngineLigado] = useState<boolean | null>(null)
  const [mostrarModalEngine, setMostrarModalEngine] = useState(false)
  const sidebarRef = useRef<ImperativePanelHandle>(null)
  const isDragging = useRef(false)

  // Carregar estado do engine da BD no mount
  useEffect(() => {
    fetch('/api/quantum/engine')
      .then(r => r.json())
      .then(({ ligado }) => setEngineLigado(ligado))
      .catch(() => setEngineLigado(true))
  }, [])

  // Guardar na BD sempre que muda (null ignorado — é o estado de carregamento)
  useEffect(() => {
    if (engineLigado === null) return
    fetch('/api/quantum/engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ligado: engineLigado }),
    }).catch(() => {})
  }, [engineLigado])

  // Sincronizar demo, sidebar e estado do engine com eventos do Header
  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) {
        setDemoActiva(e.detail)
        setResultado(null)
      }
    }
    const handleSidebar = () => {
      const panel = sidebarRef.current
      if (!panel) return
      if (panel.isCollapsed()) {
        panel.expand()
      } else {
        panel.collapse()
      }
    }
    const handleEngine = () => setEngineLigado(prev => prev === null ? false : !prev)

    window.addEventListener('quantum-tab-change', handleNav)
    window.addEventListener('toggle-quantum-sidebar', handleSidebar)
    window.addEventListener('toggle-quantum-engine', handleEngine)

    return () => {
      window.removeEventListener('quantum-tab-change', handleNav)
      window.removeEventListener('toggle-quantum-sidebar', handleSidebar)
      window.removeEventListener('toggle-quantum-engine', handleEngine)
    }
  }, [])

  const executar = useCallback(async (id: DemoId) => {
    setLoading(true)
    setDemoActiva(id)
    await new Promise(r => setTimeout(r, 150)) // yield to let UI load 3D suspense

    try {
      let res: DemoResultado
      if (id === 'bell') {
        res = { tipo: 'bell', dados: bellState() }
      } else if (id === 'qae-opcao') {
        res = { tipo: 'qae-opcao', dados: qaeOpcaoCall(cfg.qaeS, cfg.qaeK, 0.25, 0.05, cfg.qaeSigma) }
      } else if (id === 'qaoa') {
        // QAOA rigoroso Markowitz com até N assets
        const n = Math.min(cfg.qaoaN, 6)
        const retornos = [0.12, 0.35, 0.08, 0.22, 0.06, 0.45].slice(0, n)
        const vols = [0.15, 0.50, 0.08, 0.30, 0.12, 0.80].slice(0, n)
        const rhos = [
          [1, .3, .1, .2, .0, .1], [.3, 1, .0, .4, .1, .6], [.1, .0, 1, .1, .2, .0],
          [.2, .4, .1, 1, .1, .3], [.0, .1, .2, .1, 1, .0], [.1, .6, .0, .3, .0, 1],
        ]
        const cov = Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => rhos[i][j] * vols[i] * vols[j])
        )
        res = { tipo: 'qaoa', dados: qaoa(retornos, cov, cfg.qaoaRf, 4) }
      } else if (id === 'vqe-liquidez') {
        res = { tipo: 'vqe-liquidez', dados: vqeLiquidez(cfg.vqeN) } // Rigorous max 6 for real-time browser limit
      } else if (id === 'grover') {
        // Procure anomalia exacta (Statevector mode limits max n~8 para não quebrar UI com gráficos Plotly)
        res = { tipo: 'grover', dados: grover(7, x => (x === cfg.groverTarget)) }
      } else {
        res = { tipo: 'quantum-var', dados: quantumVaR(0.08 / 252, cfg.varSigma / Math.sqrt(252), cfg.varHorizon, 8) }
      }
      setResultado(res)
    } catch (e) {
      setResultado({ tipo: 'erro', dados: String(e) })
    }
    setLoading(false)
  }, [cfg])

  const renderResultado = () => {
    if (!resultado) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
        <Atom size={64} strokeWidth={0.5} style={{ color: corTema }} />
        <p className="text-[12px] font-mono tracking-widest text-[#AAA]">INITIALIZING QUANTUM STATEVECTOR ENGINE</p>
      </div>
    )
    if (resultado.tipo === 'erro') return (
      <div className="p-4 font-mono text-[11px] text-red-500 bg-red-900/10 h-full border border-red-900 overflow-auto">
        CRITICAL ERROR IN STATEVECTOR ENGINE:<br />{resultado.dados}
      </div>
    )

    // As renderizações agora usam Statevectors Reais nas views fragmentadas
    if (resultado.tipo === 'bell') return <RenderBell r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'qae-opcao') return <RenderQAE r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'qaoa') return <RenderQAOA r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'vqe-liquidez') return <RenderVQE r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'grover') return <RenderGrover r={resultado.dados} corTema={corTema} />
    if (resultado.tipo === 'quantum-var') return <RenderVaR r={resultado.dados} corTema={corTema} />

    return null
  }

  return (
    <>
      <QuantumCommandPalette />

      {/* ── Modal: Engine Offline ─────────────────────────────── */}
      {mostrarModalEngine && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={() => setMostrarModalEngine(false)}
        >
          <div
            className="flex flex-col font-mono select-none overflow-hidden"
            style={{ width: 420, backgroundColor: '#0D0D0D', border: '1px solid #EF444440', borderRadius: 8, boxShadow: '0 0 60px #EF444422, 0 25px 50px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ─ Header do modal ─ */}
            <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#1c1c1c' }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#EF4444]">ENGINE OFFLINE</span>
              <span className="text-[9px] text-neutral-600 tracking-widest">— QUANTUM STATEVECTOR</span>
              <div className="flex-1" />
              <button
                onClick={() => setMostrarModalEngine(false)}
                className="text-neutral-600 hover:text-neutral-300 transition-colors text-[16px] leading-none px-1"
              >
                ✕
              </button>
            </div>

            {/* ─ Body do modal ─ */}
            <div className="space-y-3" style={{ padding: '1rem 0.8rem' }}>
              <p className="text-[11px] font-bold text-neutral-200">
                Motor quântico desligado
              </p>
              <p className="text-[10px] text-neutral-500" style={{ lineHeight: '1.7' }}>
                O Quantum Statevector Engine está offline. Não é possível executar computações quânticas enquanto o motor estiver inactivo.
              </p>
              <p className="text-[10px] text-neutral-600">
                Usa o botão <span className="text-neutral-400 font-bold">ON/OFF</span> no header para ligar o motor.
              </p>
            </div>

            {/* ─ Footer do modal ─ */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: '#1c1c1c', backgroundColor: '#090909' }}>
              <button
                onClick={() => setMostrarModalEngine(false)}
                className="px-4 py-1.5 rounded text-[10px] font-bold tracking-widest border border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 transition-all"
              >
                FECHAR
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-quantum-engine'))
                  setMostrarModalEngine(false)
                }}
                className="px-4 py-1.5 rounded text-[10px] font-bold tracking-widest transition-all hover:opacity-85"
                style={{ backgroundColor: '#10B981', color: '#000', boxShadow: '0 0 12px #10B98155' }}
              >
                LIGAR ENGINE
              </button>
            </div>
          </div>
        </div>
      )}
      <PanelGroup direction="horizontal" id="quantum-panel-group" className="h-full bg-[#050505] text-[#ccc] font-mono overflow-hidden">
        {/* ── Sidebar Quântico ────────────────────────────────── */}
        <>
            <Panel
              ref={sidebarRef}
              id="quantum-sidebar"
              order={1}
              collapsible
              defaultSize={20}
              minSize={15}
              maxSize={40}
              onCollapse={() => {
                if (isDragging.current) {
                  // drag tentou colapsar — impedir, re-expandir imediatamente
                  requestAnimationFrame(() => sidebarRef.current?.expand())
                } else {
                  setSidebarAberta(false)
                }
              }}
              onExpand={() => setSidebarAberta(true)}
              className={`flex flex-col bg-[#0A0A0A] overflow-hidden ${sidebarAberta ? 'border-r border-[#151515]' : ''}`}
            >
              <div className="flex flex-col justify-center px-4 border-b border-[#151515] bg-[#050505] shrink-0" style={{ height: '52px' }}>
                <div className="flex items-center gap-2">
                  <Atom size={14} style={{ color: corTema }} />
                  <span className="text-[11px] font-bold tracking-widest text-white">
                    QUANTUM STATEVECTOR
                  </span>
                </div>
                <p className="text-[8px] text-neutral-600 uppercase mt-0.5">Motor Rigoroso Álgebra Linear Complexa</p>
              </div>

              <div className="p-4 bg-[#0A0A0A]">
                <p className="text-[9px] font-bold text-neutral-500 mb-3 tracking-widest">PARAMETERS</p>
                {demoActiva === 'qae-opcao' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Spot Price (S)</span><span>${cfg.qaeS}</span></label>
                      <input type="range" min="100" max="250" value={cfg.qaeS} onChange={e => setCfg({ ...cfg, qaeS: Number(e.target.value) })} className="w-full accent-[#00e5ff]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Strike Price (K)</span><span>${cfg.qaeK}</span></label>
                      <input type="range" min="100" max="250" value={cfg.qaeK} onChange={e => setCfg({ ...cfg, qaeK: Number(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                )}
                {demoActiva === 'qaoa' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Ativos (N)</span><span>{cfg.qaoaN}</span></label>
                      <input type="range" min="2" max="6" value={cfg.qaoaN} onChange={e => setCfg({ ...cfg, qaoaN: Number(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                )}
                {demoActiva === 'quantum-var' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Volatilidade An.</span><span>{(cfg.varSigma * 100).toFixed(0)}%</span></label>
                      <input type="range" min="0.05" max="0.5" step="0.01" value={cfg.varSigma} onChange={e => setCfg({ ...cfg, varSigma: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Horizonte (Dias)</span><span>{cfg.varHorizon}</span></label>
                      <input type="range" min="1" max="30" value={cfg.varHorizon} onChange={e => setCfg({ ...cfg, varHorizon: Number(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                )}
                {demoActiva === 'vqe-liquidez' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Hardware Qubits</span><span>{cfg.vqeN}</span></label>
                      <input type="range" min="2" max="7" value={cfg.vqeN} onChange={e => setCfg({ ...cfg, vqeN: Number(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                )}
                {demoActiva === 'grover' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#888] flex justify-between"><span>Target State (Int)</span><span>{cfg.groverTarget}</span></label>
                      <input type="number" min="0" max="127" value={cfg.groverTarget} onChange={e => setCfg({ ...cfg, groverTarget: Number(e.target.value) })} className="w-full bg-[#111] border border-[#222] text-[#ccc] px-2 py-1 text-[10px] rounded" />
                    </div>
                  </div>
                )}
                {(demoActiva === 'bell') && (
                  <p className="text-[9px] text-[#666] italic">Sem parâmetros clássicos ajustáveis no emaranhamento puro.</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Navigational stuff optionally would go here, now empty */}
              </div>

              <div className="border-t border-[#151515] p-4 bg-[#080808]">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${engineLigado === null ? 'bg-[#555]' : engineLigado ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
                  <p className="text-[8px] text-[#888] tracking-widest">{engineLigado === null ? 'LOADING...' : engineLigado ? 'STATEVECTOR ENGINE ONLINE' : 'STATEVECTOR ENGINE OFFLINE'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono text-[#555]"><span>Hilbert Space</span> <span className="text-[#888]">2^N (Complex)</span></div>
                  <div className="flex justify-between text-[8px] font-mono text-[#555]"><span>Unitaries</span> <span className="text-[#888]">O(2^N) Strict</span></div>
                </div>
              </div>
            </Panel>

            {sidebarAberta && (
              <PanelResizeHandle
                onDragging={(d) => { isDragging.current = d }}
                className="w-1.5 transition-colors bg-[#111] hover:bg-[#333] active:bg-[#555] cursor-col-resize shrink-0 flex items-center justify-center"
              >
                <div className="w-0.5 h-8 bg-[#444] rounded-full" />
              </PanelResizeHandle>
            )}
          </>

        {/* ── Main Workspace ──────────────────────────────────── */}
        <Panel id="quantum-main" order={2} className="flex flex-col min-w-0 bg-[#0A0A0A]">
          <div className="flex items-center justify-between pl-4 pr-4 border-b border-[#151515] bg-[#050505] shrink-0" style={{ height: '52px' }}>
            <div className="flex items-center gap-3">
              <ChevronRight size={12} style={{ color: corTema }} />
              <h1 className="text-[12px] font-bold tracking-widest text-[#DDD]">
                {DEMOS.find(d => d.id === demoActiva)?.titulo.toUpperCase()}
              </h1>
              <span className="text-[10px] text-[#666] italic bg-[#111] px-2 py-0.5 rounded">
                {DEMOS.find(d => d.id === demoActiva)?.sub}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResultado(null)}
                disabled={loading}
                className="px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-all disabled:opacity-50 hover:bg-[#222]"
                style={{ color: '#888' }}>
                LIMPAR
              </button>
              <button
                onClick={() => {
                  if (engineLigado === null) return
                  engineLigado ? executar(demoActiva) : setMostrarModalEngine(true)
                }}
                disabled={loading || engineLigado === null}
                className="flex items-center gap-2 py-2 rounded text-[10px] font-bold tracking-widest transition-all disabled:opacity-50 hover:opacity-80 disabled:cursor-wait whitespace-nowrap"
                style={{
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  backgroundColor: engineLigado === true ? corTema : '#3f3f3f',
                  color: engineLigado === true ? '#000' : '#888',
                  boxShadow: 'none',
                }}>
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill={engineLigado === true ? '#000' : '#888'} />}
                {loading ? 'SIMULATING...' : 'COMPUTE'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">

            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-[80px] h-[80px] rounded-full border-t-2 border-b-2 animate-spin" style={{ borderColor: corTema }} />
                  <div className="absolute w-[60px] h-[60px] rounded-full border-r-2 border-l-2 animate-spin animation-delay-500" style={{ borderColor: corTema, animationDirection: 'reverse' }} />
                  <Atom size={24} style={{ color: corTema, filter: `drop-shadow(0 0 10px ${corTema})` }} />
                </div>
                <p className="text-[11px] tracking-widest mt-4" style={{ color: corTema, textShadow: `0 0 10px ${corTema}` }}>
                  CALCULATING 2^N DIMENSIONAL STATE VECTOR...
                </p>
                <p className="text-[9px] text-neutral-500 italic max-w-sm text-center">
                  Evolution of quantum amplitudes through linear combinations of complex probabilities.
                </p>
              </div>
            ) : renderResultado()}
          </div>
        </Panel>
      </PanelGroup>
    </>
  )
}
