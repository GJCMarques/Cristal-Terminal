'use client'
import { corParaTema } from '@/lib/utils'

import { useState, useCallback } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts'
import { DADOS_MACRO, BANCOS_CENTRAIS, type DadosMacro } from '@/lib/mocks/macro'
import { useTerminalStore } from '@/store/terminal.store'

type TabMacro = 'visao-geral' | 'inflacao' | 'bancos-centrais' | 'pmi'

function TooltipMacro({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded p-2 font-mono text-xs shadow-xl">
      <div className="text-neutral-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}%</div>
      ))}
    </div>
  )
}

function CardBancoCentral({ b }: { b: typeof BANCOS_CENTRAIS[0] }) {
  const corCiclo = b.ciclo === 'corte' ? '#10B981' : b.ciclo === 'subida' ? '#EF4444' : '#6B7280'
  const labelCiclo = { corte: 'CICLO DE CORTE', manutenção: 'NEUTRO', subida: 'CICLO DE SUBIDA' }[b.ciclo]
  const labelProx = b.expectativaProxima === 'manter' ? '— MANTER' : b.expectativaProxima === 'corte25pb' ? '▼ -25pb' : '▲ +25pb'
  const corProx = b.expectativaProxima === 'manter' ? '#6B7280' : b.expectativaProxima === 'corte25pb' ? '#10B981' : '#EF4444'

  return (
    <div className="border border-neutral-800 rounded p-3 hover:border-neutral-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-mono text-sm font-bold text-white">{b.banco}</div>
          <div className="font-mono text-[10px] text-neutral-500">{b.pais}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold text-white">{b.taxaActual.toFixed(2)}%</div>
          <div className="font-mono text-[10px] text-neutral-500">taxa directora</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: corCiclo, backgroundColor: corCiclo + '22' }}>
          {labelCiclo}
        </span>
        <div className="text-right">
          <div className="font-mono text-[10px] text-neutral-500">Próxima: {b.proximaReuniao}</div>
          <div className="font-mono text-[10px] font-bold" style={{ color: corProx }}>{labelProx}</div>
        </div>
      </div>
    </div>
  )
}

export function MacroPanel() {
  const { temaActual, iaDisponivel } = useTerminalStore()
  const [tab, setTab] = useState<TabMacro>('visao-geral')
  const [paisSeleccionado, setPaisSeleccionado] = useState<string | null>(null)
  const [analiseIA, setAnaliseIA] = useState('')
  const [iaLoading, setIaLoading] = useState(false)

  const corTema = corParaTema(temaActual)
  const paisDetalhado = DADOS_MACRO.find((d) => d.pais === paisSeleccionado)

  const gerarAnalise = useCallback(async () => {
    if (iaLoading || !iaDisponivel) return
    setIaLoading(true); setAnaliseIA('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Analisa o contexto macro global: ciclos dos bancos centrais, risco de recessão e implicações para mercados financeiros.' }],
          context: { paises: DADOS_MACRO.map((d) => ({ pais: d.pais, pibYoY: d.pibYoY, ipscy: d.ipsCYoY, taxa: d.taxaJuro })), bancoCentrales: BANCOS_CENTRAIS.map((b) => ({ banco: b.banco, taxa: b.taxaActual, ciclo: b.ciclo })) },
          stream: true,
        }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let total = ''
      for (;;) { const { done, value } = await reader.read(); if (done) break; total += dec.decode(value, { stream: true }); setAnaliseIA(total) }
    } catch { setAnaliseIA('Serviço IA indisponível.') }
    finally { setIaLoading(false) }
  }, [iaLoading, iaDisponivel])

  const TABS: { id: TabMacro; label: string }[] = [
    { id: 'visao-geral', label: 'VISÃO GERAL' },
    { id: 'inflacao', label: 'INFLAÇÃO' },
    { id: 'bancos-centrais', label: 'BANCOS CENTRAIS' },
    { id: 'pmi', label: 'PMI' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">MONITOR MACROECONÓMICO</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: corTema + '22', color: corTema }}>MACRO</span>
        </div>
        <button type="button" onClick={gerarAnalise} disabled={iaLoading || !iaDisponivel}
          className="font-mono text-[10px] px-3 py-1 rounded disabled:opacity-40" style={{ backgroundColor: corTema + '33', color: corTema }}>
          {iaLoading ? '⟳ A analisar…' : '⚡ Análise IA'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 shrink-0">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className="px-4 py-1.5 font-mono text-[11px] border-r border-neutral-900 transition-colors"
            style={{ color: tab === t.id ? corTema : '#6B7280', backgroundColor: tab === t.id ? corTema + '11' : 'transparent', borderBottom: tab === t.id ? `2px solid ${corTema}` : '2px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Análise IA */}
      {analiseIA && (
        <div className="px-4 py-2 border-b border-neutral-800 shrink-0 bg-neutral-950 font-mono text-xs text-neutral-300 max-h-20 overflow-y-auto">
          <span className="text-[10px] font-bold mr-2" style={{ color: corTema }}>LLAMA 3 ›</span>{analiseIA}
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'visao-geral' && (
          <div>
            {/* Cabeçalho tabela */}
            <div className="sticky top-0 z-10 grid bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-600 px-4 py-1.5"
              style={{ gridTemplateColumns: '1.5rem 10rem 5rem 5rem 5rem 5rem 5rem 4rem' }}>
              <span></span><span>PAÍS</span><span className="text-right">PIB YoY</span><span className="text-right">IPC YoY</span>
              <span className="text-right">DESEMP.</span><span className="text-right">TAXA JR</span><span className="text-right">PMI</span><span className="text-right">DÍVIDA/PIB</span>
            </div>
            {DADOS_MACRO.map((d) => {
              const corPib = d.pibYoY >= 2 ? '#10B981' : d.pibYoY >= 0 ? '#EAB308' : '#EF4444'
              const corIps = d.ipsCYoY <= 2.5 ? '#10B981' : d.ipsCYoY <= 4 ? '#EAB308' : '#EF4444'
              const corPmi = d.pmi > 50 ? '#10B981' : '#EF4444'
              return (
                <div key={d.pais} role="button" tabIndex={0} onClick={() => setPaisSeleccionado(d.pais === paisSeleccionado ? null : d.pais)}
                  className="grid items-center px-4 py-2 border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer transition-colors font-mono text-xs"
                  style={{ gridTemplateColumns: '1.5rem 10rem 5rem 5rem 5rem 5rem 5rem 4rem', backgroundColor: paisSeleccionado === d.pais ? '#0f1117' : undefined }}>
                  <span>{d.bandeira}</span>
                  <span className="text-white font-bold">{d.pais}</span>
                  <span className="text-right font-bold" style={{ color: corPib }}>{d.pibYoY >= 0 ? '+' : ''}{d.pibYoY.toFixed(1)}%</span>
                  <span className="text-right" style={{ color: corIps }}>{d.ipsCYoY.toFixed(1)}%</span>
                  <span className="text-right text-neutral-400">{d.desemprego.toFixed(1)}%</span>
                  <span className="text-right text-white">{d.taxaJuro.toFixed(2)}%</span>
                  <span className="text-right font-bold" style={{ color: corPmi }}>{d.pmi.toFixed(1)}</span>
                  <span className="text-right text-neutral-400">{d.dividaPublica.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'inflacao' && (
          <div className="p-4">
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DADOS_MACRO} margin={{ top: 5, right: 20, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#111" />
                  <XAxis dataKey="bandeira" tick={{ fill: '#6B7280', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<TooltipMacro />} />
                  <ReferenceLine y={2} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Meta BCE/Fed 2%', fill: '#F59E0B', fontSize: 9 }} />
                  <Bar dataKey="ipsCYoY" name="IPC YoY" radius={[2, 2, 0, 0]}>
                    {DADOS_MACRO.map((d) => (
                      <Cell key={d.pais} fill={d.ipsCYoY <= 2.5 ? '#10B981' : d.ipsCYoY <= 4 ? '#EAB308' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              {DADOS_MACRO.map((d) => (
                <div key={d.pais} className="flex items-center justify-between border border-neutral-800 rounded px-3 py-2">
                  <span className="text-neutral-400">{d.bandeira} {d.pais}</span>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: d.ipsCYoY <= 2.5 ? '#10B981' : d.ipsCYoY <= 4 ? '#EAB308' : '#EF4444' }}>{d.ipsCYoY.toFixed(1)}%</div>
                    <div className="text-[10px] text-neutral-600">Core: {d.ipsCCore.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bancos-centrais' && (
          <div className="p-4 grid grid-cols-1 gap-3">
            {BANCOS_CENTRAIS.map((b) => <CardBancoCentral key={b.banco} b={b} />)}
          </div>
        )}

        {tab === 'pmi' && (
          <div className="p-4">
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DADOS_MACRO} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#111" horizontal={false} />
                  <XAxis type="number" domain={[44, 56]} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="pais" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipMacro />} />
                  <ReferenceLine x={50} stroke="#6B7280" strokeDasharray="4 4" label={{ value: '50', fill: '#6B7280', fontSize: 9 }} />
                  <Bar dataKey="pmi" name="PMI Composto" radius={[0, 2, 2, 0]}>
                    {DADOS_MACRO.map((d) => <Cell key={d.pais} fill={d.pmi > 50 ? '#10B981' : '#EF4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono text-[10px] text-neutral-600 text-center">PMI acima de 50 = expansão económica  ·  Abaixo de 50 = contracção</p>
          </div>
        )}
      </div>
    </div>
  )
}
