// ============================================================
// CRISTAL CAPITAL TERMINAL — Volatilidade (TypeScript)
// Heston MC, SABR approx, Vol Surface, GARCH(1,1)
// ============================================================

import { normalCDF } from './statistics'
import { blackScholes, volImplicita } from './black-scholes'

// ── Heston Model (Monte Carlo) ────────────────────────────────

export interface ParametrosHeston {
  S: number       // Preço spot
  K: number       // Strike
  T: number       // Maturidade (anos)
  r: number       // Taxa livre de risco
  v0: number      // Variância inicial (vol0² — ex: 0.04 para 20% vol)
  kappa: number   // Velocidade de reversão à média
  theta: number   // Variância de longo prazo (theta — ex: 0.04)
  xi: number      // Vol-of-vol (volatilidade da volatilidade)
  rho: number     // Correlação spot-vol (típ. negativa: -0.7)
  simulacoes?: number
  passos?: number
  tipo?: 'call' | 'put'
}

export interface ResultadoHeston {
  preco: number
  volImplicita: number  // vol implícita BS que dá o mesmo preço
  skew: number          // aproximação do skew
}

export function hestonMC(p: ParametrosHeston): ResultadoHeston {
  const { S, K, T, r, v0, kappa, theta, xi, rho } = p
  const tipo = p.tipo ?? 'call'
  const N = p.passos ?? 100
  const M = p.simulacoes ?? 20000
  const dt = T / N
  const sqdt = Math.sqrt(dt)
  const disc = Math.exp(-r * T)

  let soma = 0

  for (let m = 0; m < M; m++) {
    let St = S
    let Vt = Math.max(v0, 0)

    for (let i = 0; i < N; i++) {
      // Dois Browns correlacionados: Z1 e Z2 com corr rho
      const Z1 = randomNorm()
      const Z2 = rho * Z1 + Math.sqrt(1 - rho * rho) * randomNorm()

      const sqVt = Math.sqrt(Math.max(Vt, 0))

      // Milstein scheme para Vol (mais estável que Euler)
      Vt = Math.abs(
        Vt + kappa * (theta - Vt) * dt + xi * sqVt * Z2 * sqdt +
        0.25 * xi * xi * dt * (Z2 * Z2 - 1)
      )

      // Euler para S
      St *= Math.exp((r - 0.5 * Vt) * dt + sqVt * Z1 * sqdt)
    }

    const payoff = tipo === 'call' ? Math.max(St - K, 0) : Math.max(K - St, 0)
    soma += payoff
  }

  const preco = disc * soma / M

  // Vol implícita BS correspondente
  let vi = 0
  try {
    vi = volImplicita(preco, { S, K, T, r }, tipo)
  } catch { vi = Math.sqrt(v0) }

  // Skew aproximado (diferença IV entre 90% e 110% strike)
  const K_low = S * 0.90
  const K_high = S * 1.10
  const preco_low  = disc * simularHestonSimples(S, K_low,  T, r, v0, kappa, theta, xi, rho, tipo, M / 4, N)
  const preco_high = disc * simularHestonSimples(S, K_high, T, r, v0, kappa, theta, xi, rho, tipo, M / 4, N)
  const vi_low  = volImplicita(Math.max(preco_low,  0.001), { S, K: K_low,  T, r }, tipo)
  const vi_high = volImplicita(Math.max(preco_high, 0.001), { S, K: K_high, T, r }, tipo)
  const skew = vi_high - vi_low

  return { preco, volImplicita: vi, skew }
}

function simularHestonSimples(S: number, K: number, T: number, r: number, v0: number,
  kappa: number, theta: number, xi: number, rho: number, tipo: string, M: number, N: number): number {
  const dt = T / N
  const sqdt = Math.sqrt(dt)
  let soma = 0
  for (let m = 0; m < M; m++) {
    let St = S, Vt = Math.max(v0, 0)
    for (let i = 0; i < N; i++) {
      const Z1 = randomNorm()
      const Z2 = rho * Z1 + Math.sqrt(1 - rho * rho) * randomNorm()
      const sqVt = Math.sqrt(Math.max(Vt, 0))
      Vt = Math.abs(Vt + kappa * (theta - Vt) * dt + xi * sqVt * Z2 * sqdt)
      St *= Math.exp((r - 0.5 * Vt) * dt + sqVt * Z1 * sqdt)
    }
    soma += tipo === 'call' ? Math.max(St - K, 0) : Math.max(K - St, 0)
  }
  return soma / M
}

function randomNorm(): number {
  const u1 = Math.random(), u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 + 1e-15)) * Math.cos(2 * Math.PI * u2)
}

// ── SABR Model (Hagan et al. 2002) ────────────────────────────

export interface ParametrosSABR {
  F: number       // Forward price
  K: number       // Strike
  T: number       // Maturidade
  alpha: number   // Volatilidade inicial (SABR alpha)
  beta: number    // CEV exponent (0=Normal, 1=Log-normal)
  rho: number     // Correlação forward-vol
  nu: number      // Vol-of-vol
}

/** Aproximação analítica de Hagan para SABR vol implícita */
export function sabrVolImplicita(p: ParametrosSABR): number {
  const { F, K, T, alpha, beta, rho, nu } = p

  if (Math.abs(F - K) < 1e-8) {
    // ATM formula
    const Fatm = Math.pow(F, 1 - beta)
    const z = (nu / alpha) * Fatm * Math.log(F / K + 1e-10)
    const A = alpha / (Fatm * (1 + (Math.pow(1 - beta, 2) / 24 * alpha * alpha / Math.pow(Fatm, 2) +
              rho * beta * nu * alpha / (4 * Fatm) + (2 - 3 * rho * rho) / 24 * nu * nu) * T))
    return A
  }

  const logFK = Math.log(F / K)
  const FK_mid = Math.pow(F * K, (1 - beta) / 2)
  const z = (nu / alpha) * FK_mid * logFK

  const x_z = Math.log((Math.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho))
  const zx = Math.abs(x_z) < 1e-8 ? 1 : z / x_z

  const A = alpha / (FK_mid * (1 + Math.pow(1 - beta, 2) / 24 * logFK * logFK +
            Math.pow(1 - beta, 4) / 1920 * Math.pow(logFK, 4)))

  const B = 1 + (Math.pow(1 - beta, 2) / 24 * alpha * alpha / Math.pow(FK_mid, 2) +
            rho * beta * nu * alpha / (4 * FK_mid) + (2 - 3 * rho * rho) / 24 * nu * nu) * T

  return A * zx * B
}

// ── Vol Surface ───────────────────────────────────────────────

export interface PontoSuperficie {
  maturidade: number    // anos
  moneyness: number     // K/S (1.0 = ATM, <1 = OTM put, >1 = OTM call)
  volImplicita: number  // decimal
}

export function gerarSuperficieHeston(
  S: number, r: number,
  p: Pick<ParametrosHeston, 'v0' | 'kappa' | 'theta' | 'xi' | 'rho'>,
  maturidades = [0.1, 0.25, 0.5, 1, 2],
  moneyness  = [0.80, 0.85, 0.90, 0.95, 1.0, 1.05, 1.10, 1.15, 1.20],
  simReducidas = 3000,
): PontoSuperficie[] {
  const superficie: PontoSuperficie[] = []

  for (const T of maturidades) {
    for (const m of moneyness) {
      const K = S * m
      const disc = Math.exp(-r * T)
      const N = Math.max(20, Math.round(50 * T))
      const preco = disc * simularHestonSimples(S, K, T, r, p.v0, p.kappa, p.theta, p.xi, p.rho, 'call', simReducidas, N)
      let vi = Math.sqrt(p.v0)
      try {
        vi = volImplicita(Math.max(preco, 1e-6), { S, K, T, r }, 'call')
      } catch { /* usa v0 como fallback */ }
      superficie.push({ maturidade: T, moneyness: m, volImplicita: vi })
    }
  }

  return superficie
}

// ── GARCH(1,1) ───────────────────────────────────────────────

export interface ParametrosGARCH {
  omega: number   // constante
  alpha: number   // ARCH term (choque anterior)
  beta: number    // GARCH term (variância anterior)
}

export interface ResultadoGARCH {
  parametros: ParametrosGARCH
  variancias: number[]    // série de variâncias condicionais
  volAnualizada: number   // vol de longo prazo anualizada
  logLikelihood: number
}

/** Fit GARCH(1,1) por MLE (gradient descent simplificado) */
export function fitGARCH(retornos: number[], diasAno = 252): ResultadoGARCH {
  const n = retornos.length
  const varInicial = retornos.reduce((s, r) => s + r * r, 0) / n

  let omega = varInicial * 0.05
  let alpha = 0.10
  let betaG = 0.85

  const computeLL = (om: number, al: number, be: number) => {
    let v = varInicial
    let ll = 0
    for (const r of retornos) {
      v = om + al * r * r + be * v
      v = Math.max(v, 1e-10)
      ll -= 0.5 * (Math.log(2 * Math.PI) + Math.log(v) + r * r / v)
    }
    return ll
  }

  // Gradient descent simples
  const lr = 1e-6
  for (let iter = 0; iter < 500; iter++) {
    const base = computeLL(omega, alpha, betaG)
    const dOm = (computeLL(omega + lr, alpha, betaG) - base) / lr
    const dAl = (computeLL(omega, alpha + lr, betaG) - base) / lr
    const dBe = (computeLL(omega, alpha, betaG + lr) - base) / lr
    omega += 0.01 * dOm; omega = Math.max(omega, 1e-8)
    alpha += 0.01 * dAl; alpha = Math.max(alpha, 1e-6)
    betaG += 0.01 * dBe; betaG = Math.max(betaG, 1e-6)
    // Garantir estacionaridade
    if (alpha + betaG >= 1) { const s = (alpha + betaG) * 1.01; alpha /= s; betaG /= s }
  }

  // Série de variâncias
  const variancias: number[] = []
  let v = varInicial
  for (const r of retornos) {
    v = omega + alpha * r * r + betaG * v
    variancias.push(v)
  }

  const volLP = Math.sqrt(omega / (1 - alpha - betaG) * diasAno)
  const ll = computeLL(omega, alpha, betaG)

  return { parametros: { omega, alpha, beta: betaG }, variancias, volAnualizada: volLP, logLikelihood: ll }
}

// ── Smile de Volatilidade (SVI — Stochastic Vol Inspired) ────

export interface ParametrosSVI {
  a: number; b: number; rho: number; m: number; sigma: number
}

export function sviVol(k: number, p: ParametrosSVI): number {
  // k = log(K/F), retorna variância total w = sigma² * T
  const { a, b, rho, m, sigma } = p
  return a + b * (rho * (k - m) + Math.sqrt(Math.pow(k - m, 2) + sigma * sigma))
}

export function gerarSmileSVI(
  F: number, T: number, p: ParametrosSVI,
  strikes: number[],
): { strike: number; vol: number }[] {
  return strikes.map(K => {
    const k = Math.log(K / F)
    const w = sviVol(k, p)
    return { strike: K, vol: Math.sqrt(Math.max(w, 0) / T) }
  })
}
