'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Context Menu (botão direito)
// ============================================================

import { useEffect, useRef } from 'react'
import {
  TrendingUp, BookOpen, Zap, Star, Copy, Globe, Newspaper, Map, Search,
  Link2, Keyboard, ArrowLeft, ShoppingCart, Wallet,
} from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'

interface ItemMenu {
  label: string
  icone: React.ReactNode
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
    abrirTradeTicket,
    temaActual,
    tickerActivo,
  } = useTerminalStore()

  const menuRef = useRef<HTMLDivElement>(null)
  const corTema = corParaTema(temaActual)

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
      icone: <span className="w-3 h-3 rounded-full" style={{ backgroundColor: corTema }} />,
      accao: () => {},
      cor: corTema,
    })
    itens.push({
      label: 'Gráfico de Velas',
      icone: <TrendingUp size={12} />,
      accao: () => { definirTickerActivo(ticker); definirVista('candlestick'); fecharContextMenu() },
    })
    itens.push({
      label: 'Livro de Ordens',
      icone: <BookOpen size={12} />,
      accao: () => { definirTickerActivo(ticker); definirVista('livro-ordens'); fecharContextMenu() },
    })
    itens.push({
      label: 'Análise IA (Llama 3)',
      icone: <Zap size={12} />,
      accao: () => { definirTickerActivo(ticker); definirVista('analise'); fecharContextMenu() },
    })
    itens.push({
      label: 'Trade — Ordem Rápida',
      icone: <ShoppingCart size={12} />,
      accao: () => { abrirTradeTicket(ticker, nome ?? ticker, 0); fecharContextMenu() },
      cor: '#10B981',
    })
    itens.push({
      label: 'Adicionar ao Watchlist',
      icone: <Star size={12} />,
      accao: () => { adicionarAoWatchlist(ticker, nome ?? ticker); fecharContextMenu() },
    })
    itens.push({
      label: 'Copiar Ticker',
      icone: <Copy size={12} />,
      accao: () => { navigator.clipboard.writeText(ticker).catch(() => {}); fecharContextMenu() },
      separador: true,
    })
  }

  // ── Opções de navegação ────────────────────────────────────
  itens.push({
    label: 'Monitor de Mercado',
    icone: <Globe size={12} />,
    accao: () => { definirVista('mercado'); fecharContextMenu() },
  })
  itens.push({
    label: 'Portfolio & P&L',
    icone: <Wallet size={12} />,
    accao: () => { definirVista('portfolio'); fecharContextMenu() },
  })
  itens.push({
    label: 'Notícias',
    icone: <Newspaper size={12} />,
    accao: () => { definirVista('noticias'); fecharContextMenu() },
  })
  itens.push({
    label: 'Mapa Mundial',
    icone: <Map size={12} />,
    accao: () => { definirVista('mapa-mundo'); fecharContextMenu() },
  })
  itens.push({
    label: 'Screener de Acções',
    icone: <Search size={12} />,
    accao: () => { definirVista('screener'); fecharContextMenu() },
  })
  itens.push({
    label: 'Correlação de Activos',
    icone: <Link2 size={12} />,
    accao: () => { definirVista('correlacao'); fecharContextMenu() },
    separador: true,
  })

  // ── Utilidades ─────────────────────────────────────────────
  itens.push({
    label: 'Paleta de Comandos  Ctrl+K',
    icone: <Keyboard size={12} />,
    accao: () => { fecharContextMenu(); alternarCommandPalette() },
  })
  itens.push({
    label: 'Voltar',
    icone: <ArrowLeft size={12} />,
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
      className="fixed z-[9999] font-mono text-xs select-none cristal-context-menu"
      style={{ left: x, top: y }}
    >
      <div
        className="bg-[#0D0D0D] border border-neutral-700 rounded shadow-2xl overflow-hidden min-w-[220px]"
        style={{ boxShadow: `0 0 24px 0 ${corTema}33, 0 4px 32px rgba(0,0,0,0.8)` }}
      >
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
              <span className="w-4 flex items-center justify-center shrink-0">{item.icone}</span>
              <span className="flex-1 text-[11px]">{item.label}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
