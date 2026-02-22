'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Mapa Mundial Económico
// Choropleth interactivo via react-simple-maps
// ============================================================

import { useState, useCallback, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { useTerminalStore } from '@/store/terminal.store'
import {
  DADOS_MUNDIAIS, getCorChoropleth, getLegendaMetrica,
  type MetricaMapa, type DadosPais,
} from '@/lib/mocks/world-data'

// Fonte de dados GeoJSON (world-atlas via CDN, projecto Natural Earth 110m)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const METRICAS: { id: MetricaMapa; label: string; unidade: string; icone: string }[] = [
  { id: 'pib',        label: 'PIB per Capita',    unidade: 'k$',  icone: '💰' },
  { id: 'inflacao',   label: 'Inflação',           unidade: '%',   icone: '📈' },
  { id: 'desemprego', label: 'Desemprego',         unidade: '%',   icone: '👷' },
  { id: 'divida',     label: 'Dívida/PIB',         unidade: '%',   icone: '🏛' },
  { id: 'mercado',    label: 'Mercado YTD',        unidade: '%',   icone: '📊' },
]

// Mapeamento ISO 3166-1 alpha-3 para dados
const DADOS_MAP: Record<string, DadosPais> = Object.fromEntries(
  DADOS_MUNDIAIS.map((d) => [d.iso3, d])
)

function getValorMetrica(d: DadosPais, m: MetricaMapa): number {
  switch (m) {
    case 'pib':        return d.pib
    case 'inflacao':   return d.inflacao
    case 'desemprego': return d.desemprego
    case 'divida':     return d.dividaPublica
    case 'mercado':    return d.mercado
  }
}

function formatarValor(v: number, m: MetricaMapa): string {
  switch (m) {
    case 'pib':        return `$${v.toFixed(1)}k`
    case 'inflacao':   return `${v.toFixed(1)}%`
    case 'desemprego': return `${v.toFixed(1)}%`
    case 'divida':     return `${v.toFixed(1)}%`
    case 'mercado':    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
  }
}

interface TooltipInfo { x: number; y: number; pais: DadosPais }

const PainelInfo = memo(function PainelInfo({
  pais,
  metrica,
  corTema,
  onVerAnalise,
}: {
  pais: DadosPais
  metrica: MetricaMapa
  corTema: string
  onVerAnalise: () => void
}) {
  const v = getValorMetrica(pais, metrica)
  const cor = getCorChoropleth(v, metrica)
  return (
    <div className="border-t border-neutral-800 p-4 shrink-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg" style={{ color: corTema }}>{pais.bandeira} {pais.nome}</div>
          <div className="text-[10px] text-neutral-500">{pais.moeda} · Taxa: {pais.taxaJuro.toFixed(2)}%</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black" style={{ color: cor }}>{formatarValor(v, metrica)}</div>
          <div className="text-[10px] text-neutral-500">{METRICAS.find((m) => m.id === metrica)?.label}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mb-3">
        <div className="flex justify-between">
          <span className="text-neutral-600">PIB per cap.</span>
          <span className="text-neutral-300">${pais.pib.toFixed(1)}k</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Cresc. PIB</span>
          <span style={{ color: pais.crescimentoPib >= 0 ? '#10B981' : '#EF4444' }}>
            {pais.crescimentoPib >= 0 ? '+' : ''}{pais.crescimentoPib.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Inflação</span>
          <span style={{ color: pais.inflacao > 5 ? '#EF4444' : pais.inflacao > 2 ? '#F59E0B' : '#10B981' }}>
            {pais.inflacao.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Desemprego</span>
          <span style={{ color: pais.desemprego > 8 ? '#EF4444' : pais.desemprego > 5 ? '#F59E0B' : '#10B981' }}>
            {pais.desemprego.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Dívida/PIB</span>
          <span style={{ color: pais.dividaPublica > 100 ? '#EF4444' : '#9CA3AF' }}>
            {pais.dividaPublica.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Mercado YTD</span>
          <span style={{ color: pais.mercado >= 0 ? '#10B981' : '#EF4444' }}>
            {pais.mercado >= 0 ? '+' : ''}{pais.mercado.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Bal. Comercial</span>
          <span style={{ color: pais.balancaComercial >= 0 ? '#10B981' : '#EF4444' }}>
            {pais.balancaComercial >= 0 ? '+' : ''}{pais.balancaComercial.toFixed(1)}% PIB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Taxa de juro</span>
          <span className="text-neutral-300">{pais.taxaJuro.toFixed(2)}%</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onVerAnalise}
        className="w-full py-1.5 text-[10px] font-bold rounded border transition-colors"
        style={{ borderColor: corTema, color: corTema, background: corTema + '15' }}
      >
        ⚡ Análise IA — {pais.nome}
      </button>
    </div>
  )
})

export function MapaMundoPanel() {
  const { temaActual, definirVista, definirTickerActivo } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [metrica,    setMetrica]    = useState<MetricaMapa>('pib')
  const [paisSel,    setPaisSel]    = useState<DadosPais | null>(null)
  const [tooltip,    setTooltip]    = useState<TooltipInfo | null>(null)
  const [posicao,    setPosicao]    = useState<[number, number]>([0, 0])
  const [zoom,       setZoom]       = useState(1)
  const legenda = getLegendaMetrica(metrica)

  const handleGeoClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (geo: any) => {
      const iso3 = geo.properties?.['Alpha-3'] ?? geo.id
      const pais  = DADOS_MAP[iso3]
      if (pais) setPaisSel(pais)
    },
    []
  )

  return (
    <div className="h-full flex bg-[#0A0A0A] font-mono overflow-hidden">
      {/* ── Painel principal: Mapa ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
          <div>
            <span className="text-xs font-bold" style={{ color: corTema }}>WMAP — MAPA ECONÓMICO MUNDIAL</span>
            <span className="text-[10px] text-neutral-500 ml-2">Clique num país para detalhes · Scroll para zoom</span>
          </div>
          <div className="flex items-center gap-1">
            {METRICAS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetrica(m.id)}
                className="text-[10px] px-2.5 py-1 rounded border transition-colors"
                style={{
                  borderColor: metrica === m.id ? corTema : '#374151',
                  color:       metrica === m.id ? corTema : '#6B7280',
                  background:  metrica === m.id ? corTema + '18' : 'transparent',
                }}
              >
                {m.icone} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 min-h-0 relative">
          <ComposableMap
            projectionConfig={{ scale: 147 }}
            style={{ width: '100%', height: '100%', background: '#0A0A0A' }}
          >
            <ZoomableGroup
              zoom={zoom}
              center={posicao}
              onMoveEnd={({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
                setZoom(z)
                setPosicao(coordinates)
              }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: import('react-simple-maps').Geography[] }) =>
                  geographies.map((geo: import('react-simple-maps').Geography) => {
                    // react-simple-maps v3 usa numeric ISO 3166-1 no geo.id
                    // Tentamos resolver o alpha-3 a partir do nome ou do properties
                    const iso3 = geo.properties?.['Alpha-3'] as string | undefined
                    const pais = iso3 ? DADOS_MAP[iso3] : undefined
                    const cor  = pais
                      ? getCorChoropleth(getValorMetrica(pais, metrica), metrica)
                      : '#1a1a1a'

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleGeoClick(geo)}
                        onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                          if (pais) setTooltip({ x: e.clientX, y: e.clientY, pais })
                        }}
                        onMouseMove={(e: React.MouseEvent<SVGPathElement>) => {
                          if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          default:  { fill: cor, stroke: '#0A0A0A', strokeWidth: 0.4, outline: 'none' },
                          hover:    { fill: corTema + 'BB', stroke: corTema, strokeWidth: 0.8, outline: 'none', cursor: 'pointer' },
                          pressed:  { fill: corTema, outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 pointer-events-none bg-[#0D0D0D] border border-neutral-700 rounded px-3 py-2 text-[10px] shadow-xl"
              style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
            >
              <div className="font-bold text-white mb-0.5">
                {tooltip.pais.bandeira} {tooltip.pais.nome}
              </div>
              <div className="text-neutral-400">
                {METRICAS.find((m) => m.id === metrica)?.label}:{' '}
                <span className="text-white font-bold">
                  {formatarValor(getValorMetrica(tooltip.pais, metrica), metrica)}
                </span>
              </div>
            </div>
          )}

          {/* Controlos de zoom */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z * 1.5, 10))}
              className="w-7 h-7 flex items-center justify-center bg-[#0D0D0D] border border-neutral-700 rounded text-neutral-400 hover:text-white text-sm"
            >+</button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
              className="w-7 h-7 flex items-center justify-center bg-[#0D0D0D] border border-neutral-700 rounded text-neutral-400 hover:text-white text-sm"
            >−</button>
            <button
              type="button"
              onClick={() => { setZoom(1); setPosicao([0, 0]) }}
              className="w-7 h-7 flex items-center justify-center bg-[#0D0D0D] border border-neutral-700 rounded text-neutral-400 hover:text-white text-[9px]"
            >↺</button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-neutral-800 shrink-0">
          <span className="text-[9px] text-neutral-600">LEGENDA</span>
          {legenda.map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.cor }} />
              <span className="text-[9px] text-neutral-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Painel lateral: ranking + detalhe ─────────────────── */}
      <div className="w-64 border-l border-neutral-800 flex flex-col shrink-0 overflow-hidden">

        {/* Ranking */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="px-3 py-1.5 text-[9px] font-bold border-b border-neutral-800 sticky top-0 bg-[#0A0A0A]"
            style={{ color: corTema }}
          >
            RANKING — {METRICAS.find((m) => m.id === metrica)?.label.toUpperCase()}
          </div>
          {[...DADOS_MUNDIAIS]
            .sort((a, b) => getValorMetrica(b, metrica) - getValorMetrica(a, metrica))
            .map((d, i) => {
              const v = getValorMetrica(d, metrica)
              const cor = getCorChoropleth(v, metrica)
              return (
                <button
                  key={d.iso3}
                  type="button"
                  onClick={() => setPaisSel(d)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-neutral-900 hover:bg-neutral-900 transition-colors text-left"
                  style={{ background: paisSel?.iso3 === d.iso3 ? corTema + '18' : 'transparent' }}
                >
                  <span className="text-[9px] text-neutral-700 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm w-5 shrink-0">{d.bandeira}</span>
                  <span className="flex-1 text-[10px] text-neutral-400 truncate">{d.nome}</span>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: cor }}>
                    {formatarValor(v, metrica)}
                  </span>
                </button>
              )
            })}
        </div>

        {/* Detalhe do país selecionado */}
        {paisSel && (
          <PainelInfo
            pais={paisSel}
            metrica={metrica}
            corTema={corTema}
            onVerAnalise={() => {
              definirTickerActivo(paisSel.iso3)
              definirVista('analise')
            }}
          />
        )}
      </div>
    </div>
  )
}
