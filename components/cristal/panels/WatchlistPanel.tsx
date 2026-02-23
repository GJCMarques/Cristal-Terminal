'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Lista de Observação (Watchlist)
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, Star } from 'lucide-react'
import { useTerminalStore, selectWatchlistActiva } from '@/store/terminal.store'
import { obterPrecoActual } from '@/lib/mocks/candlestick'
import { corParaTema } from '@/lib/utils'

export function WatchlistPanel() {
  const {
    watchlists,
    watchlistActiva,
    nomesWatchlist,
    definirWatchlistActiva,
    adicionarAoWatchlist,
    removerDoWatchlist,
    criarWatchlist,
    removerWatchlist,
    renomearWatchlist,
    definirTickerActivo,
    definirVista,
    temaActual,
  } = useTerminalStore()

  const listaActiva = selectWatchlistActiva(useTerminalStore.getState())
  const corTema = corParaTema(temaActual)

  const [novoTicker,   setNovoTicker]   = useState('')
  const [editandoIdx,  setEditandoIdx]  = useState<number | null>(null)
  const [editNome,     setEditNome]     = useState('')
  const [novaListaNome, setNovaListaNome] = useState('')
  const [criandoLista, setCriandoLista]  = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const novaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editandoIdx !== null) editRef.current?.focus()
  }, [editandoIdx])

  useEffect(() => {
    if (criandoLista) novaRef.current?.focus()
  }, [criandoLista])

  const handleAdicionarTicker = (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoTicker.trim()) return
    adicionarAoWatchlist(novoTicker.trim().toUpperCase(), novoTicker.trim().toUpperCase())
    setNovoTicker('')
  }

  const handleSeleccionar = (ticker: string) => {
    definirTickerActivo(ticker)
    definirVista('candlestick')
  }

  const iniciarEdicao = (idx: number) => {
    setEditandoIdx(idx)
    setEditNome(nomesWatchlist[idx] ?? `Lista ${idx + 1}`)
  }

  const confirmarEdicao = () => {
    if (editandoIdx === null) return
    if (editNome.trim()) renomearWatchlist(editandoIdx, editNome.trim())
    setEditandoIdx(null)
    setEditNome('')
  }

  const cancelarEdicao = () => {
    setEditandoIdx(null)
    setEditNome('')
  }

  const handleCriarLista = (e: React.FormEvent) => {
    e.preventDefault()
    criarWatchlist(novaListaNome.trim())
    setNovaListaNome('')
    setCriandoLista(false)
  }

  const handleRemoverLista = (idx: number) => {
    if (watchlists.length <= 1) return
    removerWatchlist(idx)
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">

      {/* ── Tabs de watchlists ─────────────────────────── */}
      <div className="flex items-center border-b border-neutral-800 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {watchlists.map((_, idx) => (
          <div key={idx} className="flex items-center shrink-0 group/tab">
            {editandoIdx === idx ? (
              /* ── Modo edição inline ── */
              <div className="flex items-center gap-1 px-2 py-1.5 border-r border-neutral-800">
                <input
                  ref={editRef}
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmarEdicao()
                    if (e.key === 'Escape') cancelarEdicao()
                  }}
                  className="bg-neutral-800 border border-neutral-600 rounded px-1.5 py-0.5 font-mono text-[11px] text-white outline-none w-24"
                  maxLength={20}
                />
                <button type="button" onClick={confirmarEdicao} className="text-emerald-400 hover:text-emerald-300">
                  <Check size={11} />
                </button>
                <button type="button" onClick={cancelarEdicao} className="text-neutral-200 hover:text-neutral-300">
                  <X size={11} />
                </button>
              </div>
            ) : (
              /* ── Tab normal ── */
              <div
                className="flex items-center gap-1 px-3 py-2 border-r border-neutral-800 cursor-pointer select-none"
                style={{
                  color:           watchlistActiva === idx ? corTema : '#6B7280',
                  backgroundColor: watchlistActiva === idx ? corTema + '11' : 'transparent',
                  borderBottom:    watchlistActiva === idx ? `2px solid ${corTema}` : '2px solid transparent',
                }}
                onClick={() => definirWatchlistActiva(idx)}
              >
                <Star size={9} style={{ opacity: watchlistActiva === idx ? 1 : 0.4 }} />
                <span className="font-mono text-[11px] whitespace-nowrap">
                  {nomesWatchlist[idx] ?? `Lista ${idx + 1}`}
                </span>
                {/* Botões que aparecem no hover */}
                <span className="flex items-center gap-0.5 ml-1 opacity-0 group-hover/tab:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); iniciarEdicao(idx) }}
                    className="text-neutral-300 hover:text-neutral-300 p-0.5"
                    title="Renomear lista"
                  >
                    <Pencil size={9} />
                  </button>
                  {watchlists.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoverLista(idx) }}
                      className="text-neutral-300 hover:text-red-400 p-0.5"
                      title="Eliminar lista"
                    >
                      <Trash2 size={9} />
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* ── Criar nova lista ── */}
        {criandoLista ? (
          <form onSubmit={handleCriarLista} className="flex items-center gap-1 px-2 py-1.5 shrink-0">
            <input
              ref={novaRef}
              value={novaListaNome}
              onChange={(e) => setNovaListaNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setCriandoLista(false); setNovaListaNome('') } }}
              placeholder="Nome da lista…"
              className="bg-neutral-800 border border-neutral-600 rounded px-1.5 py-0.5 font-mono text-[11px] text-white outline-none w-28 placeholder:text-neutral-300"
              maxLength={20}
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300">
              <Check size={11} />
            </button>
            <button type="button" onClick={() => { setCriandoLista(false); setNovaListaNome('') }} className="text-neutral-200 hover:text-neutral-300">
              <X size={11} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCriandoLista(true)}
            className="flex items-center gap-1 px-3 py-2 font-mono text-[11px] text-neutral-300 hover:text-neutral-300 shrink-0 transition-colors"
            title="Criar nova lista"
          >
            <Plus size={11} />
          </button>
        )}

        <div className="flex-1" />
        <span className="font-mono text-[10px] text-neutral-300 px-3 shrink-0">
          {listaActiva.length} inst.
        </span>
      </div>

      {/* ── Lista de instrumentos ─────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cabeçalho */}
        <div className="sticky top-0 grid grid-cols-[1fr_2fr_1fr] gap-2 px-4 py-1.5 bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-300">
          <span>TICKER</span>
          <span className="text-right">ÚLTIMO</span>
          <span className="text-right">VAR%</span>
        </div>

        {listaActiva.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-2 font-mono text-sm text-neutral-400">
            <Star size={18} className="opacity-30" />
            <span className="text-xs">Lista vazia. Adicione instrumentos abaixo.</span>
          </div>
        )}

        {listaActiva.map((item) => {
          const preco = obterPrecoActual(item.ticker)
          const hashTicker = item.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
          const variacao = ((hashTicker % 400) - 200) / 100

          return (
            <div
              key={item.ticker}
              className="grid grid-cols-[1fr_2fr_1fr] gap-2 px-4 py-2 border-b border-neutral-900 hover:bg-neutral-900 transition-colors group"
            >
              <button
                type="button"
                onClick={() => handleSeleccionar(item.ticker)}
                className="text-left font-mono text-sm font-bold hover:underline"
                style={{ color: corTema }}
              >
                {item.ticker}
              </button>
              <span className="text-right font-mono text-xs text-white">
                {preco.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-end gap-1">
                <span
                  className="font-mono text-xs"
                  style={{ color: variacao >= 0 ? '#10B981' : '#EF4444' }}
                >
                  {variacao >= 0 ? '▲' : '▼'}{Math.abs(variacao).toFixed(2)}%
                </span>
                <button
                  type="button"
                  onClick={() => removerDoWatchlist(item.ticker)}
                  className="ml-1 text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remover"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Adicionar instrumento ─────────────────────── */}
      <form
        onSubmit={handleAdicionarTicker}
        className="flex items-center gap-2 px-3 py-2 border-t border-neutral-800 shrink-0"
      >
        <input
          type="text"
          value={novoTicker}
          onChange={(e) => setNovoTicker(e.target.value.toUpperCase())}
          placeholder="Adicionar ticker…"
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 font-mono text-xs text-white placeholder:text-neutral-300 outline-none focus:border-neutral-500"
          maxLength={12}
        />
        <button
          type="submit"
          className="flex items-center gap-1 font-mono text-xs px-3 py-1 rounded transition-colors"
          style={{ backgroundColor: corTema + '33', color: corTema }}
        >
          <Plus size={11} />
          ADD
        </button>
      </form>
    </div>
  )
}
