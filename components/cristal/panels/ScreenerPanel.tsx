'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Screener de Acções
// ============================================================

import { useState, useMemo } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import {
  ACOES_SCREENER, filtrarEOrdenar, PRESETS_SCREENER,
  type AccaoScreener, type OrdemScreener, type DirecaoOrdem, type FiltroScreener,
} from '@/lib/mocks/screener'

const COLUNAS: { key: OrdemScreener; label: string; width: string; fmt: (v: AccaoScreener) => string; cor?: (a: AccaoScreener) => string | undefined }[] = [
  { key: 'ticker',            label: 'TICKER',  width: 'w-16', fmt: (a) => a.ticker },
  { key: 'preco',             label: 'PREÇO',   width: 'w-20', fmt: (a) => `$${a.preco.toFixed(2)}` },
  { key: 'variacao1D',        label: '1D%',     width: 'w-16', fmt: (a) => `${a.variacao1D >= 0 ? '+' : ''}${a.variacao1D.toFixed(2)}%`,  cor: (a) => a.variacao1D >= 0 ? '#10B981' : '#EF4444' },
  { key: 'variacao52s',       label: '52S%',    width: 'w-16', fmt: (a) => `${a.variacao52s >= 0 ? '+' : ''}${a.variacao52s.toFixed(1)}%`, cor: (a) => a.variacao52s >= 0 ? '#10B981' : '#EF4444' },
  { key: 'capitalMerc',       label: 'CAP($B)', width: 'w-20', fmt: (a) => a.capitalMerc >= 1000 ? `${(a.capitalMerc/1000).toFixed(1)}T` : `${a.capitalMerc.toFixed(0)}B` },
  { key: 'pe',                label: 'P/E',     width: 'w-14', fmt: (a) => a.pe.toFixed(1) },
  { key: 'dividendo',         label: 'DIV%',    width: 'w-14', fmt: (a) => `${a.dividendo.toFixed(2)}%`,    cor: (a) => a.dividendo > 2 ? '#10B981' : undefined },
  { key: 'beta',              label: 'BETA',    width: 'w-14', fmt: (a) => a.beta.toFixed(2),               cor: (a) => a.beta > 1.5 ? '#F59E0B' : a.beta < 0.5 ? '#10B981' : undefined },
  { key: 'margem',            label: 'MARG%',   width: 'w-14', fmt: (a) => `${a.margem.toFixed(1)}%`,       cor: (a) => a.margem > 20 ? '#10B981' : a.margem < 5 ? '#EF4444' : undefined },
  { key: 'crescimentoReceita',label: 'CRESC%',  width: 'w-16', fmt: (a) => `${a.crescimentoReceita >= 0 ? '+' : ''}${a.crescimentoReceita.toFixed(1)}%`, cor: (a) => a.crescimentoReceita >= 10 ? '#10B981' : a.crescimentoReceita < 0 ? '#EF4444' : undefined },
  { key: 'roe',               label: 'ROE%',    width: 'w-14', fmt: (a) => `${a.roe.toFixed(1)}%`,          cor: (a) => a.roe > 20 ? '#10B981' : undefined },
]

export function ScreenerPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const [ordem,    setOrdem]    = useState<OrdemScreener>('capitalMerc')
  const [dir,      setDir]      = useState<DirecaoOrdem>('desc')
  const [filtros,  setFiltros]  = useState<FiltroScreener>({})
  const [pesquisa, setPesquisa] = useState('')
  const [presetActivo, setPresetActivo] = useState<string | null>(null)

  const dados = useMemo(() => {
    let base = ACOES_SCREENER
    if (pesquisa) {
      const q = pesquisa.toLowerCase()
      base = base.filter((a) =>
        a.ticker.toLowerCase().includes(q) || a.nome.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q)
      )
    }
    return filtrarEOrdenar(base, filtros, ordem, dir)
  }, [filtros, ordem, dir, pesquisa])

  function toggleOrdem(k: OrdemScreener) {
    if (ordem === k) setDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setOrdem(k); setDir('desc') }
  }

  function aplicarPreset(idx: number) {
    const p = PRESETS_SCREENER[idx]!
    if (presetActivo === p.nome) {
      setFiltros({})
      setPresetActivo(null)
    } else {
      setFiltros(p.filtros)
      setOrdem(p.ordem)
      setDir('desc')
      setPresetActivo(p.nome)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">

      {/* ── Cabeçalho ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div>
          <span className="text-xs font-bold" style={{ color: corTema }}>SCR — SCREENER DE ACÇÕES</span>
          <span className="text-[10px] text-neutral-500 ml-2">{dados.length} resultados</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar ticker ou empresa…"
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1 text-[11px] text-neutral-300 placeholder-neutral-600 outline-none w-52"
            style={{ fontFamily: 'IBM Plex Mono' }}
          />
        </div>
      </div>

      {/* ── Presets ────────────────────────────────────────────── */}
      <div className="flex gap-2 px-4 py-2 border-b border-neutral-900 shrink-0 overflow-x-auto">
        {PRESETS_SCREENER.map((p, i) => (
          <button
            key={p.nome}
            type="button"
            onClick={() => aplicarPreset(i)}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1 rounded border whitespace-nowrap transition-colors shrink-0"
            style={{
              borderColor: presetActivo === p.nome ? corTema : '#374151',
              color:       presetActivo === p.nome ? corTema : '#9CA3AF',
              background:  presetActivo === p.nome ? corTema + '18' : 'transparent',
            }}
          >
            <span>{p.icone}</span>
            <span>{p.nome}</span>
          </button>
        ))}
        {(presetActivo || Object.keys(filtros).length > 0) && (
          <button
            type="button"
            onClick={() => { setFiltros({}); setPresetActivo(null) }}
            className="text-[10px] px-2 py-1 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {/* ── Filtros rápidos ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-neutral-900 shrink-0 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-600">P/E max:</span>
          <input
            type="number"
            value={filtros.peMax ?? ''}
            onChange={(e) => setFiltros((f) => ({ ...f, peMax: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-300 outline-none"
            placeholder="—"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-600">Div.% mín:</span>
          <input
            type="number"
            step="0.1"
            value={filtros.dividendoMin ?? ''}
            onChange={(e) => setFiltros((f) => ({ ...f, dividendoMin: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-300 outline-none"
            placeholder="—"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-600">Beta max:</span>
          <input
            type="number"
            step="0.1"
            value={filtros.betaMax ?? ''}
            onChange={(e) => setFiltros((f) => ({ ...f, betaMax: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-300 outline-none"
            placeholder="—"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-600">Cap mín($B):</span>
          <input
            type="number"
            value={filtros.capitalMercMin ?? ''}
            onChange={(e) => setFiltros((f) => ({ ...f, capitalMercMin: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-300 outline-none"
            placeholder="—"
          />
        </div>
      </div>

      {/* ── Tabela ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead className="sticky top-0 bg-[#0A0A0A] z-10">
            <tr className="border-b border-neutral-800">
              <th className="text-left px-3 py-2 text-neutral-600 font-normal w-6">#</th>
              <th className="text-left px-3 py-2 text-neutral-600 font-normal w-8">🌍</th>
              {COLUNAS.map((col) => (
                <th
                  key={col.key}
                  className={`${col.width} px-2 py-2 text-right font-normal cursor-pointer hover:text-neutral-300 transition-colors select-none`}
                  style={{ color: ordem === col.key ? corTema : '#6B7280' }}
                  onClick={() => toggleOrdem(col.key)}
                >
                  {col.label}
                  {ordem === col.key && (
                    <span className="ml-1">{dir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
              ))}
              <th className="text-right px-3 py-2 text-neutral-600 font-normal w-20">SECTOR</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((a, i) => (
              <tr
                key={a.ticker}
                onClick={() => { definirTickerActivo(a.ticker); definirVista('candlestick') }}
                className="border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer transition-colors group"
              >
                <td className="px-3 py-1.5 text-neutral-700">{i + 1}</td>
                <td className="px-3 py-1.5 text-sm">{a.pais}</td>
                {COLUNAS.map((col) => {
                  const cor = col.cor ? col.cor(a) : undefined
                  const isOrdem = col.key === ordem
                  return (
                    <td
                      key={col.key}
                      className={`${col.width} px-2 py-1.5 text-right`}
                      style={{
                        color: cor ?? (isOrdem ? '#E5E7EB' : '#9CA3AF'),
                        fontWeight: col.key === 'ticker' ? 'bold' : 'normal',
                      }}
                    >
                      {col.key === 'ticker' ? (
                        <span style={{ color: corTema }}>{a.ticker}</span>
                      ) : col.fmt(a)}
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-right text-[9px] text-neutral-600 group-hover:text-neutral-500">
                  {a.sector}
                </td>
              </tr>
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length + 3} className="px-4 py-8 text-center text-neutral-600">
                  Sem resultados para os filtros actuais
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer com métricas do grupo ───────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-neutral-800 shrink-0 text-[10px] text-neutral-600">
        <span>Cap média: <span className="text-neutral-400">${(dados.reduce((s, a) => s + a.capitalMerc, 0) / (dados.length || 1)).toFixed(0)}B</span></span>
        <span>P/E médio: <span className="text-neutral-400">{(dados.reduce((s, a) => s + a.pe, 0) / (dados.length || 1)).toFixed(1)}x</span></span>
        <span>Div. médio: <span className="text-neutral-400">{(dados.reduce((s, a) => s + a.dividendo, 0) / (dados.length || 1)).toFixed(2)}%</span></span>
        <span>Beta médio: <span className="text-neutral-400">{(dados.reduce((s, a) => s + a.beta, 0) / (dados.length || 1)).toFixed(2)}</span></span>
      </div>
    </div>
  )
}
