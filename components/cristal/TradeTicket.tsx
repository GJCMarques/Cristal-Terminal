'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Trade Ticket (Ordem Rápida)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { X, ShoppingCart, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'

type TipoOrdem  = 'mercado' | 'limite' | 'stop'
type Validade   = 'dia' | 'gtc' | 'ioc'

const TIPOS_ORDEM: { id: TipoOrdem; label: string }[] = [
  { id: 'mercado', label: 'MERCADO' },
  { id: 'limite',  label: 'LIMITE'  },
  { id: 'stop',    label: 'STOP'    },
]

const VALIDADES: { id: Validade; label: string }[] = [
  { id: 'dia', label: 'DIA'  },
  { id: 'gtc', label: 'GTC'  },
  { id: 'ioc', label: 'IOC'  },
]

export function TradeTicket() {
  const { tradeTicket, fecharTradeTicket, temaActual } = useTerminalStore()
  const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const [lado,        setLado]        = useState<'compra' | 'venda'>(tradeTicket.lado)
  const [tipoOrdem,   setTipoOrdem]   = useState<TipoOrdem>('mercado')
  const [quantidade,  setQuantidade]  = useState('100')
  const [preco,       setPreco]       = useState(tradeTicket.precoReferencia.toFixed(2))
  const [validade,    setValidade]    = useState<Validade>('dia')
  const [confirmado,  setConfirmado]  = useState(false)
  const [executado,   setExecutado]   = useState(false)

  // Sincronizar com store quando abre
  useEffect(() => {
    if (tradeTicket.aberto) {
      setLado(tradeTicket.lado)
      setPreco(tradeTicket.precoReferencia > 0 ? tradeTicket.precoReferencia.toFixed(2) : '')
      setConfirmado(false)
      setExecutado(false)
      setTipoOrdem('mercado')
      setQuantidade('100')
      setValidade('dia')
    }
  }, [tradeTicket.aberto, tradeTicket.lado, tradeTicket.precoReferencia])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') fecharTradeTicket()
  }, [fecharTradeTicket])

  useEffect(() => {
    if (!tradeTicket.aberto) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tradeTicket.aberto, handleKeyDown])

  if (!tradeTicket.aberto) return null

  const qtd        = parseFloat(quantidade) || 0
  const precoNum   = parseFloat(preco) || tradeTicket.precoReferencia
  const valorTotal = qtd * precoNum
  const comissao   = Math.max(valorTotal * 0.001, 1) // simulado 0.1%, mín $1

  const corLado = lado === 'compra' ? '#10B981' : '#EF4444'

  function executarOrdem() {
    if (!confirmado) { setConfirmado(true); return }
    // Simular execução
    setExecutado(true)
    setTimeout(() => fecharTradeTicket(), 2000)
  }

  if (executado) {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center">
        <div className="bg-[#0D0D0D] border rounded-lg p-8 font-mono text-center max-w-xs w-full"
             style={{ borderColor: corLado }}>
          <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: corLado }} />
          <div className="text-lg font-black mb-1" style={{ color: corLado }}>
            {lado === 'compra' ? 'COMPRA EXECUTADA' : 'VENDA EXECUTADA'}
          </div>
          <div className="text-sm text-neutral-400 mb-2">{tradeTicket.ticker}</div>
          <div className="text-2xl font-black text-white">{qtd} × ${precoNum.toFixed(2)}</div>
          <div className="text-[10px] text-neutral-600 mt-1">Ordem simulada · Sem execução real</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center">
      <div
        className="bg-[#0D0D0D] border rounded-lg font-mono w-96 shadow-2xl"
        style={{ borderColor: corLado + '88', boxShadow: `0 0 40px ${corLado}22` }}
      >
        {/* ── Cabeçalho ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
             style={{ borderColor: corLado + '44', backgroundColor: corLado + '11' }}>
          <div>
            <div className="text-xs font-black" style={{ color: corLado }}>
              {lado === 'compra' ? 'COMPRAR' : 'VENDER'} — {tradeTicket.ticker || '—'}
            </div>
            <div className="text-[10px] text-neutral-500">{tradeTicket.nome || 'Seleccionar instrumento'}</div>
          </div>
          <button
            type="button"
            onClick={fecharTradeTicket}
            className="text-neutral-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Corpo ──────────────────────────────────────── */}
        <div className="p-4 space-y-3">

          {/* Lado (compra/venda) */}
          <div className="grid grid-cols-2 gap-2">
            {(['compra', 'venda'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { setLado(l); setConfirmado(false) }}
                className="py-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: lado === l ? (l === 'compra' ? '#10B98122' : '#EF444422') : 'transparent',
                  color:           lado === l ? (l === 'compra' ? '#10B981'   : '#EF4444')   : '#6B7280',
                  border:          `1px solid ${lado === l ? (l === 'compra' ? '#10B981' : '#EF4444') : '#374151'}`,
                }}
              >
                {l === 'compra' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {l === 'compra' ? 'COMPRA' : 'VENDA'}
              </button>
            ))}
          </div>

          {/* Tipo de ordem */}
          <div>
            <label className="text-[9px] text-neutral-600 block mb-1">TIPO DE ORDEM</label>
            <div className="grid grid-cols-3 gap-1">
              {TIPOS_ORDEM.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTipoOrdem(t.id); setConfirmado(false) }}
                  className="text-[10px] py-1 rounded border transition-colors"
                  style={{
                    borderColor: tipoOrdem === t.id ? corTema : '#374151',
                    color:       tipoOrdem === t.id ? corTema : '#6B7280',
                    background:  tipoOrdem === t.id ? corTema + '18' : 'transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label className="text-[9px] text-neutral-600 block mb-1">QUANTIDADE</label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => { setQuantidade(e.target.value); setConfirmado(false) }}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-neutral-500 transition-colors font-mono"
              placeholder="0"
              min="1"
            />
          </div>

          {/* Preço (apenas para limite/stop) */}
          {tipoOrdem !== 'mercado' && (
            <div>
              <label className="text-[9px] text-neutral-600 block mb-1">
                PREÇO {tipoOrdem === 'limite' ? 'LIMITE' : 'STOP'} ($)
              </label>
              <input
                type="number"
                value={preco}
                onChange={(e) => { setPreco(e.target.value); setConfirmado(false) }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-neutral-500 transition-colors font-mono"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          )}

          {/* Validade */}
          <div>
            <label className="text-[9px] text-neutral-600 block mb-1">VALIDADE</label>
            <div className="grid grid-cols-3 gap-1">
              {VALIDADES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setValidade(v.id)}
                  className="text-[10px] py-1 rounded border transition-colors"
                  style={{
                    borderColor: validade === v.id ? corTema : '#374151',
                    color:       validade === v.id ? corTema : '#6B7280',
                    background:  validade === v.id ? corTema + '18' : 'transparent',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="border border-neutral-800 rounded p-3 space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-neutral-600">Valor estimado</span>
              <span className="text-white font-bold">${valorTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-neutral-600">Comissão (sim.)</span>
              <span className="text-neutral-400">${comissao.toFixed(2)}</span>
            </div>
            <div className="h-px bg-neutral-800 my-1" />
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-neutral-400">Total</span>
              <span style={{ color: corLado }}>
                ${(valorTotal + (lado === 'compra' ? comissao : -comissao)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Aviso simulação */}
          <div className="flex items-center gap-1.5 text-[9px] text-neutral-700">
            <AlertTriangle size={10} />
            <span>Simulação · Sem execução real · Apenas para demonstração</span>
          </div>
        </div>

        {/* ── Botão de execução ──────────────────────────── */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={executarOrdem}
            disabled={qtd <= 0}
            className="w-full py-3 rounded text-[12px] font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: confirmado ? corLado : 'transparent',
              color:           confirmado ? '#000' : corLado,
              border:          `1px solid ${corLado}`,
            }}
          >
            {confirmado
              ? `CONFIRMAR ${lado === 'compra' ? 'COMPRA' : 'VENDA'} — ENTER`
              : `${lado === 'compra' ? 'COMPRAR' : 'VENDER'} ${qtd > 0 ? qtd : '—'} × ${tradeTicket.ticker || '—'}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
