'use client'
import { corParaTema } from '@/lib/utils'

import { useState, useEffect } from 'react'
import { CALENDARIO_EVENTOS, obterProximoEvento, formatarCountdown, type EventoEconomico, type ImportanciaEvento } from '@/lib/mocks/calendar'
import { useTerminalStore } from '@/store/terminal.store'

function BadgeImportancia({ importancia }: { importancia: ImportanciaEvento }) {
  const cfg = {
    alta:  { cor: '#EF4444', label: '●●●', title: 'Alta Importância' },
    media: { cor: '#F59E0B', label: '●●○', title: 'Média Importância' },
    baixa: { cor: '#6B7280', label: '●○○', title: 'Baixa Importância' },
  }[importancia]
  return (
    <span title={cfg.title} className="font-mono text-[10px] tracking-widest shrink-0" style={{ color: cfg.cor }}>
      {cfg.label}
    </span>
  )
}

function BadgeEstado({ evento }: { evento: EventoEconomico }) {
  if (evento.estado === 'publicado') {
    const desvio = evento.actual && evento.previsao
      ? parseFloat(evento.actual) - parseFloat(evento.previsao)
      : null
    const cor = desvio === null ? '#6B7280' : desvio > 0 ? '#10B981' : '#EF4444'
    return (
      <span className="font-mono text-[10px] font-bold" style={{ color: cor }}>
        {evento.actual ?? '—'}
      </span>
    )
  }
  const diffMs = new Date(evento.timestamp).getTime() - Date.now()
  if (diffMs <= 0) return <span className="font-mono text-[10px] text-yellow-400 animate-pulse">AO VIVO</span>
  if (diffMs < 3_600_000) {
    return <span className="font-mono text-[10px] text-orange-400 animate-pulse">Em breve</span>
  }
  return <span className="font-mono text-[10px] text-neutral-300">{formatarCountdown(evento.timestamp)}</span>
}

function EventoRow({ evento, activo, onClick }: { evento: EventoEconomico; activo: boolean; onClick: () => void }) {
  const hora = new Date(evento.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  const dataEvento = new Date(evento.timestamp).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const agora = Date.now()
  const isPassado = new Date(evento.timestamp).getTime() < agora && evento.estado === 'publicado'
  const desvio = evento.actual && evento.previsao ? parseFloat(evento.actual) - parseFloat(evento.previsao) : null

  return (
    <div
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="grid items-center px-4 py-2.5 border-b border-neutral-900 hover:bg-neutral-900 cursor-pointer transition-colors font-mono text-xs"
      style={{
        gridTemplateColumns: '5rem 2rem 10rem 1fr 5rem 5rem 5rem',
        opacity: isPassado ? 0.6 : 1,
        backgroundColor: activo ? '#0f1117' : undefined,
        borderLeft: evento.importancia === 'alta' ? '2px solid #EF4444' : '2px solid transparent',
      }}
    >
      <div>
        <div className="text-neutral-200 text-[10px]">{dataEvento}</div>
        <div className="text-white">{hora} UTC</div>
      </div>
      <span>{evento.bandeira}</span>
      <div>
        <div className="text-white truncate">{evento.evento}</div>
        <div className="text-[10px] text-neutral-300">{evento.categoria}</div>
      </div>
      <BadgeImportancia importancia={evento.importancia} />
      <span className="text-neutral-200 text-right">{evento.anterior ?? '—'}</span>
      <span className="text-neutral-400 text-right">{evento.previsao ?? '—'}</span>
      <div className="text-right">
        {evento.estado === 'publicado' && desvio !== null ? (
          <div>
            <span className="font-bold" style={{ color: desvio > 0 ? '#10B981' : '#EF4444' }}>{evento.actual}</span>
            <div className="text-[9px]" style={{ color: desvio > 0 ? '#10B981' : '#EF4444' }}>
              {desvio > 0 ? '▲' : '▼'} vs prev.
            </div>
          </div>
        ) : <BadgeEstado evento={evento} />}
      </div>
    </div>
  )
}

export function CalendarioPanel() {
  const { definirTickerActivo, definirVista, temaActual } = useTerminalStore()
  const [eventoActivo, setEventoActivo] = useState<string | null>(null)
  const [filtroImportancia, setFiltroImportancia] = useState<ImportanciaEvento | 'todas'>('todas')
  const [countdown, setCountdown] = useState('')

  const corTema = corParaTema(temaActual)
  const proximo = obterProximoEvento()

  // Countdown em tempo real
  useEffect(() => {
    if (!proximo) return
    const update = () => setCountdown(formatarCountdown(proximo.timestamp))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [proximo])

  const eventos = filtroImportancia === 'todas'
    ? CALENDARIO_EVENTOS
    : CALENDARIO_EVENTOS.filter((e) => e.importancia === filtroImportancia)

  const eventoDetalhe = CALENDARIO_EVENTOS.find((e) => e.id === eventoActivo)

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">CALENDÁRIO ECONÓMICO</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: corTema + '22', color: corTema }}>CAL</span>
        </div>
        {proximo && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <BadgeImportancia importancia={proximo.importancia} />
            <span className="text-neutral-400">{proximo.evento}</span>
            <span className="font-bold animate-pulse" style={{ color: corTema }}>em {countdown}</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-800 shrink-0">
        {(['todas', 'alta', 'media', 'baixa'] as const).map((f) => {
          const cfg = { todas: { label: 'TODAS', cor: corTema }, alta: { label: '●●● ALTA', cor: '#EF4444' }, media: { label: '●●○ MÉDIA', cor: '#F59E0B' }, baixa: { label: '●○○ BAIXA', cor: '#6B7280' } }[f]
          return (
            <button key={f} type="button" onClick={() => setFiltroImportancia(f)}
              className="font-mono text-[10px] px-2 py-1 rounded transition-all"
              style={{ color: filtroImportancia === f ? cfg.cor : '#4B5563', backgroundColor: filtroImportancia === f ? cfg.cor + '22' : 'transparent' }}>
              {cfg.label}
            </button>
          )
        })}
        <span className="ml-auto font-mono text-[10px] text-neutral-300">{eventos.length} eventos</span>
      </div>

      {/* Cabeçalhos colunas */}
      <div className="sticky top-0 z-10 grid px-4 py-1.5 bg-neutral-950 border-b border-neutral-800 font-mono text-[10px] text-neutral-300"
        style={{ gridTemplateColumns: '5rem 2rem 10rem 1fr 5rem 5rem 5rem' }}>
        <span>DATA/HORA</span><span></span><span>EVENTO</span><span>IMP.</span>
        <span className="text-right">ANTERIOR</span><span className="text-right">PREVISÃO</span><span className="text-right">ACTUAL</span>
      </div>

      {/* Lista */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {eventos.map((e) => (
          <EventoRow key={e.id} evento={e} activo={eventoActivo === e.id}
            onClick={() => setEventoActivo(e.id === eventoActivo ? null : e.id)} />
        ))}
      </div>

      {/* Detalhe do evento */}
      {eventoDetalhe && (
        <div className="border-t border-neutral-700 p-4 bg-neutral-950 shrink-0 font-mono text-xs">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-bold text-white">{eventoDetalhe.evento}</div>
              <div className="text-neutral-200 mt-0.5">{eventoDetalhe.bandeira} {eventoDetalhe.pais} · {eventoDetalhe.categoria}</div>
            </div>
            <button type="button" onClick={() => setEventoActivo(null)} className="text-neutral-300 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'ANTERIOR', valor: eventoDetalhe.anterior ?? '—', cor: '#6B7280' },
              { label: 'PREVISÃO', valor: eventoDetalhe.previsao ?? '—', cor: '#F59E0B' },
              { label: 'ACTUAL', valor: eventoDetalhe.actual ?? (eventoDetalhe.estado === 'pendente' ? 'Pendente' : '—'), cor: eventoDetalhe.actual ? '#10B981' : '#6B7280' },
            ].map((m) => (
              <div key={m.label} className="border border-neutral-800 rounded px-3 py-2 text-center">
                <div className="text-[10px] text-neutral-300 mb-1">{m.label}</div>
                <div className="font-bold text-sm" style={{ color: m.cor }}>{m.valor}</div>
              </div>
            ))}
          </div>
          {eventoDetalhe.impactoTickers.length > 0 && (
            <div>
              <span className="text-neutral-300 mr-2">IMPACTO:</span>
              {eventoDetalhe.impactoTickers.map((t) => (
                <button key={t} type="button"
                  onClick={() => { definirTickerActivo(t); definirVista('candlestick') }}
                  className="font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-700 text-neutral-400 hover:text-white mr-1 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
