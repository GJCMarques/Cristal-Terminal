'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Layout Redimensionável (react-resizable-panels)
// ============================================================

import dynamic from 'next/dynamic'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useTerminalStore, selectWatchlistActiva } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'
import { PainelContainer } from './PainelContainer'
import { MarketOverviewPanel } from '../panels/MarketOverviewPanel'
import { NewsPanel } from '../panels/NewsPanel'
import { YieldCurvePanel } from '../panels/YieldCurvePanel'
import { OrderBookPanel } from '../panels/OrderBookPanel'
import { WatchlistPanel } from '../panels/WatchlistPanel'
import { AnalisePanel } from '../panels/AnalisePanel'
import { CriptoPanel } from '../panels/CriptoPanel'
import { MacroPanel } from '../panels/MacroPanel'
import { HeatmapPanel } from '../panels/HeatmapPanel'
import { CalendarioPanel } from '../panels/CalendarioPanel'
import { BolhasPanel } from '../panels/BolhasPanel'
import { ScreenerPanel } from '../panels/ScreenerPanel'
import { CorrelacaoPanel } from '../panels/CorrelacaoPanel'
import { PortfolioPanel } from '../panels/PortfolioPanel'
import { DeFiPanel } from '../panels/DeFiPanel'
import { SentinelaPanel } from '../panels/SentinelaPanel'
import { ChatPanel } from '../panels/ChatPanel'
import { QuantPanel } from '../panels/QuantPanel'
import { QuantumPanel } from '../panels/QuantumPanel'
import { HelpView } from '../HelpView'

const Spinner = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center h-full bg-[#0A0A0A] font-mono text-xs text-neutral-300">
    <span className="animate-pulse">A carregar {label}…</span>
  </div>
)

// Componentes SSR-unsafe — carregam apenas no cliente
const CandlestickPanel = dynamic(
  () => import('../panels/CandlestickPanel').then((m) => ({ default: m.CandlestickPanel })),
  { ssr: false, loading: () => <Spinner label="gráfico" /> },
)

const MapaMundoPanel = dynamic(
  () => import('../panels/MapaMundoPanel').then((m) => ({ default: m.MapaMundoPanel })),
  { ssr: false, loading: () => <Spinner label="mapa" /> },
)

function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative flex items-center justify-center">
      <div className="w-px h-full bg-neutral-800 group-hover:bg-neutral-600 group-data-[resize-handle-active]:bg-amber-500 transition-colors" />
      <div className="absolute w-1 h-8 rounded-full bg-neutral-800 group-hover:bg-neutral-600 group-data-[resize-handle-active]:bg-amber-500 transition-colors" />
    </PanelResizeHandle>
  )
}

function ResizeHandleHorizontal() {
  return (
    <PanelResizeHandle className="group relative flex items-center justify-center h-1">
      <div className="h-px w-full bg-neutral-800 group-hover:bg-neutral-600 group-data-[resize-handle-active]:bg-amber-500 transition-colors" />
    </PanelResizeHandle>
  )
}

/** Painel principal — determinado pela vistaActual */
function PainelPrincipal() {
  const { vistaActual } = useTerminalStore()

  // Painéis sem controlos de zoom externos (têm zoom nativo ou são text-based)
  const semZoom = vistaActual === 'candlestick'

  const painel = (() => {
    switch (vistaActual) {
      case 'mercado': return <MarketOverviewPanel />
      case 'candlestick': return <CandlestickPanel />
      case 'livro-ordens': return <OrderBookPanel />
      case 'yield-curve': return <YieldCurvePanel />
      case 'noticias': return <NewsPanel />
      case 'watchlist': return <WatchlistPanel />
      case 'analise': return <AnalisePanel />
      case 'cripto': return <CriptoPanel />
      case 'macro': return <MacroPanel />
      case 'heatmap': return <HeatmapPanel />
      case 'calendario': return <CalendarioPanel />
      case 'mapa-mundo': return <MapaMundoPanel />
      case 'bolhas': return <BolhasPanel />
      case 'screener': return <ScreenerPanel />
      case 'correlacao': return <CorrelacaoPanel />
      case 'portfolio': return <PortfolioPanel />
      case 'defi': return <DeFiPanel />
      case 'sentinela': return <SentinelaPanel />
      case 'chat': return <ChatPanel />
      case 'quant': return <QuantPanel />
      case 'quantum': return <QuantumPanel />
      case 'ajuda': return <HelpView />
      default: return <MarketOverviewPanel />
    }
  })()

  return (
    <PainelContainer semZoom={semZoom}>
      {painel}
    </PainelContainer>
  )
}

/** Painel lateral — mini mercado + watchlist */
function PainelLateral() {
  const { temaActual, definirTickerActivo, definirVista } = useTerminalStore()
  const watchlist = selectWatchlistActiva(useTerminalStore.getState())
  const corTema = corParaTema(temaActual)

  const TOP_MOEDAS = [
    { ticker: 'EURUSD', v: 1.0823, c: -0.05 },
    { ticker: 'GBPUSD', v: 1.2641, c: +0.03 },
    { ticker: 'USDJPY', v: 149.82, c: -0.12 },
    { ticker: 'XAU', v: 2932.5, c: +0.42 },
    { ticker: 'CO1', v: 74.20, c: -1.64 },
  ]

  return (
    <PanelGroup direction="vertical">
      {/* ── Mercado rápido ─────────────────────────────── */}
      <Panel defaultSize={50} minSize={20}>
        <div className="h-full flex flex-col bg-[#0A0A0A] border-l border-neutral-800">
          <div
            className="px-3 py-1.5 font-mono text-[10px] font-bold border-b border-neutral-800 shrink-0"
            style={{ color: corTema }}
          >
            MERCADO RÁPIDO
          </div>
          <div className="flex-1 overflow-y-auto">
            {TOP_MOEDAS.map((m) => (
              <button
                key={m.ticker}
                type="button"
                onClick={() => {
                  definirTickerActivo(m.ticker)
                  definirVista('candlestick')
                }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-900 border-b border-neutral-900 font-mono text-xs transition-colors"
              >
                <span className="text-neutral-400">{m.ticker}</span>
                <div className="text-right">
                  <div className="text-white">{m.v.toFixed(m.v < 10 ? 4 : 2)}</div>
                  <div
                    className="text-[10px]"
                    style={{ color: m.c >= 0 ? '#10B981' : '#EF4444' }}
                  >
                    {m.c >= 0 ? '▲' : '▼'}{Math.abs(m.c).toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <ResizeHandleHorizontal />

      {/* ── Watchlist activa ───────────────────────────── */}
      <Panel defaultSize={50} minSize={20}>
        <WatchlistPanel />
      </Panel>
    </PanelGroup>
  )
}

export function ResizableLayout() {
  const { painelLateralVisivel } = useTerminalStore()

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <PanelGroup direction="horizontal" autoSaveId="cristal-layout">
        {/* Painel principal */}
        <Panel defaultSize={painelLateralVisivel ? 68 : 100} minSize={40}>
          <PainelPrincipal />
        </Panel>

        {/* Divisor + Painel lateral */}
        {painelLateralVisivel && (
          <>
            <ResizeHandle />
            <Panel defaultSize={32} minSize={18} maxSize={45}>
              <PainelLateral />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  )
}
