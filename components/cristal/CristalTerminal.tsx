'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Componente Principal
// ============================================================

import { useEffect, useCallback, useRef, useState } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'
import { TerminalHeader } from './TerminalHeader'
import { CommandLine } from './CommandLine'
import { ResizableLayout } from './layout/ResizableLayout'
import { StatusBar } from './StatusBar'
import { ContextMenu } from './ContextMenu'
import { CommandPalette } from './CommandPalette'
import { TradeTicket } from './TradeTicket'
import { Toaster, toast } from 'sonner'
import type { VistaTerminal } from '@/types/terminal'
import type { ClasseAtivo } from '@/types/market'

// Teclas de função → vistas
const FUNCOES_RAPIDAS: Record<string, VistaTerminal> = {
  F1: 'ajuda',
  F2: 'mercado',
  F3: 'noticias',
  F4: 'watchlist',
  F5: 'yield-curve',
  F6: 'livro-ordens',
  F7: 'cripto',
  F8: 'macro',
  F9: 'heatmap',
  F10: 'calendario',
  F11: 'mapa-mundo',
  F12: 'bolhas',
}

// Ctrl+Letra → vistas
const CTRL_ATALHOS: Record<string, VistaTerminal> = {
  m: 'mercado',
  n: 'noticias',
  w: 'watchlist',
  h: 'ajuda',
  g: 'candlestick',
  y: 'yield-curve',
  r: 'correlacao',
  s: 'screener',
  p: 'portfolio',
  d: 'defi',
  a: 'sentinela',
  t: 'chat',
  q: 'quant',
  u: 'quantum',
}

export function CristalTerminal() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const {
    definirVista,
    voltarVista,
    alternarPainelLateral,
    alternarCommandPalette,
    definirIADisponivel,
    abrirContextMenu,
    fecharContextMenu,
    fecharCommandPalette,
    fecharTradeTicket,
    temaActual,
    tickerActivo,
    nomeActivoAtivo,
    classeActivaAtivo,
    commandPaletteAberto,
    tradeTicket,
  } = useTerminalStore()

  const terminalRef = useRef<HTMLDivElement>(null)

  // ── Verificar disponibilidade do Ollama ao iniciar ──────
  useEffect(() => {
    fetch('/api/ai', { method: 'GET' })
      .then((r) => r.json())
      .then((d) => definirIADisponivel(Boolean(d.disponivel)))
      .catch(() => definirIADisponivel(false))
  }, [definirIADisponivel])

  // ── Atalhos de teclado globais ──────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      const emInput = alvo.tagName === 'TEXTAREA' || alvo.tagName === 'INPUT'

      // Fechar overlays com Escape (ordem de prioridade)
      if (e.key === 'Escape') {
        if (tradeTicket.aberto) { fecharTradeTicket(); e.preventDefault(); return }
        if (commandPaletteAberto) { fecharCommandPalette(); e.preventDefault(); return }
        fecharContextMenu()
        return
      }

      // Ctrl+K → paleta de comandos (qualquer contexto)
      if (e.key === 'k' && e.ctrlKey) {
        e.preventDefault()
        alternarCommandPalette()
        return
      }

      // Ctrl+Z → voltar à vista anterior
      if (e.key === 'z' && e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        voltarVista()
        return
      }

      // Ctrl+B → alternar painel lateral
      if (e.key === 'b' && e.ctrlKey) {
        e.preventDefault()
        alternarPainelLateral()
        return
      }

      // Ignorar se estiver a escrever num input/textarea
      if (emInput) return

      // Teclas de função F1–F12
      if (e.key in FUNCOES_RAPIDAS) {
        e.preventDefault()
        definirVista(FUNCOES_RAPIDAS[e.key]!)
        return
      }

      // Ctrl+Letra → atalhos de vista
      if (e.ctrlKey && e.key in CTRL_ATALHOS) {
        e.preventDefault()
        definirVista(CTRL_ATALHOS[e.key]!)
        return
      }

      // Alt+número → watchlist
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        // futuro: mudar watchlist activa
        return
      }
    },
    [
      commandPaletteAberto,
      tradeTicket,
      definirVista,
      voltarVista,
      alternarPainelLateral,
      alternarCommandPalette,
      fecharContextMenu,
      fecharCommandPalette,
      fecharTradeTicket,
    ],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Alertas Vivos (Simulador de Fake News/Eventos Reais em Toast) ──
  useEffect(() => {
    if (!mounted) return
    const randomInterval = () => Math.floor(Math.random() * 15000) + 15000 // 15s to 30s
    let timeoutId: NodeJS.Timeout

    const fireAlert = () => {
      const eventos = [
        { msg: 'EURUSD caiu para baixo da marca de 1.0800!', tipo: 'error', icon: '🔴' },
        { msg: 'Preço Alvo NVDIA atingido: Acima de $145.00', tipo: 'success', icon: '🟢' },
        { msg: 'Reserva Federal Americana mantem Taxa de Juro base.', tipo: 'info', icon: '🏛️' },
        { msg: 'Volume atípico detetado em transações OTC de Bitcoin.', tipo: 'warning', icon: '🟠' },
        { msg: 'Gold (XAU) sobe 0.5% em menos de meia hora.', tipo: 'success', icon: '🟡' },
        { msg: 'Notícia de Breaking News sobre Apple afeta NASDAQ 100.', tipo: 'error', icon: '🔴' }
      ]
      const alert = eventos[Math.floor(Math.random() * eventos.length)]!

      toast(alert.msg, {
        icon: alert.icon,
        style: {
          backgroundColor: '#0a0a0a',
          color: '#e5e5e5',
          border: '1px solid #262626',
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: '12px'
        },
        duration: 8000
      })

      // Agenda o próximo recursivamente com delay variável
      timeoutId = setTimeout(fireAlert, randomInterval())
    }

    // Arranca
    timeoutId = setTimeout(fireAlert, 5000)

    return () => clearTimeout(timeoutId)
  }, [mounted])

  // ── Context menu global (botão direito) ─────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()

      // Tentar ler data-ticker do elemento ou de qualquer ancestral
      let el: HTMLElement | null = e.target as HTMLElement
      let ticker: string | undefined
      let nome: string | undefined
      let classe: string | undefined

      while (el && el !== terminalRef.current) {
        if (el.dataset.ticker) { ticker = el.dataset.ticker; break }
        el = el.parentElement
      }
      if (el?.dataset.nome) nome = el.dataset.nome
      if (el?.dataset.classe) classe = el.dataset.classe

      // Fallback: usar ticker activo do store
      if (!ticker && tickerActivo) {
        ticker = tickerActivo
        nome = nomeActivoAtivo ?? undefined
        classe = classeActivaAtivo ?? undefined
      }

      abrirContextMenu({
        x: e.clientX,
        y: e.clientY,
        ticker,
        nomeActivo: nome,
        classeAtivo: classe as ClasseAtivo | undefined,
      })
    },
    [abrirContextMenu, tickerActivo, nomeActivoAtivo, classeActivaAtivo],
  )

  const corTema = corParaTema(temaActual)

  return (
    <div
      ref={terminalRef}
      className="flex flex-col h-screen bg-black text-white overflow-hidden select-none"
      style={
        {
          '--cor-tema': corTema,
          fontFamily: "'IBM Plex Mono', 'Courier New', 'Lucida Console', monospace",
        } as React.CSSProperties
      }
      onContextMenu={handleContextMenu}
    >
      {/* ── Cabeçalho com tabs ──────────────────────────── */}
      <TerminalHeader />

      {/* ── Linha de comando Bloomberg-style ────────────── */}
      <CommandLine />

      {/* ── Renderizar apenas no cliente para evitar erros de Hidratação ────────────── */}
      {mounted ? (
        <>
          {/* ── Área de trabalho redimensionável ────────────── */}
          <ResizableLayout />

          {/* ── Barra de estado inferior ─────────────────────── */}
          <StatusBar />

          {/* ── Context Menu (botão direito) ─────────────────── */}
          <ContextMenu />

          {/* ── Paleta de Comandos (Ctrl+K) ──────────────────── */}
          <CommandPalette />

          {/* ── Trade Ticket (Ordem Rápida) ──────────────────── */}
          <TradeTicket />

          {/* ── Sistema de Alertas Toast ─────────────────────── */}
          <Toaster
            position="bottom-right"
            theme="dark"
            offset={40}
            toastOptions={{
              className: "font-mono border-neutral-800 bg-[#0A0A0A] text-white"
            }}
          />
        </>
      ) : (
        <div className="flex-1 bg-black" />
      )}
    </div>
  )
}
