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
        </>
      ) : (
        <div className="flex-1 bg-black" />
      )}
    </div>
  )
}
