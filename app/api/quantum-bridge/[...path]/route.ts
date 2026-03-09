// ============================================================
// CRISTAL CAPITAL TERMINAL — Quantum Bridge Catch-All Proxy
// Forwards requests to FastAPI Python backend on port 8001.
// Endpoint: POST /api/quantum-bridge/[...path]
// ============================================================

import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL ?? 'http://localhost:8001'

// Allowed path prefixes — prevents open-proxy abuse
const ALLOWED_PREFIXES = [
  'quant/',
  'quantum/',
]

function isAllowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params
  const upstreamPath = segments.join('/')

  if (!isAllowedPath(upstreamPath)) {
    return NextResponse.json(
      { erro: 'Caminho não permitido pelo bridge', path: upstreamPath },
      { status: 400 },
    )
  }

  const upstreamUrl = `${FASTAPI_BASE}/api/${upstreamPath}`

  // Read request body once — NextRequest body can only be consumed once
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { erro: 'JSON inválido na requisição' },
      { status: 400 },
    )
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Forward correlation header if present
        ...(req.headers.get('x-request-id')
          ? { 'X-Request-Id': req.headers.get('x-request-id')! }
          : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.name === 'TimeoutError'

    return NextResponse.json(
      {
        erro: isTimeout
          ? 'O backend Python excedeu o tempo limite de 60 s'
          : 'Backend Python indisponível (porta 8001). Inicie o servidor FastAPI.',
        disponivel: false,
        path: upstreamPath,
      },
      { status: 503 },
    )
  }

  // Surface upstream error details to the caller
  if (!upstreamResponse.ok) {
    let detalhe: unknown = null
    try {
      detalhe = await upstreamResponse.json()
    } catch {
      detalhe = await upstreamResponse.text().catch(() => null)
    }

    return NextResponse.json(
      {
        erro: `Backend Python retornou erro ${upstreamResponse.status}`,
        detalhe,
        path: upstreamPath,
      },
      { status: upstreamResponse.status },
    )
  }

  // Stream-through the successful JSON response
  let data: unknown
  try {
    data = await upstreamResponse.json()
  } catch {
    return NextResponse.json(
      { erro: 'Resposta inválida do backend Python (JSON malformado)' },
      { status: 502 },
    )
  }

  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

// Reject all other HTTP methods with a clear message
export async function GET() {
  return NextResponse.json(
    { erro: 'Este endpoint aceita apenas POST. Para health check use /api/quantum-bridge/health' },
    { status: 405 },
  )
}
