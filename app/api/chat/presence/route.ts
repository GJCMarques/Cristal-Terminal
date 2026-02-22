// POST /api/chat/presence — actualiza presença online
// GET  /api/chat/presence?canal=geral — lista quem está online (últimos 30s)
import { auth } from '@/auth'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

const TTL_PRESENCA = 30 // segundos

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 })

  const body  = await request.json().catch(() => ({}))
  const canal = String(body.canal ?? 'geral').replace(/[^a-z]/g, '').slice(0, 20)
  const chave = `presence:${canal}`

  const membro = JSON.stringify({
    email: session.user.email,
    nome:  session.user.name ?? session.user.email,
    role:  (session.user as { role?: string }).role ?? 'VIEWER',
  })

  try {
    // Score = timestamp em segundos
    await (redis as any).zadd(chave, { score: Math.floor(Date.now() / 1000), member: membro })
    // Expirar registo em 60s
    await (redis as any).expire(chave, 60)
  } catch { /* graceful */ }

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ online: [] }, { status: 401 })

  const canal    = new URL(request.url).searchParams.get('canal') ?? 'geral'
  const chave    = `presence:${canal}`
  const agora    = Math.floor(Date.now() / 1000)
  const threshold = agora - TTL_PRESENCA

  try {
    // Utilizadores activos nos últimos 30s
    const membros = await (redis as any).zrange(chave, threshold, '+inf', {
      byScore: true,
    }) as string[]

    const online = membros.map((m: string) => {
      try { return JSON.parse(m) } catch { return null }
    }).filter(Boolean)

    return NextResponse.json({ online })
  } catch {
    return NextResponse.json({ online: [] })
  }
}
