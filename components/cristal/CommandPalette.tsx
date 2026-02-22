'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Paleta de Comandos (Ctrl+K)
// Bloomberg-style command launcher with fuzzy search
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import { obterSugestoes } from '@/lib/command-parser'
import type { VistaTerminal } from '@/types/terminal'

interface OpcaoPaleta {
  id: string
  label: string
  descricao: string
  icone: string
  categoria: string
  accao: () => void
}

const VISTAS_RAPIDAS: { id: VistaTerminal; label: string; icone: string; atalho: string }[] = [
  { id: 'mercado',      label: 'Monitor de Mercado',        icone: '🌐', atalho: 'F2'  },
  { id: 'noticias',     label: 'Monitor de Notícias',       icone: '📰', atalho: 'F3'  },
  { id: 'watchlist',    label: 'Lista de Observação',       icone: '★',  atalho: 'F4'  },
  { id: 'yield-curve',  label: 'Curva de Rendimento',       icone: '📉', atalho: 'F5'  },
  { id: 'livro-ordens', label: 'Livro de Ordens',           icone: '📒', atalho: 'F6'  },
  { id: 'cripto',       label: 'Mercado Crypto',            icone: '₿',  atalho: 'F7'  },
  { id: 'macro',        label: 'Monitor Macroeconómico',    icone: '🏛', atalho: 'F8'  },
  { id: 'heatmap',      label: 'Heatmap S&P 500',           icone: '🔥', atalho: 'F9'  },
  { id: 'calendario',   label: 'Calendário Económico',      icone: '📅', atalho: 'F10' },
  { id: 'mapa-mundo',   label: 'Mapa Mundial Económico',    icone: '🗺', atalho: 'MAP' },
  { id: 'bolhas',       label: 'Gráfico de Bolhas',         icone: '⚪', atalho: 'BUBBLE' },
  { id: 'screener',     label: 'Screener de Acções',        icone: '🔍', atalho: 'SCR' },
  { id: 'correlacao',   label: 'Matriz de Correlação',      icone: '🔗', atalho: 'CORR' },
  { id: 'analise',      label: 'Análise IA — Llama 3',      icone: '⚡', atalho: 'IA'  },
  { id: 'ajuda',        label: 'Centro de Ajuda',           icone: '?',  atalho: 'F1'  },
]

const TICKERS_DESTAQUE = [
  { ticker: 'AAPL',   nome: 'Apple Inc.',        icone: '🍎' },
  { ticker: 'NVDA',   nome: 'NVIDIA Corp.',       icone: '🟢' },
  { ticker: 'MSFT',   nome: 'Microsoft Corp.',    icone: '🪟' },
  { ticker: 'TSLA',   nome: 'Tesla Inc.',         icone: '⚡' },
  { ticker: 'EURUSD', nome: 'Euro / Dólar',       icone: '€' },
  { ticker: 'BTC',    nome: 'Bitcoin',            icone: '₿' },
  { ticker: 'ETH',    nome: 'Ethereum',           icone: '🔷' },
  { ticker: 'XAU',    nome: 'Ouro Spot',          icone: '🟡' },
  { ticker: 'SPX',    nome: 'S&P 500',            icone: '📈' },
  { ticker: 'DAX',    nome: 'DAX 40',             icone: '🇩🇪' },
  { ticker: 'PSI20',  nome: 'PSI 20 Portugal',    icone: '🇵🇹' },
  { ticker: 'CO1',    nome: 'Petróleo Brent',      icone: '🛢' },
]

export function CommandPalette() {
  const {
    commandPaletteAberto,
    fecharCommandPalette,
    definirVista,
    definirTickerActivo,
    executarComando,
    historicoComandos,
    temaActual,
  } = useTerminalStore()

  const [query, setQuery] = useState('')
  const [indice, setIndice] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)
  const corTema  = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  // Focus input ao abrir
  useEffect(() => {
    if (commandPaletteAberto) {
      setQuery('')
      setIndice(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteAberto])

  // Construir lista de opções filtradas
  const opcoes = useCallback((): OpcaoPaleta[] => {
    const q = query.toLowerCase().trim()
    const lista: OpcaoPaleta[] = []

    if (!q) {
      // Histórico recente
      historicoComandos.slice(0, 5).forEach((cmd, i) => {
        lista.push({
          id: `hist-${i}`,
          label: cmd,
          descricao: 'Histórico',
          icone: '🕐',
          categoria: 'RECENTE',
          accao: () => { executarComando(cmd); fecharCommandPalette() },
        })
      })

      // Vistas rápidas
      VISTAS_RAPIDAS.forEach((v) => {
        lista.push({
          id: `vista-${v.id}`,
          label: v.label,
          descricao: v.atalho,
          icone: v.icone,
          categoria: 'VISTAS',
          accao: () => { definirVista(v.id); fecharCommandPalette() },
        })
      })

      // Tickers em destaque
      TICKERS_DESTAQUE.forEach((t) => {
        lista.push({
          id: `ticker-${t.ticker}`,
          label: `${t.ticker} — ${t.nome}`,
          descricao: 'Gráfico de Velas',
          icone: t.icone,
          categoria: 'INSTRUMENTOS',
          accao: () => { definirTickerActivo(t.ticker); definirVista('candlestick'); fecharCommandPalette() },
        })
      })
      return lista
    }

    // Vistas filtradas
    VISTAS_RAPIDAS
      .filter((v) => v.label.toLowerCase().includes(q) || v.id.includes(q) || v.atalho.toLowerCase().includes(q))
      .forEach((v) => {
        lista.push({
          id: `vista-${v.id}`,
          label: v.label,
          descricao: v.atalho,
          icone: v.icone,
          categoria: 'VISTAS',
          accao: () => { definirVista(v.id); fecharCommandPalette() },
        })
      })

    // Sugestões do parser
    obterSugestoes(query.toUpperCase()).forEach((s) => {
      lista.push({
        id: `sug-${s.texto}`,
        label: s.texto,
        descricao: s.descricao,
        icone: s.categoria === 'ticker' ? '◆' : s.categoria === 'funcao' ? '⚙' : '»',
        categoria: s.categoria === 'ticker' ? 'INSTRUMENTOS' : 'COMANDOS',
        accao: () => { executarComando(s.texto); fecharCommandPalette() },
      })
    })

    // Tickers filtrados
    TICKERS_DESTAQUE
      .filter((t) => t.ticker.toLowerCase().includes(q) || t.nome.toLowerCase().includes(q))
      .forEach((t) => {
        if (!lista.some((l) => l.id === `ticker-${t.ticker}`)) {
          lista.push({
            id: `ticker-${t.ticker}`,
            label: `${t.ticker} — ${t.nome}`,
            descricao: 'Gráfico de Velas',
            icone: t.icone,
            categoria: 'INSTRUMENTOS',
            accao: () => { definirTickerActivo(t.ticker); definirVista('candlestick'); fecharCommandPalette() },
          })
        }
      })

    return lista
  }, [query, historicoComandos, definirVista, definirTickerActivo, executarComando, fecharCommandPalette])

  const lista = opcoes()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndice((i) => Math.min(i + 1, lista.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndice((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      lista[indice]?.accao()
    } else if (e.key === 'Escape') {
      fecharCommandPalette()
    }
  }

  // Scroll automático para o item seleccionado
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${indice}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [indice])

  if (!commandPaletteAberto) return null

  // Agrupar por categoria
  const grupos: Record<string, { opcao: OpcaoPaleta; idx: number }[]> = {}
  lista.forEach((o, i) => {
    if (!grupos[o.categoria]) grupos[o.categoria] = []
    grupos[o.categoria]!.push({ opcao: o, idx: i })
  })

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[12vh]" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl mx-4 font-mono" style={{ maxHeight: '70vh' }}>
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 bg-[#0D0D0D] border rounded-t"
          style={{ borderColor: corTema + '88', boxShadow: `0 0 32px ${corTema}33` }}
        >
          <span className="text-sm" style={{ color: corTema }}>⌨</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndice(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar comandos, tickers, vistas…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-neutral-600"
          />
          <span className="text-[10px] text-neutral-600 border border-neutral-700 rounded px-1.5 py-0.5">ESC</span>
        </div>

        {/* Lista de resultados */}
        <div
          ref={listRef}
          className="bg-[#080808] border-x border-b border-neutral-800 rounded-b overflow-y-auto"
          style={{ maxHeight: '55vh' }}
        >
          {Object.entries(grupos).map(([cat, items]) => (
            <div key={cat}>
              <div className="px-4 py-1 text-[9px] font-bold text-neutral-600 bg-[#0A0A0A] sticky top-0 border-b border-neutral-900" style={{ color: corTema + 'AA' }}>
                {cat}
              </div>
              {items.map(({ opcao, idx }) => (
                <button
                  key={opcao.id}
                  data-idx={idx}
                  type="button"
                  onClick={opcao.accao}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left border-b border-neutral-900 last:border-0 transition-colors"
                  style={{
                    backgroundColor: idx === indice ? corTema + '18' : 'transparent',
                    borderLeft: idx === indice ? `2px solid ${corTema}` : '2px solid transparent',
                  }}
                >
                  <span className="w-5 text-center text-sm shrink-0">{opcao.icone}</span>
                  <span className="flex-1 text-xs text-neutral-200 truncate">{opcao.label}</span>
                  <span className="text-[10px] text-neutral-600 shrink-0">{opcao.descricao}</span>
                </button>
              ))}
            </div>
          ))}
          {lista.length === 0 && (
            <div className="px-4 py-8 text-center text-neutral-600 text-xs">
              Sem resultados para &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="text-[10px] text-neutral-700 text-center mt-2">
          ↑↓ navegar · Enter seleccionar · Esc fechar
        </div>
      </div>
    </div>
  )
}
