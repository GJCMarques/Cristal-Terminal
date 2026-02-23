'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Contentor de Painel
// Fullscreen + Zoom livre para qualquer painel/gráfico
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Search } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'

interface PainelContainerProps {
  children: React.ReactNode
  /** Esconde os controlos de zoom (ex: TradingView tem o seu próprio zoom) */
  semZoom?: boolean
}

export function PainelContainer({ children, semZoom = false }: PainelContainerProps) {
  const temaActual = useTerminalStore((s) => s.temaActual)
  const corTema = corParaTema(temaActual)

  const [expandido, setExpandido] = useState(false)
  const [zoom, setZoom] = useState(1)

  const toggleExpandir = useCallback(() => setExpandido((e) => !e), [])
  const zoomIn = useCallback(() => setZoom((z) => Math.min(+(z + 0.1).toFixed(1), 3.0)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(+(z - 0.1).toFixed(1), 0.3)), [])
  const resetar = useCallback(() => setZoom(1), [])

  // Atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape fecha fullscreen
      if (expandido && e.key === 'Escape') {
        e.stopImmediatePropagation()
        setExpandido(false)
        return
      }
      // Ctrl+Shift+F alterna fullscreen
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        toggleExpandir()
        return
      }
      // Só quando expandido: +/- para zoom
      if (expandido) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
        if (e.key === '-') { e.preventDefault(); zoomOut() }
        if (e.key === '0') { e.preventDefault(); resetar() }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [expandido, toggleExpandir, zoomIn, zoomOut, resetar])

  /* ── Barra de controlos ─────────────────────────────────── */
  const barra = (
    <div className="flex items-center gap-0.5 px-2 shrink-0 border-b border-neutral-800 bg-[#0A0A0A]" style={{ height: '26px' }}>
      <div className="flex-1" />

      {/* Extra tools portal hook */}
      <div id="painel-header-tools" className="flex items-center gap-1 mr-2" />

      {/* Zoom */}
      {!semZoom && (
        <>
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.31}
            className="flex items-center justify-center w-5 h-5 rounded text-neutral-300 hover:text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-25"
            title="Diminuir (−)"
          >
            <ZoomOut size={11} />
          </button>

          <button
            type="button"
            onClick={resetar}
            className="font-mono text-[9px] px-1 min-w-[34px] text-center transition-colors"
            style={{ color: zoom === 1 ? '#525252' : corTema }}
            title="Repor zoom (0)"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 2.99}
            className="flex items-center justify-center w-5 h-5 rounded text-neutral-300 hover:text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-25"
            title="Aumentar (+)"
          >
            <ZoomIn size={11} />
          </button>

          {zoom !== 1 && (
            <button
              type="button"
              onClick={resetar}
              className="flex items-center justify-center w-5 h-5 rounded text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
              title="Repor 100%"
            >
              <RotateCcw size={10} />
            </button>
          )}

          <div className="w-px h-3 bg-neutral-800 mx-1" />
        </>
      )}

      {/* Search / Lupa */}
      <button
        type="button"
        onClick={() => useTerminalStore.getState().alternarCommandPalette()}
        className="flex items-center justify-center w-5 h-5 mr-1 rounded transition-colors"
        style={{ color: '#525252' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = corTema)}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#525252')}
        title="Pesquisar (Ctrl+K)"
      >
        <Search size={12} />
      </button>

      {/* Fullscreen */}
      <button
        type="button"
        onClick={toggleExpandir}
        className="flex items-center justify-center w-5 h-5 rounded transition-colors"
        style={{ color: expandido ? corTema : '#525252' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = corTema)}
        onMouseLeave={(e) => (e.currentTarget.style.color = expandido ? corTema : '#525252')}
        title={expandido ? 'Reduzir (Esc)' : 'Ecrã inteiro (Ctrl+Shift+F)'}
      >
        {expandido ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
      </button>
    </div>
  )

  /* ── Conteúdo com zoom ──────────────────────────────────── */
  const conteudo = (
    <div className="flex-1 min-h-0 relative overflow-hidden">
      <div
        style={zoom !== 1 ? {
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: `${(100 / zoom).toFixed(4)}%`,
          height: `${(100 / zoom).toFixed(4)}%`,
          position: 'absolute',
          top: 0,
          left: 0,
        } : { width: '100%', height: '100%' }}
      >
        {children}
      </div>
    </div>
  )

  /* ── Modo fullscreen ────────────────────────────────────── */
  if (expandido) {
    return (
      <div
        className="fixed inset-0 z-[9990] flex flex-col bg-black"
        style={{ borderTop: `2px solid ${corTema}66` }}
      >
        {barra}
        {conteudo}
      </div>
    )
  }

  /* ── Modo normal ────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full">
      {barra}
      {conteudo}
    </div>
  )
}
