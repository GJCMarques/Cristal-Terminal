'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Curva de Rendimento (YAS)
// ============================================================

import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { CURVAS_RENDIMENTO } from '@/lib/mocks/yield-curve'
import { useTerminalStore } from '@/store/terminal.store'
import type { CurvaRendimento } from '@/types/market'

// Combina todos os pontos num único array para o Recharts
function combinarCurvas(curvas: CurvaRendimento[]): Record<string, number | string>[] {
  const maturidades = curvas[0]?.pontos.map((p) => p.maturidade) ?? []
  return maturidades.map((mat) => {
    const row: Record<string, number | string> = { maturidade: mat }
    for (const c of curvas) {
      const ponto = c.pontos.find((p) => p.maturidade === mat)
      if (ponto) row[c.benchmark] = ponto.rendimento
    }
    return row
  })
}

function TooltipCurva({ active, payload, label }: {
  active?: boolean
  payload?: { color: string; name: string; value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded p-3 font-mono text-xs shadow-xl">
      <div className="text-neutral-400 mb-1 font-bold">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-neutral-400">{p.name}:</span>
          <span className="text-white font-bold">{p.value.toFixed(3)}%</span>
        </div>
      ))}
    </div>
  )
}

export function YieldCurvePanel() {
  const { temaActual } = useTerminalStore()
  const [curvasSelecionadas, setCurvasSelecionadas] = useState<string[]>(['UST', 'BUND', 'OT'])

  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const curvasFiltradas = CURVAS_RENDIMENTO.filter((c) =>
    curvasSelecionadas.includes(c.benchmark),
  )
  const dados = combinarCurvas(curvasFiltradas)

  const toggleCurva = (benchmark: string) => {
    setCurvasSelecionadas((prev) =>
      prev.includes(benchmark)
        ? prev.length > 1
          ? prev.filter((b) => b !== benchmark)
          : prev
        : [...prev, benchmark],
    )
  }

  // Spread 2A-10A da curva UST (indicador de inversão)
  const curvaUST = CURVAS_RENDIMENTO.find((c) => c.benchmark === 'UST')
  const ust2a = curvaUST?.pontos.find((p) => p.maturidade === '2A')?.rendimento ?? 0
  const ust10a = curvaUST?.pontos.find((p) => p.maturidade === '10A')?.rendimento ?? 0
  const spread2a10a = ust10a - ust2a

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* ── Cabeçalho ──────────────────────────────────── */}
      <div className="flex items-start justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white">CURVA DE RENDIMENTO</span>
            <span
              className="font-mono text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: corTema + '22', color: corTema }}
            >
              YAS
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 font-mono text-xs">
            <div>
              <span className="text-neutral-500">UST 2A-10A: </span>
              <span
                className="font-bold"
                style={{ color: spread2a10a >= 0 ? '#10B981' : '#EF4444' }}
              >
                {spread2a10a >= 0 ? '+' : ''}{(spread2a10a * 100).toFixed(0)}pb
              </span>
            </div>
            <div>
              <span className="text-neutral-500">UST 10A: </span>
              <span className="text-white font-bold">{ust10a.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-neutral-500">Bund 10A: </span>
              <span className="text-white font-bold">
                {curvasFiltradas.find((c) => c.benchmark === 'BUND')
                  ?.pontos.find((p) => p.maturidade === '10A')?.rendimento.toFixed(2) ?? '—'}%
              </span>
            </div>
          </div>
        </div>

        {/* Toggle de curvas */}
        <div className="flex items-center gap-2">
          {CURVAS_RENDIMENTO.map((c) => (
            <button
              key={c.benchmark}
              type="button"
              onClick={() => toggleCurva(c.benchmark)}
              className="font-mono text-[10px] px-2 py-1 rounded border transition-all"
              style={{
                borderColor: curvasSelecionadas.includes(c.benchmark) ? c.cor : '#374151',
                color: curvasSelecionadas.includes(c.benchmark) ? c.cor : '#6B7280',
                backgroundColor: curvasSelecionadas.includes(c.benchmark)
                  ? c.cor + '22'
                  : 'transparent',
              }}
            >
              {c.benchmark}
            </button>
          ))}
        </div>
      </div>

      {/* ── Gráfico ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#111111" />
            <XAxis
              dataKey="maturidade"
              tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1F2937' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1F2937' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<TooltipCurva />} />
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />

            {curvasFiltradas.map((c) => (
              <Line
                key={c.benchmark}
                type="monotone"
                dataKey={c.benchmark}
                stroke={c.cor}
                strokeWidth={2}
                dot={{ fill: c.cor, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: c.cor }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tabela de rendimentos ───────────────────────── */}
      <div className="border-t border-neutral-800 shrink-0 overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left px-3 py-1.5 text-neutral-600 font-normal">BENCHMARK</th>
              {curvasFiltradas[0]?.pontos.map((p) => (
                <th key={p.maturidade} className="text-right px-3 py-1.5 text-neutral-600 font-normal">
                  {p.maturidade}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {curvasFiltradas.map((c) => (
              <tr key={c.benchmark} className="border-b border-neutral-900 hover:bg-neutral-900">
                <td className="px-3 py-1" style={{ color: c.cor }}>
                  {c.benchmark} ({c.pais})
                </td>
                {c.pontos.map((p) => (
                  <td key={p.maturidade} className="text-right px-3 py-1">
                    <span className="text-white">{p.rendimento.toFixed(2)}</span>
                    <span
                      className="ml-1 text-[10px]"
                      style={{ color: p.variacao >= 0 ? '#10B981' : '#EF4444' }}
                    >
                      {p.variacao >= 0 ? '+' : ''}{(p.variacao * 100).toFixed(0)}pb
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
