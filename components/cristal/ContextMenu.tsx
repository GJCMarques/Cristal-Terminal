'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Context Menu (botão direito)
// ============================================================

import { useEffect, useRef } from 'react'
import { useTerminalStore } from '@/store/terminal.store'

interface ItemMenu {
  label: string
  icone: string
  accao: () => void
  separador?: boolean
  cor?: string
}

export function ContextMenu() {
  const {
    contextMenu,
    fecharContextMenu,
    definirVista,
    definirTickerActivo,
    adicionarAoWatchlist,
    alternarCommandPalette,
    voltarVista,
    temaActual,
    tickerActivo,
  } = useTerminalStore()

  const menuRef = useRef<HTMLDivElement>(null)
  const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  // Fechar ao clicar fora
  useEffect(() => {
    if (!contextMenu.visivel) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        fecharContextMenu()
      }
    }
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharContextMenu()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [contextMenu.visivel, fecharContextMenu])

  if (!contextMenu.visivel) return null

  const ticker = contextMenu.ticker ?? tickerActivo
  const nome   = contextMenu.nomeActivo ?? ticker

  const itens: ItemMenu[] = []

  // ── Opções baseadas no ticker ──────────────────────────────
  if (ticker) {
    itens.push({
      label: `◆ ${ticker} — ${nome ?? ''}`,
      icone: '—',
      accao: () => {},
      cor: corTema,
    })
    itens.push({
      label: 'Gráfico de Velas',
      icone: '📈',
      accao: () => { definirTickerActivo(ticker); definirVista('candlestick'); fecharContextMenu() },
    })
    itens.push({
      label: 'Livro de Ordens',
      icone: '📒',
      accao: () => { definirTickerActivo(ticker); definirVista('livro-ordens'); fecharContextMenu() },
    })
    itens.push({
      label: 'Análise IA (Llama 3)',
      icone: '⚡',
      accao: () => { definirTickerActivo(ticker); definirVista('analise'); fecharContextMenu() },
    })
    itens.push({
      label: 'Adicionar ao Watchlist',
      icone: '★',
      accao: () => { adicionarAoWatchlist(ticker, nome ?? ticker); fecharContextMenu() },
    })
    itens.push({
      label: 'Copiar Ticker',
      icone: '⎘',
      accao: () => { navigator.clipboard.writeText(ticker).catch(() => {}); fecharContextMenu() },
      separador: true,
    })
  }

  // ── Opções de navegação ────────────────────────────────────
  itens.push({
    label: 'Monitor de Mercado',
    icone: '🌐',
    accao: () => { definirVista('mercado'); fecharContextMenu() },
  })
  itens.push({
    label: 'Notícias',
    icone: '📰',
    accao: () => { definirVista('noticias'); fecharContextMenu() },
  })
  itens.push({
    label: 'Mapa Mundial',
    icone: '🗺',
    accao: () => { definirVista('mapa-mundo'); fecharContextMenu() },
  })
  itens.push({
    label: 'Screener de Acções',
    icone: '🔍',
    accao: () => { definirVista('screener'); fecharContextMenu() },
  })
  itens.push({
    label: 'Correlação de Activos',
    icone: '🔗',
    accao: () => { definirVista('correlacao'); fecharContextMenu() },
    separador: true,
  })

  // ── Utilidades ─────────────────────────────────────────────
  itens.push({
    label: 'Paleta de Comandos  Ctrl+K',
    icone: '⌨',
    accao: () => { fecharContextMenu(); alternarCommandPalette() },
  })
  itens.push({
    label: 'Voltar',
    icone: '←',
    accao: () => { voltarVista(); fecharContextMenu() },
  })

  // Ajustar posição para não sair do ecrã
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  const menuW = 240
  const menuH = itens.length * 32 + 16
  const x = Math.min(contextMenu.x, vw - menuW - 8)
  const y = Math.min(contextMenu.y, vh - menuH - 8)

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] font-mono text-xs select-none"
      style={{ left: x, top: y }}
    >
      <div className="bg-[#0D0D0D] border border-neutral-700 rounded shadow-2xl overflow-hidden min-w-[220px]"
           style={{ boxShadow: `0 0 24px 0 ${corTema}33, 0 4px 32px rgba(0,0,0,0.8)` }}>
        {itens.map((item, i) => (
          <div key={i}>
            {item.separador && i > 0 && (
              <div className="h-px bg-neutral-800 mx-2 my-0.5" />
            )}
            <button
              type="button"
              onClick={item.accao}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-neutral-800 transition-colors"
              style={{ color: item.cor ?? '#9CA3AF' }}
            >
              <span className="w-4 text-center shrink-0 text-[11px]">{item.icone}</span>
              <span className="flex-1 text-[11px]">{item.label}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
