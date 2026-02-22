'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Curva de Rendimento + Bond Calc
// ============================================================

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { CURVAS_RENDIMENTO } from '@/lib/mocks/yield-curve'
import { useTerminalStore } from '@/store/terminal.store'
import type { CurvaRendimento } from '@/types/market'

// ── Cálculos de Obrigações ────────────────────────────────────

function calcularObrigacao(
  valorNominal: number,
  cupao: number,       // % anual
  maturidade: number,  // anos
  ytm: number,         // % yield to maturity para cálculo de preço
  precoMercado?: number, // preço de mercado para calcular YTM real
) {
  const c = (cupao / 100) * valorNominal   // cupão $ por período
  const n = maturidade
  const y = ytm / 100

  // Preço teórico via desconto de fluxos
  let preco = 0
  for (let t = 1; t <= n; t++) {
    preco += c / Math.pow(1 + y, t)
  }
  preco += valorNominal / Math.pow(1 + y, n)

  // Duration de Macaulay
  let durNum = 0
  for (let t = 1; t <= n; t++) {
    durNum += t * (c / Math.pow(1 + y, t))
  }
  durNum += n * (valorNominal / Math.pow(1 + y, n))
  const durMacaulay = durNum / preco

  // Modified Duration
  const durModificada = durMacaulay / (1 + y)

  // Convexidade
  let conv = 0
  for (let t = 1; t <= n; t++) {
    conv += (t * (t + 1) * c) / Math.pow(1 + y, t + 2)
  }
  conv += (n * (n + 1) * valorNominal) / Math.pow(1 + y, n + 2)
  const convexidade = conv / preco

  // DV01 — variação de preço por 1pb (0.01%)
  const dv01 = durModificada * preco * 0.0001

  // YTM real a partir do preço de mercado (Newton-Raphson)
  let ytmReal = ytm / 100
  if (precoMercado && precoMercado > 0) {
    for (let iter = 0; iter < 100; iter++) {
      let px = 0
      let dpx = 0
      for (let t = 1; t <= n; t++) {
        const fac = Math.pow(1 + ytmReal, t)
        px += c / fac
        dpx -= t * c / (fac * (1 + ytmReal))
      }
      const facN = Math.pow(1 + ytmReal, n)
      px  += valorNominal / facN
      dpx -= n * valorNominal / (facN * (1 + ytmReal))
      const diff = px - precoMercado
      if (Math.abs(diff) < 0.0001) break
      ytmReal -= diff / dpx
    }
  }

  return {
    preco:        Math.round(preco * 100) / 100,
    durMacaulay:  Math.round(durMacaulay * 1000) / 1000,
    durModificada: Math.round(durModificada * 1000) / 1000,
    convexidade:  Math.round(convexidade * 1000) / 1000,
    dv01:         Math.round(dv01 * 1000) / 1000,
    ytmReal:      Math.round(ytmReal * 10000) / 100,
  }
}

// ── Combinar curvas ───────────────────────────────────────────

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

// ── Bond Calculator ───────────────────────────────────────────

function BondCalculator({ corTema }: { corTema: string }) {
  const [nominal,     setNominal]     = useState('1000')
  const [cupao,       setCupao]       = useState('5')
  const [maturidade,  setMaturidade]  = useState('10')
  const [ytm,         setYtm]         = useState('4.5')
  const [precoInput,  setPrecoInput]  = useState('')

  const resultado = useMemo(() => {
    const vn  = parseFloat(nominal)    || 1000
    const cup = parseFloat(cupao)      || 5
    const mat = parseFloat(maturidade) || 10
    const y   = parseFloat(ytm)        || 4.5
    const px  = parseFloat(precoInput) || undefined
    if (vn <= 0 || mat <= 0) return null
    return calcularObrigacao(vn, cup, mat, y, px)
  }, [nominal, cupao, maturidade, ytm, precoInput])

  const precoNum    = parseFloat(precoInput) || resultado?.preco || 0
  const premium     = resultado && precoNum > 0 ? ((precoNum / (parseFloat(nominal) || 1000)) - 1) * 100 : null

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4 grid grid-cols-2 gap-4">
      {/* Inputs */}
      <div className="space-y-3">
        <div className="text-[9px] font-bold mb-2" style={{ color: corTema }}>PARÂMETROS DA OBRIGAÇÃO</div>

        {[
          { label: 'VALOR NOMINAL ($)',     val: nominal,    set: setNominal,    step: '100',  placeholder: '1000' },
          { label: 'CUPÃO ANUAL (%)',        val: cupao,      set: setCupao,      step: '0.25', placeholder: '5.0'  },
          { label: 'MATURIDADE (anos)',      val: maturidade, set: setMaturidade, step: '1',    placeholder: '10'   },
          { label: 'YIELD TO MATURITY (%)', val: ytm,        set: setYtm,        step: '0.05', placeholder: '4.5'  },
          { label: 'PREÇO MERCADO ($) opt.', val: precoInput, set: setPrecoInput, step: '0.01', placeholder: 'ex: 1050' },
        ].map(({ label, val, set, step, placeholder }) => (
          <div key={label}>
            <label className="text-[9px] text-neutral-600 block mb-1">{label}</label>
            <input
              type="number"
              value={val}
              onChange={(e) => set(e.target.value)}
              step={step}
              placeholder={placeholder}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-[11px] text-white outline-none focus:border-neutral-600 transition-colors font-mono"
            />
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div className="space-y-2">
        <div className="text-[9px] font-bold mb-2" style={{ color: corTema }}>MÉTRICAS CALCULADAS</div>

        {resultado ? (
          <>
            {[
              { label: 'PREÇO TEÓRICO',      val: `$${resultado.preco.toFixed(2)}`,               cor: 'text-white', bold: true },
              { label: 'YTM (real)',          val: `${resultado.ytmReal.toFixed(3)}%`,              cor: 'text-white', bold: true },
              { label: 'DURATION MACAULAY',   val: `${resultado.durMacaulay.toFixed(3)} anos`,      cor: 'text-neutral-300' },
              { label: 'DURATION MODIFICADA', val: `${resultado.durModificada.toFixed(3)}`,         cor: 'text-neutral-300' },
              { label: 'CONVEXIDADE',         val: `${resultado.convexidade.toFixed(3)}`,           cor: 'text-neutral-300' },
              { label: 'DV01 ($/pb)',         val: `$${resultado.dv01.toFixed(3)}`,                 cor: 'text-amber-400'   },
            ].map(({ label, val, cor, bold }) => (
              <div key={label} className="flex items-center justify-between border border-neutral-900 rounded px-3 py-2">
                <span className="text-[9px] text-neutral-600">{label}</span>
                <span className={`text-[12px] font-mono ${bold ? 'font-bold' : ''} ${cor}`}>{val}</span>
              </div>
            ))}

            {premium !== null && (
              <div className="flex items-center justify-between border border-neutral-900 rounded px-3 py-2">
                <span className="text-[9px] text-neutral-600">PRÉMIO/DESCONTO</span>
                <span className={`text-[12px] font-bold font-mono ${premium >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {premium >= 0 ? '+' : ''}{premium.toFixed(2)}%
                </span>
              </div>
            )}

            {/* Sensibilidade */}
            <div className="border border-neutral-800 rounded p-3 mt-2">
              <div className="text-[9px] text-neutral-600 mb-2">SENSIBILIDADE AO YIELD</div>
              {[
                { delta: -0.5, label: 'YTM −50pb' },
                { delta: -0.25, label: 'YTM −25pb' },
                { delta: +0.25, label: 'YTM +25pb' },
                { delta: +0.5, label: 'YTM +50pb' },
              ].map(({ delta, label }) => {
                const novoYtm = (parseFloat(ytm) || 4.5) + delta
                if (novoYtm <= 0) return null
                const res = calcularObrigacao(parseFloat(nominal) || 1000, parseFloat(cupao) || 5, parseFloat(maturidade) || 10, novoYtm)
                const difPreco = res.preco - resultado.preco
                return (
                  <div key={label} className="flex justify-between text-[9px] mb-1">
                    <span className="text-neutral-700">{label}</span>
                    <span style={{ color: difPreco >= 0 ? '#10B981' : '#EF4444' }}>
                      {difPreco >= 0 ? '+' : ''}${difPreco.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-[10px] text-neutral-700 mt-4">Introduza parâmetros válidos</div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function YieldCurvePanel() {
  const { temaActual } = useTerminalStore()
  const [curvasSelecionadas, setCurvasSelecionadas] = useState<string[]>(['UST', 'BUND', 'OT'])
  const [aba, setAba] = useState<'curvas' | 'bond'>('curvas')

  const corTema =
    corParaTema(temaActual)

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

  const curvaUST = CURVAS_RENDIMENTO.find((c) => c.benchmark === 'UST')
  const ust2a    = curvaUST?.pontos.find((p) => p.maturidade === '2A')?.rendimento ?? 0
  const ust10a   = curvaUST?.pontos.find((p) => p.maturidade === '10A')?.rendimento ?? 0
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
              <span className="font-bold" style={{ color: spread2a10a >= 0 ? '#10B981' : '#EF4444' }}>
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

        <div className="flex items-center gap-2">
          {/* Toggle abas */}
          {(['curvas', 'bond'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              className="font-mono text-[10px] px-2 py-1 rounded border transition-all"
              style={{
                borderColor: aba === a ? corTema : '#374151',
                color:       aba === a ? corTema : '#6B7280',
                backgroundColor: aba === a ? corTema + '22' : 'transparent',
              }}
            >
              {a === 'curvas' ? 'CURVAS' : 'BOND CALC'}
            </button>
          ))}

          {/* Toggle curvas (apenas no tab curvas) */}
          {aba === 'curvas' && (
            <>
              <div className="w-px h-4 bg-neutral-800" />
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
            </>
          )}
        </div>
      </div>

      {/* ── Conteúdo ─────────────────────────────────────── */}
      {aba === 'curvas' ? (
        <>
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
        </>
      ) : (
        <BondCalculator corTema={corTema} />
      )}
    </div>
  )
}
