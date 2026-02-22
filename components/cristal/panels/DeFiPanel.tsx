'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — DeFi / On-Chain Tracker
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Network, TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'

// ── Tipos ─────────────────────────────────────────────────────

interface ProtocoloDefi {
  id: string
  name: string
  tvl: number
  change1d: number
  change7d: number
  chain: string
  category: string
  symbol: string
}

interface GasPreco {
  lento: number
  normal: number
  rapido: number
}

interface DexVolume {
  name: string
  volume24h: number
  change24h: number
  chain: string
}

// ── Mock data (fallback) ───────────────────────────────────────

const MOCK_PROTOCOLOS: ProtocoloDefi[] = [
  { id: 'aave',       name: 'Aave',        tvl: 21800000000,  change1d: +1.24,  change7d: +5.2,  chain: 'Ethereum', category: 'Lending',    symbol: 'AAVE' },
  { id: 'lido',       name: 'Lido',        tvl: 35600000000,  change1d: +0.82,  change7d: +3.8,  chain: 'Ethereum', category: 'Liquid Stk', symbol: 'LDO' },
  { id: 'uniswap',    name: 'Uniswap',     tvl: 6200000000,   change1d: -0.45,  change7d: -1.2,  chain: 'Ethereum', category: 'DEX',        symbol: 'UNI' },
  { id: 'makerdao',   name: 'MakerDAO',    tvl: 8900000000,   change1d: +0.31,  change7d: +2.1,  chain: 'Ethereum', category: 'CDP',        symbol: 'MKR' },
  { id: 'compound',   name: 'Compound',    tvl: 3100000000,   change1d: -1.20,  change7d: -4.5,  chain: 'Ethereum', category: 'Lending',    symbol: 'COMP' },
  { id: 'curve',      name: 'Curve',       tvl: 4500000000,   change1d: +0.55,  change7d: +1.8,  chain: 'Ethereum', category: 'DEX',        symbol: 'CRV' },
  { id: 'pancakeswap',name: 'PancakeSwap', tvl: 2800000000,   change1d: +2.10,  change7d: +8.5,  chain: 'BSC',      category: 'DEX',        symbol: 'CAKE' },
  { id: 'jito',       name: 'Jito',        tvl: 4200000000,   change1d: +3.40,  change7d: +12.1, chain: 'Solana',   category: 'Liquid Stk', symbol: 'JTO' },
  { id: 'jupiter',    name: 'Jupiter',     tvl: 1900000000,   change1d: +1.80,  change7d: +6.3,  chain: 'Solana',   category: 'DEX Aggr',   symbol: 'JUP' },
  { id: 'morpho',     name: 'Morpho',      tvl: 5800000000,   change1d: +0.90,  change7d: +4.2,  chain: 'Ethereum', category: 'Lending',    symbol: 'MORPHO' },
  { id: 'eigen',      name: 'EigenLayer',  tvl: 12600000000,  change1d: +1.60,  change7d: +7.8,  chain: 'Ethereum', category: 'Restaking',  symbol: 'EIGEN' },
  { id: 'pendle',     name: 'Pendle',      tvl: 3400000000,   change1d: -0.80,  change7d: -2.3,  chain: 'Ethereum', category: 'Yield',      symbol: 'PENDLE' },
  { id: 'gmx',        name: 'GMX',         tvl: 850000000,    change1d: +1.20,  change7d: +4.0,  chain: 'Arbitrum', category: 'Perps',      symbol: 'GMX' },
  { id: 'dydx',       name: 'dYdX',        tvl: 520000000,    change1d: -1.50,  change7d: -3.8,  chain: 'Cosmos',   category: 'Perps',      symbol: 'DYDX' },
  { id: 'rocketpool', name: 'Rocket Pool', tvl: 3100000000,   change1d: +0.45,  change7d: +1.5,  chain: 'Ethereum', category: 'Liquid Stk', symbol: 'RPL' },
]

const MOCK_DEX_VOLUMES: DexVolume[] = [
  { name: 'Uniswap V3',    volume24h: 1800000000, change24h: +12.4, chain: 'Ethereum' },
  { name: 'PancakeSwap',   volume24h: 980000000,  change24h: +8.2,  chain: 'BSC' },
  { name: 'Jupiter',       volume24h: 1200000000, change24h: +21.8, chain: 'Solana' },
  { name: 'Curve',         volume24h: 420000000,  change24h: -5.3,  chain: 'Ethereum' },
  { name: 'dYdX',          volume24h: 680000000,  change24h: +3.1,  chain: 'Cosmos' },
  { name: 'GMX',           volume24h: 340000000,  change24h: +7.9,  chain: 'Arbitrum' },
]

const MOCK_GAS: GasPreco = { lento: 12, normal: 18, rapido: 28 }

// ── Formatação ─────────────────────────────────────────────────

function fmtTvl(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

const COR_CHAIN: Record<string, string> = {
  'Ethereum': '#627EEA',
  'BSC':      '#F3BA2F',
  'Solana':   '#9945FF',
  'Arbitrum': '#28A0F0',
  'Cosmos':   '#2E3148',
  'Polygon':  '#8247E5',
}

export function DeFiPanel() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [protocolos,  setProtocolos]  = useState<ProtocoloDefi[]>(MOCK_PROTOCOLOS)
  const [dexVolumes,  setDexVolumes]  = useState<DexVolume[]>(MOCK_DEX_VOLUMES)
  const [gas,         setGas]         = useState<GasPreco>(MOCK_GAS)
  const [aba,         setAba]         = useState<'tvl' | 'dex' | 'gas'>('tvl')
  const [filtroChain, setFiltroChain] = useState<string>('ALL')
  const [carregando,  setCarregando]  = useState(false)
  const [fonte,       setFonte]       = useState<'live' | 'mock'>('mock')

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    try {
      const [tvlRes, dexRes] = await Promise.all([
        fetch('https://api.llama.fi/protocols', { signal: AbortSignal.timeout(8000) }),
        fetch('https://api.llama.fi/overview/dexs?excludeTotalDataChartBreakdown=true&excludeTotalDataChart=true', { signal: AbortSignal.timeout(8000) }),
      ])

      if (tvlRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = await tvlRes.json()
        const top = data
          .filter((p: { tvl: number }) => p.tvl > 1e6)
          .sort((a: { tvl: number }, b: { tvl: number }) => b.tvl - a.tvl)
          .slice(0, 15)
          .map((p: { slug: string; name: string; tvl: number; change_1d: number; change_7d: number; chain: string; category: string; symbol: string }) => ({
            id:       p.slug,
            name:     p.name,
            tvl:      p.tvl,
            change1d: p.change_1d ?? 0,
            change7d: p.change_7d ?? 0,
            chain:    p.chain ?? 'Multi',
            category: p.category ?? '—',
            symbol:   p.symbol ?? '—',
          }))
        setProtocolos(top)
        setFonte('live')
      }

      if (dexRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await dexRes.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const protocols: any[] = data.protocols ?? []
        const top = protocols
          .sort((a: { totalVolume24h: number }, b: { totalVolume24h: number }) => b.totalVolume24h - a.totalVolume24h)
          .slice(0, 6)
          .map((p: { name: string; totalVolume24h: number; change_1d: number; chain: string }) => ({
            name:      p.name,
            volume24h: p.totalVolume24h ?? 0,
            change24h: p.change_1d ?? 0,
            chain:     p.chain ?? 'Multi',
          }))
        if (top.length > 0) setDexVolumes(top)
      }
    } catch {
      // fallback já está definido com mock
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  const chains = ['ALL', ...Array.from(new Set(protocolos.map((p) => p.chain)))]
  const protocolosFiltrados = filtroChain === 'ALL'
    ? protocolos
    : protocolos.filter((p) => p.chain === filtroChain)

  const tvlTotal = protocolos.reduce((s, p) => s + p.tvl, 0)
  const tvlDia   = protocolosFiltrados.reduce((s, p) => s + (p.change1d / 100) * p.tvl, 0)

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">

      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Network size={14} style={{ color: corTema }} />
          <span className="text-xs font-bold" style={{ color: corTema }}>DEFI — ON-CHAIN TRACKER</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: fonte === 'live' ? '#10B98122' : '#37414122', color: fonte === 'live' ? '#10B981' : '#6B7280' }}
          >
            {fonte === 'live' ? '🟢 LIVE DefiLlama' : '📦 Mock'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={carregarDados}
            className="text-neutral-600 hover:text-neutral-400 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={12} className={carregando ? 'animate-spin' : ''} />
          </button>
          {(['tvl', 'dex', 'gas'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              className="text-[10px] px-2.5 py-1 rounded border transition-colors"
              style={{
                borderColor: aba === a ? corTema : '#374151',
                color:       aba === a ? corTema : '#6B7280',
                background:  aba === a ? corTema + '18' : 'transparent',
              }}
            >
              {a === 'tvl' ? 'TVL TOP' : a === 'dex' ? 'DEX VOL' : 'GAS'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards de resumo ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-0 border-b border-neutral-800 shrink-0">
        {[
          {
            label: 'TVL TOTAL',
            val: fmtTvl(tvlTotal),
            cor: 'text-white',
          },
          {
            label: 'VARIAÇÃO DIA',
            val: `${tvlDia >= 0 ? '+' : ''}${fmtTvl(tvlDia)}`,
            cor: tvlDia >= 0 ? 'text-emerald-400' : 'text-red-400',
          },
          {
            label: 'PROTOCOLOS',
            val: `${protocolos.length}`,
            cor: 'text-white',
          },
          {
            label: 'GAS ETH (NORMAL)',
            val: `${gas.normal} gwei`,
            cor: gas.normal > 40 ? 'text-red-400' : gas.normal > 20 ? 'text-amber-400' : 'text-emerald-400',
          },
        ].map(({ label, val, cor }) => (
          <div key={label} className="flex flex-col items-center justify-center py-2 border-r border-neutral-900 last:border-r-0">
            <span className="text-[9px] text-neutral-600">{label}</span>
            <span className={`text-sm font-bold mt-0.5 ${cor}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* ── Conteúdo ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {aba === 'tvl' && (
          <div className="h-full flex flex-col">
            {/* Filtro chain */}
            <div className="flex gap-1 px-4 py-2 border-b border-neutral-900 shrink-0 overflow-x-auto">
              {chains.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFiltroChain(c)}
                  className="text-[9px] px-2 py-0.5 rounded border whitespace-nowrap transition-colors"
                  style={{
                    borderColor: filtroChain === c ? (COR_CHAIN[c] ?? corTema) : '#374151',
                    color:       filtroChain === c ? (COR_CHAIN[c] ?? corTema) : '#6B7280',
                    background:  filtroChain === c ? (COR_CHAIN[c] ?? corTema) + '22' : 'transparent',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Tabela TVL */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead className="sticky top-0 bg-[#0A0A0A] z-10">
                  <tr className="border-b border-neutral-800">
                    <th className="text-left px-3 py-2 text-neutral-600 font-normal w-8">#</th>
                    <th className="text-left px-3 py-2 text-neutral-600 font-normal">PROTOCOLO</th>
                    <th className="text-right px-3 py-2 text-neutral-600 font-normal">TVL</th>
                    <th className="text-right px-3 py-2 text-neutral-600 font-normal">1D%</th>
                    <th className="text-right px-3 py-2 text-neutral-600 font-normal">7D%</th>
                    <th className="text-right px-3 py-2 text-neutral-600 font-normal">CHAIN</th>
                    <th className="text-right px-3 py-2 text-neutral-600 font-normal">CATEGORIA</th>
                  </tr>
                </thead>
                <tbody>
                  {protocolosFiltrados.map((p, i) => (
                    <tr key={p.id} className="border-b border-neutral-900 hover:bg-neutral-900 transition-colors">
                      <td className="px-3 py-1.5 text-neutral-700">{i + 1}</td>
                      <td className="px-3 py-1.5">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[9px] text-neutral-600">{p.symbol}</div>
                      </td>
                      <td className="px-3 py-1.5 text-right text-white font-bold">{fmtTvl(p.tvl)}</td>
                      <td className="px-3 py-1.5 text-right" style={{ color: p.change1d >= 0 ? '#10B981' : '#EF4444' }}>
                        {p.change1d >= 0 ? '+' : ''}{p.change1d.toFixed(2)}%
                      </td>
                      <td className="px-3 py-1.5 text-right" style={{ color: p.change7d >= 0 ? '#10B981' : '#EF4444' }}>
                        {p.change7d >= 0 ? '+' : ''}{p.change7d.toFixed(1)}%
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: (COR_CHAIN[p.chain] ?? '#6B7280') + '22', color: COR_CHAIN[p.chain] ?? '#6B7280' }}
                        >
                          {p.chain}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-[9px] text-neutral-600">{p.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aba === 'dex' && (
          <div className="p-4 overflow-auto h-full">
            <div className="text-[9px] text-neutral-600 mb-3">VOLUME 24H — DEX AGGREGADO</div>
            {dexVolumes.map((d, i) => {
              const maxVol = Math.max(...dexVolumes.map((x) => x.volume24h))
              const pct = (d.volume24h / maxVol) * 100
              return (
                <div key={i} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: (COR_CHAIN[d.chain] ?? '#6B7280') + '22', color: COR_CHAIN[d.chain] ?? '#6B7280' }}
                      >
                        {d.chain}
                      </span>
                      <span className="text-[11px] text-white font-bold">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px]" style={{ color: d.change24h >= 0 ? '#10B981' : '#EF4444' }}>
                        {d.change24h >= 0 ? <TrendingUp size={10} className="inline mr-0.5" /> : <TrendingDown size={10} className="inline mr-0.5" />}
                        {d.change24h >= 0 ? '+' : ''}{d.change24h.toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-white font-bold">{fmtTvl(d.volume24h)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: COR_CHAIN[d.chain] ?? corTema }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {aba === 'gas' && (
          <div className="p-6 flex flex-col gap-6 items-center justify-center h-full">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={14} style={{ color: corTema }} />
              <span className="text-sm font-bold" style={{ color: corTema }}>GAS TRACKER — ETHEREUM</span>
            </div>
            <div className="grid grid-cols-3 gap-8 w-full max-w-xl">
              {[
                { label: 'LENTO',   val: gas.lento,  cor: '#10B981', eta: '~5 min' },
                { label: 'NORMAL',  val: gas.normal, cor: '#F59E0B', eta: '~1 min' },
                { label: 'RÁPIDO',  val: gas.rapido, cor: '#EF4444', eta: '<30 seg' },
              ].map((g) => (
                <div key={g.label} className="flex flex-col items-center border border-neutral-800 rounded-lg p-6">
                  <div className="text-[9px] text-neutral-600 mb-2">{g.label}</div>
                  <div className="text-4xl font-black mb-1" style={{ color: g.cor }}>
                    {g.val}
                  </div>
                  <div className="text-[10px] text-neutral-600">gwei</div>
                  <div className="text-[9px] text-neutral-700 mt-2">{g.eta}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-neutral-700">
              Gas simulado — em produção via Etherscan API
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
