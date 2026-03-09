// ============================================================
// CRISTAL CAPITAL TERMINAL — Quantum Bridge Health Check
// Probes the FastAPI Python backend on port 8001.
// Endpoint: GET /api/quantum-bridge/health
// ============================================================

import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL ?? 'http://localhost:8001'

// FastAPI endpoints this bridge is designed to proxy.
// Listed here for introspection — not called during health check.
const PROXIED_ENDPOINTS = [
  // Classical quant
  'POST /api/quant/black-scholes',
  'POST /api/quant/vol-surface',
  'POST /api/quant/monte-carlo',
  'POST /api/quant/portfolio-optimize',
  'POST /api/quant/bond-pricing',
  'POST /api/quant/yield-curve',
  'POST /api/quant/garch',
  'POST /api/quant/risk-analytics',
  // Quantum computing
  'POST /api/quantum/bell-state',
  'POST /api/quantum/qae-pricing',
  'POST /api/quantum/qaoa-portfolio',
  'POST /api/quantum/grover-search',
  'POST /api/quantum/vqe',
]

export async function GET(_req: NextRequest) {
  const inicio = Date.now()

  try {
    const res = await fetch(`${FASTAPI_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    })

    const latenciaMs = Date.now() - inicio

    if (res.ok) {
      let detalhe: Record<string, unknown> = {}
      try {
        detalhe = await res.json()
      } catch {
        // Backend responded 200 but without a JSON body — still healthy
      }

      return NextResponse.json(
        {
          disponivel: true,
          statusHttp: res.status,
          latenciaMs,
          backend: FASTAPI_BASE,
          endpoints: PROXIED_ENDPOINTS,
          detalhe,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      )
    }

    // Backend reachable but returned a non-2xx status
    return NextResponse.json(
      {
        disponivel: false,
        statusHttp: res.status,
        latenciaMs,
        backend: FASTAPI_BASE,
        erro: `Backend respondeu com HTTP ${res.status}`,
        timestamp: new Date().toISOString(),
      },
      { status: 502 },
    )
  } catch (err) {
    const latenciaMs = Date.now() - inicio
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'

    return NextResponse.json(
      {
        disponivel: false,
        latenciaMs,
        backend: FASTAPI_BASE,
        erro: isTimeout
          ? 'Backend Python não respondeu dentro de 5 s'
          : 'Backend Python indisponível (porta 8001). Inicie o servidor FastAPI.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
