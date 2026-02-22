'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Linha de Comando (CLI)
// ============================================================
// Emula a linha de comando do Bloomberg Terminal.
// Suporta: histórico (↑/↓), autocomplete, validação, F-keys.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import { obterSugestoes, type SugestaoComando } from '@/lib/command-parser'
import type { VistaTerminal } from '@/types/terminal'

// Mapeamento de teclas de função para vistas
const FUNCOES_RAPIDAS: Record<string, VistaTerminal> = {
  F1: 'ajuda',
  F2: 'mercado',
  F3: 'noticias',
  F4: 'watchlist',
  F5: 'yield-curve',
  F6: 'livro-ordens',
}

export function CommandLine() {
  const {
    inputComando,
    definirInputComando,
    executarComando,
    navegarHistorico,
    erro,
    limparErro,
    definirVista,
    temaActual,
  } = useTerminalStore()

  const inputRef = useRef<HTMLInputElement>(null)
  const [sugestoes, setSugestoes] = useState<SugestaoComando[]>([])
  const [indiceSugestao, setIndiceSugestao] = useState(-1)
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false)

  // Cor primária do tema
  const corTema = corParaTema(temaActual)

  // ── Actualizar sugestões ao digitar ──────────────────────
  useEffect(() => {
    if (inputComando.length >= 1) {
      const novas = obterSugestoes(inputComando)
      setSugestoes(novas)
      setSugestoesVisiveis(novas.length > 0)
      setIndiceSugestao(-1)
    } else {
      setSugestoes([])
      setSugestoesVisiveis(false)
    }
  }, [inputComando])

  // ── Auto-focus ────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ── Limpar erro após 4 s ──────────────────────────────────
  useEffect(() => {
    if (!erro) return
    const t = setTimeout(limparErro, 4_000)
    return () => clearTimeout(t)
  }, [erro, limparErro])

  const fecharSugestoes = useCallback(() => {
    setSugestoesVisiveis(false)
    setIndiceSugestao(-1)
  }, [])

  const aplicarSugestao = useCallback(
    (sugestao: SugestaoComando) => {
      definirInputComando(sugestao.texto)
      fecharSugestoes()
      inputRef.current?.focus()
    },
    [definirInputComando, fecharSugestoes],
  )

  // ── Teclado ────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Teclas de função globais
      if (e.key in FUNCOES_RAPIDAS) {
        e.preventDefault()
        definirVista(FUNCOES_RAPIDAS[e.key]!)
        fecharSugestoes()
        return
      }

      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          if (indiceSugestao >= 0 && sugestoes[indiceSugestao]) {
            aplicarSugestao(sugestoes[indiceSugestao]!)
          } else {
            executarComando(inputComando)
            fecharSugestoes()
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          if (sugestoesVisiveis) {
            setIndiceSugestao((i) => Math.max(i - 1, 0))
          } else {
            navegarHistorico('cima')
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (sugestoesVisiveis) {
            setIndiceSugestao((i) => Math.min(i + 1, sugestoes.length - 1))
          } else {
            navegarHistorico('baixo')
          }
          break

        case 'Escape':
          e.preventDefault()
          if (sugestoesVisiveis) {
            fecharSugestoes()
          } else {
            definirInputComando('')
          }
          break

        case 'Tab':
          e.preventDefault()
          if (sugestoes.length > 0) {
            const idx = indiceSugestao >= 0 ? indiceSugestao : 0
            if (sugestoes[idx]) aplicarSugestao(sugestoes[idx]!)
          }
          break
      }
    },
    [
      indiceSugestao,
      sugestoes,
      sugestoesVisiveis,
      inputComando,
      aplicarSugestao,
      executarComando,
      navegarHistorico,
      fecharSugestoes,
      definirVista,
    ],
  )

  return (
    <div className="relative border-b border-neutral-800 bg-black">
      {/* ── Linha de input ─────────────────────────────── */}
      <div className="flex items-center px-3 py-1.5 gap-2">
        {/* Prompt */}
        <span
          className="font-mono text-sm font-bold select-none shrink-0"
          style={{ color: corTema }}
        >
          ›
        </span>

        {/* Campo de texto */}
        <input
          ref={inputRef}
          type="text"
          value={inputComando}
          onChange={(e) => definirInputComando(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(fecharSugestoes, 150)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="AAPL <Equity>  |  EURUSD <Curncy>  |  HELP  |  MKTM"
          className="flex-1 bg-transparent font-mono text-sm outline-none text-white placeholder:text-neutral-700 uppercase"
          style={{ caretColor: corTema }}
        />

        {/* Indicador de erro */}
        {erro && (
          <span className="font-mono text-xs text-red-400 shrink-0 max-w-[300px] truncate">
            ✕ {erro}
          </span>
        )}

        {/* Dicas de teclas rápidas */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {(['F1', 'F2', 'F3', 'F4'] as const).map((f) => (
            <span
              key={f}
              className="font-mono text-[10px] px-1 rounded border border-neutral-700 text-neutral-500"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── Dropdown de sugestões ───────────────────────── */}
      {sugestoesVisiveis && sugestoes.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 border border-neutral-700 bg-neutral-950 shadow-2xl">
          {sugestoes.map((s, i) => (
            <button
              key={s.texto}
              type="button"
              onMouseDown={() => aplicarSugestao(s)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-800 transition-colors"
              style={{
                backgroundColor: i === indiceSugestao ? '#1a1a1a' : undefined,
                borderLeft: i === indiceSugestao ? `2px solid ${corTema}` : '2px solid transparent',
              }}
            >
              {/* Categoria badge */}
              <span
                className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor:
                    s.categoria === 'ticker'
                      ? '#1a3a1a'
                      : s.categoria === 'funcao'
                        ? '#1a1a3a'
                        : '#2a1a0a',
                  color:
                    s.categoria === 'ticker'
                      ? '#4ade80'
                      : s.categoria === 'funcao'
                        ? '#818cf8'
                        : corTema,
                }}
              >
                {s.categoria}
              </span>

              {/* Texto do comando */}
              <span className="font-mono text-sm text-white">{s.texto}</span>

              {/* Descrição */}
              <span className="font-mono text-xs text-neutral-500 ml-auto">
                {s.descricao}
              </span>
            </button>
          ))}

          {/* Dica inferior */}
          <div className="px-4 py-1 border-t border-neutral-800 flex items-center gap-4">
            <span className="font-mono text-[10px] text-neutral-600">
              ↑↓ navegar  ·  TAB completar  ·  ENTER executar  ·  ESC fechar
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
