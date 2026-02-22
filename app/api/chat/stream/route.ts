// GET /api/chat/stream?canal=geral — SSE em tempo-real
// Mantém conexão ~44s, polling Redis 1s, cliente reconecta automaticamente
import { auth } from '@/auth'
import { redis } from '@/lib/redis'

export const runtime    = 'nodejs'
export const maxDuration = 45 // segundos — limite Vercel

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const canal = new URL(request.url).searchParams.get('canal') ?? 'geral'
  const chave = `chat:${canal}:messages`

  // Comprimento actual no momento da ligação
  let lastLen: number
  try {
    lastLen = ((await (redis as any).llen(chave)) as number) ?? 0
  } catch {
    lastLen = 0
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* cliente desligou */ }
      }

      // Evento inicial de ligação
      enqueue({ tipo: 'connected', canal, ts: Date.now() })

      // Polling durante ~44 iterações (≈ 44s)
      for (let i = 0; i < 44; i++) {
        await new Promise((r) => setTimeout(r, 1000))

        try {
          const currentLen = ((await (redis as any).llen(chave)) as number) ?? 0

          if (currentLen > lastLen) {
            const novas = await (redis as any).lrange(chave, lastLen, currentLen - 1) as string[]
            for (const raw of novas) {
              try {
                const msg = JSON.parse(raw)
                enqueue({ tipo: 'mensagem', ...msg })
              } catch { /* JSON inválido */ }
            }
            lastLen = currentLen
          }
        } catch {
          break // Redis indisponível — fecha stream graciosamente
        }
      }

      // Sinal de reconexão ao cliente
      enqueue({ tipo: 'reconnect' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':   'text/event-stream',
      'Cache-Control':  'no-cache, no-transform',
      'Connection':     'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
