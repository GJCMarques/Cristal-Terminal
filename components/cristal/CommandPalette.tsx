'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Paleta de Comandos (Ctrl+K)
// Bloomberg-style command launcher — sem emojis
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Globe, Newspaper, Star, TrendingDown, BookOpen, Bitcoin, Building2,
  Flame, Calendar, Map, Circle, Search, Link2, Wallet, Network, Bell,
  Zap, HelpCircle, Clock, ChevronRight, Settings, BarChart2, TrendingUp,
  Keyboard, MessageSquare, FlaskConical, Atom,
} from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { obterSugestoes } from '@/lib/command-parser'
import { corParaTema } from '@/lib/utils'
import type { VistaTerminal } from '@/types/terminal'

interface OpcaoPaleta {
  id: string
  label: string
  descricao: string
  icone: React.ReactNode
  categoria: string
  accao: () => void
}

const VISTAS_RAPIDAS: { id: VistaTerminal; label: string; icone: React.ReactNode; atalho: string }[] = [
  { id: 'mercado',      label: 'Monitor de Mercado',     icone: <Globe      size={13} />, atalho: 'F2'     },
  { id: 'noticias',     label: 'Monitor de Notícias',    icone: <Newspaper  size={13} />, atalho: 'F3'     },
  { id: 'watchlist',    label: 'Lista de Observação',    icone: <Star       size={13} />, atalho: 'F4'     },
  { id: 'yield-curve',  label: 'Curva de Rendimento',    icone: <TrendingDown size={13}/>, atalho: 'F5'    },
  { id: 'livro-ordens', label: 'Livro de Ordens',        icone: <BookOpen   size={13} />, atalho: 'F6'     },
  { id: 'cripto',       label: 'Mercado Crypto',         icone: <Bitcoin    size={13} />, atalho: 'F7'     },
  { id: 'macro',        label: 'Monitor Macroeconómico', icone: <Building2  size={13} />, atalho: 'F8'     },
  { id: 'heatmap',      label: 'Heatmap S&P 500',        icone: <Flame      size={13} />, atalho: 'F9'     },
  { id: 'calendario',   label: 'Calendário Económico',   icone: <Calendar   size={13} />, atalho: 'F10'    },
  { id: 'mapa-mundo',   label: 'Mapa Mundial Económico', icone: <Map        size={13} />, atalho: 'MAP'    },
  { id: 'bolhas',       label: 'Gráfico de Bolhas',      icone: <Circle     size={13} />, atalho: 'BUBBLE' },
  { id: 'screener',     label: 'Screener de Acções',     icone: <Search     size={13} />, atalho: 'SCR'    },
  { id: 'correlacao',   label: 'Matriz de Correlação',   icone: <Link2      size={13} />, atalho: 'CORR'   },
  { id: 'portfolio',    label: 'Portfolio & P&L',         icone: <Wallet     size={13} />, atalho: 'PORT'   },
  { id: 'defi',         label: 'DeFi / On-Chain',        icone: <Network    size={13} />, atalho: 'DEFI'   },
  { id: 'sentinela',    label: 'Sentinela — Alertas',    icone: <Bell           size={13} />, atalho: 'ALERT'  },
  { id: 'analise',      label: 'Análise IA — Llama 3',   icone: <Zap            size={13} />, atalho: 'IA'     },
  { id: 'chat',         label: 'Chat Institucional',      icone: <MessageSquare  size={13} />, atalho: 'MSG'    },
  { id: 'quant',        label: 'Ambiente Quant',          icone: <FlaskConical   size={13} />, atalho: 'QUANT'   },
  { id: 'quantum',      label: 'Finança Quântica',        icone: <Atom           size={13} />, atalho: 'QUANTUM' },
  { id: 'ajuda',        label: 'Centro de Ajuda',         icone: <HelpCircle     size={13} />, atalho: 'F1'      },
]

// Tickers com ícone Lucide neutro (sem emojis de bandeira/cor)
const TICKERS_DESTAQUE: { ticker: string; nome: string; icone: React.ReactNode }[] = [
  { ticker: 'AAPL',   nome: 'Apple Inc.',       icone: <BarChart2   size={13} /> },
  { ticker: 'NVDA',   nome: 'NVIDIA Corp.',      icone: <BarChart2   size={13} /> },
  { ticker: 'MSFT',   nome: 'Microsoft Corp.',   icone: <BarChart2   size={13} /> },
  { ticker: 'TSLA',   nome: 'Tesla Inc.',        icone: <TrendingUp  size={13} /> },
  { ticker: 'EURUSD', nome: 'Euro / Dólar',      icone: <TrendingDown size={13}/> },
  { ticker: 'BTC',    nome: 'Bitcoin',           icone: <Bitcoin     size={13} /> },
  { ticker: 'ETH',    nome: 'Ethereum',          icone: <Network     size={13} /> },
  { ticker: 'XAU',    nome: 'Ouro Spot',         icone: <Circle      size={13} /> },
  { ticker: 'SPX',    nome: 'S&P 500',           icone: <BarChart2   size={13} /> },
  { ticker: 'DAX',    nome: 'DAX 40',            icone: <BarChart2   size={13} /> },
  { ticker: 'PSI20',  nome: 'PSI 20 Portugal',   icone: <BarChart2   size={13} /> },
  { ticker: 'CO1',    nome: 'Petróleo Brent',     icone: <TrendingDown size={13}/> },
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
  const corTema  = corParaTema(temaActual)

  useEffect(() => {
    if (commandPaletteAberto) {
      setQuery('')
      setIndice(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteAberto])

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
          icone: <Clock size={13} />,
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
        icone: s.categoria === 'ticker'
          ? <BarChart2  size={13} />
          : s.categoria === 'funcao'
          ? <Settings   size={13} />
          : <ChevronRight size={13} />,
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

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${indice}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [indice])

  if (!commandPaletteAberto) return null

  const grupos: Record<string, { opcao: OpcaoPaleta; idx: number }[]> = {}
  lista.forEach((o, i) => {
    if (!grupos[o.categoria]) grupos[o.categoria] = []
    grupos[o.categoria]!.push({ opcao: o, idx: i })
  })

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[12vh]"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-2xl mx-4 font-mono cristal-palette-backdrop" style={{ maxHeight: '70vh' }}>

        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 bg-[#0D0D0D] border rounded-t"
          style={{ borderColor: corTema + '88', boxShadow: `0 0 32px ${corTema}33` }}
        >
          <Keyboard size={14} style={{ color: corTema }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndice(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar comandos, tickers, vistas…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-neutral-600"
          />
          <span className="text-[10px] text-neutral-300 border border-neutral-700 rounded px-1.5 py-0.5">ESC</span>
        </div>

        {/* Lista de resultados */}
        <div
          ref={listRef}
          className="bg-[#080808] border-x border-b border-neutral-800 rounded-b overflow-y-auto"
          style={{ maxHeight: '55vh' }}
        >
          {Object.entries(grupos).map(([cat, items]) => (
            <div key={cat}>
              <div
                className="px-4 py-1 text-[9px] font-bold bg-[#0A0A0A] sticky top-0 border-b border-neutral-900"
                style={{ color: corTema + 'AA' }}
              >
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
                  <span
                    className="w-5 flex items-center justify-center shrink-0"
                    style={{ color: idx === indice ? corTema : '#6B7280' }}
                  >
                    {opcao.icone}
                  </span>
                  <span className="flex-1 text-xs text-neutral-200 truncate">{opcao.label}</span>
                  <span className="text-[10px] text-neutral-300 shrink-0">{opcao.descricao}</span>
                </button>
              ))}
            </div>
          ))}
          {lista.length === 0 && (
            <div className="px-4 py-8 text-center text-neutral-300 text-xs">
              Sem resultados para &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="text-[10px] text-neutral-400 text-center mt-2">
          ↑↓ navegar · Enter seleccionar · Esc fechar
        </div>
      </div>
    </div>
  )
}
