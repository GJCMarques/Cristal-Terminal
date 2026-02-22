'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Chat Institucional (Bloomberg MSG)
// SSE em tempo-real + Redis
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Circle, Hash, Users } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'
import type { Role } from '@/lib/users'

interface Mensagem {
  id:     string
  userId: string
  nome:   string
  role:   Role
  texto:  string
  canal:  string
  ts:     number
}

interface UtilizadorOnline {
  email: string
  nome:  string
  role:  Role
}

const CANAIS = ['geral', 'mercado', 'cripto', 'macro', 'defi'] as const
type Canal = typeof CANAIS[number]

const LABEL_CANAL: Record<Canal, string> = {
  geral:   '#geral',
  mercado: '#mercado',
  cripto:  '#cripto',
  macro:   '#macro',
  defi:    '#defi',
}

const COR_ROLE: Record<string, string> = {
  ADMIN:   '#F59E0B',
  ANALYST: '#3B82F6',
  TRADER:  '#10B981',
  VIEWER:  '#6B7280',
}

function BolhaMensagem({
  msg,
  euSou,
  corTema,
}: {
  msg: Mensagem
  euSou: boolean
  corTema: string
}) {
  const hora = new Date(msg.ts).toLocaleTimeString('pt-PT', {
    hour:   '2-digit',
    minute: '2-digit',
  })
  const cor = COR_ROLE[msg.role] ?? '#6B7280'

  return (
    <div className={`flex flex-col mb-2 ${euSou ? 'items-end' : 'items-start'}`}>
      {/* Autor + role */}
      {!euSou && (
        <div className="flex items-center gap-1.5 mb-0.5 ml-1">
          <span className="font-mono text-[9px]" style={{ color: cor }}>{msg.role}</span>
          <span className="font-mono text-[10px] text-neutral-400 font-bold">{msg.nome}</span>
        </div>
      )}

      {/* Bolha */}
      <div
        className="max-w-[75%] rounded px-3 py-1.5 font-mono text-xs leading-relaxed"
        style={euSou ? {
          backgroundColor: corTema + '22',
          border:          `1px solid ${corTema}44`,
          color:           '#e5e5e5',
        } : {
          backgroundColor: '#161616',
          border:          '1px solid #2a2a2a',
          color:           '#d4d4d4',
        }}
      >
        {msg.texto}
      </div>

      {/* Hora */}
      <span className="font-mono text-[8px] text-neutral-700 mt-0.5 mx-1">{hora}</span>
    </div>
  )
}

export function ChatPanel() {
  const { data: session } = useSession()
  const temaActual = useTerminalStore((s) => s.temaActual)
  const limparChatNaoLidas = useTerminalStore((s) => s.limparChatNaoLidas)
  const incrementarChatNaoLidas = useTerminalStore((s) => s.incrementarChatNaoLidas)
  const corTema = corParaTema(temaActual)

  const [canal,    setCanal]    = useState<Canal>('geral')
  const [msgs,     setMsgs]     = useState<Mensagem[]>([])
  const [texto,    setTexto]    = useState('')
  const [online,   setOnline]   = useState<UtilizadorOnline[]>([])
  const [enviando, setEnviando] = useState(false)
  const [mostrarOnline, setMostrarOnline] = useState(false)

  const listRef      = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const eventoSource = useRef<EventSource | null>(null)
  const canalRef     = useRef(canal)

  canalRef.current = canal

  // Limpar não lidas ao abrir
  useEffect(() => { limparChatNaoLidas() }, [limparChatNaoLidas])

  // Scroll ao fundo quando chegam mensagens
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  // Carregar histórico ao mudar canal
  const carregarHistorico = useCallback(async (c: Canal) => {
    try {
      const res  = await fetch(`/api/chat/messages?canal=${c}`)
      const data = await res.json()
      setMsgs(data.mensagens ?? [])
    } catch {
      setMsgs([])
    }
  }, [])

  useEffect(() => {
    carregarHistorico(canal)
  }, [canal, carregarHistorico])

  // SSE — stream em tempo-real
  useEffect(() => {
    eventoSource.current?.close()

    const conectar = () => {
      const es = new EventSource(`/api/chat/stream?canal=${canal}`)
      eventoSource.current = es

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.tipo === 'mensagem') {
            setMsgs((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev
              if (data.canal !== canalRef.current) {
                incrementarChatNaoLidas()
                return prev
              }
              return [...prev.slice(-199), data as Mensagem]
            })
          } else if (data.tipo === 'reconnect') {
            setTimeout(conectar, 500)
          }
        } catch { /* ignore */ }
      }

      es.onerror = () => {
        es.close()
        setTimeout(conectar, 3000)
      }
    }

    conectar()
    return () => eventoSource.current?.close()
  }, [canal, incrementarChatNaoLidas])

  // Presença — heartbeat a cada 20s
  useEffect(() => {
    const actualizar = async () => {
      try {
        await fetch('/api/chat/presence', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ canal }),
        })
        const res  = await fetch(`/api/chat/presence?canal=${canal}`)
        const data = await res.json()
        setOnline(data.online ?? [])
      } catch { /* graceful */ }
    }

    actualizar()
    const id = setInterval(actualizar, 20000)
    return () => clearInterval(id)
  }, [canal])

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      const res = await fetch('/api/chat/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ texto: texto.trim(), canal }),
      })
      if (res.ok) {
        const data = await res.json()
        setMsgs((prev) => {
          if (prev.some((m) => m.id === data.mensagem.id)) return prev
          return [...prev.slice(-199), data.mensagem]
        })
        setTexto('')
      }
    } finally {
      setEnviando(false)
      inputRef.current?.focus()
    }
  }

  const meuEmail = session?.user?.email ?? ''

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] font-mono">

      {/* ── Barra de canais ─────────────────────────────────── */}
      <div className="flex items-center border-b border-neutral-800 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {CANAIS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCanal(c)}
            className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold border-r border-neutral-900 shrink-0 transition-colors whitespace-nowrap"
            style={{
              color:           canal === c ? corTema : '#555',
              backgroundColor: canal === c ? corTema + '11' : 'transparent',
              borderBottom:    canal === c ? `2px solid ${corTema}` : '2px solid transparent',
            }}
          >
            <Hash size={8} />
            {c}
          </button>
        ))}

        <div className="flex-1" />

        {/* Online count */}
        <button
          type="button"
          onClick={() => setMostrarOnline((v) => !v)}
          className="flex items-center gap-1 px-3 py-2 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
          title="Utilizadores online"
        >
          <Circle size={6} className="fill-emerald-500 text-emerald-500" />
          {online.length} online
          <Users size={10} className="ml-1" />
        </button>
      </div>

      {/* ── Painel de online (dropdown) ──────────────────────── */}
      {mostrarOnline && online.length > 0 && (
        <div className="border-b border-neutral-800 bg-neutral-950 px-3 py-2 shrink-0">
          <div className="flex flex-wrap gap-2">
            {online.map((u, i) => (
              <div key={i} className="flex items-center gap-1">
                <Circle size={5} className="fill-emerald-500 text-emerald-500" />
                <span className="text-[9px]" style={{ color: COR_ROLE[u.role] ?? '#6B7280' }}>
                  {u.nome}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lista de mensagens ───────────────────────────────── */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
      >
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-neutral-700">
            <Hash size={20} className="opacity-30" />
            <span className="text-xs">Sem mensagens em {LABEL_CANAL[canal]}.</span>
            <span className="text-[10px]">Seja o primeiro a escrever.</span>
          </div>
        )}

        {msgs.map((msg) => (
          <BolhaMensagem
            key={msg.id}
            msg={msg}
            euSou={msg.userId === meuEmail}
            corTema={corTema}
          />
        ))}
      </div>

      {/* ── Linha de composição ──────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-neutral-800 shrink-0">
        <span className="text-neutral-600 text-[10px] shrink-0">{LABEL_CANAL[canal]}</span>
        <span className="text-neutral-700">▶</span>
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder="Escrever mensagem…"
          maxLength={500}
          className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-neutral-700"
          style={{ caretColor: corTema }}
        />
        {texto.length > 400 && (
          <span className="text-[9px] text-neutral-600 shrink-0">{texto.length}/500</span>
        )}
        <button
          type="button"
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          className="flex items-center justify-center w-6 h-6 rounded transition-all disabled:opacity-30 shrink-0"
          style={{ backgroundColor: corTema + '22', color: corTema }}
          title="Enviar (Enter)"
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  )
}
