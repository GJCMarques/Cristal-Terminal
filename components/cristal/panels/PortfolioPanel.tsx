'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Portfolio & P&L
// ============================================================

import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, BarChart2 } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import type { PosicaoPortfolio } from '@/types/terminal'

// ── Mock portfolio positions ──────────────────────────────────
const POSICOES: PosicaoPortfolio[] = [
  { ticker: 'AAPL',  nome: 'Apple Inc.',       classeAtivo: 'Equity', sector: 'Tecnologia',   quantidade: 50,   custoMedio: 178.40, precoActual: 211.84, variacao1D: +0.82, beta: 1.21, moeda: 'USD' },
  { ticker: 'MSFT',  nome: 'Microsoft Corp.',  classeAtivo: 'Equity', sector: 'Tecnologia',   quantidade: 30,   custoMedio: 385.20, precoActual: 415.30, variacao1D: +0.31, beta: 0.98, moeda: 'USD' },
  { ticker: 'NVDA',  nome: 'NVIDIA Corp.',     classeAtivo: 'Equity', sector: 'Semicond.',    quantidade: 20,   custoMedio: 620.00, precoActual: 875.40, variacao1D: +2.14, beta: 1.85, moeda: 'USD' },
  { ticker: 'GOOGL', nome: 'Alphabet Inc.',    classeAtivo: 'Equity', sector: 'Tecnologia',   quantidade: 25,   custoMedio: 162.50, precoActual: 192.10, variacao1D: -0.22, beta: 1.05, moeda: 'USD' },
  { ticker: 'JPM',   nome: 'JPMorgan Chase',   classeAtivo: 'Equity', sector: 'Financeiro',   quantidade: 40,   custoMedio: 188.60, precoActual: 231.45, variacao1D: +0.55, beta: 1.12, moeda: 'USD' },
  { ticker: 'XAU',   nome: 'Ouro Spot',        classeAtivo: 'Comdty', sector: 'Commodities',  quantidade: 10,   custoMedio: 2450.0, precoActual: 2932.50, variacao1D: +0.42, beta: 0.12, moeda: 'USD' },
  { ticker: 'BTC',   nome: 'Bitcoin',          classeAtivo: 'Crypto', sector: 'Cripto',       quantidade: 0.5,  custoMedio: 62000,  precoActual: 95800,  variacao1D: +4.20, beta: 1.95, moeda: 'USD' },
  { ticker: 'EURUSD',nome: 'EUR/USD',          classeAtivo: 'Curncy', sector: 'FX',           quantidade: 50000,custoMedio: 1.0720, precoActual: 1.0823, variacao1D: -0.05, beta: 0.05, moeda: 'USD' },
  { ticker: 'UST10', nome: 'US Treasury 10A',  classeAtivo: 'Govt',   sector: 'Obrigações',   quantidade: 10,   custoMedio: 97.80,  precoActual: 96.42,  variacao1D: -0.18, beta: -0.15, moeda: 'USD' },
  { ticker: 'PSI20', nome: 'PSI 20',           classeAtivo: 'Index',  sector: 'Índices',      quantidade: 100,  custoMedio: 6210.0, precoActual: 6832.14, variacao1D: +0.12, beta: 0.82, moeda: 'EUR' },
]

const COR_SECTOR: Record<string, string> = {
  'Tecnologia':   '#3B82F6',
  'Semicond.':    '#8B5CF6',
  'Financeiro':   '#10B981',
  'Commodities':  '#F59E0B',
  'Cripto':       '#F97316',
  'FX':           '#06B6D4',
  'Obrigações':   '#6B7280',
  'Índices':      '#EC4899',
}

function calcularPnl(p: PosicaoPortfolio) {
  const valorActual = p.quantidade * p.precoActual
  const custo       = p.quantidade * p.custoMedio
  const pnlTotal    = valorActual - custo
  const pnlPct      = (pnlTotal / custo) * 100
  const pnlDia      = valorActual * (p.variacao1D / 100)
  return { valorActual, custo, pnlTotal, pnlPct, pnlDia }
}

function FmtMoeda({ v, cor }: { v: number; cor?: boolean }) {
  const negativo = v < 0
  const style = cor ? { color: negativo ? '#EF4444' : '#10B981' } : { color: '#E5E7EB' }
  return (
    <span style={style}>
      {negativo ? '-' : cor ? '+' : ''}${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  )
}

function FmtPct({ v }: { v: number }) {
  return (
    <span style={{ color: v >= 0 ? '#10B981' : '#EF4444' }}>
      {v >= 0 ? '+' : ''}{v.toFixed(2)}%
    </span>
  )
}

export function PortfolioPanel() {
  const { temaActual, definirTickerActivo, definirVista, abrirTradeTicket } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [abaDados, setAbaDados] = useState<'posicoes' | 'sector' | 'risco'>('posicoes')
  const [ordemCol, setOrdemCol] = useState<'pnlTotal' | 'valorActual' | 'pnlPct'>('valorActual')

  const dadosComputados = useMemo(() => {
    return POSICOES.map((p) => ({ ...p, ...calcularPnl(p) }))
      .sort((a, b) => {
        if (ordemCol === 'pnlTotal')    return Math.abs(b.pnlTotal)    - Math.abs(a.pnlTotal)
        if (ordemCol === 'pnlPct')      return Math.abs(b.pnlPct)      - Math.abs(a.pnlPct)
        return b.valorActual - a.valorActual
      })
  }, [ordemCol])

  // Sumários globais
  const totalValor    = dadosComputados.reduce((s, p) => s + p.valorActual, 0)
  const totalCusto    = dadosComputados.reduce((s, p) => s + p.custo, 0)
  const totalPnl      = totalValor - totalCusto
  const totalPnlPct   = (totalPnl / totalCusto) * 100
  const totalPnlDia   = dadosComputados.reduce((s, p) => s + p.pnlDia, 0)
  const betaPortfolio = dadosComputados.reduce((s, p) => s + p.beta * (p.valorActual / totalValor), 0)

  // Dados para o gráfico de sector
  const dadosSector = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const p of dadosComputados) {
      mapa[p.sector] = (mapa[p.sector] ?? 0) + p.valorActual
    }
    return Object.entries(mapa).map(([name, value]) => ({
      name,
      value,
      pct: (value / totalValor) * 100,
      cor: COR_SECTOR[name] ?? '#6B7280',
    })).sort((a, b) => b.value - a.value)
  }, [dadosComputados, totalValor])

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">

      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Wallet size={14} style={{ color: corTema }} />
          <span className="text-xs font-bold" style={{ color: corTema }}>PORT — CARTEIRA & P&L</span>
        </div>
        <div className="flex items-center gap-1">
          {(['posicoes', 'sector', 'risco'] as const).map((aba) => (
            <button
              key={aba}
              type="button"
              onClick={() => setAbaDados(aba)}
              className="text-[10px] px-2.5 py-1 rounded border transition-colors"
              style={{
                borderColor: abaDados === aba ? corTema : '#374151',
                color:       abaDados === aba ? corTema : '#6B7280',
                background:  abaDados === aba ? corTema + '18' : 'transparent',
              }}
            >
              {aba === 'posicoes' ? 'POSIÇÕES' : aba === 'sector' ? 'SECTORES' : 'RISCO'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards de resumo ─────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-0 border-b border-neutral-800 shrink-0">
        {[
          { label: 'VALOR TOTAL',   val: <span className="text-white">${totalValor.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span> },
          { label: 'CUSTO BASE',    val: <span className="text-neutral-400">${totalCusto.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span> },
          { label: 'P&L TOTAL',     val: <FmtMoeda v={totalPnl} cor /> },
          { label: 'P&L %',         val: <FmtPct v={totalPnlPct} /> },
          { label: 'P&L DIA',       val: <FmtMoeda v={totalPnlDia} cor /> },
        ].map(({ label, val }) => (
          <div key={label} className="flex flex-col items-center justify-center py-2 border-r border-neutral-900 last:border-r-0">
            <span className="text-[9px] text-neutral-300">{label}</span>
            <span className="text-sm font-bold mt-0.5">{val}</span>
          </div>
        ))}
      </div>

      {/* ── Conteúdo principal ─────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex">

        {abaDados === 'posicoes' && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead className="sticky top-0 bg-[#0A0A0A] z-10">
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-3 py-2 text-neutral-300 font-normal w-10">#</th>
                  <th className="text-left px-3 py-2 text-neutral-300 font-normal">TICKER</th>
                  <th className="text-right px-3 py-2 text-neutral-300 font-normal">QTD</th>
                  <th className="text-right px-3 py-2 text-neutral-300 font-normal">CUSTO</th>
                  <th className="text-right px-3 py-2 text-neutral-300 font-normal">ACTUAL</th>
                  {[
                    ['valorActual', 'VALOR'],
                    ['pnlTotal',    'P&L $'],
                    ['pnlPct',      'P&L %'],
                  ].map(([key, lbl]) => (
                    <th
                      key={key}
                      className="text-right px-3 py-2 font-normal cursor-pointer hover:text-neutral-300 transition-colors"
                      style={{ color: ordemCol === key ? corTema : '#6B7280' }}
                      onClick={() => setOrdemCol(key as typeof ordemCol)}
                    >
                      {lbl} {ordemCol === key && '↓'}
                    </th>
                  ))}
                  <th className="text-right px-3 py-2 text-neutral-300 font-normal">1D%</th>
                  <th className="text-right px-3 py-2 text-neutral-300 font-normal">PESO</th>
                  <th className="text-right px-3 py-2 text-neutral-300 font-normal">SECTOR</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {dadosComputados.map((p, i) => {
                  const peso = (p.valorActual / totalValor) * 100
                  return (
                    <tr
                      key={p.ticker}
                      className="border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer group transition-colors"
                      onClick={() => { definirTickerActivo(p.ticker); definirVista('candlestick') }}
                    >
                      <td className="px-3 py-1.5 text-neutral-400">{i + 1}</td>
                      <td className="px-3 py-1.5">
                        <div className="font-bold" style={{ color: corTema }}>{p.ticker}</div>
                        <div className="text-[9px] text-neutral-300 truncate max-w-[120px]">{p.nome}</div>
                      </td>
                      <td className="px-3 py-1.5 text-right text-neutral-400">{p.quantidade.toLocaleString('en-US')}</td>
                      <td className="px-3 py-1.5 text-right text-neutral-200">${p.custoMedio.toFixed(p.custoMedio < 100 ? 4 : 2)}</td>
                      <td className="px-3 py-1.5 text-right text-neutral-300">${p.precoActual.toFixed(p.precoActual < 100 ? 4 : 2)}</td>
                      <td className="px-3 py-1.5 text-right text-white">${p.valorActual.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="px-3 py-1.5 text-right"><FmtMoeda v={p.pnlTotal} cor /></td>
                      <td className="px-3 py-1.5 text-right"><FmtPct v={p.pnlPct} /></td>
                      <td className="px-3 py-1.5 text-right"><FmtPct v={p.variacao1D} /></td>
                      <td className="px-3 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="h-1 rounded-sm" style={{ width: `${Math.max(peso, 1)}px`, maxWidth: 40, backgroundColor: COR_SECTOR[p.sector] ?? corTema }} />
                          <span className="text-neutral-200">{peso.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-right text-[9px]" style={{ color: COR_SECTOR[p.sector] ?? '#6B7280' }}>{p.sector}</td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); abrirTradeTicket(p.ticker, p.nome, p.precoActual) }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Trade"
                        >
                          <ShoppingCart size={11} style={{ color: '#10B981' }} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {abaDados === 'sector' && (
          <div className="flex-1 flex min-h-0">
            {/* Gráfico de pizza */}
            <div className="w-64 shrink-0 flex flex-col items-center justify-center p-4">
              <div className="text-[9px] text-neutral-300 mb-2">ALOCAÇÃO SECTORIAL</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dadosSector}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {dadosSector.map((d, i) => (
                      <Cell key={i} fill={d.cor} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Valor']}
                    contentStyle={{ background: '#0D0D0D', border: '1px solid #374151', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela de sectores */}
            <div className="flex-1 overflow-auto p-4">
              {dadosSector.map((s) => (
                <div key={s.name} className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.cor }} />
                  <span className="text-[10px] text-neutral-400 w-24 shrink-0">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, backgroundColor: s.cor }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-200 w-10 text-right">{s.pct.toFixed(1)}%</span>
                  <span className="text-[10px] text-neutral-300 w-24 text-right">
                    ${s.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaDados === 'risco' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-3 gap-4">
              {/* Beta do portfolio */}
              <div className="border border-neutral-800 rounded p-4">
                <div className="text-[9px] text-neutral-300 mb-1">BETA PORTFOLIO</div>
                <div className="text-2xl font-black" style={{ color: betaPortfolio > 1.2 ? '#EF4444' : betaPortfolio < 0.8 ? '#10B981' : '#F59E0B' }}>
                  {betaPortfolio.toFixed(2)}
                </div>
                <div className="text-[10px] text-neutral-300 mt-1">
                  {betaPortfolio > 1.2 ? 'Alta volatilidade vs S&P' : betaPortfolio < 0.8 ? 'Defensivo' : 'Neutro'}
                </div>
              </div>

              {/* Diversificação */}
              <div className="border border-neutral-800 rounded p-4">
                <div className="text-[9px] text-neutral-300 mb-1">DIVERSIFICAÇÃO</div>
                <div className="text-2xl font-black text-white">{dadosSector.length}</div>
                <div className="text-[10px] text-neutral-300 mt-1">sectores distintos</div>
              </div>

              {/* Posição maior */}
              <div className="border border-neutral-800 rounded p-4">
                <div className="text-[9px] text-neutral-300 mb-1">MAIOR POSIÇÃO</div>
                {(() => {
                  const maior = dadosComputados[0]
                  if (!maior) return null
                  return (
                    <>
                      <div className="text-2xl font-black" style={{ color: corTema }}>{maior.ticker}</div>
                      <div className="text-[10px] text-neutral-300 mt-1">
                        {((maior.valorActual / totalValor) * 100).toFixed(1)}% do portfolio
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Tabela de betas */}
              <div className="col-span-3 border border-neutral-800 rounded">
                <div className="px-4 py-2 text-[9px] font-bold border-b border-neutral-800" style={{ color: corTema }}>
                  <BarChart2 size={10} className="inline mr-1" />
                  EXPOSIÇÃO BETA POR POSIÇÃO
                </div>
                <div className="p-4 space-y-2">
                  {dadosComputados.sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta)).map((p) => {
                    const exposicao = p.beta * (p.valorActual / totalValor)
                    const barW = Math.abs(p.beta / 2) * 100
                    return (
                      <div key={p.ticker} className="flex items-center gap-3 text-[10px]">
                        <span className="w-14 shrink-0 font-bold" style={{ color: corTema }}>{p.ticker}</span>
                        <div className="w-24 h-2 bg-neutral-900 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(barW, 100)}%`,
                              backgroundColor: p.beta > 1.5 ? '#EF4444' : p.beta < 0 ? '#3B82F6' : '#10B981',
                            }}
                          />
                        </div>
                        <span className="w-10 text-right" style={{ color: p.beta > 1.5 ? '#EF4444' : p.beta < 0 ? '#3B82F6' : '#9CA3AF' }}>
                          β {p.beta.toFixed(2)}
                        </span>
                        <span className="text-neutral-300">Contribuição: {(exposicao * 100).toFixed(2)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-neutral-800 shrink-0 text-[10px] text-neutral-300">
        <span>{dadosComputados.length} posições</span>
        <span>Beta portfolio: <span className="text-neutral-400">{betaPortfolio.toFixed(2)}</span></span>
        <span>P&L dia: <span style={{ color: totalPnlDia >= 0 ? '#10B981' : '#EF4444' }}>
          {totalPnlDia >= 0 ? '+' : ''}${Math.abs(totalPnlDia).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span></span>
        <div className="flex-1" />
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] hover:text-neutral-300 transition-colors"
          onClick={() => abrirTradeTicket('', '', 0)}
        >
          <ShoppingCart size={10} />
          <span>Nova Ordem</span>
        </button>
        <TrendingUp size={10} className="text-neutral-400" />
        <TrendingDown size={10} className="text-neutral-400" />
      </div>
    </div>
  )
}
