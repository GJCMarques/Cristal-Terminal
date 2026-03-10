// ============================================================
// CRISTAL CAPITAL TERMINAL — Interest Rate Models
// Vasicek · CIR · Hull-White · Nelson-Siegel-Svensson
// ============================================================

import { normalCDF } from './statistics'

/** Vasicek short-rate simulation */
export function vasicekPaths(r0: number, kappa: number, theta: number, sigma: number, T: number, dt: number, nPaths: number): { paths: number[][]; times: number[] } {
  const nSteps = Math.round(T / dt)
  const times = Array.from({ length: nSteps + 1 }, (_, i) => i * dt)
  const paths: number[][] = []
  for (let p = 0; p < nPaths; p++) {
    const path = [r0]
    for (let i = 1; i <= nSteps; i++) {
      const r = path[i - 1]
      const dr = kappa * (theta - r) * dt + sigma * Math.sqrt(dt) * randn()
      path.push(r + dr)
    }
    paths.push(path)
  }
  return { paths, times }
}

/** Vasicek zero-coupon bond price (analytical) */
export function vasicekBondPrice(r0: number, kappa: number, theta: number, sigma: number, T: number): number {
  if (kappa === 0) return Math.exp(-r0 * T)
  const B = (1 - Math.exp(-kappa * T)) / kappa
  const A = (theta - sigma * sigma / (2 * kappa * kappa)) * (B - T) - (sigma * sigma * B * B) / (4 * kappa)
  return Math.exp(A - B * r0)
}

/** CIR short-rate simulation (Milstein scheme) */
export function cirPaths(r0: number, kappa: number, theta: number, sigma: number, T: number, dt: number, nPaths: number): { paths: number[][]; times: number[] } {
  const nSteps = Math.round(T / dt)
  const times = Array.from({ length: nSteps + 1 }, (_, i) => i * dt)
  const paths: number[][] = []
  for (let p = 0; p < nPaths; p++) {
    const path = [r0]
    for (let i = 1; i <= nSteps; i++) {
      const r = Math.max(path[i - 1], 0)
      const z = randn()
      const dr = kappa * (theta - r) * dt + sigma * Math.sqrt(Math.max(r, 0) * dt) * z + 0.25 * sigma * sigma * dt * (z * z - 1)
      path.push(Math.max(r + dr, 0))
    }
    paths.push(path)
  }
  return { paths, times }
}

/** CIR zero-coupon bond price (analytical) */
export function cirBondPrice(r0: number, kappa: number, theta: number, sigma: number, T: number): number {
  const h = Math.sqrt(kappa * kappa + 2 * sigma * sigma)
  const A_num = 2 * h * Math.exp((kappa + h) * T / 2)
  const A_den = 2 * h + (kappa + h) * (Math.exp(h * T) - 1)
  const A = Math.pow(A_num / A_den, 2 * kappa * theta / (sigma * sigma))
  const B = 2 * (Math.exp(h * T) - 1) / (2 * h + (kappa + h) * (Math.exp(h * T) - 1))
  return A * Math.exp(-B * r0)
}

/** Hull-White trinomial tree for short rates */
export function hullWhiteTree(r0: number, kappa: number, sigma: number, T: number, nSteps: number): { rates: number[][]; bondPrices: number[]; yieldCurve: { T: number; y: number }[] } {
  const dt = T / nSteps
  const dr = sigma * Math.sqrt(3 * dt)
  const rates: number[][] = []
  for (let i = 0; i <= nSteps; i++) {
    const n = 2 * i + 1
    const row: number[] = []
    for (let j = 0; j < n; j++) {
      row.push(r0 + (j - i) * dr + kappa * (0.05 - r0) * i * dt)
    }
    rates.push(row)
  }
  const yieldCurve: { T: number; y: number }[] = []
  const bondPrices: number[] = []
  for (let i = 1; i <= nSteps; i++) {
    const t = i * dt
    const P = vasicekBondPrice(r0, kappa, 0.05, sigma, t)
    bondPrices.push(P)
    yieldCurve.push({ T: t, y: -Math.log(P) / t })
  }
  return { rates, bondPrices, yieldCurve }
}

/** Forward Rate Agreement pricing */
export function fraRate(r1: number, r2: number, t1: number, t2: number): number {
  return ((1 + r2 * t2) / (1 + r1 * t1) - 1) / (t2 - t1)
}

/** Par swap rate from discount factors */
export function swapRate(discountFactors: number[], tenors: number[]): number {
  const n = discountFactors.length
  if (n < 2) return 0
  const annuity = tenors.slice(1).reduce((sum, t, i) => {
    const dt = t - tenors[i]
    return sum + dt * discountFactors[i + 1]
  }, 0)
  if (annuity === 0) return 0
  return (discountFactors[0] - discountFactors[n - 1]) / annuity
}

/** Nelson-Siegel-Svensson yield curve */
export function nelsonSiegelSvensson(beta0: number, beta1: number, beta2: number, beta3: number, tau1: number, tau2: number, T: number): number {
  if (T <= 0) return beta0 + beta1
  const x1 = T / tau1
  const x2 = T / tau2
  const factor1 = (1 - Math.exp(-x1)) / x1
  const factor2 = factor1 - Math.exp(-x1)
  const factor3 = (1 - Math.exp(-x2)) / x2 - Math.exp(-x2)
  return beta0 + beta1 * factor1 + beta2 * factor2 + beta3 * factor3
}

/** Generate yield curve from NSS parameters */
export function nssYieldCurve(beta0: number, beta1: number, beta2: number, beta3: number, tau1: number, tau2: number, maturities: number[]): { T: number; y: number }[] {
  return maturities.map(T => ({ T, y: nelsonSiegelSvensson(beta0, beta1, beta2, beta3, tau1, tau2, T) }))
}

/** Cap/Floor pricing via Black's model */
export function capFloorBlack(notional: number, strike: number, vol: number, forwardRate: number, discountFactor: number, T: number, type: 'cap' | 'floor'): number {
  if (vol <= 0 || T <= 0) return 0
  const d1 = (Math.log(forwardRate / strike) + 0.5 * vol * vol * T) / (vol * Math.sqrt(T))
  const d2 = d1 - vol * Math.sqrt(T)
  if (type === 'cap') {
    return notional * discountFactor * T * (forwardRate * normalCDF(d1) - strike * normalCDF(d2))
  }
  return notional * discountFactor * T * (strike * normalCDF(-d2) - forwardRate * normalCDF(-d1))
}

/** Bootstrap discount curve from par rates */
export function bootstrapCurve(parRates: number[], tenors: number[]): { T: number; df: number; zero: number }[] {
  const result: { T: number; df: number; zero: number }[] = []
  const dfs: number[] = []
  for (let i = 0; i < parRates.length; i++) {
    const c = parRates[i]
    const T = tenors[i]
    let sumPrev = 0
    for (let j = 0; j < i; j++) {
      const dt = tenors[j + 1] ? tenors[j + 1] - tenors[j] : tenors[j]
      sumPrev += c * dt * dfs[j]
    }
    const dt = i > 0 ? T - tenors[i - 1] : T
    const df = (1 - sumPrev) / (1 + c * dt)
    dfs.push(df)
    const zero = -Math.log(df) / T
    result.push({ T, df, zero })
  }
  return result
}

function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
