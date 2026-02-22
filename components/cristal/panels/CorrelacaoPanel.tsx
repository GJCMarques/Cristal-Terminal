'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Matriz de Correlação de Activos
// ============================================================

import { useState } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import { CORRELACAO_DADOS, getCorCorrelacao, getTextCorrelacao } from '@/lib/mocks/correlacao'

export function CorrelacaoPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const [selecionado, setSelecionado] = useState<{ r: number; c: number } | null>(null)
  const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const { activos, matrix, nomes, categorias } = CORRELACAO_DADOS
  const n = activos.length

  const infoSelecionado = selecionado
    ? {
        ativoA: activos[selecionado.r]!,
        ativoB: activos[selecionado.c]!,
        corr:   matrix[selecionado.r]![selecionado.c]!,
      }
    : null

  function interpretarCorrelacao(v: number): { texto: string; cor: string } {
    const abs = Math.abs(v)
    const dir = v >= 0 ? 'positiva' : 'negativa'
    if (abs >= 0.8) return { texto: `Correlação ${dir} muito forte`, cor: v >= 0 ? '#10B981' : '#EF4444' }
    if (abs >= 0.6) return { texto: `Correlação ${dir} forte`, cor: v >= 0 ? '#34D399' : '#F87171' }
    if (abs >= 0.4) return { texto: `Correlação ${dir} moderada`, cor: v >= 0 ? '#6EE7B7' : '#FCA5A5' }
    if (abs >= 0.2) return { texto: `Correlação ${dir} fraca`, cor: '#9CA3AF' }
    return { texto: 'Sem correlação significativa', cor: '#6B7280' }
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">
      {/* ── Cabeçalho ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div>
          <span className="text-xs font-bold" style={{ color: corTema }}>CORR — MATRIZ DE CORRELAÇÃO</span>
          <span className="text-[10px] text-neutral-500 ml-2">60 dias · Fecho diário</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: '#1b5e20' }} /> Forte +</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: '#1a1a2e' }} /> Neutra</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: '#b71c1c' }} /> Forte −</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Matriz ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-3">
          <table className="border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="w-16" />
                {activos.map((a, c) => (
                  <th
                    key={c}
                    className="w-12 h-8 text-center font-mono font-normal text-[9px] pb-1"
                    style={{
                      color: hover?.c === c || selecionado?.c === c ? corTema : '#6B7280',
                      fontWeight: hover?.c === c || selecionado?.c === c ? 'bold' : 'normal',
                    }}
                  >
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activos.map((aR, r) => (
                <tr key={r}>
                  <td
                    className="pr-2 text-right text-[9px] py-0.5 font-mono"
                    style={{
                      color: hover?.r === r || selecionado?.r === r ? corTema : '#6B7280',
                      fontWeight: hover?.r === r || selecionado?.r === r ? 'bold' : 'normal',
                    }}
                  >
                    {aR}
                  </td>
                  {activos.map((_, c) => {
                    const val = matrix[r]![c]!
                    const bg  = getCorCorrelacao(val)
                    const fg  = getTextCorrelacao(val)
                    const isHover = hover?.r === r && hover?.c === c
                    const isSel   = selecionado?.r === r && selecionado?.c === c
                    const isDiag  = r === c
                    return (
                      <td
                        key={c}
                        onMouseEnter={() => setHover({ r, c })}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => setSelecionado(isSel ? null : { r, c })}
                        className="w-12 h-10 text-center cursor-pointer transition-all"
                        style={{
                          background: isDiag ? '#1a1a1a' : bg,
                          color:      isDiag ? '#374151' : fg,
                          outline:    isHover || isSel ? `1.5px solid ${corTema}` : 'none',
                          outlineOffset: '-1px',
                          fontSize: 9,
                          fontFamily: 'IBM Plex Mono',
                          opacity: hover && !isHover && hover.r !== r && hover.c !== c ? 0.5 : 1,
                        }}
                      >
                        {isDiag ? '—' : val.toFixed(2)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Painel lateral de info ───────────────────────────── */}
        <div className="w-56 border-l border-neutral-800 p-3 flex flex-col gap-4 shrink-0 overflow-y-auto">
          {/* Info par selecionado */}
          {infoSelecionado ? (
            <div>
              <div className="text-[10px] font-bold mb-2" style={{ color: corTema }}>
                PAR SELECIONADO
              </div>
              <div className="flex items-center gap-1 mb-1">
                <button
                  type="button"
                  onClick={() => { definirTickerActivo(infoSelecionado.ativoA); definirVista('candlestick') }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-300 hover:border-neutral-500"
                >
                  {infoSelecionado.ativoA}
                </button>
                <span className="text-neutral-600">×</span>
                <button
                  type="button"
                  onClick={() => { definirTickerActivo(infoSelecionado.ativoB); definirVista('candlestick') }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-300 hover:border-neutral-500"
                >
                  {infoSelecionado.ativoB}
                </button>
              </div>
              <div
                className="text-3xl font-black text-center my-3"
                style={{ color: infoSelecionado.corr >= 0 ? '#10B981' : '#EF4444' }}
              >
                {infoSelecionado.corr.toFixed(2)}
              </div>
              {(() => {
                const { texto, cor } = interpretarCorrelacao(infoSelecionado.corr)
                return <div className="text-[10px] text-center" style={{ color: cor }}>{texto}</div>
              })()}

              <div className="mt-3 text-[9px] text-neutral-600 space-y-1">
                <div>{nomes[infoSelecionado.ativoA]} · {categorias[infoSelecionado.ativoA]}</div>
                <div>{nomes[infoSelecionado.ativoB]} · {categorias[infoSelecionado.ativoB]}</div>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-neutral-600 text-center pt-4">
              Clique numa célula para ver detalhes do par
            </div>
          )}

          {/* Escala de correlação */}
          <div>
            <div className="text-[9px] font-bold text-neutral-600 mb-2">ESCALA</div>
            {[
              { label: '+0.8 a +1.0', cor: '#1b5e20',  desc: 'Muito forte +' },
              { label: '+0.5 a +0.8', cor: '#388e3c',  desc: 'Forte +'       },
              { label: '+0.2 a +0.5', cor: '#66bb6a',  desc: 'Fraca +'       },
              { label: '−0.2 a +0.2', cor: '#1a1a2e',  desc: 'Sem correlação'},
              { label: '−0.5 a −0.2', cor: '#e53935',  desc: 'Fraca −'       },
              { label: '−0.8 a −0.5', cor: '#b71c1c',  desc: 'Forte −'       },
              { label: '<−0.8',        cor: '#7f0000',  desc: 'Muito forte −' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 mb-1">
                <span className="w-10 h-3 rounded shrink-0" style={{ background: s.cor }} />
                <div className="text-[9px] leading-tight">
                  <div className="text-neutral-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top correlações */}
          <div>
            <div className="text-[9px] font-bold text-neutral-600 mb-2">MAIORES CORRELAÇÕES</div>
            {Array.from({ length: n }, (_, r) =>
              Array.from({ length: n }, (_, c) =>
                r < c ? { r, c, v: matrix[r]![c]! } : null
              )
            ).flat()
              .filter(Boolean)
              .sort((a, b) => Math.abs(b!.v) - Math.abs(a!.v))
              .slice(0, 5)
              .map((p, i) => p && (
                <div
                  key={i}
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-neutral-900 rounded px-1"
                  onClick={() => setSelecionado({ r: p.r, c: p.c })}
                >
                  <span className="text-[9px] text-neutral-500">
                    {activos[p.r]}/{activos[p.c]}
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: p.v >= 0 ? '#10B981' : '#EF4444' }}
                  >
                    {p.v.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
