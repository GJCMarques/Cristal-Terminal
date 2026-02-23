'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Curva de Rendimento + Bond Calc (YAS)
// ============================================================

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, AreaChart, Area,
  BarChart, Bar
} from 'recharts'
import { CURVAS_RENDIMENTO } from '@/lib/mocks/yield-curve'
import { useTerminalStore } from '@/store/terminal.store'
import type { CurvaRendimento } from '@/types/market'

// ── Cálculos de Obrigações ────────────────────────────────────

function calcularObrigacao(
  valorNominal: number,
  cupao: number,
  maturidade: number,
  ytm: number,
  precoMercado?: number,
) {
  const c = (cupao / 100) * valorNominal
  const n = maturidade
  const y = ytm / 100

  let preco = 0
  for (let t = 1; t <= n; t++) {
    preco += c / Math.pow(1 + y, t)
  }
  preco += valorNominal / Math.pow(1 + y, n)

  let durNum = 0
  for (let t = 1; t <= n; t++) {
    durNum += t * (c / Math.pow(1 + y, t))
  }
  durNum += n * (valorNominal / Math.pow(1 + y, n))
  const durMacaulay = durNum / preco
  const durModificada = durMacaulay / (1 + y)

  let conv = 0
  for (let t = 1; t <= n; t++) {
    conv += (t * (t + 1) * c) / Math.pow(1 + y, t + 2)
  }
  conv += (n * (n + 1) * valorNominal) / Math.pow(1 + y, n + 2)
  const convexidade = conv / preco

  const dv01 = durModificada * preco * 0.0001
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
      px += valorNominal / facN
      dpx -= n * valorNominal / (facN * (1 + ytmReal))
      const diff = px - precoMercado
      if (Math.abs(diff) < 0.0001) break
      ytmReal -= diff / dpx
    }
  }

  return {
    preco: Math.round(preco * 100) / 100,
    durMacaulay: Math.round(durMacaulay * 1000) / 1000,
    durModificada: Math.round(durModificada * 1000) / 1000,
    convexidade: Math.round(convexidade * 1000) / 1000,
    dv01: Math.round(dv01 * 1000) / 1000,
    ytmReal: Math.round(ytmReal * 10000) / 100,
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

function TooltipCurva({ active, payload, label, mode = 'yield' }: {
  active?: boolean
  payload?: { color: string; name: string; value: number }[]
  label?: string
  mode?: 'yield' | 'spread'
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#050505] border border-neutral-700/50 p-3 font-mono text-xs shadow-2xl backdrop-blur-md">
      <div className="text-neutral-500 mb-2 font-bold uppercase tracking-wider">MATURITY: {label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 5px ${p.color}` }} />
            <span className="text-neutral-300">{p.name}</span>
          </div>
          <span className="text-white font-bold">{p.value.toFixed(3)}{mode === 'yield' ? '%' : ' BP'}</span>
        </div>
      ))}
    </div>
  )
}

// ── Bond Calculator ───────────────────────────────────────────

function BondCalculator({ corTema }: { corTema: string }) {
  const [nominal, setNominal] = useState('100')
  const [cupao, setCupao] = useState('4.25')
  const [maturidade, setMaturidade] = useState('10')
  const [ytm, setYtm] = useState('3.85')
  const [precoInput, setPrecoInput] = useState('')

  const resultado = useMemo(() => {
    const vn = parseFloat(nominal) || 100
    const cup = parseFloat(cupao) || 4.25
    const mat = parseFloat(maturidade) || 10
    const y = parseFloat(ytm) || 3.85
    const px = parseFloat(precoInput) || undefined
    if (vn <= 0 || mat <= 0) return null
    return calcularObrigacao(vn, cup, mat, y, px)
  }, [nominal, cupao, maturidade, ytm, precoInput])

  const precoNum = parseFloat(precoInput) || resultado?.preco || 0
  const premium = resultado && precoNum > 0 ? ((precoNum / (parseFloat(nominal) || 100)) - 1) * 100 : null

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4 md:p-8 bg-[#020202] grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* ── Entradas PRICING ENGINE ── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-300">PRICING ENGINE</h2>
          <p className="text-[10px] text-neutral-500 font-mono">Definir Parâmetros da Obrigação (Fixed Income)</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'VALOR NOMINAL', val: nominal, set: setNominal, step: '10', placeholder: '100' },
            { label: 'CUPÃO ANUAL (%)', val: cupao, set: setCupao, step: '0.125', placeholder: '4.25' },
            { label: 'MATURIDADE (YRS)', val: maturidade, set: setMaturidade, step: '1', placeholder: '10' },
            { label: 'YTM ALVO (%)', val: ytm, set: setYtm, step: '0.05', placeholder: '3.85' },
          ].map(({ label, val, set, step, placeholder }) => (
            <div key={label} className="bg-[#0A0C10] p-3 border border-neutral-800/50 rounded flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <label className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider mb-2">{label}</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  step={step}
                  placeholder={placeholder}
                  className="w-full bg-transparent text-xl md:text-2xl text-white font-mono font-bold outline-none placeholder-neutral-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col ml-2 w-6 shrink-0 bg-[#1f1f1f] rounded-sm overflow-hidden border border-neutral-800 h-10">
                  <button onClick={() => set(String(Math.round((Number(val) + Number(step)) * 10000) / 10000))} className="flex-1 hover:bg-[#F59E0B] flex items-center justify-center text-[#888] hover:text-black transition-colors text-[10px]">▲</button>
                  <button onClick={() => set(String(Math.round((Number(val) - Number(step)) * 10000) / 10000))} className="flex-1 hover:bg-[#F59E0B] flex items-center justify-center text-[#888] hover:text-black transition-colors border-t border-neutral-800 text-[10px]">▼</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0A0C10] p-4 border border-violet-900/30 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-3xl group-hover:bg-violet-600/10 transition-colors" />
          <label className="text-[9px] text-violet-400 font-mono uppercase tracking-wider mb-2 block relative z-10">PREÇO DE MERCADO (CALCULAR YTM INVERSO)</label>
          <div className="flex items-center relative z-10">
            <input
              type="number"
              value={precoInput}
              onChange={(e) => setPrecoInput(e.target.value)}
              step="0.01"
              placeholder="Opcional: Forçar Preço..."
              className="w-full bg-transparent text-xl md:text-2xl text-white font-mono font-bold outline-none placeholder-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {precoInput !== '' && (
              <div className="flex flex-col ml-2 w-6 shrink-0 bg-[#1f1f1f] rounded-sm overflow-hidden border border-neutral-800 h-10">
                <button onClick={() => setPrecoInput(String(Math.round((Number(precoInput) + 0.01) * 100) / 100))} className="flex-1 hover:bg-[#F59E0B] flex items-center justify-center text-[#888] hover:text-black transition-colors text-[10px]">▲</button>
                <button onClick={() => setPrecoInput(String(Math.round((Number(precoInput) - 0.01) * 100) / 100))} className="flex-1 hover:bg-[#F59E0B] flex items-center justify-center text-[#888] hover:text-black transition-colors border-t border-neutral-800 text-[10px]">▼</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Resultados ANALYTICS ── */}
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest" style={{ color: corTema }}>ANALYTICS & RISK</h2>
          <p className="text-[10px] text-neutral-500 font-mono">Sensibilidade da Obrigação a Alterações na Curva</p>
        </div>

        {resultado ? (
          <div className="flex-1 flex flex-col space-y-4">
            {/* The Big Price */}
            <div className="flex items-center justify-between bg-[#0A0C10] p-6 border-l-4 rounded" style={{ borderColor: corTema }}>
              <div>
                <div className="text-[10px] text-neutral-500 font-mono mb-1 uppercase tracking-wider">PREÇO TEÓRICO SUJO (DIRTY)</div>
                <div className="text-4xl lg:text-5xl font-mono font-black text-white shadow-black drop-shadow-lg tracking-tighter">
                  {resultado.preco.toFixed(4)}
                </div>
              </div>
              {premium !== null && (
                <div className="text-right">
                  <div className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider">SPREAD DA PARIDADE</div>
                  <div className={`text-xl font-bold font-mono ${premium >= 0 ? 'text-[#00FF00]' : 'text-[#FF2A2A]'}`}>
                    {premium >= 0 ? '+' : ''}{premium.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'YTM EFETIVO', val: `${resultado.ytmReal.toFixed(3)}%`, glow: true },
                { label: 'DUR. MACAULAY', val: `${resultado.durMacaulay.toFixed(2)} YRS` },
                { label: 'MOD. DURATION', val: `${resultado.durModificada.toFixed(2)}` },
                { label: 'CONVEXIDADE', val: `${resultado.convexidade.toFixed(2)}` },
              ].map((m) => (
                <div key={m.label} className="bg-[#0A0C10] border border-neutral-900 px-4 py-3 flex flex-col justify-center">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider mb-1">{m.label}</span>
                  <span className={`text-lg font-mono font-bold ${m.glow ? 'text-white' : 'text-neutral-300'}`}>
                    {m.val}
                  </span>
                </div>
              ))}
            </div>

            {/* DV01 & Shock */}
            <div className="flex-1 bg-[#100A0A] border border-red-900/30 rounded p-4 flex flex-col justify-between">
              <div>
                <div className="text-[9px] text-red-500 font-mono uppercase tracking-wider mb-2 font-bold">DV01 (DOLLAR VALUE OF 1 BP) </div>
                <div className="text-2xl font-mono font-black text-red-400">
                  {resultado.dv01.toFixed(4)} <span className="text-sm font-normal text-red-800">CENTS</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-red-900/30">
                <div className="text-[8px] text-neutral-500 font-mono uppercase mb-2">CHOQUE DE TAXA (YIELD SHOCK)</div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { delta: -0.5, label: '-50 BP' },
                    { delta: -0.25, label: '-25 BP' },
                    { delta: +0.25, label: '+25 BP' },
                    { delta: +0.5, label: '+50 BP' },
                  ].map(({ delta, label }) => {
                    const novoYtm = (parseFloat(ytm) || 3.85) + delta
                    const difPreco = novoYtm > 0 ? (calcularObrigacao(parseFloat(nominal) || 100, parseFloat(cupao) || 4.25, parseFloat(maturidade) || 10, novoYtm).preco - resultado.preco) : 0
                    return (
                      <div key={label} className="text-center bg-[#050000] p-2 rounded">
                        <div className="text-[8px] text-neutral-500 font-mono mb-1">{label}</div>
                        <div className="text-[10px] font-mono font-bold" style={{ color: difPreco >= 0 ? '#00FF00' : '#FF2A2A' }}>
                          {difPreco > 0 ? '+' : ''}{difPreco.toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border border-dashed border-neutral-800 rounded">
            <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Aguardando Parâmetros...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

type TabMode = 'curvas' | 'spreads' | 'bond'

export function YieldCurvePanel() {
  const { temaActual } = useTerminalStore()
  const [curvasSelecionadas, setCurvasSelecionadas] = useState<string[]>(['UST', 'BUND', 'OT', 'JGB'])
  const [aba, setAba] = useState<TabMode>('curvas')
  const [spreadRef, setSpreadRef] = useState('BUND')

  const corTema = corParaTema(temaActual)

  const curvasFiltradas = CURVAS_RENDIMENTO.filter((c) =>
    curvasSelecionadas.includes(c.benchmark),
  )

  const dados = combinarCurvas(curvasFiltradas)

  const dadosSpread = useMemo(() => {
    const maturidades = CURVAS_RENDIMENTO[0]?.pontos.map((p) => p.maturidade) ?? []
    return maturidades.map((mat, i) => {
      const row: Record<string, number | string> = { maturidade: mat }
      for (const c of curvasFiltradas) {
        if (c.benchmark === spreadRef) {
          row[c.benchmark] = 0
        } else {
          const refPoint = CURVAS_RENDIMENTO.find(r => r.benchmark === spreadRef)?.pontos[i]
          const p = c.pontos[i]
          if (p && refPoint) {
            row[c.benchmark] = (p.rendimento - refPoint.rendimento) * 100 // Convert to BP
          }
        }
      }
      return row
    })
  }, [curvasFiltradas, spreadRef])

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
  const ust2a = curvaUST?.pontos.find((p) => p.maturidade === '2A')?.rendimento ?? 0
  const ust10a = curvaUST?.pontos.find((p) => p.maturidade === '10A')?.rendimento ?? 0
  const spread2a10a = ust10a - ust2a

  const TABS: { id: TabMode, label: string }[] = [
    { id: 'curvas', label: 'SOVEREIGN CURVES' },
    { id: 'spreads', label: 'SPREAD TO BENCHMARK' },
    { id: 'bond', label: 'BOND PRICER' }
  ]

  return (
    <div className="flex flex-col h-full bg-[#050505] font-mono shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
      {/* ── Cabeçalho Principal ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0 bg-[#0A0C10]">
        <div>
          <div className="flex items-center gap-3 mb-1 md:mb-0">
            <span className="font-mono text-sm font-bold text-white tracking-wide">YIELD CURVE & FIXED INCOME</span>
            <span
              className="font-mono text-[9px] px-1.5 py-0.5 border"
              style={{ backgroundColor: corTema + '22', color: corTema, borderColor: corTema + '55' }}
            >
              YAS
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] md:text-xs">
            <div className="bg-[#111] px-2 py-0.5 rounded border border-neutral-800">
              <span className="text-neutral-500">UST 2s10s: </span>
              <span className="font-bold font-mono" style={{ color: spread2a10a >= 0 ? '#00FF00' : '#FF2A2A' }}>
                {spread2a10a >= 0 ? '+' : ''}{(spread2a10a * 100).toFixed(0)} BP
              </span>
            </div>
            <div className="bg-[#111] px-2 py-0.5 rounded border border-neutral-800 hidden sm:block">
              <span className="text-neutral-500">UST 10Y: </span>
              <span className="text-white font-bold font-mono">{ust10a.toFixed(3)}%</span>
            </div>
            <div className="bg-[#111] px-2 py-0.5 rounded border border-neutral-800 hidden sm:block">
              <span className="text-neutral-500">BUND 10Y: </span>
              <span className="text-white font-bold font-mono">
                {CURVAS_RENDIMENTO.find(c => c.benchmark === 'BUND')?.pontos.find(p => p.maturidade === '10A')?.rendimento.toFixed(3) ?? '—'}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 md:mt-0 self-end md:self-auto">
          {TABS.map((a) => {
            const isActive = aba === a.id
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className="font-mono text-[10px] px-3 py-1.5 rounded border transition-all font-bold tracking-wider"
                style={{
                  borderColor: isActive ? corTema : '#374151',
                  color: isActive ? corTema : '#6B7280',
                  backgroundColor: isActive ? corTema + '22' : 'transparent',
                }}
              >
                {a.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-header Filter Toolbar */}
      {aba !== 'bond' && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#0A0C10] border-b border-neutral-800">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {CURVAS_RENDIMENTO.map((c) => {
              const isSelected = curvasSelecionadas.includes(c.benchmark)
              return (
                <button
                  key={c.benchmark}
                  type="button"
                  onClick={() => toggleCurva(c.benchmark)}
                  className="font-mono text-[9px] px-2 py-0.5 rounded transition-colors hover:brightness-125 font-bold border"
                  style={{
                    borderColor: isSelected ? c.cor : '#333',
                    color: isSelected ? c.cor : '#666',
                    backgroundColor: isSelected ? c.cor + '20' : 'transparent',
                  }}
                >
                  {c.benchmark}
                </button>
              )
            })}
          </div>

          {aba === 'spreads' && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-neutral-500 font-mono">REFERÊNCIA:</span>
              <select
                className="bg-[#111] border border-neutral-700 text-white text-[9px] font-mono p-0.5 outline-none rounded"
                value={spreadRef}
                onChange={(e) => setSpreadRef(e.target.value)}
                style={{ colorScheme: 'dark' }}
              >
                {CURVAS_RENDIMENTO.map(c => (
                  <option key={c.benchmark} value={c.benchmark} className="bg-[#111] text-white">
                    {c.benchmark}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ── Conteúdo / Tabs ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-[#050505]">
        {aba === 'curvas' ? (
          <div className="h-[400px] sm:h-[450px] shrink-0 p-2 lg:p-6 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#222" vertical={false} />
                <XAxis dataKey="maturidade" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#333' }} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} domain={['auto', 'auto']} dx={-10} />
                <Tooltip content={<TooltipCurva />} cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <ReferenceLine y={0} stroke="#444" />
                {curvasFiltradas.map((c) => (
                  <Line key={c.benchmark} type="monotone" dataKey={c.benchmark} stroke={c.cor} strokeWidth={3} activeDot={{ r: 6, fill: '#000', stroke: c.cor, strokeWidth: 2 }} dot={{ fill: c.cor, r: 3, strokeWidth: 0 }} isAnimationActive={true} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : aba === 'spreads' ? (
          <div className="h-[400px] sm:h-[450px] shrink-0 p-2 lg:p-6 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSpread} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#222" vertical={false} />
                <XAxis dataKey="maturidade" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#333' }} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} BP`} domain={['auto', 'auto']} dx={-10} />
                <Tooltip content={<TooltipCurva mode="spread" />} cursor={{ fill: '#222', opacity: 0.3 }} />
                <ReferenceLine y={0} stroke="#444" strokeWidth={2} />
                {curvasFiltradas.filter(c => c.benchmark !== spreadRef).map((c) => (
                  <Bar key={c.benchmark} dataKey={c.benchmark} fill={c.cor} opacity={0.8} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <BondCalculator corTema={corTema} />
        )}

        {aba !== 'bond' && (
          <div className="shrink-0 overflow-x-auto border-t border-neutral-800 bg-[#0A0C10]">
            <table className="w-full font-mono text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-neutral-800 bg-[#020202]">
                  <th className="text-left px-4 py-2 text-neutral-500 font-bold tracking-widest text-[9px] uppercase">BENCHMARK</th>
                  {curvasFiltradas[0]?.pontos.map((p) => (
                    <th key={p.maturidade} className="text-right px-3 py-2 text-neutral-500 font-bold tracking-widest text-[9px] uppercase">
                      {p.maturidade}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {curvasFiltradas.map((c) => (
                  <tr key={c.benchmark} className="border-b border-neutral-900 hover:bg-neutral-800/50 transition-colors group cursor-pointer">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.cor, boxShadow: `0 0 10px ${c.cor}` }} />
                      <div>
                        <span className="font-bold text-white text-[11px]">{c.benchmark}</span>
                        <span className="ml-2 text-[9px] text-neutral-500">{c.pais}</span>
                      </div>
                    </td>
                    {c.pontos.map((p) => {
                      let displayVal = p.rendimento.toFixed(3)
                      let displaySuffix = ''
                      let valColor = 'text-white'

                      if (aba === 'spreads' && c.benchmark !== spreadRef) {
                        const refPoint = CURVAS_RENDIMENTO.find(r => r.benchmark === spreadRef)?.pontos.find(refP => refP.maturidade === p.maturidade)
                        if (refPoint) {
                          const spreadScore = (p.rendimento - refPoint.rendimento) * 100
                          displayVal = (spreadScore > 0 ? '+' : '') + spreadScore.toFixed(1)
                          displaySuffix = ' BP'
                          valColor = spreadScore > 0 ? 'text-[#00FF00]' : 'text-[#FF2A2A]'
                        }
                      }

                      return (
                        <td key={p.maturidade} className="text-right px-3 py-3">
                          <div className={`font-bold group-hover:text-amber-100 transition-colors text-[11px] ${valColor}`}>{displayVal}{displaySuffix}</div>
                          {aba === 'curvas' && (
                            <div
                              className="text-[9px] mt-0.5 tracking-tighter"
                              style={{ color: p.variacao >= 0 ? '#00FF00' : '#FF2A2A' }}
                            >
                              {p.variacao >= 0 ? '▲ ' : '▼ '}{(Math.abs(p.variacao) * 100).toFixed(1)} BP
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
