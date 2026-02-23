'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Livro de Ordens (ALLQ)
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { gerarLivroOrdens, actualizarLivroOrdens } from '@/lib/mocks/order-book'
import { useTerminalStore } from '@/store/terminal.store'
import type { LivroOrdens, NivelOrdem } from '@/types/market'
import { ACOES_SCREENER } from '@/lib/mocks/screener'
import { Columns } from 'lucide-react'

interface Props {
  ticker?: string
  niveis?: number
}

function NivelRow({
  nivel,
  lado,
  maxQt,
  corBase,
}: {
  nivel: NivelOrdem
  lado: 'oferta' | 'pedido'
  maxQt: number
  corBase: string
}) {
  const pct = Math.min((nivel.quantidade / maxQt) * 100, 100)

  return (
    <div className="relative flex items-center px-3 py-[3px] font-mono text-[10px] sm:text-xs group hover:bg-neutral-800 transition-colors">
      <div
        className="absolute inset-y-1 opacity-20"
        style={{
          width: `${pct}%`,
          right: lado === 'oferta' ? 0 : '',
          left: lado === 'pedido' ? 0 : '',
          backgroundColor: corBase,
        }}
      />

      {lado === 'oferta' ? (
        <>
          <span className="flex-1 text-right text-neutral-400">
            {nivel.quantidade.toLocaleString('pt-PT')}
          </span>
          <span className="w-24 text-right font-bold" style={{ color: corBase }}>
            {nivel.preco.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </span>
        </>
      ) : (
        <>
          <span className="w-24 text-left font-bold" style={{ color: corBase }}>
            {nivel.preco.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </span>
          <span className="flex-1 text-left text-neutral-400">
            {nivel.quantidade.toLocaleString('pt-PT')}
          </span>
        </>
      )}
    </div>
  )
}

function SingleOrderBook({
  ticker,
  onChangeTicker,
  corTema,
  niveis = 16
}: { ticker: string, onChangeTicker: (t: string) => void, corTema: string, niveis?: number }) {
  const [livro, setLivro] = useState<LivroOrdens>(() => gerarLivroOrdens(ticker, niveis))

  useEffect(() => {
    setLivro(gerarLivroOrdens(ticker, niveis))
  }, [ticker, niveis])

  useEffect(() => {
    const id = setInterval(() => {
      setLivro((l) => actualizarLivroOrdens(l))
    }, 500)
    return () => clearInterval(id)
  }, [ticker])

  const maxQtOfertas = Math.max(...livro.ofertas.map(o => o.quantidade))
  const maxQtPedidos = Math.max(...livro.pedidos.map(o => o.quantidade))
  const maxAbsQt = Math.max(maxQtOfertas, maxQtPedidos) || 1

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] font-mono shadow-[inset_0_0_20px_rgba(0,0,0,1)] border-r border-neutral-800 last:border-r-0">
      <div className="flex bg-[#0A0C10] items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <select
            value={ticker}
            onChange={e => onChangeTicker(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 font-bold text-white text-sm px-2 py-1 outline-none w-28 lg:w-32 truncate"
            style={{ borderLeft: `3px solid ${corTema}` }}
          >
            {ACOES_SCREENER.map(a => (
              <option key={a.ticker} value={a.ticker}>{a.ticker} - {a.nome}</option>
            ))}
            {!ACOES_SCREENER.find(a => a.ticker === ticker) && <option value={ticker}>{ticker} - Activo</option>}
          </select>
          <span
            className="text-[8px] lg:text-[9px] px-1.5 py-0.5 whitespace-nowrap hidden sm:inline-block"
            style={{ backgroundColor: corTema + '22', color: corTema, border: `1px solid ${corTema}55` }}
          >
            ALLQ
          </span>
        </div>
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-1 lg:gap-4 text-[10px] lg:text-xs">
          <div>
            <span className="text-neutral-500">SPD </span>
            <span className="text-yellow-400 font-bold">
              {livro.spread.toFixed(livro.moeda === 'JPY' ? 3 : 4)}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 hidden xl:inline-block">MID </span>
            <span className="text-white font-bold ml-1 xl:ml-0">
              {livro.precoMedio.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between px-2 py-1 text-[9px] text-neutral-300 border-r border-neutral-800">
          <span className="text-left hidden sm:inline-block">QTD</span>
          <span className="text-right text-red-400 font-bold w-full sm:w-auto">ASK</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 text-[9px] text-neutral-300">
          <span className="text-left text-green-400 font-bold w-full sm:w-auto">BID</span>
          <span className="text-right hidden sm:inline-block">QTD</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 overflow-hidden">
        <div className="border-r border-neutral-800 overflow-y-auto flex flex-col-reverse bg-[#0A0000]">
          {livro.ofertas.map((nivel, i) => (
            <NivelRow
              key={`ask-${i}`}
              nivel={nivel}
              lado="oferta"
              maxQt={maxAbsQt}
              corBase="#FF2A2A"
            />
          ))}
        </div>
        <div className="overflow-y-auto flex flex-col bg-[#000A05]">
          {livro.pedidos.map((nivel, i) => (
            <NivelRow
              key={`bid-${i}`}
              nivel={nivel}
              lado="pedido"
              maxQt={maxAbsQt}
              corBase="#00FF00"
            />
          ))}
        </div>
      </div>

      <div
        className="flex items-center justify-between px-4 py-1.5 border-t border-neutral-800 shrink-0 bg-[#050505]"
        style={{ borderTopColor: corTema + '66' }}
      >
        <span className="text-[9px] text-neutral-500 truncate mr-2">
          {new Date(livro.timestamp).toLocaleTimeString('pt-PT')} <span className="hidden sm:inline-block">// LEVEL 2</span>
        </span>
        <span className="text-[10px] lg:text-xs font-bold whitespace-nowrap" style={{ color: corTema }}>
          MATCH: {livro.precoMedio.toLocaleString('pt-PT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 5,
          })}{' '}
          {livro.moeda}
        </span>
      </div>
    </div>
  )
}

export function OrderBookPanel({ ticker: tickerProp, niveis = 16 }: Props) {
  const { tickerActivo, definirTickerActivo, temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const mainTicker = tickerProp ?? tickerActivo ?? 'AAPL'
  const [ticker2, setTicker2] = useState('MSFT')
  const [vistaDupla, setVistaDupla] = useState(false)
  const [porta, setPorta] = useState<Element | null>(null)

  useEffect(() => {
    setPorta(document.getElementById('painel-header-tools'))

    // Clean up portal space on unmount if needed
    return () => setPorta(null)
  }, [])

  return (
    <>
      <div className="w-full h-full flex flex-col sm:flex-row overflow-hidden bg-black">
        <SingleOrderBook
          ticker={mainTicker}
          onChangeTicker={definirTickerActivo}
          corTema={corTema}
          niveis={niveis}
        />
        {vistaDupla && (
          <SingleOrderBook
            ticker={ticker2}
            onChangeTicker={setTicker2}
            corTema={corTema}
            niveis={niveis}
          />
        )}
      </div>

      {porta && createPortal(
        <button
          onClick={() => setVistaDupla(v => !v)}
          className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded transition-all border outline-none cursor-pointer"
          style={{
            color: vistaDupla ? '#000' : corTema,
            backgroundColor: vistaDupla ? corTema : 'transparent',
            borderColor: vistaDupla ? corTema : '#333'
          }}
          title="Alternar Vista Dupla"
        >
          <Columns size={12} />
          <span className="font-bold hidden sm:inline-block">{vistaDupla ? '2X VIEW ON' : 'DUAL VIEW'}</span>
        </button>,
        porta
      )}
    </>
  )
}
