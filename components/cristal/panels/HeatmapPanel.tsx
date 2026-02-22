'use client'

import { useState } from 'react'
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts'
import { SECTORES_SP500, type Sector, type AccaoSector } from '@/lib/mocks/heatmap'
import { useTerminalStore } from '@/store/terminal.store'

type Periodo = '1D' | '1S' | '1M' | 'YTD'
type Nivel = 'sectores' | 'acoes'

// Variações simuladas por período
const MULT: Record<Periodo, number> = { '1D': 1, '1S': 4.2, '1M': 12.8, 'YTD': 32.1 }

function getCorHeatmap(v: number): string {
  if (v >= 3)   return '#065f46'
  if (v >= 1.5) return '#047857'
  if (v >= 0.5) return '#059669'
  if (v >= 0)   return '#10b981'
  if (v >= -0.5)return '#dc2626'
  if (v >= -1.5)return '#b91c1c'
  if (v >= -3)  return '#991b1b'
  return '#7f1d1d'
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
  if (width < 20 || height < 20) return null
  const cor = getCorHeatmap(variacao)
  const sinal = variacao >= 0 ? '+' : ''
  const mostrarTexto = width > 60 && height > 40

  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={3} fill={cor} stroke="#0A0A0A" strokeWidth={2} />
      {mostrarTexto && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={Math.min(14, width / 6)} fontWeight="bold" fontFamily="monospace">
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 8} textAnchor="middle" fill={variacao >= 0 ? '#86efac' : '#fca5a5'} fontSize={Math.min(11, width / 7)} fontFamily="monospace">
            {sinal}{variacao.toFixed(2)}%
          </text>
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
      <div className="text-neutral-500 mt-1">Cap: ${d.capMerc.toFixed(1)}T</div>
    </div>
  )
}

export function HeatmapPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const [periodo, setPeriodo] = useState<Periodo>('1D')
  const [nivel, setNivel] = useState<Nivel>('sectores')
  const [sectorActivo, setSectorActivo] = useState<string | null>(null)

  const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'
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
              className="font-mono text-[10px] text-neutral-500 hover:text-white mr-2">‹ Sectores</button>
          )}
          <span className="font-mono text-sm font-bold text-white">
            {nivel === 'sectores' ? 'MAPA DE CALOR — S&P 500' : `${sectorDetalhes?.nome.toUpperCase() ?? ''} — ACÇÕES`}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: corTema + '22', color: corTema }}>HEAT</span>
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

      {/* Legenda de cores */}
      <div className="flex items-center justify-center gap-1 py-2 border-t border-neutral-800 shrink-0">
        {[
          { cor: '#065f46', label: '>+3%' }, { cor: '#059669', label: '>+1%' }, { cor: '#10b981', label: '>0%' },
          { cor: '#dc2626', label: '<0%' }, { cor: '#991b1b', label: '<-1%' }, { cor: '#7f1d1d', label: '<-3%' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: l.cor }} />
            <span className="font-mono text-[9px] text-neutral-600">{l.label}</span>
          </div>
        ))}
        <span className="font-mono text-[9px] text-neutral-700 ml-3">· Clique num sector para detalhe</span>
      </div>
    </div>
  )
}
