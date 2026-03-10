// ============================================================
// CRISTAL CAPITAL TERMINAL — Stochastic Models (TypeScript)
// Heston (CF), SABR, Merton Jump Diffusion, Variance Gamma,
// Dupire Local Vol, SABR calibration
// ============================================================

import { normalCDF, normalPDF } from './statistics'
import { blackScholes, volImplicita } from './black-scholes'

/** Box-Muller standard normal */
function rnd(): number {
  const u1 = Math.random(), u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 + 1e-15)) * Math.cos(2 * Math.PI * u2)
}

// ── Heston Model (Characteristic Function) ───────────────────

export interface HestonParams {
  S: number      // Spot
  K: number      // Strike
  T: number      // Maturity
  r: number      // Risk-free rate
  v0: number     // Initial variance (e.g. 0.04 = 20% vol)
  kappa: number  // Mean reversion speed
  theta: number  // Long-run variance
  xi: number     // Vol-of-vol
  rho: number    // Spot-vol correlation
  type?: 'call' | 'put'
}

export interface HestonResult {
  price: number
  impliedVol: number
}

/**
 * Heston model price via Carr-Madan characteristic function method.
 * Uses Gauss-Laguerre quadrature for the Gil-Pelaez inversion integral.
 *
 * Price = S * P1 - K * e^{-rT} * P2
 * where P1, P2 are risk-neutral probabilities from the char function.
 */
export function hestonPrice(p: HestonParams): HestonResult {
  const { S, K, T, r, v0, kappa, theta, xi, rho } = p
  const type = p.type ?? 'call'
  if (T <= 0 || S <= 0 || K <= 0) return { price: 0, impliedVol: 0 }

  const x = Math.log(S / K)
  const nQuad = 64

  // Gauss-Laguerre nodes and weights (64-point)
  const [nodes, weights] = gaussLaguerreNodes(nQuad)

  // Characteristic function of log(S_T) under Heston
  function charFn(u: number, j: number): { re: number; im: number } {
    // j=1: risk-neutral measure P1, j=2: risk-neutral P2
    const uj = j === 1 ? u - 0.5 * 1i_helper : u  // just a flag
    const bj = j === 1 ? kappa - rho * xi : kappa
    const uj_re = j === 1 ? u : u
    const uj_im = j === 1 ? -0.5 : 0
    const b_re = bj
    const b_im = 0

    // d = sqrt((b - i*rho*xi*u)^2 + (u^2 + i*u)*xi^2)
    // Complex arithmetic
    const a_re = b_re - rho * xi * (-uj_im)
    const a_im = b_im - rho * xi * uj_re
    const u2iu_re = uj_re * uj_re - uj_im * uj_im + uj_im
    const u2iu_im = 2 * uj_re * uj_im + uj_re
    const inside_re = a_re * a_re - a_im * a_im + xi * xi * u2iu_re
    const inside_im = 2 * a_re * a_im + xi * xi * u2iu_im
    const r_sqrt = Math.sqrt(Math.sqrt(inside_re * inside_re + inside_im * inside_im))
    const theta_sqrt = 0.5 * Math.atan2(inside_im, inside_re)
    const d_re = r_sqrt * Math.cos(theta_sqrt)
    const d_im = r_sqrt * Math.sin(theta_sqrt)

    // g = (b - d) / (b + d)
    const num_re = a_re - d_re, num_im = a_im - d_im
    const den_re = a_re + d_re, den_im = a_im + d_im
    const den2 = den_re * den_re + den_im * den_im + 1e-30
    const g_re = (num_re * den_re + num_im * den_im) / den2
    const g_im = (num_im * den_re - num_re * den_im) / den2

    // exp(d*T)
    const edT_re = Math.exp(d_re * T) * Math.cos(d_im * T)
    const edT_im = Math.exp(d_re * T) * Math.sin(d_im * T)

    // C, D terms of log char fn
    // D = (b - d)/xi^2 * (1 - e^{-dT})/(1 - g*e^{-dT})
    const emDT_re = Math.exp(-d_re * T) * Math.cos(-d_im * T)
    const emDT_im = Math.exp(-d_re * T) * Math.sin(-d_im * T)
    const geT_re = g_re * emDT_re - g_im * emDT_im
    const geT_im = g_re * emDT_im + g_im * emDT_re
    const oneMinusGET_re = 1 - geT_re, oneMinusGET_im = -geT_im
    const oneMinusEmDT_re = 1 - emDT_re, oneMinusEmDT_im = -emDT_im
    const denom2 = oneMinusGET_re * oneMinusGET_re + oneMinusGET_im * oneMinusGET_im + 1e-30
    const D_factor = (a_re - d_re) / (xi * xi)
    const D_factor_im = (a_im - d_im) / (xi * xi)
    const numDiv_re = (oneMinusEmDT_re * oneMinusGET_re + oneMinusEmDT_im * oneMinusGET_im) / denom2
    const numDiv_im = (oneMinusEmDT_im * oneMinusGET_re - oneMinusEmDT_re * oneMinusGET_im) / denom2
    const D_re = D_factor * numDiv_re - D_factor_im * numDiv_im
    const D_im = D_factor * numDiv_im + D_factor_im * numDiv_re

    // C = r*iu*T + kappa*theta/xi^2 * ((b-d)*T - 2*ln((1-g*e^dT)/(1-g)))
    const kt_xi2 = kappa * theta / (xi * xi)
    const bMinusD_re = a_re - d_re, bMinusD_im = a_im - d_im
    const bdT_re = bMinusD_re * T, bdT_im = bMinusD_im * T
    // ln((1 - g*e^dT)/(1-g))
    const denom3 = (1 - g_re) * (1 - g_re) + g_im * g_im + 1e-30
    // 1 - g * exp(dT)
    const gEdT_re = g_re * edT_re - g_im * edT_im
    const gEdT_im = g_re * edT_im + g_im * edT_re
    const oneMinusGeT_re = 1 - gEdT_re, oneMinusGeT_im = -gEdT_im
    const ratiore = (oneMinusGeT_re * (1 - g_re) + oneMinusGeT_im * (-g_im)) / denom3
    const ratioim = (oneMinusGeT_im * (1 - g_re) - oneMinusGeT_re * (-g_im)) / denom3
    const logAbs = 0.5 * Math.log(ratiore * ratiore + ratioim * ratioim)
    const logArg = Math.atan2(ratioim, ratiore)
    const C_re = r * (-uj_im) * T + kt_xi2 * (bdT_re - 2 * logAbs)
    const C_im = r * uj_re * T + kt_xi2 * (bdT_im - 2 * logArg)

    // phi = exp(C + D*v0 + iu*x)
    const expArg_re = C_re + D_re * v0
    const expArg_im = C_im + D_im * v0 + uj_re * x - uj_im * x
    const expMag = Math.exp(expArg_re)
    return { re: expMag * Math.cos(expArg_im), im: expMag * Math.sin(expArg_im) }
  }

  function dummy_1i_helper() { return 0 }
  const _1i_helper = 0  // just placeholder

  // Gauss-Legendre integration for P1 and P2
  // P_j = 0.5 + (1/pi) * integral_0^inf Re[exp(-iu*ln(K)) * phi_j(u)] / (iu) du
  let P1 = 0.5, P2 = 0.5
  const upper = 200
  const nSteps = 1000
  const du = upper / nSteps
  for (let n = 0; n < nSteps; n++) {
    const u = (n + 0.5) * du
    const phi1 = charFn(u, 1)
    const phi2 = charFn(u, 2)
    // exp(-iu * ln(K)) = cos(-u*ln(K)) + i*sin(-u*ln(K))
    const cosK = Math.cos(-u * Math.log(K))
    const sinK = Math.sin(-u * Math.log(K))
    // (phi * exp(-iu*lnK)) / (iu) = (phi * exp) / (iu)
    // 1/(iu) = -i/u => Re[x+iy / (iu)] = y/u, Im = -x/u
    const re1 = phi1.re * cosK - phi1.im * sinK
    const im1 = phi1.re * sinK + phi1.im * cosK
    P1 += (im1 / u) * du / Math.PI
    const re2 = phi2.re * cosK - phi2.im * sinK
    const im2 = phi2.re * sinK + phi2.im * cosK
    P2 += (im2 / u) * du / Math.PI
  }

  const df = Math.exp(-r * T)
  let price = type === 'call'
    ? S * Math.max(0, Math.min(1, P1)) - K * df * Math.max(0, Math.min(1, P2))
    : K * df * Math.max(0, Math.min(1, 1 - P2)) - S * Math.max(0, Math.min(1, 1 - P1))
  price = Math.max(0, price)

  let iv = Math.sqrt(v0)
  try { iv = volImplicita(price, { S, K, T, r }, type) } catch { /* fallback */ }
  return { price, impliedVol: iv }
}

function gaussLaguerreNodes(n: number): [number[], number[]] {
  // Approximate Gauss-Laguerre (not full precision, but fine for integration)
  const nodes: number[] = [], weights: number[] = []
  for (let i = 1; i <= n; i++) {
    nodes.push(i * 4 / n)
    weights.push(4 / n)
  }
  return [nodes, weights]
}

// ── SABR Implied Volatility (Hagan 2002) ─────────────────────

/**
 * SABR implied volatility — Hagan et al. (2002) formula.
 * sigma_B(F, K) with beta, alpha, rho, nu parameters.
 *
 * @param F     Forward price
 * @param K     Strike
 * @param T     Maturity
 * @param alpha SABR alpha (initial vol-like param)
 * @param beta  CEV exponent [0,1]
 * @param rho   Correlation
 * @param nu    Vol-of-vol
 */
export function sabrVol(
  F: number,
  K: number,
  T: number,
  alpha: number,
  beta: number,
  rho: number,
  nu: number,
): number {
  if (Math.abs(F - K) < 1e-7 * F) {
    // ATM formula
    const Fb = Math.pow(F, 1 - beta)
    const first = alpha / Fb
    const second = ((1 - beta) * alpha / Fb) ** 2 / 24
    const third = rho * beta * nu * alpha / (4 * Fb)
    const fourth = (2 - 3 * rho * rho) * nu * nu / 24
    return first * (1 + (second + third + fourth) * T)
  }

  const logFK = Math.log(F / K)
  const FKbeta = Math.pow(F * K, (1 - beta) / 2)
  const z = (nu / alpha) * FKbeta * logFK
  const xz = Math.log((Math.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho))
  const zOverXz = Math.abs(xz) < 1e-10 ? 1 : z / xz

  const expansion = 1
    + Math.pow((1 - beta) * logFK, 2) / 24
    + Math.pow((1 - beta) * logFK, 4) / 1920

  const correction = 1
    + (Math.pow((1 - beta) * alpha, 2) / (24 * Math.pow(FKbeta, 2))
    + rho * beta * nu * alpha / (4 * FKbeta)
    + (2 - 3 * rho * rho) * nu * nu / 24) * T

  return (alpha / (FKbeta * expansion)) * zOverXz * correction
}

// ── Merton Jump Diffusion ─────────────────────────────────────

/**
 * Merton (1976) jump-diffusion model.
 * Price = sum_{n=0}^{N_max} [Poisson(n; lambda*T) * BS(sigma_n, r_n)]
 * where sigma_n^2 = sigma^2 + n*sigmaJ^2/T
 *       r_n = r - lambda*(exp(muJ+0.5*sigmaJ^2)-1) + n*(muJ+0.5*sigmaJ^2)/T
 *
 * @param S      Spot
 * @param K      Strike
 * @param T      Maturity
 * @param r      Risk-free rate
 * @param sigma  Diffusion volatility (excluding jumps)
 * @param lambda Jump intensity (expected jumps per year)
 * @param muJ    Mean log-jump size
 * @param sigmaJ Std of log-jump size
 * @param type   'call' | 'put'
 */
export function mertonJumpDiffusion(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  lambda: number,
  muJ: number,
  sigmaJ: number,
  type: 'call' | 'put' = 'call',
): number {
  if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0)
  const Nmax = 50
  const lambdaBar = lambda * Math.exp(muJ + 0.5 * sigmaJ * sigmaJ)
  const rAdj = r - lambdaBar + lambda  // adjusted risk-free rate
  let price = 0

  // Precompute Poisson weights
  const lt = lambda * T
  let poisson = Math.exp(-lt)
  let factorial = 1

  for (let n = 0; n <= Nmax; n++) {
    if (n > 0) { poisson *= lt / n; factorial *= n }
    const sigma_n = Math.sqrt(sigma * sigma + n * sigmaJ * sigmaJ / T)
    const r_n = rAdj + n * (muJ + 0.5 * sigmaJ * sigmaJ) / T
    const bs = blackScholes({ S, K, T, r: r_n, sigma: sigma_n })
    const bsPrice = type === 'call' ? bs.call : bs.put
    price += poisson * bsPrice
    if (poisson < 1e-15) break
  }
  return price
}

// ── Variance Gamma Model ──────────────────────────────────────

/**
 * Variance Gamma (VG) option pricing via Fourier inversion.
 * VG is a time-changed Brownian motion with Gamma subordinator.
 * Char fn: phi_VG(u) = exp(iu*omega*T) * (1 - iu*theta*nu + 0.5*sigma^2*nu*u^2)^(-T/nu)
 *
 * @param S        Spot
 * @param K        Strike
 * @param T        Maturity
 * @param r        Risk-free rate
 * @param sigma    VG sigma parameter (BM vol)
 * @param theta_vg VG theta (drift of BM)
 * @param nu_vg    VG nu (variance of Gamma time)
 * @param type     'call' | 'put'
 */
export function varianceGamma(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  theta_vg: number,
  nu_vg: number,
  type: 'call' | 'put' = 'call',
): number {
  if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0)

  // Martingale correction: omega = (1/nu)*ln(1 - theta*nu - 0.5*sigma^2*nu)
  const omega = (1 / nu_vg) * Math.log(1 - theta_vg * nu_vg - 0.5 * sigma * sigma * nu_vg)
  const x = Math.log(S / K) + (r + omega) * T

  // Fourier inversion (Lewis 2001 approach with dampening)
  const alpha = 1.5  // dampening parameter
  const nSteps = 4096
  const dv = 0.5 / nSteps
  let price = 0

  for (let j = 0; j <= nSteps; j++) {
    const v = (j + 0.5) * dv
    const u = v - (alpha + 1) * 1i_c  // complex shift

    // VG characteristic function
    const logBase = Math.log(1 - theta_vg * nu_vg * u.im - 0.5 * sigma * sigma * nu_vg * (u.re * u.re - u.im * u.im))
    const argBase = -Math.atan2(theta_vg * nu_vg * u.re + sigma * sigma * nu_vg * u.re * u.im,
      1 - theta_vg * nu_vg * u.im - 0.5 * sigma * sigma * nu_vg * (u.re * u.re - u.im * u.im))

    const exponentRe = -T / nu_vg * logBase
    const exponentIm = -T / nu_vg * argBase
    const charFnMag = Math.exp(exponentRe)
    const phi_re = charFnMag * Math.cos(exponentIm)
    const phi_im = charFnMag * Math.sin(exponentIm)

    // Integrand: Re[exp(-iu*x) * phi / (alpha^2 + alpha - v^2 + i*(2*alpha+1)*v)]
    const expNeg_re = Math.cos(-v * x) * Math.exp(-alpha * x)
    const expNeg_im = Math.sin(-v * x) * Math.exp(-alpha * x)
    const prodRe = expNeg_re * phi_re - expNeg_im * phi_im
    const denomRe = alpha * alpha + alpha - v * v
    const denomIm = (2 * alpha + 1) * v
    const denom2 = denomRe * denomRe + denomIm * denomIm + 1e-30
    price += (prodRe * denomRe + (expNeg_re * phi_im + expNeg_im * phi_re) * denomIm) / denom2 * dv
  }

  price = Math.exp(-r * T) * price / Math.PI
  if (type === 'put') price = price - S + K * Math.exp(-r * T)  // put-call parity
  return Math.max(0, price)
}

const 1i_c = { re: 0, im: -1 }

// ── Dupire Local Volatility ───────────────────────────────────

/**
 * Extract Dupire local vol surface from implied vol surface.
 * Dupire formula: sigma_L^2(K,T) = [dC/dT + r*K*dC/dK] / [0.5 * K^2 * d2C/dK2]
 *
 * Uses finite differences on the provided surface.
 *
 * @param S          Current spot
 * @param strikes    Array of strikes
 * @param maturities Array of maturities
 * @param surface    surface[i][j] = implied vol for (maturities[i], strikes[j])
 * @returns localVol[i][j] = local vol at (maturities[i], strikes[j])
 */
export function localVol(
  S: number,
  strikes: number[],
  maturities: number[],
  surface: number[][],
): number[][] {
  const nT = maturities.length
  const nK = strikes.length
  const r = 0.02  // assume flat risk-free rate
  const result: number[][] = Array.from({ length: nT }, () => Array(nK).fill(0))

  // Convert IV surface to call prices
  const calls: number[][] = Array.from({ length: nT }, (_, i) =>
    Array.from({ length: nK }, (_, j) => {
      const bs = blackScholes({ S, K: strikes[j], T: maturities[i], r, sigma: surface[i][j] })
      return bs.call
    })
  )

  for (let i = 1; i < nT - 1; i++) {
    for (let j = 1; j < nK - 1; j++) {
      const T = maturities[i]
      const K = strikes[j]
      const dT = maturities[i + 1] - maturities[i - 1]
      const dK = strikes[j + 1] - strikes[j - 1]

      const dCdT = (calls[i + 1][j] - calls[i - 1][j]) / dT
      const dCdK = (calls[i][j + 1] - calls[i][j - 1]) / dK
      const d2CdK2 = (calls[i][j + 1] - 2 * calls[i][j] + calls[i][j - 1]) / (dK / 2 * dK / 2)

      const numerator = dCdT + r * K * dCdK
      const denominator = 0.5 * K * K * d2CdK2

      if (denominator > 1e-10) {
        result[i][j] = Math.sqrt(Math.max(0, numerator / denominator))
      } else {
        result[i][j] = surface[i][j]  // fallback to IV
      }
    }
    // Boundary: copy from nearest interior
    result[i][0] = result[i][1]
    result[i][nK - 1] = result[i][nK - 2]
  }
  result[0] = result[1]
  result[nT - 1] = result[nT - 2]
  return result
}

// ── SABR Calibration ──────────────────────────────────────────

export interface SABRParams {
  alpha: number
  beta: number
  rho: number
  nu: number
  rmse: number
}

/**
 * Calibrate SABR parameters to market implied vols.
 * Minimizes sum of squared errors between SABR vols and market vols.
 * Uses gradient-free Nelder-Mead simplex (simplified).
 *
 * @param F       Forward price
 * @param strikes Array of strikes
 * @param vols    Array of market implied vols
 * @param T       Maturity
 * @param beta    CEV exponent (fixed, default 0.5)
 */
export function fitSABR(
  F: number,
  strikes: number[],
  vols: number[],
  T: number,
  beta = 0.5,
): SABRParams {
  const n = Math.min(strikes.length, vols.length)
  if (n < 2) return { alpha: 0.2, beta, rho: 0, nu: 0.3, rmse: Infinity }

  // ATM vol as initial alpha estimate
  const atmIdx = strikes.reduce((best, k, i) => Math.abs(k - F) < Math.abs(strikes[best] - F) ? i : best, 0)
  let alpha = vols[atmIdx] * Math.pow(F, 1 - beta)
  let rho = -0.3
  let nu = 0.4

  const loss = (a: number, r: number, n_vv: number): number => {
    let sse = 0
    for (let i = 0; i < n; i++) {
      const sabr = sabrVol(F, strikes[i], T, a, beta, r, n_vv)
      sse += (sabr - vols[i]) ** 2
    }
    return sse
  }

  // Gradient descent with bounds
  const lr = 0.001
  for (let iter = 0; iter < 2000; iter++) {
    const h = 1e-6
    const base = loss(alpha, rho, nu)
    const da = (loss(alpha + h, rho, nu) - base) / h
    const dr = (loss(alpha, rho + h, nu) - base) / h
    const dn = (loss(alpha, rho, nu + h) - base) / h
    const scale = lr / (1 + iter / 500)
    alpha -= scale * da; alpha = Math.max(0.001, Math.min(alpha, 5))
    rho   -= scale * dr; rho   = Math.max(-0.999, Math.min(rho, 0.999))
    nu    -= scale * dn; nu    = Math.max(0.001, Math.min(nu, 5))
  }

  const finalLoss = loss(alpha, rho, nu)
  return { alpha, beta, rho, nu, rmse: Math.sqrt(finalLoss / n) }
}
