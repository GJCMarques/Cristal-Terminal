'use client'
import { corParaTema } from '@/lib/utils'

import { useState, useCallback } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Zap } from 'lucide-react'
import { DADOS_MACRO, BANCOS_CENTRAIS, YIELD_CURVES, RISCO_RECESSAO, type DadosMacro } from '@/lib/mocks/macro'
import { useTerminalStore } from '@/store/terminal.store'

type TabMacro = 'visao-geral' | 'inflacao' | 'bancos-centrais' | 'pmi' | 'yield-curves' | 'risco-recessao'

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
          <div className="font-mono text-[10px] text-neutral-200">{b.pais}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold text-white">{b.taxaActual.toFixed(2)}%</div>
          <div className="font-mono text-[10px] text-neutral-200">taxa directora</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: corCiclo, backgroundColor: corCiclo + '22' }}>
          {labelCiclo}
        </span>
        <div className="text-right">
          <div className="font-mono text-[10px] text-neutral-200">Próxima: {b.proximaReuniao}</div>
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
      for (; ;) { const { done, value } = await reader.read(); if (done) break; total += dec.decode(value, { stream: true }); setAnaliseIA(total) }
    } catch { setAnaliseIA('Serviço IA indisponível.') }
    finally { setIaLoading(false) }
  }, [iaLoading, iaDisponivel])

  const TABS: { id: TabMacro; label: string }[] = [
    { id: 'visao-geral', label: 'VISÃO GERAL' },
    { id: 'inflacao', label: 'INFLAÇÃO' },
    { id: 'bancos-centrais', label: 'BANCOS CENTRAIS' },
    { id: 'pmi', label: 'PMI' },
    { id: 'yield-curves', label: 'YIELD CURVES' },
    { id: 'risco-recessao', label: 'RISCO DE RECESSÃO' },
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
          className="font-mono text-[10px] px-3 py-1 rounded disabled:opacity-40 flex items-center justify-center gap-1" style={{ backgroundColor: corTema + '33', color: corTema }}>
          {iaLoading ? '⟳ A analisar…' : <><Zap size={10} /> Análise IA</>}
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
            <div className="sticky top-0 z-10 grid bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-300 px-4 py-1.5"
              style={{ gridTemplateColumns: '1.5rem 10rem 5rem 5rem 5rem 5rem 5rem 4rem' }}>
              <span></span><span>PAÍS</span><span className="text-right">PIB YoY</span><span className="text-right">IPC YoY</span>
              <span className="text-right">DESEMP.</span><span className="text-right">TAXA JR</span><span className="text-right">PMI</span><span className="text-right">DÍVIDA/PIB</span>
            </div>
            {DADOS_MACRO.map((d) => {
              const corPib = d.pibYoY >= 2 ? '#10B981' : d.pibYoY >= 0 ? '#EAB308' : '#EF4444'
              const corIps = d.ipsCYoY <= 2.5 ? '#10B981' : d.ipsCYoY <= 4 ? '#EAB308' : '#EF4444'
              const corPmi = d.pmi > 50 ? '#10B981' : '#EF4444'
              return (
                <div key={d.pais} className="flex flex-col">
                  <div role="button" tabIndex={0} onClick={() => setPaisSeleccionado(d.pais === paisSeleccionado ? null : d.pais)}
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
                  {paisSeleccionado === d.pais && (
                    <div className="bg-black border-b border-neutral-900 p-4 font-mono text-[10px] grid grid-cols-4 gap-4 text-neutral-300">
                      <div>
                        <div className="text-neutral-500 mb-1">Banco Central</div>
                        <div className="text-white font-bold">{d.bancoCentral}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 mb-1">PIB Trimestral (QoQ)</div>
                        <div className="text-white">{d.pibTrimYoY >= 0 ? '+' : ''}{d.pibTrimYoY.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 mb-1">Balança Comercial</div>
                        <div className="text-white">{d.balancaComercial > 0 ? `+${d.balancaComercial}M` : `${d.balancaComercial}M`} USD</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 mb-1">Défice Fiscal</div>
                        <div className="text-white">{d.deficeFiscal.toFixed(1)}% do PIB</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 mb-1">Inflação Core</div>
                        <div className="text-white">{d.ipsCCore.toFixed(1)}% YoY</div>
                      </div>
                    </div>
                  )}
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
                    <div className="text-[10px] text-neutral-300">Core: {d.ipsCCore.toFixed(1)}%</div>
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
            <p className="font-mono text-[10px] text-neutral-300 text-center">PMI acima de 50 = expansão económica  ·  Abaixo de 50 = contracção</p>
          </div>
        )}

        {tab === 'yield-curves' && (
          <div className="p-4">
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={YIELD_CURVES} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="maturidade" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#374151' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '10px', fontFamily: 'monospace', color: '#FFF' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="us" name="EUA (Treasuries)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="eu" name="Alemanha (Bunds)" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="uk" name="Reino Unido (Gilts)" stroke="#A78BFA" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono text-[10px] text-neutral-300 text-center">Uma curva invertida (taxas de curto prazo maiores que de longo prazo) é historicamente um indicador de recessão eminente.</p>
          </div>
        )}

        {tab === 'risco-recessao' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Gráfico 1: Probabilidade */}
            <div className="h-[270px] bg-neutral-900 border border-neutral-800 rounded p-4 relative flex flex-col items-center justify-center overflow-hidden">
              <span className="text-[10px] font-bold text-neutral-400 absolute top-4 left-4 z-10">PROBABILIDADE DE RECESSÃO (12M)</span>
              <div className="mt-5 flex items-center justify-center w-full h-[210px] min-w-[300px]">
                <BarChart width={320} height={210} data={RISCO_RECESSAO} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="pais" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipMacro />} />
                  <Bar dataKey="probabilidade" name="Probabilidade" radius={[0, 4, 4, 0]}>
                    {RISCO_RECESSAO.map((d) => (
                      <Cell key={d.pais} fill={d.probabilidade > 60 ? '#EF4444' : d.probabilidade > 40 ? '#F59E0B' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            </div>

            {/* Gráfico 2: Radar de Vectores */}
            <div className="h-[270px] bg-neutral-900 border border-neutral-800 rounded p-4 relative flex flex-col items-center justify-center overflow-hidden">
              <span className="text-[10px] font-bold text-neutral-400 absolute top-4 left-4 z-10">VECTORES DE ESTAGNAÇÃO</span>
              <div className="mt-5 flex items-center justify-center w-full h-[210px] min-w-[300px]">
                <RadarChart width={320} height={210} cx="50%" cy="50%" outerRadius={60} data={RISCO_RECESSAO}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="pais" tick={{ fill: '#9CA3AF', fontSize: 9, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[40, 110]} tick={{ fill: '#4B5563', fontSize: 8 }} />
                  <Radar name="Indicador Lider (%)" dataKey="indicadorLider" stroke={corTema} fill={corTema} fillOpacity={0.3} />
                  <Radar name="Confiança Consum." dataKey="confiancaConsumidor" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '10px', fontFamily: 'monospace', color: '#FFF' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }} />
                </RadarChart>
              </div>
            </div>

            {/* Painel 3: Factores e Sinais */}
            <div className="h-[270px] bg-neutral-900 border border-neutral-800 rounded flex flex-col p-4 relative overflow-y-auto">
              <span className="text-[10px] font-bold text-neutral-400 mb-4 border-b border-neutral-800 pb-2">SINAIS TÉCNICOS DE ALERTA</span>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-neutral-300 font-bold">Curva de Sahm (Sahm Rule)</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">ACTIVADA</span>
              </div>
              <p className="text-[10px] text-neutral-500 mb-4">Média móvel de 3M da taxa de desemprego excedeu em 0.5% o mínimo dos últimos 12M.</p>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-neutral-300 font-bold">Curva de Juros Invertida</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-500">PROLONGADA</span>
              </div>
              <p className="text-[10px] text-neutral-500 mb-4">Curva US 10Y-2Y a manter-se em territorio negativo há mais de 18 meses consecutivos (factor sistémico grave).</p>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-neutral-300 font-bold">Credit Default Swaps (CDS)</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/30 text-green-400">ESTÁVEL</span>
              </div>
              <p className="text-[10px] text-neutral-500">Sem stresse no risco de incumprimento bancário nos 5Y de referência da Zona Euro e EUA corporativo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
