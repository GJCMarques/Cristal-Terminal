'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Monitor de Mercado Global (MKTM)
// ============================================================

import { useTerminalStore } from '@/store/terminal.store'
import type { VistaTerminal } from '@/types/terminal'
import { TrendingUp, TrendingDown } from 'lucide-react'

// Dados de mercado simulados (em produção viriam do hook useMarketDataQuery)
const GRUPOS_MERCADO = [
  {
    regiao: 'EUROPA',
    cor: '#3B82F6',
    items: [
      { ticker: 'PSI20', nome: 'PSI 20', valor: 6832.14, variacao: +0.12, ytd: +3.42, volume: 182_000_000 },
      { ticker: 'IBEX', nome: 'IBEX 35', valor: 12_942.3, variacao: +0.54, ytd: +6.81, volume: 2_100_000_000 },
      { ticker: 'DAX', nome: 'DAX 40', valor: 22_412.3, variacao: +0.31, ytd: +9.12, volume: 4_800_000_000 },
      { ticker: 'CAC', nome: 'CAC 40', valor: 8_128.7, variacao: -0.18, ytd: +4.23, volume: 3_200_000_000 },
      { ticker: 'FTSE', nome: 'FTSE 100', valor: 8_742.5, variacao: +0.22, ytd: +5.67, volume: 5_100_000_000 },
      { ticker: 'MIB', nome: 'FTSE MIB', valor: 37_842.1, variacao: +0.89, ytd: +8.34, volume: 1_900_000_000 },
    ],
  },
  {
    regiao: 'AMÉRICAS',
    cor: '#10B981',
    items: [
      { ticker: 'SPX', nome: 'S&P 500', valor: 6118.71, variacao: -0.08, ytd: +2.41, volume: 12_800_000_000 },
      { ticker: 'NDX', nome: 'Nasdaq 100', valor: 21_956.4, variacao: +0.14, ytd: +3.82, volume: 8_400_000_000 },
      { ticker: 'DJIA', nome: 'Dow Jones', valor: 43_840.2, variacao: -0.21, ytd: +1.94, volume: 6_200_000_000 },
      { ticker: 'VIX', nome: 'VIX', valor: 18.42, variacao: -3.21, ytd: -12.40, volume: 0 },
      { ticker: 'IBOV', nome: 'Ibovespa', valor: 127_832.4, variacao: +0.67, ytd: +4.12, volume: 18_200_000_000 },
    ],
  },
  {
    regiao: 'ÁSIA-PACÍFICO',
    cor: '#F59E0B',
    items: [
      { ticker: 'NKY', nome: 'Nikkei 225', valor: 38_412.8, variacao: -0.34, ytd: -2.18, volume: 3_100_000_000 },
      { ticker: 'HSI', nome: 'Hang Seng', valor: 22_184.3, variacao: +0.82, ytd: +12.41, volume: 7_200_000_000 },
      { ticker: 'CSI', nome: 'CSI 300', valor: 4_021.7, variacao: +1.12, ytd: +8.93, volume: 42_100_000_000 },
      { ticker: 'KOSPI', nome: 'KOSPI', valor: 2_642.1, variacao: -0.12, ytd: -1.24, volume: 4_800_000_000 },
    ],
  },
  {
    regiao: 'FX / MOEDA',
    cor: '#8B5CF6',
    items: [
      { ticker: 'EURUSD', nome: 'EUR/USD', valor: 1.0823, variacao: -0.05, ytd: +0.82, volume: 0 },
      { ticker: 'GBPUSD', nome: 'GBP/USD', valor: 1.2641, variacao: +0.03, ytd: +1.24, volume: 0 },
      { ticker: 'USDJPY', nome: 'USD/JPY', valor: 149.82, variacao: -0.12, ytd: -3.42, volume: 0 },
      { ticker: 'USDCHF', nome: 'USD/CHF', valor: 0.8941, variacao: +0.08, ytd: +0.34, volume: 0 },
    ],
  },
  {
    regiao: 'COMMODITIES',
    cor: '#EF4444',
    items: [
      { ticker: 'XAU', nome: 'Ouro (USD/oz)', valor: 2932.50, variacao: +0.42, ytd: +10.82, volume: 0 },
      { ticker: 'XAG', nome: 'Prata (USD/oz)', valor: 32.41, variacao: -0.21, ytd: +6.34, volume: 0 },
      { ticker: 'CL1', nome: 'WTI ($/bbl)', valor: 70.85, variacao: -1.82, ytd: -8.42, volume: 0 },
      { ticker: 'CO1', nome: 'Brent ($/bbl)', valor: 74.20, variacao: -1.64, ytd: -7.81, volume: 0 },
    ],
  },
]

interface ItemMercadoRow {
  ticker: string
  nome: string
  valor: number
  variacao: number
  ytd: number
  volume: number
}

function Sparkline({ variacao }: { variacao: number }) {
  // Mini sparkline simulada
  const pontos = Array.from({ length: 8 }, (_, i) => {
    const ruido = (Math.random() - 0.5) * 0.3
    const tendencia = variacao > 0 ? i * 0.1 : -i * 0.1
    return 0.5 + tendencia + ruido
  })
  const h = 20
  const w = 48
  const min = Math.min(...pontos)
  const max = Math.max(...pontos)
  const normalizar = (v: number) =>
    h - ((v - min) / (max - min || 1)) * h

  const pts = pontos
    .map((v, i) => `${(i / (pontos.length - 1)) * w},${normalizar(v)}`)
    .join(' ')

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={variacao >= 0 ? '#10B981' : '#EF4444'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MercadoRow({
  item,
  onSeleccionar,
}: {
  item: ItemMercadoRow
  onSeleccionar: (ticker: string) => void
}) {
  const cor = item.variacao >= 0 ? '#10B981' : '#EF4444'

  return (
    <button
      type="button"
      onClick={() => onSeleccionar(item.ticker)}
      className="w-full grid grid-cols-[2fr_2fr_1fr_1fr_1fr_48px] gap-2 items-center px-4 py-1.5 text-right hover:bg-neutral-900 transition-colors border-b border-neutral-900 font-mono text-xs"
    >
      <span className="text-left text-white font-bold">{item.ticker}</span>
      <span className="text-left text-neutral-400">{item.nome}</span>
      <span className="text-white">
        {item.valor.toLocaleString('pt-PT', {
          minimumFractionDigits: 2,
          maximumFractionDigits: item.valor < 10 ? 4 : 2,
        })}
      </span>
      <span className="flex items-center justify-end gap-0.5" style={{ color: cor }}>
        {item.variacao >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {Math.abs(item.variacao).toFixed(2)}%
      </span>
      <span
        style={{
          color: item.ytd >= 0 ? '#10B981' : '#EF4444',
        }}
      >
        {item.ytd >= 0 ? '+' : ''}{item.ytd.toFixed(2)}%
      </span>
      <div className="flex justify-end">
        <Sparkline variacao={item.variacao} />
      </div>
    </button>
  )
}

export function MarketOverviewPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()

  const handleSeleccionar = (ticker: string) => {
    definirTickerActivo(ticker)
    definirVista('candlestick')
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-y-auto">
      {/* Cabeçalho das colunas (mobile only - para desktop está dentro da grid) */}
      <div className="md:hidden sticky top-0 z-10 grid grid-cols-[2fr_2fr_1fr_1fr_1fr_48px] gap-2 items-center px-4 py-2 text-right bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-600">
        <span className="text-left">TICKER</span>
        <span className="text-left">NOME</span>
        <span>ÚLTIMO</span>
        <span>VAR%</span>
        <span>YTD</span>
        <span className="text-right">SPARK</span>
      </div>

      {/* Grid 2x2 para os grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-px bg-neutral-800">
        {GRUPOS_MERCADO.map((grupo) => (
          <div key={grupo.regiao} className="bg-[#0A0A0A] h-full flex flex-col pb-4 md:pb-0">
            <div
              className="px-4 py-1.5 font-mono text-[10px] font-bold border-b border-neutral-800 sticky top-0 md:static z-10"
              style={{ color: grupo.cor, backgroundColor: grupo.cor + '11' }}
            >
              {grupo.regiao}
            </div>

            {/* Cabeçalho por painel no desktop */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_48px] gap-2 items-center px-4 py-1.5 text-right bg-neutral-950/50 border-b border-neutral-800/50 font-mono text-[9px] text-neutral-600">
              <span className="text-left">TICKER</span>
              <span className="text-left">NOME</span>
              <span>ÚLTIMO</span>
              <span>VAR%</span>
              <span>YTD</span>
              <span className="text-right">SPARK</span>
            </div>

            <div className="flex-1">
              {grupo.items.map((item) => (
                <MercadoRow
                  key={item.ticker}
                  item={item}
                  onSeleccionar={handleSeleccionar}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
