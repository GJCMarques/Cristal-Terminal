'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Análise IA Llama 3 (DES)
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTerminalStore } from '@/store/terminal.store'
import { obterPrecoActual, obterDadosCandlestick } from '@/lib/mocks/candlestick'
import { TICKERS_CONHECIDOS } from '@/lib/command-parser'
import type { MensagemIA } from '@/types/market'

function formatarTs(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AnalisePanel() {
  const {
    tickerActivo,
    mensagensIA,
    iaACarregar,
    iaDisponivel,
    adicionarMensagemIA,
    definirIACarregando,
    definirIADisponivel,
    temaActual,
  } = useTerminalStore()

  const [inputPergunta, setInputPergunta] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const ticker = tickerActivo ?? 'AAPL'
  const info = TICKERS_CONHECIDOS[ticker]
  const preco = obterPrecoActual(ticker)
  const dados = obterDadosCandlestick(ticker)
  const ultimo = dados[dados.length - 1]
  const penultimo = dados[dados.length - 2]
  const variacaoPct = ultimo && penultimo
    ? ((ultimo.close - penultimo.close) / penultimo.close) * 100
    : 0

  // Verifica disponibilidade do Ollama no mount
  useEffect(() => {
    fetch('/api/ai', { method: 'GET' })
      .then((r) => r.json())
      .then((d) => definirIADisponivel(d.disponivel ?? false))
      .catch(() => definirIADisponivel(false))
  }, [definirIADisponivel])

  // Auto-scroll
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagensIA, iaACarregar])

  const contexto = {
    ticker,
    nome: info?.nome ?? ticker,
    classe: info?.classe ?? 'Equity',
    precoActual: preco,
    variacaoDiaria: `${variacaoPct.toFixed(2)}%`,
    abertura: ultimo?.open,
    maximo: ultimo?.high,
    minimo: ultimo?.low,
    fecho: ultimo?.close,
    volumeDiario: ultimo?.volume,
    data: new Date().toLocaleDateString('pt-PT'),
  }

  const enviarMensagem = useCallback(
    async (texto: string) => {
      if (!texto.trim() || iaACarregar) return

      const mensagemUtilizador: MensagemIA = {
        papel: 'utilizador',
        conteudo: texto.trim(),
        timestamp: new Date().toISOString(),
      }

      adicionarMensagemIA(mensagemUtilizador)
      setInputPergunta('')
      definirIACarregando(true)

      // Mensagem de placeholder para o assistente (será actualizada via stream)
      const tsAssistente = new Date().toISOString()
      adicionarMensagemIA({
        papel: 'assistente',
        conteudo: '',
        timestamp: tsAssistente,
      })

      try {
        const historico = [...mensagensIA, mensagemUtilizador].map((m) => ({
          role: m.papel === 'utilizador' ? 'user' : ('assistant' as const),
          content: m.conteudo,
        }))

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historico,
            context: contexto,
            stream: true,
          }),
        })

        if (!res.ok) throw new Error('Ollama indisponível')

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let conteudoTotal = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          conteudoTotal += decoder.decode(value, { stream: true })

          // Actualiza a última mensagem do assistente em tempo real
          useTerminalStore.setState((s) => {
            const msgs = [...s.mensagensIA]
            const idx = msgs.findLastIndex((m) => m.papel === 'assistente')
            if (idx >= 0) {
              msgs[idx] = { ...msgs[idx]!, conteudo: conteudoTotal }
            }
            return { mensagensIA: msgs }
          })
        }
      } catch (err) {
        useTerminalStore.setState((s) => {
          const msgs = [...s.mensagensIA]
          const idx = msgs.findLastIndex((m) => m.papel === 'assistente')
          if (idx >= 0) {
            msgs[idx] = {
              ...msgs[idx]!,
              conteudo:
                '⚠ Serviço IA indisponível. Certifique-se que o Ollama está a correr: `ollama run llama3`',
            }
          }
          return { mensagensIA: msgs }
        })
      } finally {
        definirIACarregando(false)
        inputRef.current?.focus()
      }
    },
    [iaACarregar, mensagensIA, adicionarMensagemIA, definirIACarregando, contexto],
  )

  const perguntasSugeridas = [
    `Analisa o desempenho recente de ${ticker}`,
    `Quais são os factores de risco para ${ticker}?`,
    `Compara ${ticker} com os seus pares de sector`,
    `Interpreta a variação de ${variacaoPct.toFixed(2)}% hoje`,
  ]

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* ── Cabeçalho ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{ticker}</span>
              {info && <span className="font-mono text-xs text-neutral-500">{info.nome}</span>}
            </div>
            <div className="flex items-center gap-3 mt-0.5 font-mono text-xs">
              <span className="text-white">{preco.toFixed(2)}</span>
              <span style={{ color: variacaoPct >= 0 ? '#10B981' : '#EF4444' }}>
                {variacaoPct >= 0 ? '▲' : '▼'}{Math.abs(variacaoPct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: iaDisponivel === true
                ? '#10B98122'
                : iaDisponivel === false
                  ? '#EF444422'
                  : '#6B728022',
              color: iaDisponivel === true ? '#10B981'
                : iaDisponivel === false ? '#EF4444'
                : '#6B7280',
            }}
          >
            <span className="animate-pulse">●</span>
            <span>
              {iaDisponivel === true ? 'Llama 3' : iaDisponivel === false ? 'IA Offline' : 'A verificar…'}
            </span>
          </div>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: corTema + '22', color: corTema }}
          >
            DES
          </span>
        </div>
      </div>

      {/* ── Conversação ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Estado vazio */}
        {mensagensIA.length === 0 && (
          <div className="space-y-4">
            <div className="font-mono text-xs text-neutral-600 text-center py-4">
              Análise IA por Llama 3 — Faça uma pergunta sobre {ticker}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {perguntasSugeridas.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => enviarMensagem(p)}
                  className="text-left px-3 py-2 rounded border border-neutral-800 hover:border-neutral-600 font-mono text-xs text-neutral-400 hover:text-white transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagens */}
        {mensagensIA.map((msg, i) => (
          <div
            key={`${msg.timestamp}-${i}`}
            className={`flex gap-3 ${msg.papel === 'utilizador' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.papel === 'assistente' && (
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-black font-bold text-[10px] shrink-0 mt-0.5"
                style={{ backgroundColor: corTema }}
              >
                AI
              </div>
            )}
            <div
              className="max-w-[80%] rounded px-3 py-2 font-mono text-xs"
              style={{
                backgroundColor:
                  msg.papel === 'utilizador' ? corTema + '22' : '#111111',
                color: msg.papel === 'utilizador' ? corTema : '#D1D5DB',
                border: msg.papel === 'assistente'
                  ? '1px solid #1F2937'
                  : `1px solid ${corTema}44`,
              }}
            >
              {msg.conteudo === '' && iaACarregar ? (
                <span className="animate-pulse text-neutral-500">A gerar análise…</span>
              ) : (
                <span className="whitespace-pre-wrap">{msg.conteudo}</span>
              )}
              <div className="text-[10px] text-neutral-600 mt-1 text-right">
                {formatarTs(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      {/* ── Input de pergunta ────────────────────────────── */}
      <div className="border-t border-neutral-800 p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviarMensagem(inputPergunta)
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputPergunta}
            onChange={(e) => setInputPergunta(e.target.value)}
            placeholder={`Pergunte sobre ${ticker}…`}
            disabled={iaACarregar || iaDisponivel === false}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-600 outline-none focus:border-neutral-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={iaACarregar || !inputPergunta.trim() || iaDisponivel === false}
            className="font-mono text-xs px-4 py-2 rounded transition-colors disabled:opacity-50"
            style={{ backgroundColor: corTema + '33', color: corTema }}
          >
            {iaACarregar ? '…' : 'ENVIAR'}
          </button>
        </form>
        {iaDisponivel === false && (
          <p className="font-mono text-[10px] text-red-400 mt-1">
            Ollama offline. Execute: <code className="text-orange-400">ollama run llama3</code>
          </p>
        )}
      </div>
    </div>
  )
}
