// ============================================================
// CRISTAL CAPITAL TERMINAL — Black-Scholes (TypeScript)
// Espelho das funções em native/quant/black_scholes.cpp
// ============================================================

import { normalCDF, normalPDF } from './statistics'

export interface OpcoesBS {
  S: number   // Preço spot do activo subjacente
  K: number   // Preço de exercício (strike)
  T: number   // Tempo até expiração (anos)
  r: number   // Taxa de juro livre de risco (decimal, ex: 0.05 = 5%)
  sigma: number // Volatilidade implícita (decimal, ex: 0.20 = 20%)
  q?: number  // Dividend yield contínuo (decimal, default 0)
}

export interface ResultadoBS {
  call: number       // Preço teórico da call
  put: number        // Preço teórico da put
  delta_call: number
  delta_put: number
  gamma: number
  theta_call: number // por dia (dividido por 365)
  theta_put: number
  vega: number       // por 1% de variação em sigma
  rho_call: number
  rho_put: number
  d1: number
  d2: number
}

/**
 * Fórmula de Black-Scholes para opções europeias.
 * Inclui todas as gregas (delta, gamma, theta, vega, rho).
 */
export function blackScholes(opts: OpcoesBS): ResultadoBS {
  const { S, K, T, r, sigma } = opts
  const q = opts.q ?? 0

  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const zero = { call: 0, put: 0, delta_call: 0, delta_put: 0, gamma: 0,
                   theta_call: 0, theta_put: 0, vega: 0, rho_call: 0, rho_put: 0, d1: 0, d2: 0 }
    return zero
  }

  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT

  const Nd1 = normalCDF(d1)
  const Nd2 = normalCDF(d2)
  const Nnd1 = normalCDF(-d1)
  const Nnd2 = normalCDF(-d2)
  const nd1 = normalPDF(d1)

  const eqT = Math.exp(-q * T)
  const erT = Math.exp(-r * T)

  const call = S * eqT * Nd1 - K * erT * Nd2
  const put  = K * erT * Nnd2 - S * eqT * Nnd1

  const delta_call =  eqT * Nd1
  const delta_put  = -eqT * Nnd1
  const gamma = eqT * nd1 / (S * sigma * sqrtT)
  const vega  = S * eqT * nd1 * sqrtT / 100  // por 1% de vol

  const theta_call = (-(S * eqT * nd1 * sigma) / (2 * sqrtT)
    - r * K * erT * Nd2 + q * S * eqT * Nd1) / 365
  const theta_put  = (-(S * eqT * nd1 * sigma) / (2 * sqrtT)
    + r * K * erT * Nnd2 - q * S * eqT * Nnd1) / 365

  const rho_call =  K * T * erT * Nd2  / 100  // por 1% de juro
  const rho_put  = -K * T * erT * Nnd2 / 100

  return { call, put, delta_call, delta_put, gamma, theta_call, theta_put, vega, rho_call, rho_put, d1, d2 }
}

// ── Volatilidade Implícita (Newton-Raphson) ───────────────────

export type TipoOpcao = 'call' | 'put'

/**
 * Calcula a volatilidade implícita dado o preço de mercado da opção.
 * Método Newton-Raphson — converge em ~5 iterações.
 */
export function volImplicita(
  precoMercado: number,
  opts: Omit<OpcoesBS, 'sigma'>,
  tipo: TipoOpcao = 'call',
  maxIter = 100,
  tol = 1e-8,
): number {
  let sigma = 0.20  // estimativa inicial

  for (let i = 0; i < maxIter; i++) {
    const bs = blackScholes({ ...opts, sigma })
    const preco = tipo === 'call' ? bs.call : bs.put
    const vega  = bs.vega * 100   // vega em termos absolutos (não por 1%)
    const diff  = preco - precoMercado
    if (Math.abs(diff) < tol) break
    if (Math.abs(vega) < 1e-10) break
    sigma -= diff / vega
    sigma = Math.max(0.001, Math.min(sigma, 20))  // bound [0.1%, 2000%]
  }

  return sigma
}

// ── Binomial (Cox-Ross-Rubinstein) — também suporta americanas ──

export interface OpcoesBinomial extends OpcoesBS {
  passos?: number          // número de passos (default 200)
  americana?: boolean      // true = opção americana
}

export function binomialCRR(opts: OpcoesBinomial): { call: number; put: number } {
  const { S, K, T, r, sigma, americana = false } = opts
  const q = opts.q ?? 0
  const N = opts.passos ?? 200

  const dt   = T / N
  const u    = Math.exp(sigma * Math.sqrt(dt))
  const d    = 1 / u
  const disc = Math.exp(-r * dt)
  const pu   = (Math.exp((r - q) * dt) - d) / (u - d)
  const pd   = 1 - pu

  // Preços terminais
  const ST: number[] = []
  for (let j = 0; j <= N; j++) ST.push(S * Math.pow(u, N - j) * Math.pow(d, j))

  // Payoffs terminais
  const call = ST.map(s => Math.max(s - K, 0))
  const put  = ST.map(s => Math.max(K - s, 0))

  // Backward induction
  for (let i = N - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      const sNode = S * Math.pow(u, i - j) * Math.pow(d, j)
      call[j] = disc * (pu * call[j] + pd * call[j + 1])
      put[j]  = disc * (pu * put[j]  + pd * put[j + 1])
      if (americana) {
        call[j] = Math.max(call[j], sNode - K)
        put[j]  = Math.max(put[j],  K - sNode)
      }
    }
  }

  return { call: call[0], put: put[0] }
}
