'use client'
import { corParaTema } from '@/lib/utils'

import { useState, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { CRYPTOS, METRICAS_GLOBAIS, formatarCapMerc, formatarPreco, type CriptoItem } from '@/lib/mocks/crypto'
import { useTerminalStore } from '@/store/terminal.store'

function GaugeIndicador({ valor, label }: { valor: number; label: string }) {
  const cor = valor < 25 ? '#EF4444' : valor < 45 ? '#F97316' : valor < 55 ? '#EAB308' : valor < 75 ? '#84CC16' : '#10B981'
  const desc = valor < 25 ? 'Medo Extremo' : valor < 45 ? 'Medo' : valor < 55 ? 'Neutro' : valor < 75 ? 'Ganância' : 'Ganância Extrema'
  const angulo = (valor / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-28 h-16">
        {/* Track */}
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#1f1f1f" strokeWidth="10" strokeLinecap="round" />
        {/* Fill */}
        <path
          d={`M 10 60 A 50 50 0 0 1 110 60`}
          fill="none"
          stroke={cor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${valor * 1.57} 157`}
          opacity="0.85"
        />
        {/* Needle */}
        <line
          x1="60" y1="60"
          x2={60 + 40 * Math.cos((angulo * Math.PI) / 180)}
          y2={60 + 40 * Math.sin((angulo * Math.PI) / 180)}
          stroke={cor} strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="4" fill={cor} />
        {/* Value */}
        <text x="60" y="52" textAnchor="middle" fill={cor} fontSize="14" fontWeight="bold" fontFamily="monospace">{valor}</text>
      </svg>
      <span className="font-mono text-[10px] font-bold" style={{ color: cor }}>{desc}</span>
      <span className="font-mono text-[9px] text-neutral-300 mt-0.5">{label}</span>
    </div>
  )
}

function CriptoRow({ item, onSeleccionar }: { item: CriptoItem; onSeleccionar: (t: string) => void }) {
  const cor24h = item.variacao24h >= 0 ? '#10B981' : '#EF4444'
  const cor7d = item.variacao7d >= 0 ? '#10B981' : '#EF4444'

  return (
    <div
      role="button" tabIndex={0}
      onClick={() => onSeleccionar(item.ticker)}
      onKeyDown={(e) => e.key === 'Enter' && onSeleccionar(item.ticker)}
      className="grid items-center px-4 py-2 border-b border-neutral-900 hover:bg-neutral-900 transition-colors cursor-pointer font-mono text-xs"
      style={{ gridTemplateColumns: '2rem 2.5rem 7rem 7rem 5rem 5rem 7rem' }}
    >
      <span className="text-neutral-300">{item.rank}</span>
      <span className="font-bold" style={{ color: item.cor }}>{item.ticker}</span>
      <span className="text-white">${formatarPreco(item.preco)}</span>
      <div className="text-right pr-4">
        <div style={{ color: cor24h }}>{item.variacao24h >= 0 ? '▲' : '▼'}{Math.abs(item.variacao24h).toFixed(2)}%</div>
        <div className="text-[10px]" style={{ color: cor7d }}>7d: {item.variacao7d >= 0 ? '+' : ''}{item.variacao7d.toFixed(2)}%</div>
      </div>
      <span className="text-neutral-400 text-right pr-2">{formatarCapMerc(item.capMerc)}</span>
      <span className="text-neutral-400 text-right pr-2">{formatarCapMerc(item.vol24h)}</span>
      {/* Mini dominância bar */}
      <div className="flex items-center gap-1">
        <div className="flex-1 h-1.5 bg-neutral-800 rounded overflow-hidden">
          <div
            className="h-full rounded"
            style={{ width: `${(item.capMerc / METRICAS_GLOBAIS.capTotalMercado) * 100 * 3}%`, backgroundColor: item.cor }}
          />
        </div>
        <span className="text-neutral-300 text-[10px]">
          {((item.capMerc / METRICAS_GLOBAIS.capTotalMercado) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export function CriptoPanel() {
  const { definirTickerActivo, definirVista, temaActual, iaDisponivel, adicionarMensagemIA, definirIACarregando } = useTerminalStore()
  const [analiseIA, setAnaliseIA] = useState('')
  const [iaLoading, setIaLoading] = useState(false)

  const corTema = corParaTema(temaActual)
  const m = METRICAS_GLOBAIS

  const handleSeleccionar = useCallback((ticker: string) => {
    definirTickerActivo(ticker, 'Commodity')
    definirVista('candlestick')
  }, [definirTickerActivo, definirVista])

  const gerarAnaliseIA = useCallback(async () => {
    if (iaLoading || !iaDisponivel) return
    setIaLoading(true)
    setAnaliseIA('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Faz uma análise concisa do mercado cripto actual com base nos dados fornecidos. Inclui: sentimento do mercado, BTC dominância, e 2-3 oportunidades/riscos principais.' }],
          context: { btcPreco: m.btcPreco, dominanciaBTC: m.dominanciaBTC, capTotal: formatarCapMerc(m.capTotalMercado), medoGanancia: m.indedoMedoGanancia, top5: CRYPTOS.slice(0, 5).map(c => ({ ticker: c.ticker, variacao24h: c.variacao24h })) },
          stream: true,
        }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let total = ''
      for (; ;) {
        const { done, value } = await reader.read()
        if (done) break
        total += dec.decode(value, { stream: true })
        setAnaliseIA(total)
      }
    } catch { setAnaliseIA('Serviço IA indisponível.') }
    finally { setIaLoading(false) }
  }, [iaLoading, iaDisponivel, m])

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">MERCADO CRIPTO</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: corTema + '22', color: corTema }}>CRYPTO</span>
        </div>
        <button
          type="button" onClick={gerarAnaliseIA}
          disabled={iaLoading || !iaDisponivel}
          className="font-mono text-[10px] px-3 py-1 rounded disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          style={{ backgroundColor: corTema + '33', color: corTema }}
        >
          {iaLoading ? '⟳ A analisar…' : <><Zap size={10} /> Análise IA</>}
        </button>
      </div>

      {/* Métricas globais */}
      <div className="grid grid-cols-4 gap-px bg-neutral-800 border-b border-neutral-800 shrink-0">
        {[
          { label: 'CAP. TOTAL', valor: formatarCapMerc(m.capTotalMercado), sub: 'mercado cripto' },
          { label: 'DOMINÂNCIA BTC', valor: `${m.dominanciaBTC}%`, sub: 'de capitalização' },
          { label: 'VOLUME 24H', valor: formatarCapMerc(m.vol24h), sub: 'negociação global' },
          { label: 'CRIPTOS', valor: m.totalCriptos.toLocaleString('pt-PT'), sub: 'activos listados' },
        ].map((m2) => (
          <div key={m2.label} className="bg-[#0A0A0A] px-4 py-2">
            <div className="font-mono text-[10px] text-neutral-300">{m2.label}</div>
            <div className="font-mono text-base font-bold text-white">{m2.valor}</div>
            <div className="font-mono text-[10px] text-neutral-200">{m2.sub}</div>
          </div>
        ))}
      </div>

      {/* Índices de sentimento */}
      <div className="flex items-center justify-around px-4 py-3 border-b border-neutral-800 shrink-0 bg-neutral-950">
        <GaugeIndicador valor={m.indedoMedoGanancia} label="Medo & Ganância" />
        <div className="w-px h-12 bg-neutral-800" />
        <GaugeIndicador valor={m.altcoinsSeason} label="Temporada Altcoin" />
        <div className="w-px h-12 bg-neutral-800" />
        <div className="text-center">
          <div className="font-mono text-2xl font-bold text-white">${formatarPreco(m.btcPreco)}</div>
          <div className="font-mono text-[10px] text-neutral-200 mt-1">BTC/USD — Referência</div>
          <div className="font-mono text-xs text-green-400 mt-0.5">▲ 4.20% (24h)</div>
        </div>
      </div>

      {/* Análise IA */}
      {analiseIA && (
        <div className="px-4 py-2 border-b border-neutral-800 shrink-0 bg-neutral-950 font-mono text-xs text-neutral-300 max-h-24 overflow-y-auto">
          <span className="text-[10px] font-bold mr-2" style={{ color: corTema }}>LLAMA 3 ›</span>
          {analiseIA}
        </div>
      )}

      {/* Tabela */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cabeçalhos */}
        <div
          className="sticky top-0 z-10 grid px-4 py-1.5 bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-300"
          style={{ gridTemplateColumns: '2rem 2.5rem 7rem 7rem 5rem 5rem 7rem' }}
        >
          <span>#</span><span>TICK</span><span>PREÇO</span><span className="text-right pr-4">VAR 24H / 7D</span>
          <span className="text-right pr-2">CAP MERC</span><span className="text-right pr-2">VOL 24H</span><span>DOMINÂNCIA</span>
        </div>
        {CRYPTOS.map((c) => <CriptoRow key={c.ticker} item={c} onSeleccionar={handleSeleccionar} />)}
      </div>
    </div>
  )
}
