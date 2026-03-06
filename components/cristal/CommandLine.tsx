'use client'
import { corParaTema } from '@/lib/utils'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Linha de Comando (CLI)
// ============================================================
// Emula a linha de comando do Bloomberg Terminal.
// Suporta: histórico (↑/↓), autocomplete, validação, F-keys.

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Bot, Code2, Loader2, Check } from 'lucide-react'
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
    agenteACarregar,
    agenteStatus,
    agenteResultado,
    fecharAgenteResultado
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
          className="flex-1 bg-transparent font-mono text-sm outline-none text-white placeholder:text-neutral-400 uppercase"
          style={{ caretColor: corTema }}
        />

        {/* Indicador de erro */}
        {erro && (
          <span className="font-mono text-xs text-red-400 shrink-0 max-w-[300px] truncate flex items-center justify-center">
            <X size={12} className="inline mr-1" /> {erro}
          </span>
        )}

        {/* Dicas de teclas rápidas */}
        <div className="hidden md:flex items-center gap-3 shrink-0 pr-2 ml-4">
          {[
            { id: 'F1', label: 'HELP', vista: 'ajuda' },
            { id: 'F2', label: 'MKTM', vista: 'mercado' },
            { id: 'F3', label: 'NWSM', vista: 'noticias' },
            { id: 'F4', label: 'WL', vista: 'watchlist' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => definirVista(f.vista as VistaTerminal)}
              className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <span
                className="font-mono text-[9px] px-1 rounded border font-bold text-black"
                style={{ backgroundColor: corTema, borderColor: corTema }}
              >
                {f.id}
              </span>
              <span className="font-mono text-[10px] text-neutral-300 font-bold hover:text-white">
                {f.label}
              </span>
            </button>
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
              <span className="font-mono text-xs text-neutral-200 ml-auto">
                {s.descricao}
              </span>
            </button>
          ))}

          {/* Dica inferior */}
          <div className="px-4 py-1 border-t border-neutral-800 flex items-center gap-4">
            <span className="font-mono text-[10px] text-neutral-300">
              ↑↓ navegar  ·  TAB completar  ·  ENTER executar  ·  ESC fechar
            </span>
          </div>
        </div>
      )}

      {/* ── Overlay do Agente IA ───────────────────────── */}
      {(agenteACarregar || (agenteResultado && !sugestoesVisiveis)) && (
        <div className="absolute left-0 bottom-[calc(100%+1px)] w-full max-w-3xl bg-[#0f0f0f] border-t border-r border-l border-neutral-800 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-[60] origin-bottom animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-900 bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <Bot size={14} style={{ color: corTema }} />
              <span className="font-mono text-[10px] font-bold tracking-widest text-white">AGENTE QUANT AUTÓNOMO</span>
            </div>
            {agenteResultado && !agenteACarregar && (
              <button onClick={fecharAgenteResultado} className="text-neutral-500 hover:text-white transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {agenteACarregar ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 size={16} className="animate-spin" style={{ color: corTema }} />
                <span className="font-mono text-xs text-neutral-300">{agenteStatus}</span>
              </div>
            ) : agenteResultado ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#10B981]">
                  <Check size={14} />
                  <span className="font-mono text-xs font-bold leading-relaxed">{agenteResultado.mensagem}</span>
                </div>

                {agenteResultado.codigo && (
                  <div className="bg-[#050505] p-3 rounded border border-neutral-900 font-mono text-[9px] text-neutral-400 overflow-x-auto">
                    <div className="flex items-center gap-1.5 mb-2 text-neutral-500">
                      <Code2 size={10} /> <span>Script Python Gerado</span>
                    </div>
                    <pre>{agenteResultado.codigo}</pre>
                  </div>
                )}

                {agenteResultado.stdout && (
                  <div className="bg-[#050505] p-3 rounded border border-neutral-900 font-mono text-[9px] text-neutral-300 overflow-x-auto whitespace-pre-wrap">
                    <div className="flex items-center gap-1.5 mb-2 text-neutral-500">
                      <span style={{ color: corTema, fontWeight: 'bold' }}>›_</span> <span>Output Quant</span>
                    </div>
                    <pre>{agenteResultado.stdout}</pre>
                  </div>
                )}

                {agenteResultado.stderr && (
                  <div className="bg-[#1a0505] p-3 rounded border border-red-900/30 font-mono text-[9px] text-red-400 overflow-x-auto whitespace-pre-wrap">
                    <pre>{agenteResultado.stderr}</pre>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
