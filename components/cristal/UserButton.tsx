'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Botão de Utilizador (header)
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, ShieldCheck, User, ChevronDown } from 'lucide-react'
import type { Role } from '@/lib/users'

const COR_ROLE: Record<string, string> = {
  ADMIN:   '#F59E0B',
  ANALYST: '#3B82F6',
  TRADER:  '#10B981',
  VIEWER:  '#6B7280',
}

function iniciais(nome?: string | null): string {
  if (!nome) return '?'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserButton() {
  const { data: session, status } = useSession()
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 px-3 border-l border-neutral-800 h-full shrink-0">
        <div className="w-5 h-5 rounded-full bg-neutral-800 animate-pulse" />
      </div>
    )
  }

  if (!session?.user) return null

  const role  = (session.user as { role?: Role }).role ?? 'VIEWER'
  const nome  = session.user.name ?? session.user.email ?? 'Utilizador'
  const email = session.user.email ?? ''
  const cor   = COR_ROLE[role] ?? '#6B7280'

  return (
    <div ref={ref} className="relative border-l border-neutral-800 h-full shrink-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex items-center gap-1.5 px-2.5 h-full hover:bg-neutral-900 transition-colors"
      >
        {/* Avatar */}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-black shrink-0"
          style={{ backgroundColor: cor }}
        >
          {iniciais(nome)}
        </div>
        {/* Nome + Role */}
        <div className="flex flex-col items-start leading-none">
          <span className="font-mono text-[10px] text-neutral-300 max-w-[80px] truncate">{nome}</span>
          <span className="font-mono text-[8px]" style={{ color: cor }}>{role}</span>
        </div>
        <ChevronDown size={10} className="text-neutral-300" />
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute right-0 top-full z-50 bg-neutral-900 border border-neutral-700 rounded shadow-2xl min-w-[200px]">
          {/* Info do utilizador */}
          <div className="px-3 py-2.5 border-b border-neutral-800">
            <p className="font-mono text-xs text-white font-bold truncate">{nome}</p>
            <p className="font-mono text-[10px] text-neutral-200 truncate">{email}</p>
            <div
              className="inline-block mt-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold"
              style={{ backgroundColor: cor + '22', color: cor, border: `1px solid ${cor}44` }}
            >
              {role}
            </div>
          </div>

          {/* Acções */}
          <div className="py-1">
            <a
              href="/setup-mfa"
              className="flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] text-neutral-300 hover:bg-neutral-800 transition-colors"
              onClick={() => setAberto(false)}
            >
              <ShieldCheck size={12} className="text-amber-500" />
              Configurar MFA
            </a>
            <button
              type="button"
              onClick={async () => {
                setAberto(false)
                await signOut({ redirectTo: '/login' })
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] text-red-400 hover:bg-red-950 transition-colors"
            >
              <LogOut size={12} />
              Terminar Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
