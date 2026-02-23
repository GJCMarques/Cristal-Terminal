'use client'
import { corParaTema } from '@/lib/utils'

import { useState } from 'react'
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts'
import { SECTORES_SP500, type Sector, type AccaoSector } from '@/lib/mocks/heatmap'
import { useTerminalStore } from '@/store/terminal.store'

type Periodo = '1D' | '1S' | '1M' | 'YTD'
type Nivel = 'sectores' | 'acoes'

// Variações simuladas por período
const MULT: Record<Periodo, number> = { '1D': 1, '1S': 4.2, '1M': 12.8, 'YTD': 32.1 }

function getCorHeatmap(v: number): string {
  if (v >= 3) return '#00FF00' // Bright Green
  if (v >= 1.5) return '#00C000' // Mid Green
  if (v >= 0.5) return '#008000' // Dark Green
  if (v >= 0) return '#004000' // Very Dark Green
  if (v >= -0.5) return '#400000' // Very Dark Red
  if (v >= -1.5) return '#800000' // Dark Red
  if (v >= -3) return '#C00000' // Mid Red
  return '#FF0000'               // Bright Red
}

interface TreemapContentProps {
  root?: unknown
  depth?: number
  x?: number; y?: number; width?: number; height?: number
  name?: string
  value?: number
  variacao?: number
}

function CustomContent(props: TreemapContentProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', variacao = 0, depth = 0 } = props
  if (width < 25 || height < 25) return null
  const cor = getCorHeatmap(variacao)
  const sinal = variacao > 0 ? '+' : ''
  const isSector = name.length > 5 // Tickers are usually short

  // Dynamic font sizing
  const fontSizeTicker = Math.min(16, width / 4, height / 3)
  const fontSizeVar = Math.max(8, fontSizeTicker * 0.75)

  const showText = width > 45 && height > 35
  const showFullDetails = width > 70 && height > 55

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={cor} stroke="#000000" strokeWidth={2}
        style={{ cursor: 'pointer', transition: 'fill 0.2s', filter: 'brightness(0.95)' }}
      />
      {/* 3D Inner Bevel Highlight effect */}
      <rect x={x + 2} y={y + 2} width={width - 4} height={height - 4} fill="none" stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1} pointerEvents="none" />

      {showText && (
        <>
          <text
            x={x + width / 2} y={y + height / 2 - (showFullDetails ? 4 : -2)}
            textAnchor="middle" fill="#FFFFFF"
            fontSize={fontSizeTicker} fontWeight="bold" fontFamily="monospace"
            pointerEvents="none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {name.length > Math.floor(width / (fontSizeTicker * 0.65)) ? name.substring(0, Math.floor(width / (fontSizeTicker * 0.65)) - 1) + '…' : name}
          </text>

          {showFullDetails && (
            <text
              x={x + width / 2} y={y + height / 2 + fontSizeVar + 2}
              textAnchor="middle" fill="#FFFFFF"
              fontSize={fontSizeVar} fontWeight="bold" fontFamily="monospace"
              pointerEvents="none"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {sinal}{variacao.toFixed(2)}%
            </text>
          )}
        </>
      )}
    </g>
  )
}

function TooltipHeatmap({ active, payload }: { active?: boolean; payload?: { payload: { name: string; variacao: number; capMerc: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const cor = getCorHeatmap(d.variacao)
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded p-3 font-mono text-xs shadow-xl min-w-[140px]">
      <div className="font-bold text-white mb-1">{d.name}</div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded" style={{ backgroundColor: cor }} />
        <span style={{ color: d.variacao >= 0 ? '#10B981' : '#EF4444' }}>
          {d.variacao >= 0 ? '+' : ''}{d.variacao.toFixed(2)}%
        </span>
      </div>
      <div className="text-neutral-200 mt-1">Cap: ${d.capMerc.toFixed(1)}T</div>
    </div>
  )
}

export function HeatmapPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const [periodo, setPeriodo] = useState<Periodo>('1D')
  const [nivel, setNivel] = useState<Nivel>('sectores')
  const [sectorActivo, setSectorActivo] = useState<string | null>(null)

  const corTema = corParaTema(temaActual)
  const mult = MULT[periodo]

  // Dados para o treemap
  const dadosSectores = SECTORES_SP500.map((s) => ({
    name: s.nome,
    size: s.peso,
    capMerc: s.capMerc,
    variacao: s.variacao * mult,
    id: s.id,
  }))

  const sectorDetalhes = SECTORES_SP500.find((s) => s.id === sectorActivo)
  const dadosAcoes = sectorDetalhes?.acoes.map((a) => ({
    name: a.ticker,
    size: a.capMerc,
    capMerc: a.capMerc / 1000,
    variacao: a.variacao * mult,
  })) ?? []

  const handleClickSector = (data: { id?: string; name?: string }) => {
    if (nivel === 'sectores' && data.id) {
      setSectorActivo(data.id)
      setNivel('acoes')
    }
  }

  const handleClickAcao = (data: { name?: string }) => {
    if (data.name) {
      definirTickerActivo(data.name)
      definirVista('candlestick')
    }
  }

  const dadosActuais = nivel === 'sectores' ? dadosSectores : dadosAcoes

  // Legenda de variação
  const ganhos = dadosSectores.filter((d) => d.variacao >= 0).length
  const perdas = dadosSectores.length - ganhos

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          {nivel === 'acoes' && sectorDetalhes && (
            <button type="button" onClick={() => { setNivel('sectores'); setSectorActivo(null) }}
              className="font-mono text-[10px] text-neutral-200 hover:text-white mr-2">‹ Voltar</button>
          )}
          <div>
            <span className="text-xs font-bold" style={{ color: corTema }}>HEAT MAP</span>
            <span className="text-[10px] text-neutral-200 ml-2 uppercase">
              {nivel === 'sectores' ? 'MAPA DE CALOR DO MERCADO' : `${sectorDetalhes?.nome} — ACÇÕES`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Resumo */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-green-400">{ganhos} ▲</span>
            <span className="text-red-400">{perdas} ▼</span>
          </div>
          {/* Período */}
          <div className="flex items-center gap-1">
            {(['1D', '1S', '1M', 'YTD'] as Periodo[]).map((p) => (
              <button key={p} type="button" onClick={() => setPeriodo(p)}
                className="font-mono text-[10px] px-2 py-0.5 rounded transition-colors"
                style={{ backgroundColor: periodo === p ? corTema + '33' : 'transparent', color: periodo === p ? corTema : '#6B7280' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Treemap */}
      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={dadosActuais}
            dataKey="size"
            content={<CustomContent />}
            onClick={nivel === 'sectores' ? handleClickSector : handleClickAcao}
          >
            <Tooltip content={<TooltipHeatmap />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Legenda de cores ao estilo Bloomberg */}
      <div className="flex items-center justify-between px-4 py-2 bg-black border-t border-neutral-800 shrink-0 shadow-inner">
        <div className="flex items-center gap-0">
          {[
            { cor: '#FF0000', label: '<-3%' },
            { cor: '#C00000', label: '' },
            { cor: '#800000', label: '' },
            { cor: '#400000', label: '' },
            { cor: '#004000', label: '0%' },
            { cor: '#008000', label: '' },
            { cor: '#00C000', label: '' },
            { cor: '#00FF00', label: '>+3%' },
          ].map((l, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-6 h-4 border-r border-black" style={{ backgroundColor: l.cor }} />
              <span className="font-mono text-[8px] text-neutral-400 mt-1 h-3">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[9px] text-neutral-500 uppercase flex gap-4">
          <span>{nivel === 'sectores' ? 'Clica num sector para detalhe ▲' : 'Clica numa acção para abrir gráfico MKT ▲'}</span>
          <span>SPX 500 COMPONENTES</span>
        </div>
      </div>
    </div>
  )
}
