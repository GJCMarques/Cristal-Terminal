'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Gráfico de Bolhas de Mercado
// ============================================================
// X: Variação YTD (%)  |  Y: Capitalização Relativa (log)
// Tamanho bolha: Vol médio diário  |  Cor: Sector

import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Label,
} from 'recharts'
import { useTerminalStore } from '@/store/terminal.store'

interface PontoBolha {
  ticker: string
  nome: string
  sector: string
  x: number       // variação YTD %
  y: number       // log10(capMerc B$)
  z: number       // volume médio (tamanho bolha)
  preco: number
  variacao1D: number
}

const COR_SECTOR: Record<string, string> = {
  'Tecnologia':    '#3B82F6',
  'Financeiro':    '#10B981',
  'Saúde':         '#8B5CF6',
  'Consumo':       '#F59E0B',
  'Energia':       '#EF4444',
  'Industrial':    '#6B7280',
  'Automóvel':     '#EC4899',
  'Entretenimento':'#14B8A6',
  'Luxo':          '#F97316',
  'Utilities':     '#84CC16',
}

const DADOS_BOLHAS: PontoBolha[] = [
  { ticker:'NVDA', nome:'NVIDIA',           sector:'Tecnologia',    x:+52.8, y:3.45, z:192, preco:116.40, variacao1D:+3.21 },
  { ticker:'META', nome:'Meta Platforms',   sector:'Tecnologia',    x:+62.4, y:3.19, z:149, preco:610.20, variacao1D:+1.83 },
  { ticker:'NFLX', nome:'Netflix',          sector:'Entretenimento',x:+88.4, y:2.61, z:32,  preco:946.30, variacao1D:+4.12 },
  { ticker:'TSLA', nome:'Tesla',            sector:'Automóvel',     x:+84.2, y:3.05, z:987, preco:352.56, variacao1D:-2.14 },
  { ticker:'AAPL', nome:'Apple',            sector:'Tecnologia',    x:+28.4, y:3.49, z:584, preco:213.50, variacao1D:+1.24 },
  { ticker:'MSFT', nome:'Microsoft',        sector:'Tecnologia',    x:+14.2, y:3.47, z:221, preco:399.20, variacao1D:+0.87 },
  { ticker:'AMZN', nome:'Amazon',           sector:'Consumo',       x:+45.2, y:3.32, z:368, preco:198.90, variacao1D:+0.65 },
  { ticker:'GOOGL',nome:'Alphabet',         sector:'Tecnologia',    x:+38.7, y:3.33, z:241, preco:172.30, variacao1D:-0.42 },
  { ticker:'JPM',  nome:'JPMorgan',         sector:'Financeiro',    x:+42.1, y:2.91, z:98,  preco:278.40, variacao1D:+0.92 },
  { ticker:'V',    nome:'Visa',             sector:'Financeiro',    x:+22.6, y:2.79, z:59,  preco:296.80, variacao1D:+0.54 },
  { ticker:'NOVO', nome:'Novo Nordisk',     sector:'Saúde',         x:-24.2, y:2.64, z:124, preco:96.40,  variacao1D:+2.84 },
  { ticker:'JNJ',  nome:'J&J',             sector:'Saúde',         x:+2.4,  y:2.58, z:68,  preco:162.80, variacao1D:+0.12 },
  { ticker:'PG',   nome:'P&G',             sector:'Consumo',       x:+14.2, y:2.60, z:54,  preco:168.40, variacao1D:-0.24 },
  { ticker:'XOM',  nome:'Exxon',           sector:'Energia',       x:+8.4,  y:2.74, z:142, preco:128.40, variacao1D:-1.24 },
  { ticker:'DIS',  nome:'Disney',          sector:'Entretenimento',x:-8.4,  y:2.30, z:112, preco:108.40, variacao1D:-0.73 },
  { ticker:'ASML', nome:'ASML',            sector:'Tecnologia',    x:-14.2, y:2.58, z:12,  preco:962.10, variacao1D:+1.52 },
  { ticker:'SAP',  nome:'SAP SE',          sector:'Tecnologia',    x:+52.4, y:2.49, z:18,  preco:269.80, variacao1D:+0.84 },
  { ticker:'LVMH', nome:'LVMH',            sector:'Luxo',          x:-22.4, y:2.47, z:8.9, preco:596.30, variacao1D:-1.24 },
  { ticker:'BABA', nome:'Alibaba',         sector:'Tecnologia',    x:+24.2, y:2.33, z:248, preco:82.40,  variacao1D:+4.82 },
  { ticker:'CVX',  nome:'Chevron',         sector:'Energia',       x:-4.2,  y:2.44, z:84,  preco:152.40, variacao1D:-0.84 },
]

// Tooltip customizado
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipCustom({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: PontoBolha = payload[0].payload
  const cor = COR_SECTOR[d.sector] ?? '#ffffff'
  const sinal = d.variacao1D >= 0 ? '▲' : '▼'
  return (
    <div className="bg-[#0D0D0D] border border-neutral-700 rounded px-3 py-2 font-mono text-xs shadow-2xl">
      <div className="font-bold mb-1" style={{ color: cor }}>{d.ticker} — {d.nome}</div>
      <div className="text-neutral-400">{d.sector}</div>
      <div className="text-neutral-300 mt-1">Preço: <span className="text-white">${d.preco.toFixed(2)}</span></div>
      <div style={{ color: d.variacao1D >= 0 ? '#10B981' : '#EF4444' }}>Hoje: {sinal}{Math.abs(d.variacao1D).toFixed(2)}%</div>
      <div style={{ color: d.x >= 0 ? '#10B981' : '#EF4444' }}>YTD: {d.x >= 0 ? '+' : ''}{d.x.toFixed(1)}%</div>
      <div className="text-neutral-500 text-[10px] mt-1">Vol. médio: {d.z}k/dia</div>
    </div>
  )
}

type Periodo = '1D' | 'YTD' | '52S'

export function BolhasPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const [periodo, setPeriodo] = useState<Periodo>('YTD')
  const [sectorFiltro, setSectorFiltro] = useState<string>('Todos')
  const corTema = corParaTema(temaActual)

  const sectores = useMemo(() =>
    ['Todos', ...Array.from(new Set(DADOS_BOLHAS.map((d) => d.sector)))], [])

  const dados = useMemo(() => {
    const filtrado = sectorFiltro === 'Todos'
      ? DADOS_BOLHAS
      : DADOS_BOLHAS.filter((d) => d.sector === sectorFiltro)

    return filtrado.map((d) => ({
      ...d,
      x: periodo === '1D'  ? d.variacao1D
         : periodo === '52S' ? d.x * 1.4
         : d.x,
    }))
  }, [periodo, sectorFiltro])

  const labels: Record<Periodo, string> = {
    '1D':  'Variação Hoje (%)',
    'YTD': 'Variação YTD (%)',
    '52S': 'Variação 52S (%)',
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">
      {/* ── Cabeçalho ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div>
          <span className="text-xs font-bold" style={{ color: corTema }}>BUBBLE MAP</span>
          <span className="text-[10px] text-neutral-500 ml-2">Gráfico de Bolhas de Mercado</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro sector */}
          <select
            value={sectorFiltro}
            onChange={(e) => setSectorFiltro(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-neutral-400 outline-none"
          >
            {sectores.map((s) => <option key={s}>{s}</option>)}
          </select>
          {/* Selector de período */}
          {(['1D', 'YTD', '52S'] as Periodo[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className="text-[10px] px-2 py-0.5 rounded border transition-colors"
              style={{
                borderColor: periodo === p ? corTema : '#374151',
                color:       periodo === p ? corTema : '#6B7280',
                background:  periodo === p ? corTema + '15' : 'transparent',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legenda de sectores ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-1.5 border-b border-neutral-900 shrink-0">
        {Object.entries(COR_SECTOR).map(([s, cor]) => (
          <button
            key={s}
            type="button"
            onClick={() => setSectorFiltro(sectorFiltro === s ? 'Todos' : s)}
            className="flex items-center gap-1.5 text-[10px] transition-opacity"
            style={{ opacity: sectorFiltro !== 'Todos' && sectorFiltro !== s ? 0.3 : 1 }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cor }} />
            <span className="text-neutral-400">{s}</span>
          </button>
        ))}
      </div>

      {/* ── Gráfico ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 32, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              type="number"
              dataKey="x"
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            >
              <Label value={labels[periodo]} offset={-12} position="insideBottom" fill="#4B5563" fontSize={10} fontFamily="IBM Plex Mono" />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              domain={[2.0, 3.7]}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={(v: number) => {
                const cap = Math.pow(10, v)
                if (cap >= 1000) return `$${(cap/1000).toFixed(0)}T`
                return `$${cap.toFixed(0)}B`
              }}
            >
              <Label value="Cap. Mercado" angle={-90} offset={-24} position="insideLeft" fill="#4B5563" fontSize={10} fontFamily="IBM Plex Mono" />
            </YAxis>
            <Tooltip content={<TooltipCustom />} />
            <ReferenceLine x={0} stroke="#374151" strokeDasharray="4 4" />
            <Scatter
              data={dados}
              onClick={(d: PontoBolha) => {
                definirTickerActivo(d.ticker)
                definirVista('candlestick')
              }}
              cursor="pointer"
            >
              {dados.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={COR_SECTOR[d.sector] ?? '#ffffff'}
                  fillOpacity={0.75}
                  stroke={COR_SECTOR[d.sector] ?? '#ffffff'}
                  strokeOpacity={0.9}
                  strokeWidth={1}
                  r={Math.max(8, Math.min(32, Math.sqrt(d.z) * 2.4))}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tabela rápida ─────────────────────────────────────── */}
      <div className="border-t border-neutral-800 shrink-0 max-h-28 overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-[#080808]">
            <tr className="text-neutral-600 border-b border-neutral-900">
              <th className="text-left px-3 py-1">TICKER</th>
              <th className="text-right px-3">SETOR</th>
              <th className="text-right px-3">YTD</th>
              <th className="text-right px-3">HOJE</th>
            </tr>
          </thead>
          <tbody>
            {dados
              .sort((a, b) => b.x - a.x)
              .map((d) => (
                <tr
                  key={d.ticker}
                  onClick={() => { definirTickerActivo(d.ticker); definirVista('candlestick') }}
                  className="border-b border-neutral-900 cursor-pointer hover:bg-neutral-900 transition-colors"
                >
                  <td className="px-3 py-1" style={{ color: COR_SECTOR[d.sector] ?? '#fff' }}>{d.ticker}</td>
                  <td className="px-3 text-right text-neutral-500">{d.sector}</td>
                  <td className="px-3 text-right" style={{ color: d.x >= 0 ? '#10B981' : '#EF4444' }}>
                    {d.x >= 0 ? '+' : ''}{d.x.toFixed(1)}%
                  </td>
                  <td className="px-3 text-right" style={{ color: d.variacao1D >= 0 ? '#10B981' : '#EF4444' }}>
                    {d.variacao1D >= 0 ? '▲' : '▼'}{Math.abs(d.variacao1D).toFixed(2)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
