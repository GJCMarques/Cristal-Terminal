'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Livro de Ordens (ALLQ)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { gerarLivroOrdens, actualizarLivroOrdens } from '@/lib/mocks/order-book'
import { useTerminalStore } from '@/store/terminal.store'
import type { LivroOrdens, NivelOrdem } from '@/types/market'

interface Props {
  ticker?: string
  niveis?: number
}

function NivelRow({
  nivel,
  lado,
  maxTotal,
  corBase,
}: {
  nivel: NivelOrdem
  lado: 'oferta' | 'pedido'
  maxTotal: number
  corBase: string
}) {
  const pct = (nivel.total / maxTotal) * 100

  return (
    <div className="relative flex items-center px-2 py-[2px] font-mono text-xs group hover:bg-neutral-900">
      {/* Barra de profundidade */}
      <div
        className="absolute inset-y-0 opacity-15"
        style={{
          width: `${pct}%`,
          right: lado === 'oferta' ? 0 : undefined,
          left: lado === 'pedido' ? 0 : undefined,
          backgroundColor: corBase,
        }}
      />

      {/* Colunas */}
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

export function OrderBookPanel({ ticker: tickerProp, niveis = 10 }: Props) {
  const { tickerActivo, temaActual } = useTerminalStore()
  const ticker = tickerProp ?? tickerActivo ?? 'AAPL'

  const [livro, setLivro] = useState<LivroOrdens>(() => gerarLivroOrdens(ticker, niveis))

  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  // Recria o livro quando o ticker muda
  useEffect(() => {
    setLivro(gerarLivroOrdens(ticker, niveis))
  }, [ticker, niveis])

  // Actualização simulada em tempo real
  useEffect(() => {
    const id = setInterval(() => {
      setLivro((l) => actualizarLivroOrdens(l))
    }, 500)
    return () => clearInterval(id)
  }, [ticker])

  const maxTotalOfertas = livro.ofertas[livro.ofertas.length - 1]?.total ?? 1
  const maxTotalPedidos = livro.pedidos[livro.pedidos.length - 1]?.total ?? 1

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] font-mono">
      {/* ── Cabeçalho ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div>
          <span className="text-sm font-bold text-white">{ticker}</span>
          <span
            className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: corTema + '22', color: corTema }}
          >
            LIVRO DE ORDENS
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-neutral-500">SPREAD </span>
            <span className="text-yellow-400 font-bold">
              {livro.spread.toFixed(livro.moeda === 'JPY' ? 3 : 4)}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">MID </span>
            <span className="text-white font-bold">
              {livro.precoMedio.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-neutral-600">
            {new Date(livro.timestamp).toLocaleTimeString('pt-PT')}
          </div>
        </div>
      </div>

      {/* ── Cabeçalhos das colunas ──────────────────────── */}
      <div className="grid grid-cols-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-neutral-600 border-r border-neutral-800">
          <span className="flex-1 text-right">QTD</span>
          <span className="w-24 text-right text-red-400">OFERTA (ASK)</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-neutral-600">
          <span className="w-24 text-left text-green-400">PEDIDO (BID)</span>
          <span className="flex-1 text-left">QTD</span>
        </div>
      </div>

      {/* ── Corpo do livro ──────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-2 overflow-hidden">
        {/* Coluna esquerda: Ofertas (asks) — vermelho */}
        <div className="border-r border-neutral-800 overflow-y-auto flex flex-col-reverse">
          {livro.pedidos.map((nivel, i) => (
            <NivelRow
              key={`ask-${i}`}
              nivel={nivel}
              lado="oferta"
              maxTotal={maxTotalPedidos}
              corBase="#EF4444"
            />
          ))}
        </div>

        {/* Coluna direita: Pedidos (bids) — verde */}
        <div className="overflow-y-auto flex flex-col">
          {livro.ofertas.map((nivel, i) => (
            <NivelRow
              key={`bid-${i}`}
              nivel={nivel}
              lado="pedido"
              maxTotal={maxTotalOfertas}
              corBase="#10B981"
            />
          ))}
        </div>
      </div>

      {/* ── Preço médio central ─────────────────────────── */}
      <div
        className="flex items-center justify-center py-1 border-t border-neutral-800 shrink-0"
        style={{ borderTopColor: corTema + '44' }}
      >
        <span className="text-xs font-bold" style={{ color: corTema }}>
          {livro.precoMedio.toLocaleString('pt-PT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 5,
          })}{' '}
          {livro.moeda}
        </span>
      </div>
    </div>
  )
}
