'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Monitor de Notícias
// API real (NewsAPI.org) ou mocks expandidos · Pesquisa · Paginação
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import { Globe, Package, Search, X, TrendingUp, Minus, TrendingDown, Newspaper } from 'lucide-react'

interface Noticia {
  id: string
  titulo: string
  resumo: string
  fonte: string
  categoria: string
  timestamp: string
  url: string
  sentimento: 'positivo' | 'neutro' | 'negativo'
  pontuacaoSentimento: number
  urgente: boolean
  tickers: string[]
  bandeira: string
}

const COR_SENT: Record<string, string> = {
  positivo: '#10B981',
  neutro: '#6B7280',
  negativo: '#EF4444',
}

const ICONE_SENT: Record<string, React.ReactNode> = {
  positivo: <TrendingUp size={12} />,
  neutro: <Minus size={12} />,
  negativo: <TrendingDown size={12} />,
}

const CATEGORIAS = [
  { id: '', label: 'Todas' },
  { id: 'mercados', label: 'Mercados' },
  { id: 'tecnologia', label: 'Tecnologia' },
  { id: 'cripto', label: 'Cripto' },
  { id: 'macro', label: 'Macro' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'bancos-centrais', label: 'Bcos. Centrais' },
  { id: 'europa', label: 'Europa' },
  { id: 'financeiro', label: 'Financeiro' },
]

function tempoRelativo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Agora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function BarraSentimento({ pontuacao }: { pontuacao: number }) {
  const largura = `${Math.abs(pontuacao) * 100}%`
  const cor = pontuacao >= 0.2 ? '#10B981' : pontuacao <= -0.2 ? '#EF4444' : '#6B7280'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-0.5 bg-neutral-800 rounded overflow-hidden relative">
        <div className="h-full rounded" style={{ width: largura, background: cor }} />
      </div>
      <span className="text-[9px] font-mono shrink-0" style={{ color: cor }}>
        {pontuacao > 0 ? '+' : ''}{(pontuacao * 100).toFixed(0)}
      </span>
    </div>
  )
}

export function NewsPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [seleccionada, setSeleccionada] = useState<Noticia | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [pesquisaInput, setPesquisaInput] = useState('')
  const [categoria, setCategoria] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [fonteAPI, setFonteAPI] = useState<'newsapi' | 'mock'>('mock')
  const limite = 50

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams()
      if (pesquisa) params.set('q', pesquisa)
      if (categoria) params.set('categoria', categoria)
      params.set('pagina', String(pagina))
      params.set('limite', String(limite))

      const res = await fetch(`/api/news?${params.toString()}`)
      const data = await res.json()
      setNoticias(data.noticias ?? [])
      setTotal(data.total ?? 0)
      setFonteAPI(data.fonte ?? 'mock')
    } catch {
      setNoticias([])
    } finally {
      setCarregando(false)
    }
  }, [pesquisa, categoria, pagina])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { setPagina(1) }, [pesquisa, categoria])

  function submeterPesquisa(e: React.FormEvent) {
    e.preventDefault()
    setPesquisa(pesquisaInput)
  }

  const totalPaginas = Math.ceil(total / limite)

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">

      {/* ── Cabeçalho + pesquisa ──────────────────────────────── */}
      <div className="border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <span className="text-xs font-bold" style={{ color: corTema }}>NWSM — MONITOR DE NOTÍCIAS</span>
            <span className="text-[10px] text-neutral-200 ml-2">
              {fonteAPI === 'newsapi' ? <><Globe size={10} className="inline-block relative -top-0.5" /> NewsAPI.org</> : <><Package size={10} className="inline-block relative -top-0.5" /> Local</>} · {total} artigos
            </span>
          </div>
          <form onSubmit={submeterPesquisa} className="flex items-center gap-2">
            <input
              type="text"
              value={pesquisaInput}
              onChange={(e) => setPesquisaInput(e.target.value)}
              placeholder="Pesquisar…"
              className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1 text-[11px] text-neutral-300 placeholder-neutral-600 outline-none w-40"
              style={{ fontFamily: 'IBM Plex Mono' }}
            />
            <button type="submit" className="text-[10px] px-2 py-1 rounded border border-neutral-700 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"><Search size={10} /></button>
            {(pesquisa || pesquisaInput) && (
              <button type="button" onClick={() => { setPesquisa(''); setPesquisaInput('') }} className="text-neutral-200 hover:text-neutral-300 flex items-center justify-center"><X size={12} /></button>
            )}
          </form>
        </div>

        {/* Categorias */}
        <div className="flex gap-0.5 px-4 pb-2 overflow-x-auto">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoria(c.id)}
              className="text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors shrink-0"
              style={{
                borderColor: categoria === c.id ? corTema : '#374151',
                color: categoria === c.id ? corTema : '#6B7280',
                background: categoria === c.id ? corTema + '18' : 'transparent',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Corpo ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Lista */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {carregando ? (
            <div className="flex items-center justify-center h-32 text-neutral-300 text-xs animate-pulse">
              A carregar notícias…
            </div>
          ) : noticias.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-neutral-300 text-xs">
              Sem notícias para os filtros actuais
            </div>
          ) : (
            noticias.map((n) => {
              const isSel = seleccionada?.id === n.id
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSeleccionada(isSel ? null : n)}
                  onKeyDown={(e) => e.key === 'Enter' && setSeleccionada(isSel ? null : n)}
                  className="border-b border-neutral-900 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{
                    background: isSel ? corTema + '10' : 'transparent',
                    borderLeft: isSel ? `3px solid ${corTema}` : '3px solid transparent',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[11px] mt-0.5 shrink-0" style={{ color: COR_SENT[n.sentimento] }}>
                      {ICONE_SENT[n.sentimento]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] leading-snug text-neutral-200 mb-1 line-clamp-2">
                        {n.urgente && <span className="text-[8px] font-bold text-red-500 mr-1">URGENTE</span>}
                        <Newspaper size={10} className="inline-block relative -top-0.5 mr-1 text-neutral-200" /> {n.titulo}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-neutral-300">{n.fonte}</span>
                        <span className="text-[9px] text-neutral-400">·</span>
                        <span className="text-[9px] text-neutral-300">{tempoRelativo(n.timestamp)}</span>
                        {n.tickers.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); definirTickerActivo(t); definirVista('candlestick') }}
                            className="text-[9px] px-1 py-0.5 rounded font-bold transition-colors"
                            style={{ color: corTema, background: corTema + '18' }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="mt-1">
                        <BarraSentimento pontuacao={n.pontuacaoSentimento} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Detalhe */}
        {seleccionada && (
          <div className="w-72 border-l border-neutral-800 flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
              <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: COR_SENT[seleccionada.sentimento] }}>
                {seleccionada.sentimento.toUpperCase()} {ICONE_SENT[seleccionada.sentimento]}
              </span>
              <button type="button" onClick={() => setSeleccionada(null)} className="text-neutral-300 hover:text-neutral-400 flex items-center justify-center"><X size={12} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs font-bold text-neutral-100 leading-snug mb-3">{seleccionada.titulo}</div>
              <div className="text-[11px] text-neutral-400 leading-relaxed mb-4">{seleccionada.resumo}</div>
              <div className="text-[9px] text-neutral-300 space-y-1 mb-3">
                <div>Fonte: <span className="text-neutral-400">{seleccionada.fonte}</span></div>
                <div>Data: <span className="text-neutral-400">{new Date(seleccionada.timestamp).toLocaleString('pt-PT')}</span></div>
              </div>
              <div className="mb-4">
                <div className="text-[9px] text-neutral-300 mb-1">SENTIMENTO</div>
                <BarraSentimento pontuacao={seleccionada.pontuacaoSentimento} />
              </div>
              {seleccionada.tickers.length > 0 && (
                <div>
                  <div className="text-[9px] text-neutral-300 mb-2">INSTRUMENTOS</div>
                  <div className="flex flex-wrap gap-1">
                    {seleccionada.tickers.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { definirTickerActivo(t); definirVista('candlestick') }}
                        className="text-[10px] px-2 py-1 rounded font-bold border transition-colors"
                        style={{ color: corTema, borderColor: corTema + '66', background: corTema + '12' }}
                      >
                        {t} →
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {seleccionada.url !== '#' && (
                <a href={seleccionada.url} target="_blank" rel="noopener noreferrer" className="block mt-4 text-[10px] text-neutral-300 hover:text-neutral-400 underline">
                  Ver artigo completo ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Paginação ─────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 border-t border-neutral-800 shrink-0">
          <button type="button" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}
            className="text-[10px] px-2 py-0.5 rounded border border-neutral-700 text-neutral-200 disabled:opacity-30 hover:text-neutral-300">
            ← Ant.
          </button>
          {Array.from({ length: Math.min(7, totalPaginas) }, (_, i) => {
            const pg = pagina <= 4 ? i + 1
              : pagina >= totalPaginas - 3 ? totalPaginas - 6 + i
                : pagina - 3 + i
            if (pg < 1 || pg > totalPaginas) return null
            return (
              <button key={pg} type="button" onClick={() => setPagina(pg)}
                className="text-[10px] w-5 h-5 rounded border transition-colors"
                style={{ borderColor: pagina === pg ? corTema : '#374151', color: pagina === pg ? corTema : '#6B7280', background: pagina === pg ? corTema + '18' : 'transparent' }}>
                {pg}
              </button>
            )
          })}
          <button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)}
            className="text-[10px] px-2 py-0.5 rounded border border-neutral-700 text-neutral-200 disabled:opacity-30 hover:text-neutral-300">
            Seg. →
          </button>
        </div>
      )}
    </div>
  )
}
