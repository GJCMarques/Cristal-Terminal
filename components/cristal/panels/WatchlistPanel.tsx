'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Lista de Observação (Watchlist)
// ============================================================

import { useState } from 'react'
import { useTerminalStore, selectWatchlistActiva } from '@/store/terminal.store'
import { obterPrecoActual } from '@/lib/mocks/candlestick'

export function WatchlistPanel() {
  const {
    watchlists,
    watchlistActiva,
    definirWatchlistActiva,
    adicionarAoWatchlist,
    removerDoWatchlist,
    definirTickerActivo,
    definirVista,
    temaActual,
  } = useTerminalStore()

  const listaActiva = selectWatchlistActiva(useTerminalStore.getState())
  const [novoTicker, setNovoTicker] = useState('')
  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

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

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* ── Tabs de watchlists ─────────────────────────── */}
      <div className="flex items-center border-b border-neutral-800 shrink-0">
        {watchlists.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => definirWatchlistActiva(idx)}
            className="px-4 py-2 font-mono text-xs border-r border-neutral-800 transition-colors"
            style={{
              color: watchlistActiva === idx ? corTema : '#6B7280',
              backgroundColor: watchlistActiva === idx ? corTema + '11' : 'transparent',
              borderBottom: watchlistActiva === idx ? `2px solid ${corTema}` : '2px solid transparent',
            }}
          >
            LISTA {idx + 1}
          </button>
        ))}
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-neutral-600 px-3">
          {listaActiva.length} instrumentos
        </span>
      </div>

      {/* ── Lista de instrumentos ─────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cabeçalho */}
        <div className="sticky top-0 grid grid-cols-[1fr_2fr_1fr] gap-2 px-4 py-1.5 bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-600">
          <span>TICKER</span>
          <span className="text-right">ÚLTIMO</span>
          <span className="text-right">VAR%</span>
        </div>

        {listaActiva.length === 0 && (
          <div className="flex items-center justify-center h-24 font-mono text-sm text-neutral-700">
            Lista vazia. Adicione instrumentos abaixo.
          </div>
        )}

        {listaActiva.map((item) => {
          const preco = obterPrecoActual(item.ticker)
          // Variação simulada com base no ticker
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
                className="text-left font-mono text-sm font-bold text-white hover:underline"
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
                  className="ml-2 font-mono text-[10px] text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
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
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 font-mono text-xs text-white placeholder:text-neutral-600 outline-none focus:border-neutral-500"
          maxLength={12}
        />
        <button
          type="submit"
          className="font-mono text-xs px-3 py-1 rounded transition-colors"
          style={{ backgroundColor: corTema + '33', color: corTema }}
        >
          + ADD
        </button>
      </form>
    </div>
  )
}
