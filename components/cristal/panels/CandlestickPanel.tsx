'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Painel de Gráfico de Velas
// ============================================================
// Usa lightweight-charts (TradingView) para renderização
// profissional de candlesticks em canvas.

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts'
import { obterDadosCandlestick } from '@/lib/mocks/candlestick'
import { useTerminalStore } from '@/store/terminal.store'
import { TICKERS_CONHECIDOS } from '@/lib/command-parser'

interface Props {
  ticker?: string
}

export function CandlestickPanel({ ticker: tickerProp }: Props) {
  const { tickerActivo, definirTickerActivo, temaActual } = useTerminalStore()
  const ticker = tickerProp ?? tickerActivo ?? 'AAPL'

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const [tooltip, setTooltip] = useState<{
    data: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    variacao: number
  } | null>(null)

  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const info = TICKERS_CONHECIDOS[ticker]
  const dados = obterDadosCandlestick(ticker)

  // ── Criação do gráfico ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0A0A0A' },
        textColor: '#9CA3AF',
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#111111' },
        horzLines: { color: '#111111' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: corTema + '88',
          width: 1,
          style: 2,
          labelBackgroundColor: corTema,
        },
        horzLine: {
          color: corTema + '88',
          width: 1,
          style: 2,
          labelBackgroundColor: corTema,
        },
      },
      rightPriceScale: {
        borderColor: '#1F2937',
        textColor: '#6B7280',
      },
      timeScale: {
        borderColor: '#1F2937',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    chartRef.current = chart

    // ── Série de velas ──────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    })
    candleRef.current = candleSeries

    // ── Série de volume ─────────────────────────────────────
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: '#26a69a',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      borderVisible: false,
    })

    volumeRef.current = volumeSeries

    // ── Alimentar dados ─────────────────────────────────────
    const candleData: CandlestickData[] = dados.map((b) => ({
      time: b.time as CandlestickData['time'],
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }))

    const volumeData = dados.map((b) => ({
      time: b.time as CandlestickData['time'],
      value: b.volume,
      color: b.close >= b.open ? '#10B98144' : '#EF444444',
    }))

    candleSeries.setData(candleData)
    volumeSeries.setData(volumeData)

    chart.timeScale().fitContent()

    // ── Tooltip via crosshair ─────────────────────────────
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setTooltip(null)
        return
      }
      const d = param.seriesData.get(candleSeries) as CandlestickData | undefined
      const v = param.seriesData.get(volumeSeries) as { value: number } | undefined
      if (!d) return

      const prevBar = dados.find((b) => b.time === Number(param.time) - 86400)
      const variacao = prevBar
        ? ((d.close - prevBar.close) / prevBar.close) * 100
        : 0

      setTooltip({
        data: new Date(Number(param.time) * 1000).toLocaleDateString('pt-PT'),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: v?.value ?? 0,
        variacao,
      })
    })

    // ── Resize observer ─────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight - 48, // cabeçalho
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, temaActual])

  // Preço e variação finais
  const ultimo = dados[dados.length - 1]
  const penultimo = dados[dados.length - 2]
  const variacaoFinal =
    ultimo && penultimo
      ? ((ultimo.close - penultimo.close) / penultimo.close) * 100
      : 0
  const corVariacao = variacaoFinal >= 0 ? '#10B981' : '#EF4444'

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* ── Cabeçalho do painel ─────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-neutral-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white">{ticker}</span>
            {info && (
              <span className="font-mono text-xs text-neutral-500">{info.nome}</span>
            )}
            <span
              className="font-mono text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: corTema + '22', color: corTema }}
            >
              {info?.classe ?? 'Equity'}
            </span>
          </div>
          {ultimo && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-xl font-bold text-white">
                {ultimo.close.toLocaleString('pt-PT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="font-mono text-sm" style={{ color: corVariacao }}>
                {variacaoFinal >= 0 ? '▲' : '▼'}{' '}
                {Math.abs(variacaoFinal).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Tooltip cruzamento */}
        {tooltip && (
          <div className="ml-auto flex items-center gap-4 font-mono text-xs">
            <span className="text-neutral-500">{tooltip.data}</span>
            <span className="text-neutral-400">
              A: <span className="text-white">{tooltip.open.toFixed(2)}</span>
            </span>
            <span className="text-neutral-400">
              Max: <span className="text-green-400">{tooltip.high.toFixed(2)}</span>
            </span>
            <span className="text-neutral-400">
              Min: <span className="text-red-400">{tooltip.low.toFixed(2)}</span>
            </span>
            <span className="text-neutral-400">
              F: <span className="text-white">{tooltip.close.toFixed(2)}</span>
            </span>
            <span style={{ color: tooltip.variacao >= 0 ? '#10B981' : '#EF4444' }}>
              {tooltip.variacao >= 0 ? '▲' : '▼'}{Math.abs(tooltip.variacao).toFixed(2)}%
            </span>
            <span className="text-neutral-400">
              Vol:{' '}
              <span className="text-white">
                {(tooltip.volume / 1_000_000).toFixed(2)}M
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Contentor do gráfico ────────────────────────── */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
}
