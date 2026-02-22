'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Cabeçalho com Navegação Agrupada
// ============================================================

import { useState, useEffect } from 'react'
import {
  Globe, Star, BookOpen, TrendingDown, TrendingUp, Flame, Circle,
  Search, Link2, Building2, Calendar, Map, Bitcoin, Newspaper, Zap,
  HelpCircle, Keyboard, LayoutGrid, Wallet, Network, Bell, MessageSquare, Check
} from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema, CORES_TEMA } from '@/lib/utils'
import { UserButton } from './UserButton'
import { LocaleSelector } from './LocaleSelector'
import type { VistaTerminal } from '@/types/terminal'

interface TabDef {
  vista: VistaTerminal
  label: string
  tecla: string
  icone?: React.ReactNode
}

interface GrupoTabs {
  grupo: string
  cor: string
  tabs: TabDef[]
}

const GRUPOS_TABS: GrupoTabs[] = [
  {
    grupo: 'MERCADOS',
    cor: '#F59E0B',
    tabs: [
      { vista: 'mercado', label: 'MKTM', tecla: 'F2', icone: <Globe size={10} /> },
      { vista: 'watchlist', label: 'WL', tecla: 'F4', icone: <Star size={10} /> },
      { vista: 'livro-ordens', label: 'ALLQ', tecla: 'F6', icone: <BookOpen size={10} /> },
      { vista: 'yield-curve', label: 'YAS', tecla: 'F5', icone: <TrendingDown size={10} /> },
      { vista: 'portfolio', label: 'PORT', tecla: '', icone: <Wallet size={10} /> },
    ],
  },
  {
    grupo: 'ANÁLISE',
    cor: '#3B82F6',
    tabs: [
      { vista: 'heatmap', label: 'HEAT', tecla: 'F9', icone: <Flame size={10} /> },
      { vista: 'bolhas', label: 'BUBBLE', tecla: 'F12', icone: <Circle size={10} /> },
      { vista: 'screener', label: 'SCR', tecla: '', icone: <Search size={10} /> },
      { vista: 'correlacao', label: 'CORR', tecla: '', icone: <Link2 size={10} /> },
    ],
  },
  {
    grupo: 'GLOBAL',
    cor: '#10B981',
    tabs: [
      { vista: 'macro', label: 'MACRO', tecla: 'F8', icone: <Building2 size={10} /> },
      { vista: 'calendario', label: 'CAL', tecla: 'F10', icone: <Calendar size={10} /> },
      { vista: 'mapa-mundo', label: 'WMAP', tecla: 'F11', icone: <Map size={10} /> },
    ],
  },
  {
    grupo: 'CRIPTO & DEFI',
    cor: '#F97316',
    tabs: [
      { vista: 'cripto', label: 'CRYPTO', tecla: 'F7', icone: <Bitcoin size={10} /> },
      { vista: 'defi', label: 'DEFI', tecla: '', icone: <Network size={10} /> },
    ],
  },
  {
    grupo: 'NOTÍCIAS & IA',
    cor: '#8B5CF6',
    tabs: [
      { vista: 'noticias', label: 'NWSM', tecla: 'F3', icone: <Newspaper size={10} /> },
      { vista: 'analise', label: 'IA DES', tecla: '', icone: <Zap size={10} /> },
      { vista: 'sentinela', label: 'ALERT', tecla: '', icone: <Bell size={10} /> },
    ],
  },
  {
    grupo: 'COMUNICAÇÃO',
    cor: '#06B6D4',
    tabs: [
      { vista: 'chat', label: 'MSG', tecla: '', icone: <MessageSquare size={10} /> },
    ],
  },
  {
    grupo: 'AJUDA',
    cor: '#6B7280',
    tabs: [
      { vista: 'ajuda', label: 'HELP', tecla: 'F1', icone: <HelpCircle size={10} /> },
    ],
  },
]

export function TerminalHeader() {
  const {
    vistaActual,
    definirVista,
    tickerActivo,
    nomeActivoAtivo,
    iaDisponivel,
    temaActual,
    definirTema,
    alternarPainelLateral,
    alternarCommandPalette,
    alertasSentinela,
    chatNaoLidas,
  } = useTerminalStore()

  const [hora, setHora] = useState('')
  const [data, setData] = useState('')
  const [mostrarTemas, setMostrarTemas] = useState(false)

  const corTema = corParaTema(temaActual)
  const alertasActivos = alertasSentinela.filter((a) => a.ativo).length

  useEffect(() => {
    const actualizar = () => {
      const agora = new Date()
      setHora(agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
      setData(agora.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }))
    }
    actualizar()
    const id = setInterval(actualizar, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex flex-col border-b border-neutral-800 bg-black select-none shrink-0">

      {/* ── Linha superior: logo + info + relógio ──────────── */}
      <div className="flex items-center h-8 border-b border-neutral-900">

        {/* Logo */}
        <div className="flex items-center gap-2 px-3 border-r border-neutral-800 h-full shrink-0" style={{ borderRightColor: corTema + '55' }}>
          <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="#D7B56D" strokeWidth="6" strokeLinejoin="miter" />
          </svg>
          <span className="font-mono text-[11px] font-bold" style={{ color: corTema }}>CRISTAL CAPITAL</span>
          <span className="font-mono text-[9px] text-neutral-700">TERMINAL PRO</span>
        </div>

        {/* Ticker activo */}
        {tickerActivo && (
          <div className="flex items-center px-3 border-r border-neutral-800 h-full gap-2 shrink-0">
            <span className="font-mono text-[9px] text-neutral-600">►</span>
            <span className="font-mono text-xs font-bold" style={{ color: corTema }}>{tickerActivo}</span>
            {nomeActivoAtivo && (
              <span className="font-mono text-[10px] text-neutral-500">— {nomeActivoAtivo}</span>
            )}
          </div>
        )}

        {/* Paleta de comandos hint */}
        <button
          type="button"
          onClick={alternarCommandPalette}
          className="flex items-center gap-1.5 px-3 border-r border-neutral-800 h-full font-mono text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors shrink-0"
          title="Ctrl+K"
        >
          <Keyboard size={11} />
          <span>Ctrl+K</span>
        </button>

        <div className="flex-1" />

        {/* Alertas activos */}
        {alertasActivos > 0 && (
          <button
            type="button"
            onClick={() => definirVista('sentinela')}
            className="flex items-center gap-1.5 px-3 border-l border-neutral-800 h-full shrink-0 hover:bg-neutral-900 transition-colors"
            title="Alertas Sentinela"
          >
            <Bell size={11} className="animate-pulse" style={{ color: '#F59E0B' }} />
            <span className="font-mono text-[9px]" style={{ color: '#F59E0B' }}>{alertasActivos} ALERTAS</span>
          </button>
        )}

        {/* Estado IA */}
        <div className="flex items-center gap-1.5 px-3 border-l border-neutral-800 h-full shrink-0">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: iaDisponivel === true ? '#10B981' : iaDisponivel === false ? '#EF4444' : '#6B7280' }}
          />
          <span className="font-mono text-[9px] text-neutral-500">
            {iaDisponivel === true ? 'LLAMA 3 ONLINE' : iaDisponivel === false ? 'IA OFFLINE' : '…'}
          </span>
        </div>

        {/* Selector de tema */}
        <div className="relative border-l border-neutral-800 h-full shrink-0">
          <button
            type="button"
            onClick={() => setMostrarTemas(!mostrarTemas)}
            className="flex items-center gap-1.5 px-3 h-full font-mono text-[10px] text-neutral-500 hover:text-white transition-colors"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corTema }} />
            TEMA
          </button>
          {mostrarTemas && (
            <div className="absolute right-0 top-full z-50 bg-neutral-900 border border-neutral-700 rounded shadow-2xl min-w-[160px]">
              {(Object.entries(CORES_TEMA) as [string, string][]).map(([t, c]) => {
                const nomes: Record<string, string> = {
                  amber: 'Âmbar', green: 'Verde', blue: 'Azul',
                  purple: 'Roxo', red: 'Vermelho', cyan: 'Ciano',
                  rose: 'Rosa', slate: 'Ardósia',
                }
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { definirTema(t as Parameters<typeof definirTema>[0]); setMostrarTemas(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 font-mono text-[11px] hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-neutral-300">{nomes[t] ?? t}</span>
                    {temaActual === t && <Check size={12} className="ml-auto" style={{ color: c }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Toggle painel lateral */}
        <button
          type="button"
          onClick={alternarPainelLateral}
          className="flex items-center justify-center px-3 h-full border-l border-neutral-800 text-neutral-600 hover:text-white transition-colors shrink-0"
          title="Ctrl+B — Alternar painel lateral"
        >
          <LayoutGrid size={13} />
        </button>

        {/* Selector de idioma */}
        <LocaleSelector />

        {/* Utilizador */}
        <UserButton />

        {/* Relógio */}
        <div className="flex flex-col items-end justify-center px-3 border-l border-neutral-800 h-full shrink-0">
          <span className="font-mono text-sm font-bold leading-none" style={{ color: corTema }}>{hora}</span>
          <span className="font-mono text-[9px] text-neutral-600 uppercase leading-none mt-0.5">{data}</span>
        </div>
      </div>

      {/* ── Linha inferior: tabs agrupados ─────────────────── */}
      <nav className="flex items-stretch h-7 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {GRUPOS_TABS.map((grupo, gi) => (
          <div key={grupo.grupo} className="flex items-stretch shrink-0">
            {/* Separador de grupo */}
            {gi > 0 && (
              <div className="w-px bg-neutral-800 my-1" />
            )}

            {/* Label do grupo */}
            <div className="flex items-center px-1.5 shrink-0" title={grupo.grupo}>
              <div className="w-0.5 h-3 rounded-full opacity-40" style={{ background: grupo.cor }} />
            </div>

            {/* Tabs do grupo */}
            {grupo.tabs.map((tab) => {
              const activo = vistaActual === tab.vista
              return (
                <button
                  key={tab.vista}
                  type="button"
                  onClick={() => definirVista(tab.vista)}
                  className="relative flex items-center gap-1 px-2.5 font-mono text-[10px] transition-all shrink-0 whitespace-nowrap border-r border-neutral-900 group"
                  style={{
                    color: activo ? '#000' : '#555',
                    backgroundColor: activo ? grupo.cor : 'transparent',
                    borderBottom: activo ? 'none' : '2px solid transparent',
                  }}
                  title={`${tab.label}${tab.tecla ? ` (${tab.tecla})` : ''}`}
                >
                  {tab.icone && (
                    <span className="opacity-80 group-hover:opacity-100">{tab.icone}</span>
                  )}
                  {tab.tecla && (
                    <span
                      className="text-[8px] opacity-60"
                      style={{ color: activo ? '#000' : grupo.cor }}
                    >
                      {tab.tecla}
                    </span>
                  )}
                  <span className="font-bold tracking-tight">{tab.label}</span>
                  {/* Badge de mensagens não lidas no chat */}
                  {tab.vista === 'chat' && chatNaoLidas > 0 && !activo && (
                    <span
                      className="ml-0.5 rounded-full font-bold text-[7px] px-1 py-0.5 text-black"
                      style={{ backgroundColor: '#06B6D4' }}
                    >
                      {chatNaoLidas > 9 ? '9+' : chatNaoLidas}
                    </span>
                  )}
                  {!activo && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
                      style={{ background: grupo.cor }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {/* Ticker activo na nav */}
        {tickerActivo && (
          <>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => definirVista('candlestick')}
              className="flex items-center gap-1.5 px-3 h-full border-l border-neutral-800 font-mono text-[10px] shrink-0 transition-colors"
              style={{ color: vistaActual === 'candlestick' ? corTema : '#5a5a5a' }}
            >
              <TrendingUp size={11} />
              <span className="font-bold">{tickerActivo}</span>
              <span className="text-[9px] opacity-60">GP</span>
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
