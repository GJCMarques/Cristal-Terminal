// GET /api/chat/messages?canal=geral — últimas 50 mensagens
import { auth } from '@/auth'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const canal = new URL(request.url).searchParams.get('canal') ?? 'geral'
  const chave = `chat:${canal}:messages`

  try {
    const raw = await (redis as any).lrange(chave, -50, -1) as string[]
    const mensagens = raw.map((m: string) => {
      try { return JSON.parse(m) } catch { return null }
    }).filter(Boolean)

    return NextResponse.json({ mensagens })
  } catch {
    return NextResponse.json({ mensagens: [] })
  }
}
