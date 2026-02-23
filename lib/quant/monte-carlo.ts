// ============================================================
// CRISTAL CAPITAL TERMINAL — Monte Carlo (TypeScript)
// Espelho das funções em native/quant/monte_carlo.cpp
// ============================================================

import { normalInvCDF, percentil, media, desvioPadrao } from './statistics'

// ── Gerador de Números Pseudo-aleatórios (xoshiro256++) ───────

/** Box-Muller transform para normal padrão */
function normalRand(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 + 1e-15)) * Math.cos(2 * Math.PI * u2)
}

// ── Simulação de Preços (GBM) ─────────────────────────────────

export interface ParametrosGBM {
  S0: number        // Preço inicial
  mu: number        // Drift anualizado (retorno esperado)
  sigma: number     // Volatilidade anualizada
  T: number         // Horizonte (anos)
  passos: number    // Número de passos de tempo
  simulacoes: number // Número de trajectórias
}

export interface ResultadoGBM {
  trajectorias: number[][]  // [simulacao][passo]
  precosFinal: number[]     // distribuição de preços finais
  percentis: Record<string, number>
  mediaFinal: number
  volRealizada: number
}

/**
 * Simulação Monte Carlo via Geometric Brownian Motion.
 * S(t+dt) = S(t) * exp((mu - sigma²/2)*dt + sigma*sqrt(dt)*Z)
 */
export function simularGBM(p: ParametrosGBM): ResultadoGBM {
  const dt = p.T / p.passos
  const drift = (p.mu - 0.5 * p.sigma * p.sigma) * dt
  const difusao = p.sigma * Math.sqrt(dt)

  const trajectorias: number[][] = []
  const precosFinal: number[] = []

  for (let sim = 0; sim < p.simulacoes; sim++) {
    const traj: number[] = [p.S0]
    let S = p.S0
    for (let t = 0; t < p.passos; t++) {
      S *= Math.exp(drift + difusao * normalRand())
      traj.push(S)
    }
    trajectorias.push(traj)
    precosFinal.push(S)
  }

  return {
    trajectorias,
    precosFinal,
    percentis: {
      p5:  percentil(precosFinal, 5),
      p25: percentil(precosFinal, 25),
      p50: percentil(precosFinal, 50),
      p75: percentil(precosFinal, 75),
      p95: percentil(precosFinal, 95),
    },
    mediaFinal: media(precosFinal),
    volRealizada: desvioPadrao(precosFinal) / p.S0,
  }
}

// ── Value at Risk (VaR) e CVaR ────────────────────────────────

export interface ParametrosVaR {
  retornos: number[]         // Histórico de retornos diários (log ou simples)
  confianca?: number         // Nível de confiança (default 0.95)
  horizonte?: number         // Horizonte em dias (default 1)
  simulacoes?: number        // Número de simulações MC (default 10000)
  metodo?: 'historico' | 'parametrico' | 'montecarlo'
}

export interface ResultadoVaR {
  var: number    // VaR como percentagem do portfolio (positivo = perda)
  cvar: number   // CVaR / Expected Shortfall
  metodo: string
}

export function calcularVaR(p: ParametrosVaR): ResultadoVaR {
  const confianca = p.confianca ?? 0.95
  const horizonte = p.horizonte ?? 1
  const metodo = p.metodo ?? 'historico'
  const alpha = 1 - confianca

  if (metodo === 'historico') {
    const ret = [...p.retornos].sort((a, b) => a - b)
    const idx = Math.floor(alpha * ret.length)
    const varVal = -ret[idx] * Math.sqrt(horizonte)
    const cvarVal = -media(ret.slice(0, idx)) * Math.sqrt(horizonte)
    return { var: varVal, cvar: cvarVal, metodo: 'Histórico' }
  }

  if (metodo === 'parametrico') {
    const m = media(p.retornos)
    const s = desvioPadrao(p.retornos)
    const z = -normalInvCDF(alpha)
    const varVal = -(m * horizonte - z * s * Math.sqrt(horizonte))
    // CVaR paramétrico: E[Z | Z > VaR] = phi(z)/alpha
    const cvarVal = s * Math.sqrt(horizonte) * (1 / (alpha * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z)) - m * horizonte
    return { var: varVal, cvar: cvarVal, metodo: 'Paramétrico (Normal)' }
  }

  // Monte Carlo
  const m = media(p.retornos)
  const s = desvioPadrao(p.retornos)
  const n = p.simulacoes ?? 10000
  const simRet: number[] = []
  for (let i = 0; i < n; i++) {
    let ret = 0
    for (let d = 0; d < horizonte; d++) ret += m + s * normalRand()
    simRet.push(ret)
  }
  simRet.sort((a, b) => a - b)
  const idx = Math.floor(alpha * simRet.length)
  const varVal = -simRet[idx]
  const cvarVal = -media(simRet.slice(0, idx))
  return { var: varVal, cvar: cvarVal, metodo: 'Monte Carlo' }
}

// ── Opções Monte Carlo (com variância reduzida) ───────────────

export interface OpcoesMonteCarloOpcao {
  S: number
  K: number
  T: number
  r: number
  sigma: number
  q?: number
  tipo?: 'call' | 'put' | 'asian-call' | 'asian-put' | 'barrier-up-out'
  barreira?: number
  simulacoes?: number
  passos?: number
}

export function opcaoMonteCarlo(p: OpcoesMonteCarloOpcao): number {
  const { S, K, T, r, sigma } = p
  const q = p.q ?? 0
  const N = p.passos ?? 252
  const M = p.simulacoes ?? 50000
  const tipo = p.tipo ?? 'call'
  const dt = T / N
  const drift = (r - q - 0.5 * sigma * sigma) * dt
  const dif = sigma * Math.sqrt(dt)

  let soma = 0
  for (let m = 0; m < M; m++) {
    let St = S
    const precos: number[] = [S]
    let knockout = false

    for (let i = 0; i < N; i++) {
      St *= Math.exp(drift + dif * normalRand())
      precos.push(St)
      if (tipo === 'barrier-up-out' && p.barreira && St >= p.barreira) {
        knockout = true
        break
      }
    }

    if (knockout) continue

    let payoff = 0
    if (tipo === 'call')           payoff = Math.max(St - K, 0)
    else if (tipo === 'put')       payoff = Math.max(K - St, 0)
    else if (tipo === 'asian-call') payoff = Math.max(media(precos) - K, 0)
    else if (tipo === 'asian-put')  payoff = Math.max(K - media(precos), 0)
    else if (tipo === 'barrier-up-out') payoff = Math.max(St - K, 0)
    soma += payoff
  }

  return Math.exp(-r * T) * soma / M
}

// ── Nelson-Siegel — Fitting da Curva de Taxas ─────────────────

export interface ParametrosNelsonSiegel {
  maturidades: number[]  // anos
  yields: number[]       // taxas (decimal)
}

export interface CoeficientesNS {
  beta0: number   // nível (longo prazo)
  beta1: number   // slope (curto prazo)
  beta2: number   // curvatura
  lambda: number  // factor de decaimento
  erroRMSE: number
}

function yieldNS(t: number, b0: number, b1: number, b2: number, lam: number): number {
  if (t <= 0) return b0 + b1
  const e = Math.exp(-lam * t)
  return b0 + b1 * (1 - e) / (lam * t) + b2 * ((1 - e) / (lam * t) - e)
}

/** Fitting Nelson-Siegel por mínimos quadrados (gradient descent simples) */
export function fitNelsonSiegel(p: ParametrosNelsonSiegel): CoeficientesNS {
  const n = Math.min(p.maturidades.length, p.yields.length)
  let b0 = p.yields[p.yields.length - 1] ?? 0.04
  let b1 = (p.yields[0] ?? 0.02) - b0
  let b2 = 0
  let lam = 0.5

  const lr = 0.01
  const iters = 5000

  for (let iter = 0; iter < iters; iter++) {
    const scale = lr / (1 + iter / 1000)
    let gb0 = 0, gb1 = 0, gb2 = 0, glam = 0
    for (let i = 0; i < n; i++) {
      const t = p.maturidades[i]
      const y = p.yields[i]
      const yhat = yieldNS(t, b0, b1, b2, lam)
      const err = yhat - y
      const e = Math.exp(-lam * t)
      const ilt = (1 - e) / (lam * t + 1e-9)
      gb0  += err
      gb1  += err * ilt
      gb2  += err * (ilt - e)
      glam += err * (b1 * (e * t / (lam * t + 1e-9) - ilt / lam) +
                     b2 * (e * t / (lam * t + 1e-9) - ilt / lam + e * t))
    }
    b0  -= scale * gb0 * 2 / n
    b1  -= scale * gb1 * 2 / n
    b2  -= scale * gb2 * 2 / n
    lam -= scale * glam * 2 / n
    lam = Math.max(0.01, lam)
  }

  let rmse = 0
  for (let i = 0; i < n; i++) {
    rmse += (yieldNS(p.maturidades[i], b0, b1, b2, lam) - p.yields[i]) ** 2
  }

  return { beta0: b0, beta1: b1, beta2: b2, lambda: lam, erroRMSE: Math.sqrt(rmse / n) }
}

/** Gerar curva suavizada Nelson-Siegel */
export function curvasuavisadaNS(
  coef: CoeficientesNS,
  maturidades: number[],
): number[] {
  return maturidades.map(t => yieldNS(t, coef.beta0, coef.beta1, coef.beta2, coef.lambda))
}
