'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Sentinela IA (Alertas & Triggers)
// ============================================================

import { useState } from 'react'
import { Bell, BellOff, Plus, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import type { TipoAlerta } from '@/types/terminal'

const TIPO_LABELS: Record<TipoAlerta, string> = {
  preco_acima:   'Preço acima de',
  preco_abaixo:  'Preço abaixo de',
  variacao_pct:  'Variação diária >',
  volume_spike:  'Volume anormal',
  noticia:       'Menção em notícias',
}

const TIPO_ICONE: Record<TipoAlerta, React.ReactNode> = {
  preco_acima:  <AlertTriangle size={10} />,
  preco_abaixo: <AlertTriangle size={10} />,
  variacao_pct: <AlertTriangle size={10} />,
  volume_spike: <AlertTriangle size={10} />,
  noticia:      <Bell size={10} />,
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// Templates de alertas rápidos
const TEMPLATES = [
  { label: 'S&P 500 > 6.500',        ticker: 'SPX',   tipo: 'preco_acima'  as TipoAlerta, valor: 6500   },
  { label: 'BTC < $80.000',          ticker: 'BTC',   tipo: 'preco_abaixo' as TipoAlerta, valor: 80000  },
  { label: 'NVDA variação > 5%',     ticker: 'NVDA',  tipo: 'variacao_pct' as TipoAlerta, valor: 5      },
  { label: 'EUR/USD > 1.10',         ticker: 'EURUSD',tipo: 'preco_acima'  as TipoAlerta, valor: 1.10   },
  { label: 'Ouro > $3.000',          ticker: 'XAU',   tipo: 'preco_acima'  as TipoAlerta, valor: 3000   },
  { label: 'AAPL < $190',            ticker: 'AAPL',  tipo: 'preco_abaixo' as TipoAlerta, valor: 190    },
]

export function SentinelaPanel() {
  const {
    alertasSentinela,
    adicionarAlerta,
    removerAlerta,
    toggleAlerta,
    temaActual,
  } = useTerminalStore()

  const corTema = temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  // Formulário de novo alerta
  const [novoTicker, setNovoTicker] = useState('')
  const [novoTipo,   setNovoTipo]   = useState<TipoAlerta>('preco_acima')
  const [novoValor,  setNovoValor]  = useState('')
  const [formAberto, setFormAberto] = useState(false)

  const alertasActivos   = alertasSentinela.filter((a) => a.ativo && !a.disparadoEm)
  const alertasDisparados = alertasSentinela.filter((a) => a.disparadoEm)
  const alertasInactivos = alertasSentinela.filter((a) => !a.ativo && !a.disparadoEm)

  function submeterAlerta() {
    if (!novoTicker.trim()) return
    const valor = parseFloat(novoValor)
    if (isNaN(valor) && novoTipo !== 'noticia') return

    adicionarAlerta({
      ticker:     novoTicker.trim().toUpperCase(),
      tipo:       novoTipo,
      valor:      isNaN(valor) ? 0 : valor,
      label:      `${novoTicker.trim().toUpperCase()} — ${TIPO_LABELS[novoTipo]} ${isNaN(valor) ? '' : valor}`,
      ativo:      true,
    })
    setNovoTicker('')
    setNovoValor('')
    setFormAberto(false)
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono overflow-hidden">

      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={14} style={{ color: corTema }} />
          <span className="text-xs font-bold" style={{ color: corTema }}>SENTINELA — ALERTAS & TRIGGERS IA</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: corTema + '22', color: corTema }}
          >
            {alertasActivos.length} activos
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFormAberto(!formAberto)}
          className="flex items-center gap-1 text-[10px] px-3 py-1 rounded border transition-colors"
          style={{
            borderColor: corTema,
            color:       corTema,
            background:  formAberto ? corTema + '18' : 'transparent',
          }}
        >
          <Plus size={11} />
          <span>Novo Alerta</span>
        </button>
      </div>

      {/* ── Formulário de novo alerta ─────────────────────── */}
      {formAberto && (
        <div className="border-b border-neutral-800 bg-neutral-950 px-4 py-3 shrink-0">
          <div className="text-[9px] font-bold mb-2" style={{ color: corTema }}>CONFIGURAR ALERTA</div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-600">TICKER</label>
              <input
                type="text"
                value={novoTicker}
                onChange={(e) => setNovoTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] text-white outline-none w-24"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-600">CONDIÇÃO</label>
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value as TipoAlerta)}
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] text-white outline-none"
              >
                {(Object.entries(TIPO_LABELS) as [TipoAlerta, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {novoTipo !== 'noticia' && novoTipo !== 'volume_spike' && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-neutral-600">VALOR</label>
                <input
                  type="number"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  placeholder="0"
                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] text-white outline-none w-24"
                />
              </div>
            )}
            <button
              type="button"
              onClick={submeterAlerta}
              className="flex items-center gap-1 text-[11px] px-4 py-1.5 rounded transition-colors font-bold"
              style={{ backgroundColor: corTema, color: '#000' }}
            >
              <Plus size={11} />
              Criar
            </button>
          </div>

          {/* Templates rápidos */}
          <div className="mt-3">
            <div className="text-[9px] text-neutral-600 mb-1.5">TEMPLATES RÁPIDOS</div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => adicionarAlerta({ ticker: t.ticker, tipo: t.tipo, valor: t.valor, label: t.label, ativo: true })}
                  className="text-[9px] px-2 py-0.5 rounded border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                >
                  + {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Lista de alertas ──────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">

        {/* Activos */}
        {alertasActivos.length > 0 && (
          <div>
            <div className="px-4 py-1.5 text-[9px] font-bold border-b border-neutral-900 sticky top-0 bg-[#0A0A0A]" style={{ color: corTema }}>
              ACTIVOS — MONITORIZAÇÃO EM CURSO
            </div>
            {alertasActivos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-900 hover:bg-neutral-900 transition-colors group">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: corTema }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.ticker && (
                      <span className="text-[10px] font-bold px-1 rounded" style={{ backgroundColor: corTema + '22', color: corTema }}>
                        {a.ticker}
                      </span>
                    )}
                    <span className="text-[11px] text-white truncate">{a.label}</span>
                  </div>
                  <div className="text-[9px] text-neutral-600 mt-0.5">
                    <Clock size={8} className="inline mr-1" />
                    Criado {formatarData(a.criadoEm)}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => toggleAlerta(a.id)}
                    title="Desactivar"
                    className="text-neutral-600 hover:text-amber-400 transition-colors"
                  >
                    <BellOff size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerAlerta(a.id)}
                    title="Remover"
                    className="text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disparados */}
        {alertasDisparados.length > 0 && (
          <div>
            <div className="px-4 py-1.5 text-[9px] font-bold border-b border-neutral-900 sticky top-0 bg-[#0A0A0A] text-amber-500">
              DISPARADOS
            </div>
            {alertasDisparados.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-900 hover:bg-neutral-900 transition-colors group">
                <CheckCircle size={12} className="shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.ticker && (
                      <span className="text-[10px] font-bold px-1 rounded bg-amber-500/20 text-amber-400">
                        {a.ticker}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-300 truncate">{a.label}</span>
                  </div>
                  {a.mensagem && (
                    <div className="text-[9px] text-amber-600 mt-0.5">{a.mensagem}</div>
                  )}
                  <div className="text-[9px] text-neutral-600 mt-0.5">
                    Disparado {a.disparadoEm ? formatarData(a.disparadoEm) : '—'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removerAlerta(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inactivos */}
        {alertasInactivos.length > 0 && (
          <div>
            <div className="px-4 py-1.5 text-[9px] font-bold border-b border-neutral-900 sticky top-0 bg-[#0A0A0A] text-neutral-600">
              INACTIVOS
            </div>
            {alertasInactivos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-900 hover:bg-neutral-900 transition-colors group opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.ticker && (
                      <span className="text-[10px] font-bold px-1 rounded bg-neutral-800 text-neutral-500">
                        {a.ticker}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-500 truncate">{a.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => toggleAlerta(a.id)}
                    title="Activar"
                    className="text-neutral-600 hover:text-green-400 transition-colors"
                  >
                    <Bell size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerAlerta(a.id)}
                    title="Remover"
                    className="text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {alertasSentinela.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-neutral-700 gap-3 p-8">
            <Bell size={32} />
            <div className="text-sm">Sem alertas configurados</div>
            <div className="text-xs text-center">Crie triggers automáticos para ser notificado quando as condições de mercado forem atingidas</div>
            <button
              type="button"
              onClick={() => setFormAberto(true)}
              className="text-[10px] px-4 py-2 rounded border border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors mt-2"
            >
              + Criar primeiro alerta
            </button>
          </div>
        )}
      </div>

      {/* ── Footer info ──────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-neutral-800 shrink-0 text-[9px] text-neutral-700">
        <span>{alertasSentinela.length} alertas totais</span>
        <span>·</span>
        <span>{alertasActivos.length} activos</span>
        <span>·</span>
        <span>{alertasDisparados.length} disparados</span>
        <div className="flex-1" />
        <span>Motor de alertas: local · Em produção: WebSocket + push</span>
      </div>
    </div>
  )
}
