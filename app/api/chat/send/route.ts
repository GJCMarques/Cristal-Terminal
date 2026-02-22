// POST /api/chat/send — publica uma mensagem no canal
import { auth } from '@/auth'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'
import type { Role } from '@/lib/users'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.texto?.trim() || !body?.canal) {
    return NextResponse.json({ erro: 'Parâmetros inválidos' }, { status: 400 })
  }

  const texto = String(body.texto).trim().slice(0, 500) // max 500 chars
  const canal = String(body.canal).replace(/[^a-z]/g, '').slice(0, 20)

  const mensagem = {
    id:        Date.now().toString(),
    userId:    session.user.email ?? 'anon',
    nome:      session.user.name  ?? 'Anónimo',
    role:      ((session.user as { role?: Role }).role) ?? 'VIEWER',
    texto,
    canal,
    ts:        Date.now(),
  }

  const chave = `chat:${canal}:messages`
  try {
    await (redis as any).rpush(chave, JSON.stringify(mensagem))
    await (redis as any).ltrim(chave, -200, -1) // manter últimas 200
    // TTL de 7 dias
    await (redis as any).expire(chave, 60 * 60 * 24 * 7)
  } catch (err) {
    console.error('chat send error', err)
    return NextResponse.json({ erro: 'Erro ao guardar mensagem' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mensagem })
}
