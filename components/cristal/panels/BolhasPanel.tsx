'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Gráfico de Bolhas (EQRV Avançado)
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Label, ZAxis
} from 'recharts'
import { useTerminalStore } from '@/store/terminal.store'
import { ACOES_SCREENER, type AccaoScreener } from '@/lib/mocks/screener'
import { ArrowUpDown, ArrowRightLeft, Maximize2 } from 'lucide-react'

const COR_SECTOR: Record<string, string> = {
  'Tecnologia': '#3B82F6',
  'Financeiro': '#10B981',
  'Saúde': '#8B5CF6',
  'Consumo': '#F59E0B',
  'Energia': '#EF4444',
  'Industrial': '#6B7280',
  'Automóvel': '#EC4899',
  'Entretenimento': '#14B8A6',
  'Luxo': '#F97316',
  'Utilities': '#84CC16',
}

type NumericKey = 'variacao1D' | 'variacao52s' | 'capitalMerc' | 'pe' | 'pb' | 'dividendo' | 'beta' | 'volumeMedio' | 'margem' | 'crescimentoReceita' | 'roe'

interface MetricaDef {
  id: NumericKey
  nome: string
  prefixo?: string
  sufixo?: string
  domain?: [number | string, number | string]
}

const OPCOES: MetricaDef[] = [
  { id: 'variacao52s', nome: 'Perf. 52 Semanas', sufixo: '%' },
  { id: 'variacao1D', nome: 'Perf. Hoje', sufixo: '%' },
  { id: 'crescimentoReceita', nome: 'Crescimento Receita', sufixo: '%' },
  { id: 'roe', nome: 'Return on Equity (ROE)', sufixo: '%' },
  { id: 'margem', nome: 'Margem Líquida', sufixo: '%' },
  { id: 'dividendo', nome: 'Dividend Yield', sufixo: '%' },
  { id: 'pe', nome: 'Rácio P/E', sufixo: 'x' },
  { id: 'pb', nome: 'Rácio P/B', sufixo: 'x' },
  { id: 'beta', nome: 'Volatilidade (Beta)' },
  { id: 'capitalMerc', nome: 'Cap. Mercado', prefixo: '$', sufixo: 'B' },
  { id: 'volumeMedio', nome: 'Volume Médio (k)' },
]

function formatarValor(val: number, metrica: MetricaDef) {
  if (val === undefined || isNaN(val)) return 'N/A'
  let fmt = val.toFixed(1)
  if (metrica.id === 'beta') fmt = val.toFixed(2)
  if (metrica.id === 'capitalMerc') {
    if (val >= 1000) return `$${(val / 1000).toFixed(2)}T`
    return `$${val.toFixed(0)}B`
  }
  if (metrica.id === 'volumeMedio') return `${(val / 1000).toFixed(0)}M`
  return `${metrica.prefixo || ''}${fmt}${metrica.sufixo || ''}`
}

export function BolhasPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [eixoX, setEixoX] = useState<NumericKey>('variacao52s')
  const [eixoY, setEixoY] = useState<NumericKey>('pe')
  const [eixoZ, setEixoZ] = useState<NumericKey>('capitalMerc')
  const [sectorFiltro, setSectorFiltro] = useState<string>('Todos')
  const [showChart, setShowChart] = useState(false)

  useEffect(() => {
    // Delay rendering the chart items to let the main UI paint first immediately
    const t = setTimeout(() => setShowChart(true), 50)
    return () => clearTimeout(t)
  }, [])

  const metricX = OPCOES.find((o) => o.id === eixoX)!
  const metricY = OPCOES.find((o) => o.id === eixoY)!
  const metricZ = OPCOES.find((o) => o.id === eixoZ)!

  const sectoresUnicos = useMemo(() => ['Todos', ...Array.from(new Set(ACOES_SCREENER.map(a => a.sector)))], [])

  // Process data for Recharts (extracting specifically the chosen X, Y, Z for scale)
  const dadosFormatados = useMemo(() => {
    let filtrado = ACOES_SCREENER
    if (sectorFiltro !== 'Todos') {
      filtrado = filtrado.filter(a => a.sector === sectorFiltro)
    }

    return filtrado.map((a) => ({
      ...a,
      _x: a[eixoX],
      _y: a[eixoY],
      _z: a[eixoZ]
    }))
  }, [eixoX, eixoY, eixoZ, sectorFiltro])

  // Calcula médias para desenhar a cruz de quadrantes
  const mediaX = dadosFormatados.length > 0 ? dadosFormatados.reduce((acc, obj) => acc + (obj._x as number), 0) / dadosFormatados.length : 0
  const mediaY = dadosFormatados.length > 0 ? dadosFormatados.reduce((acc, obj) => acc + (obj._y as number), 0) / dadosFormatados.length : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    const d = payload[0].payload
    const cor = COR_SECTOR[d.sector] ?? '#FFF'

    return (
      <div className="bg-[#080808] border border-neutral-700 rounded p-3 font-mono text-[10px] shadow-2xl z-50 min-w-[160px]">
        <div className="font-bold text-xs mb-1" style={{ color: cor }}>{d.ticker} <span className="text-neutral-400 font-normal ml-1">— {d.nome}</span></div>
        <div className="text-neutral-500 mb-2 border-b border-neutral-800 pb-1">{d.sector}</div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-neutral-400">{metricX.nome}:</span>
          <span className="text-right text-white font-bold">{formatarValor(d._x, metricX)}</span>

          <span className="text-neutral-400">{metricY.nome}:</span>
          <span className="text-right text-white font-bold">{formatarValor(d._y, metricY)}</span>

          <span className="text-neutral-400">{metricZ.nome}:</span>
          <span className="text-right text-white opacity-80">{formatarValor(d._z, metricZ)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">
      {/* ── Cabeçalho e Controlos Bloomberg Style ──────────────── */}
      <div className="flex flex-col border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/50">
          <div>
            <span className="text-xs font-bold" style={{ color: corTema }}>BUBBLE MAP</span>
            <span className="text-[10px] text-neutral-200 ml-2 uppercase">Análise Multi-Dimensional (EQRV)</span>
          </div>
          <div className="flex gap-2 items-center text-[10px]">
            <span className="text-neutral-400 mr-1">Tamanho da Bolha:</span>
            <select
              value={eixoZ} onChange={e => setEixoZ(e.target.value as NumericKey)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-white outline-none"
            >
              {OPCOES.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Eixos de Controlo */}
        <div className="flex gap-4 px-4 py-2 bg-[#050505]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={12} className="text-neutral-500" />
            <span className="text-[10px] text-neutral-400">Eixo X:</span>
            <select
              value={eixoX} onChange={e => setEixoX(e.target.value as NumericKey)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white outline-none w-40"
            >
              {OPCOES.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={12} className="text-neutral-500" />
            <span className="text-[10px] text-neutral-400">Eixo Y:</span>
            <select
              value={eixoY} onChange={e => setEixoY(e.target.value as NumericKey)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white outline-none w-40"
            >
              {OPCOES.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 border-l border-neutral-800 pl-4 ml-2">
            <span className="text-[10px] text-neutral-400">Filtro Sectorial:</span>
            <select
              value={sectorFiltro} onChange={e => setSectorFiltro(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white outline-none w-36 cursor-pointer"
            >
              {sectoresUnicos.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Área Gráfica Com Quadrantes ────────────────────────── */}
      <div className={`flex-1 min-h-0 relative p-4 bg-[#0A0C10] transition-opacity duration-700 ease-out ${showChart ? 'opacity-100' : 'opacity-0'}`}>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1F2937" />

            <XAxis
              type="number" dataKey="_x" name={metricX.nome}
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => formatarValor(v, metricX)}
              axisLine={{ stroke: '#374151', strokeWidth: 1.5 }}
              tickLine={false}
            >
              <Label value={metricX.nome} offset={-15} position="insideBottom" fill="#9CA3AF" fontSize={10} fontFamily="monospace" />
            </XAxis>

            <YAxis
              type="number" dataKey="_y" name={metricY.nome}
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => formatarValor(v, metricY)}
              axisLine={{ stroke: '#374151', strokeWidth: 1.5 }}
              tickLine={false}
            >
              <Label value={metricY.nome} angle={-90} offset={-20} position="insideLeft" fill="#9CA3AF" fontSize={10} fontFamily="monospace" />
            </YAxis>

            {/* Z-Axis determines the bubble size */}
            <ZAxis type="number" dataKey="_z" range={[20, 800]} />

            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

            {/* Linhas Medias Cruzadas (Crosshairs) - Wallstreet style */}
            <ReferenceLine x={mediaX} stroke="#6B7280" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={mediaY} stroke="#6B7280" strokeDasharray="3 3" strokeOpacity={0.6} />

            <Scatter
              data={showChart ? dadosFormatados : []}
              isAnimationActive={true}
              animationDuration={800}
              onClick={(d: AccaoScreener) => { definirTickerActivo(d.ticker); definirVista('candlestick') }}
            >
              {showChart && dadosFormatados.map((d) => {
                const cor = COR_SECTOR[d.sector] || '#3B82F6'
                return (
                  <Cell
                    key={d.ticker}
                    fill={cor}
                    stroke={cor}
                    strokeWidth={2}
                    fillOpacity={0.6}
                    style={{ cursor: 'pointer' }}
                  />
                )
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legenda Horizontal Compacta ────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-800 shrink-0 bg-[#000]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(COR_SECTOR).map(([sector, cor]) => {
            const isFaded = sectorFiltro !== 'Todos' && sectorFiltro !== sector
            return (
              <div key={sector} className="flex items-center gap-1.5 transition-opacity" style={{ opacity: isFaded ? 0.3 : 1 }}>
                <div className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: cor, boxShadow: `0 0 5px ${cor}88` }} />
                <span className="text-[9px] text-neutral-400 capitalize">{sector}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-2 text-[9px] text-neutral-500 uppercase">
          <Maximize2 size={10} /> Escala Z: {metricZ.nome}
        </div>
      </div>
    </div>
  )
}
