// ============================================================
// CRISTAL CAPITAL TERMINAL — Exotic Options (TypeScript)
// Asian, Barrier, Lookback, Digital, Spread, Quanto,
// Compound, Chooser options — analytical + Monte Carlo
// ============================================================

import { normalCDF, normalPDF, normalInvCDF } from './statistics'
import { blackScholes } from './black-scholes'

/** Box-Muller standard normal sample */
function rnd(): number {
  const u1 = Math.random(), u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 + 1e-15)) * Math.cos(2 * Math.PI * u2)
}

// ── Interfaces ────────────────────────────────────────────────

export interface ExoticResult {
  price: number
  delta?: number
  gamma?: number
  vega?: number
  theta?: number
  stdError?: number
}

// ── Asian Options ────────────────────────────────────────────
// Geometric average: closed-form via adjusted BS parameters
// Arithmetic average: Monte Carlo with antithetic variates

/**
 * Asian option pricing.
 * Geometric averaging: closed-form (Kemna & Vorst 1990 for continuous avg).
 * Arithmetic averaging: Monte Carlo with antithetic variates.
 *
 * @param S     Spot price
 * @param K     Strike
 * @param T     Time to maturity (years)
 * @param r     Risk-free rate
 * @param sigma Volatility
 * @param n     Number of averaging steps
 * @param type  'call' | 'put'
 * @param averaging 'geometric' | 'arithmetic'
 */
export function asianOption(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  n: number,
  type: 'call' | 'put' = 'call',
  averaging: 'geometric' | 'arithmetic' = 'arithmetic',
): ExoticResult {
  if (T <= 0 || sigma <= 0 || S <= 0) return { price: 0 }

  if (averaging === 'geometric') {
    // Kemna-Vorst continuous geometric average approximation
    // Adjusted parameters: sigma_g = sigma/sqrt(3), r_g adjusted
    const sigmaG = sigma / Math.sqrt(3)
    const bG = 0.5 * (r - 0.5 * sigma * sigma + (r - 0.5 * sigmaG * sigmaG))
    const d1 = (Math.log(S / K) + (bG + 0.5 * sigmaG * sigmaG) * T) / (sigmaG * Math.sqrt(T))
    const d2 = d1 - sigmaG * Math.sqrt(T)
    const df = Math.exp(-r * T)
    const price = type === 'call'
      ? Math.exp((bG - r) * T) * S * normalCDF(d1) - K * df * normalCDF(d2)
      : K * df * normalCDF(-d2) - Math.exp((bG - r) * T) * S * normalCDF(-d1)
    return { price: Math.max(0, price) }
  }

  // Arithmetic: Monte Carlo with antithetic variates
  const M = 50000
  const dt = T / n
  const drift = (r - 0.5 * sigma * sigma) * dt
  const dif = sigma * Math.sqrt(dt)
  const df = Math.exp(-r * T)

  let sum = 0, sum2 = 0
  for (let m = 0; m < M / 2; m++) {
    let S1 = S, S2 = S
    let avg1 = 0, avg2 = 0
    for (let i = 0; i < n; i++) {
      const z = rnd()
      S1 *= Math.exp(drift + dif * z)
      S2 *= Math.exp(drift - dif * z)
      avg1 += S1
      avg2 += S2
    }
    avg1 /= n; avg2 /= n
    const p1 = type === 'call' ? Math.max(avg1 - K, 0) : Math.max(K - avg1, 0)
    const p2 = type === 'call' ? Math.max(avg2 - K, 0) : Math.max(K - avg2, 0)
    const payoff = (p1 + p2) / 2
    sum += payoff
    sum2 += payoff * payoff
  }
  const price = df * sum / (M / 2)
  const variance = (sum2 / (M / 2) - (sum / (M / 2)) ** 2) / (M / 2)
  return { price, stdError: Math.sqrt(variance) * df }
}

// ── Barrier Options ──────────────────────────────────────────
// Analytical formulas (Reiner & Rubinstein 1991)

type BarrierType = 'up-and-out' | 'up-and-in' | 'down-and-out' | 'down-and-in'

/**
 * Barrier option pricing (Reiner-Rubinstein analytical formulas).
 * Supports all 8 combinations: up/down × in/out × call/put.
 *
 * @param S       Spot
 * @param K       Strike
 * @param T       Maturity
 * @param r       Risk-free rate
 * @param sigma   Volatility
 * @param barrier Barrier level H
 * @param type    'call' | 'put'
 * @param direction 'up-and-out' | 'up-and-in' | 'down-and-out' | 'down-and-in'
 * @param rebate  Cash rebate if knocked out (default 0)
 */
export function barrierOption(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  barrier: number,
  type: 'call' | 'put' = 'call',
  direction: BarrierType = 'up-and-out',
  rebate = 0,
): ExoticResult {
  if (T <= 0 || sigma <= 0) return { price: 0 }
  const H = barrier
  const sqT = Math.sqrt(T)
  const mu = (r - 0.5 * sigma * sigma) / (sigma * sigma)
  const lambda = Math.sqrt(mu * mu + 2 * r / (sigma * sigma))

  // Standard BS price
  const bsResult = blackScholes({ S, K, T, r, sigma })
  const bsPrice = type === 'call' ? bsResult.call : bsResult.put

  // Helper terms
  const x1 = Math.log(S / K) / (sigma * sqT) + (1 + mu) * sigma * sqT
  const x2 = Math.log(S / H) / (sigma * sqT) + (1 + mu) * sigma * sqT
  const y1 = Math.log(H * H / (S * K)) / (sigma * sqT) + (1 + mu) * sigma * sqT
  const y2 = Math.log(H / S) / (sigma * sqT) + (1 + mu) * sigma * sqT
  const z  = Math.log(H / S) / (sigma * sqT) + lambda * sigma * sqT

  const phi = type === 'call' ? 1 : -1
  const eta = direction.startsWith('down') ? 1 : -1

  // Reiner-Rubinstein building blocks A through F
  const df = Math.exp(-r * T)
  const A = phi * (S * normalCDF(phi * x1) - K * df * normalCDF(phi * (x1 - sigma * sqT)))
  const B = phi * (S * normalCDF(phi * x2) - K * df * normalCDF(phi * (x2 - sigma * sqT)))
  const C = phi * (S * Math.pow(H / S, 2 * (mu + 1)) * normalCDF(eta * y1) -
            K * df * Math.pow(H / S, 2 * mu) * normalCDF(eta * (y1 - sigma * sqT)))
  const D = phi * (S * Math.pow(H / S, 2 * (mu + 1)) * normalCDF(eta * y2) -
            K * df * Math.pow(H / S, 2 * mu) * normalCDF(eta * (y2 - sigma * sqT)))
  const E = rebate * df * (normalCDF(eta * (x2 - sigma * sqT)) -
            Math.pow(H / S, 2 * mu) * normalCDF(eta * (y2 - sigma * sqT)))
  const F = rebate * (Math.pow(H / S, mu + lambda) * normalCDF(eta * z) +
            Math.pow(H / S, mu - lambda) * normalCDF(eta * (z - 2 * lambda * sigma * sqT)))

  let price = 0
  const isCall = type === 'call'
  const isUp   = direction.startsWith('up')
  const isOut  = direction.endsWith('out')

  if (isCall && isDown(direction) && K >= H) {
    price = isOut ? 0 + E : bsPrice + E
  } else if (isCall && isDown(direction) && K < H) {
    price = isOut ? A - C + E : C + E
  } else if (isCall && isUp && K >= H) {
    price = isOut ? 0 + E : bsPrice + E
  } else if (isCall && isUp && K < H) {
    price = isOut ? A - B + C - D + E : B - C + D + E
  } else if (!isCall && isDown(direction) && K >= H) {
    price = isOut ? B - C + D + E : A - B + C - D + E
  } else if (!isCall && isDown(direction) && K < H) {
    price = isOut ? A - D + E : D + E
  } else if (!isCall && isUp && K >= H) {
    price = isOut ? A - C + E : C + E
  } else { // put up K < H
    price = isOut ? 0 + E : bsPrice + E
  }

  return { price: Math.max(0, price) }
}

function isDown(d: BarrierType) { return d.startsWith('down') }

// ── Lookback Options ──────────────────────────────────────────
// Goldman-Sosin-Gatto (1979) analytical for floating strike

/**
 * Floating-strike lookback option.
 * Call: payoff = S_T - S_min  |  Put: payoff = S_max - S_T
 * Analytical formula (Goldman-Sosin-Gatto).
 *
 * @param S     Current spot
 * @param T     Time to maturity
 * @param r     Risk-free rate
 * @param sigma Volatility
 * @param type  'call' | 'put'
 * @param Smin  Running minimum (for call), defaults to S
 * @param Smax  Running maximum (for put), defaults to S
 */
export function lookbackOption(
  S: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put' = 'call',
  Smin?: number,
  Smax?: number,
): ExoticResult {
  if (T <= 0 || sigma <= 0) return { price: 0 }
  const sqT = Math.sqrt(T)
  const df = Math.exp(-r * T)

  if (type === 'call') {
    const m = Smin ?? S
    const a1 = (Math.log(S / m) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT)
    const a2 = a1 - sigma * sqT
    const a3 = (-Math.log(S / m) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT)
    const price = S * normalCDF(a1) - m * df * normalCDF(a2)
      - S * sigma * sigma / (2 * r) * (normalCDF(-a1) - df * Math.pow(m / S, 2 * r / (sigma * sigma)) * normalCDF(-a3))
    return { price: Math.max(0, price) }
  } else {
    const M = Smax ?? S
    const b1 = (-Math.log(S / M) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT)
    const b2 = b1 - sigma * sqT
    const b3 = (Math.log(S / M) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT)
    const price = M * df * normalCDF(b2) - S * normalCDF(-b1)
      + S * sigma * sigma / (2 * r) * (normalCDF(b1) - df * Math.pow(M / S, 2 * r / (sigma * sigma)) * normalCDF(b3))
    return { price: Math.max(0, price) }
  }
}

// ── Digital / Binary Options ──────────────────────────────────

/**
 * Digital (binary) cash-or-nothing option.
 * Pays $1 if S_T > K (call) or S_T < K (put) at expiry.
 * Price = e^{-rT} * N(d2)  for call, N(-d2) for put.
 */
export function digitalOption(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put' = 'call',
): ExoticResult {
  if (T <= 0 || sigma <= 0) {
    const intrinsic = type === 'call' ? (S > K ? 1 : 0) : (S < K ? 1 : 0)
    return { price: intrinsic }
  }
  const sqT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT)
  const d2 = d1 - sigma * sqT
  const df = Math.exp(-r * T)

  const price = type === 'call' ? df * normalCDF(d2) : df * normalCDF(-d2)

  // Delta: d/dS of digital call = df * N'(d2) / (S * sigma * sqT)
  const delta = type === 'call'
    ? df * normalPDF(d2) / (S * sigma * sqT)
    : -df * normalPDF(d2) / (S * sigma * sqT)

  return { price, delta }
}

// ── Spread Options (Kirk's Approximation) ────────────────────

/**
 * Spread option on difference of two assets: max(S1 - S2 - K, 0).
 * Kirk (1995) approximation — very accurate for small K.
 *
 * @param S1    Price of asset 1
 * @param S2    Price of asset 2
 * @param K     Strike (often 0 for exchange option)
 * @param T     Maturity
 * @param r     Risk-free rate
 * @param sigma1 Vol of asset 1
 * @param sigma2 Vol of asset 2
 * @param rho   Correlation between assets
 */
export function spreadOption(
  S1: number,
  S2: number,
  K: number,
  T: number,
  r: number,
  sigma1: number,
  sigma2: number,
  rho: number,
): ExoticResult {
  if (T <= 0) return { price: Math.max(S1 - S2 - K, 0) }
  const df = Math.exp(-r * T)
  const F1 = S1 * Math.exp(r * T)
  const F2 = S2 * Math.exp(r * T)

  // Kirk substitution: F2' = F2 + K
  const F2k = F2 + K
  const sigmaK = Math.sqrt(
    sigma1 * sigma1 + (sigma2 * F2 / F2k) ** 2 - 2 * rho * sigma1 * sigma2 * F2 / F2k
  )
  const sqT = Math.sqrt(T)
  const d1 = (Math.log(F1 / F2k) + 0.5 * sigmaK * sigmaK * T) / (sigmaK * sqT)
  const d2 = d1 - sigmaK * sqT
  const price = df * (F1 * normalCDF(d1) - F2k * normalCDF(d2))
  return { price: Math.max(0, price) }
}

// ── Quanto Options ────────────────────────────────────────────

/**
 * Quanto option — foreign asset, domestic payoff.
 * Adjustment: effective drift = r_d - rho * sigma_s * sigma_fx
 *
 * @param S       Foreign asset price (in foreign currency)
 * @param K       Strike (in foreign currency, paid in domestic)
 * @param T       Maturity
 * @param r_d     Domestic risk-free rate
 * @param r_f     Foreign risk-free rate
 * @param sigma_s Asset volatility
 * @param sigma_fx FX volatility (foreign/domestic)
 * @param rho     Correlation asset vs FX rate
 * @param type    'call' | 'put'
 */
export function quantoOption(
  S: number,
  K: number,
  T: number,
  r_d: number,
  r_f: number,
  sigma_s: number,
  sigma_fx: number,
  rho: number,
  type: 'call' | 'put' = 'call',
): ExoticResult {
  if (T <= 0) return { price: Math.max(type === 'call' ? S - K : K - S, 0) }

  // Quanto adjustment reduces the drift by rho * sigma_s * sigma_fx
  const quantoAdj = rho * sigma_s * sigma_fx
  const b = r_f - quantoAdj  // cost of carry in quanto world

  const sqT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (b + 0.5 * sigma_s * sigma_s) * T) / (sigma_s * sqT)
  const d2 = d1 - sigma_s * sqT
  const df = Math.exp(-r_d * T)
  const dfb = Math.exp((b - r_d) * T)

  const price = type === 'call'
    ? S * dfb * normalCDF(d1) - K * df * normalCDF(d2)
    : K * df * normalCDF(-d2) - S * dfb * normalCDF(-d1)

  return { price: Math.max(0, price) }
}

// ── Compound Options ──────────────────────────────────────────
// Option on an option (Geske 1979)

/**
 * Compound option: option on an option.
 * type = 'call-on-call' | 'call-on-put' | 'put-on-call' | 'put-on-put'
 *
 * @param S   Spot
 * @param K1  Strike of the compound option (outer)
 * @param K2  Strike of the underlying option (inner)
 * @param T1  Expiry of the compound option (T1 < T2)
 * @param T2  Expiry of the underlying option
 * @param r   Risk-free rate
 * @param sigma Volatility
 * @param type  'call-on-call' | 'put-on-call' | 'call-on-put' | 'put-on-put'
 */
export function compoundOption(
  S: number,
  K1: number,
  K2: number,
  T1: number,
  T2: number,
  r: number,
  sigma: number,
  type: 'call-on-call' | 'put-on-call' | 'call-on-put' | 'put-on-put' = 'call-on-call',
): ExoticResult {
  if (T1 <= 0 || T2 <= T1) return { price: 0 }

  const sqT1 = Math.sqrt(T1)
  const sqT2 = Math.sqrt(T2)
  const rho = Math.sqrt(T1 / T2)
  const df1 = Math.exp(-r * T1)
  const df2 = Math.exp(-r * T2)

  // Find Sstar: value of underlying option at T1 = K1
  // Binary search for critical spot at T1
  let lo = 0.01, hi = S * 10
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const bsInner = blackScholes({ S: mid, K: K2, T: T2 - T1, r, sigma })
    const innerVal = type.endsWith('call') ? bsInner.call : bsInner.put
    if (innerVal > K1) hi = mid; else lo = mid
  }
  const Sstar = (lo + hi) / 2

  const a1 = (Math.log(S / Sstar) + (r + 0.5 * sigma * sigma) * T1) / (sigma * sqT1)
  const a2 = a1 - sigma * sqT1
  const b1 = (Math.log(S / K2) + (r + 0.5 * sigma * sigma) * T2) / (sigma * sqT2)
  const b2 = b1 - sigma * sqT2

  // Bivariate normal approximation using the Owen T function approach
  function bvn(h: number, k: number, r: number): number {
    return bivNormCDF(h, k, r)
  }

  let price: number
  if (type === 'call-on-call') {
    price = S * bvn(a1, b1, rho) - K2 * df2 * bvn(a2, b2, rho) - K1 * df1 * normalCDF(a2)
  } else if (type === 'put-on-call') {
    price = K2 * df2 * bvn(-a2, b2, -rho) - S * bvn(-a1, b1, -rho) + K1 * df1 * normalCDF(-a2)
  } else if (type === 'call-on-put') {
    price = K2 * df2 * bvn(-a2, -b2, rho) - S * bvn(-a1, -b1, rho) - K1 * df1 * normalCDF(-a2)
  } else { // put-on-put
    price = S * bvn(a1, -b1, -rho) - K2 * df2 * bvn(a2, -b2, -rho) + K1 * df1 * normalCDF(a2)
  }

  return { price: Math.max(0, price) }
}

/**
 * Bivariate normal CDF approximation (Drezner 1978).
 * P(X <= h, Y <= k) with correlation rho.
 */
function bivNormCDF(h: number, k: number, rho: number): number {
  // Gauss-Legendre 10-point quadrature
  const w = [0.1791588, 0.1765627, 0.1680041, 0.1540458, 0.1355069,
             0.1134890, 0.0893736, 0.0640097, 0.0381603, 0.0124109]
  const x = [0.0765265, 0.2277859, 0.3737061, 0.5108670, 0.6360537,
             0.7463065, 0.8391170, 0.9122344, 0.9639719, 0.9931286]
  const hk = h * k
  let bvn = 0

  if (Math.abs(rho) < 0.925) {
    const hs = (h * h + k * k) / 2
    const asr = Math.asin(rho)
    for (let i = 0; i < 10; i++) {
      for (const s of [-1, 1]) {
        const sn = Math.sin(asr * (s * x[i] + 1) / 2)
        bvn += w[i] * Math.exp((sn * hk - hs) / (1 - sn * sn))
      }
    }
    bvn = bvn * asr / (4 * Math.PI) + normalCDF(-h) * normalCDF(-k)
  } else {
    if (rho < 0) { k = -k; hk = -hk }
    if (Math.abs(rho) < 1) {
      const ASS = (1 - rho) * (1 + rho)
      const a  = Math.sqrt(ASS)
      const bs = (h - k) * (h - k)
      const c  = (4 - hk) / 8
      const d  = (12 - hk) / 16
      const asr = -(bs / ASS + hk) / 2
      if (asr > -100) bvn = a * Math.exp(asr) * (1 - c * (bs - ASS) * (1 - d * bs / 5) / 3 + c * d * ASS * ASS / 5)
      if (-hk < 100) {
        const b2 = Math.sqrt(bs)
        bvn -= Math.exp(-hk / 2) * Math.sqrt(2 * Math.PI) * normalCDF(-b2 / a) * b2 * (1 - c * bs * (1 - d * bs / 5) / 3)
      }
      bvn /= (2 * Math.PI)
    }
    if (rho > 0) bvn += normalCDF(-Math.max(h, k))
    else bvn = -bvn + Math.max(0, normalCDF(-h) - normalCDF(-k))
  }
  return Math.max(0, Math.min(1, bvn))
}

// ── Chooser Options ───────────────────────────────────────────

/**
 * Chooser option (as-you-like-it).
 * At time t_choose, holder chooses to have a call or put with strike K, expiry T.
 *
 * Rubinstein (1991): price = BS_call(S, K, T, r, sigma) + BS_put(S, K*, t_choose, r, sigma)
 * where K* = K * exp(-r*(T - t_choose)) (adjusted strike for put).
 */
export function chooserOption(
  S: number,
  K: number,
  T: number,
  t_choose: number,
  r: number,
  sigma: number,
): ExoticResult {
  if (t_choose <= 0 || T <= t_choose) {
    // Standard option
    const bs = blackScholes({ S, K, T, r, sigma })
    return { price: Math.max(bs.call, bs.put) }
  }

  // Simple chooser decomposition:
  // V = Call(S, K, T) + Put(S, K_adj, t_choose)
  // K_adj = K * e^{-r*(T - t_choose)}
  const K_adj = K * Math.exp(-r * (T - t_choose))
  const bs1 = blackScholes({ S, K, T, r, sigma })
  const bs2 = blackScholes({ S, K: K_adj, T: t_choose, r, sigma })
  const price = bs1.call + bs2.put
  return { price }
}
