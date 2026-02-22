'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Página de Login
// Estética Bloomberg: preto, âmbar, IBM Plex Mono
// ============================================================

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { signIn } from 'next-auth/react'

function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'

  const [erro, setErro] = useState<string | null>(null)
  const [aPensar, setAPensar] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)
  const [hora, setHora] = useState('')

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAPensar(true)
    setErro(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const totpCode = formData.get('totpCode') as string

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      totpCode,
    })

    if (res?.error) {
      setErro('Credenciais inválidas ou erro na autenticação. Verifique os dados.')
      setAPensar(false)
    } else {
      window.location.href = from
    }
  }

  return (
    <div className="w-full max-w-md mx-4">

      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="#F59E0B" strokeWidth="4" strokeLinejoin="miter" />
            <path d="M32 16 L48 32 L32 48 L16 32 Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2" />
          </svg>
        </div>
        <h1 className="font-mono text-xl font-bold text-amber-500 tracking-widest">CRISTAL CAPITAL</h1>
        <p className="font-mono text-xs text-neutral-600 mt-1 tracking-wider">TERMINAL PROFISSIONAL · {hora}</p>
      </div>

      {/* ── Formulário ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="from" value={from} />

        {/* Email */}
        <div className="space-y-1">
          <label className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">
            Correio Electrónico
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="utilizador@cristal.pt"
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 font-mono text-sm text-white placeholder:text-neutral-700 outline-none focus:border-amber-500 transition-colors"
            style={{ caretColor: '#F59E0B' }}
          />
        </div>

        {/* Palavra-passe */}
        <div className="space-y-1">
          <label className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">
            Palavra-passe
          </label>
          <div className="relative">
            <input
              name="password"
              type={mostrarPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 pr-10 font-mono text-sm text-white placeholder:text-neutral-700 outline-none focus:border-amber-500 transition-colors"
              style={{ caretColor: '#F59E0B' }}
            />
            <button
              type="button"
              onClick={() => setMostrarPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
              tabIndex={-1}
            >
              {mostrarPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Código MFA (campo sempre presente, mas subtil) */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
            <ShieldCheck size={10} />
            Código MFA (opcional)
          </label>
          <input
            name="totpCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000 000"
            maxLength={7}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 font-mono text-sm text-white placeholder:text-neutral-700 outline-none focus:border-amber-500 transition-colors tracking-widest"
            style={{ caretColor: '#F59E0B' }}
          />
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-950 border border-red-900 rounded">
            <span className="font-mono text-xs text-red-400">{erro}</span>
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          disabled={aPensar}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded font-mono text-sm font-bold tracking-widest transition-all disabled:opacity-50"
          style={{
            backgroundColor: aPensar ? '#92400E' : '#F59E0B',
            color: '#000',
          }}
        >
          {aPensar ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              A autenticar…
            </>
          ) : (
            'ENTRAR →'
          )}
        </button>
      </form>

      {/* ── Utilizadores demo ──────────────────────────────── */}
      <div className="mt-6 border border-neutral-900 rounded p-3">
        <p className="font-mono text-[9px] text-neutral-600 mb-2 tracking-widest uppercase">Acesso Demo</p>
        <div className="space-y-1">
          {[
            { email: 'admin@cristal.pt', role: 'ADMIN', cor: '#F59E0B' },
            { email: 'analyst@cristal.pt', role: 'ANALYST', cor: '#3B82F6' },
            { email: 'trader@cristal.pt', role: 'TRADER', cor: '#10B981' },
            { email: 'viewer@cristal.pt', role: 'VIEWER', cor: '#6B7280' },
          ].map(({ email, role, cor }) => (
            <div key={email} className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-neutral-500">{email}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ color: cor, border: `1px solid ${cor}44` }}>
                {role}
              </span>
            </div>
          ))}
          <p className="font-mono text-[9px] text-neutral-700 mt-1">Password: &lt;Role&gt;123! (ex: Admin123!)</p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center font-mono text-[9px] text-neutral-800 mt-6">
        CRISTAL CAPITAL TERMINAL PRO · ACESSO RESTRITO
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-4 flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-amber-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
