// ============================================================
// CRISTAL CAPITAL TERMINAL — Credit Risk Models
// Merton · KMV · CDS · Credit VaR · Transition Matrices
// ============================================================

import { normalCDF, normalPDF, normalInvCDF } from './statistics'

/** Merton structural credit model */
export function mertonModel(V: number, D: number, T: number, r: number, sigmaV: number): {
  equityValue: number; defaultProb: number; creditSpread: number; distanceToDefault: number
  debtValue: number; recoveryRate: number; dd_term_structure: { T: number; pd: number; spread: number }[]
} {
  const d1 = (Math.log(V / D) + (r + 0.5 * sigmaV * sigmaV) * T) / (sigmaV * Math.sqrt(T))
  const d2 = d1 - sigmaV * Math.sqrt(T)
  const equityValue = V * normalCDF(d1) - D * Math.exp(-r * T) * normalCDF(d2)
  const defaultProb = normalCDF(-d2)
  const debtValue = V - equityValue
  const yieldDebt = -Math.log(debtValue / D) / T
  const creditSpread = Math.max(yieldDebt - r, 0)
  const distanceToDefault = d2
  const recoveryRate = defaultProb > 0 ? Math.max(0, Math.min(1, debtValue / (D * Math.exp(-r * T)))) : 1
  const dd_term_structure: { T: number; pd: number; spread: number }[] = []
  for (let t = 0.25; t <= Math.max(T, 10); t += 0.25) {
    const d2t = (Math.log(V / D) + (r - 0.5 * sigmaV * sigmaV) * t) / (sigmaV * Math.sqrt(t))
    const pdt = normalCDF(-d2t)
    const d1t = d2t + sigmaV * Math.sqrt(t)
    const eq = V * normalCDF(d1t) - D * Math.exp(-r * t) * normalCDF(d2t)
    const dbt = V - eq
    const yt = -Math.log(dbt / D) / t
    dd_term_structure.push({ T: t, pd: pdt, spread: Math.max(yt - r, 0) })
  }
  return { equityValue, defaultProb, creditSpread, distanceToDefault, debtValue, recoveryRate, dd_term_structure }
}

/** KMV distance-to-default model */
export function kmvModel(equity: number, debt: number, r: number, sigmaE: number, T: number): {
  assetValue: number; assetVol: number; distanceToDefault: number; defaultProb: number
  iterations: { iter: number; V: number; sigmaV: number }[]
} {
  let V = equity + debt
  let sigmaV = sigmaE * equity / V
  const iterations: { iter: number; V: number; sigmaV: number }[] = []
  for (let iter = 0; iter < 50; iter++) {
    const d1 = (Math.log(V / debt) + (r + 0.5 * sigmaV * sigmaV) * T) / (sigmaV * Math.sqrt(T))
    const d2 = d1 - sigmaV * Math.sqrt(T)
    const V_new = (equity + debt * Math.exp(-r * T) * normalCDF(d2)) / normalCDF(d1)
    const sigmaV_new = sigmaE * equity / (V_new * normalCDF(d1))
    iterations.push({ iter, V: V_new, sigmaV: sigmaV_new })
    if (Math.abs(V_new - V) < 0.001 && Math.abs(sigmaV_new - sigmaV) < 0.0001) break
    V = V_new
    sigmaV = sigmaV_new
  }
  const dd = (Math.log(V / debt) + (r - 0.5 * sigmaV * sigmaV) * T) / (sigmaV * Math.sqrt(T))
  return { assetValue: V, assetVol: sigmaV, distanceToDefault: dd, defaultProb: normalCDF(-dd), iterations }
}

/** CDS par spread */
export function cdsSpread(hazardRate: number, recoveryRate: number, T: number, discountRate: number): {
  spread: number; protectionLeg: number; premiumLeg: number
  survivalCurve: { t: number; prob: number }[]
} {
  const dt = 0.25
  const n = Math.round(T / dt)
  let protectionLeg = 0
  let premiumLeg = 0
  const survivalCurve: { t: number; prob: number }[] = [{ t: 0, prob: 1 }]
  for (let i = 1; i <= n; i++) {
    const t = i * dt
    const sp = Math.exp(-hazardRate * t)
    const sp_prev = Math.exp(-hazardRate * (t - dt))
    const df = Math.exp(-discountRate * t)
    protectionLeg += (1 - recoveryRate) * (sp_prev - sp) * df
    premiumLeg += dt * sp * df
    survivalCurve.push({ t, prob: sp })
  }
  const spread = premiumLeg > 0 ? protectionLeg / premiumLeg : 0
  return { spread, protectionLeg, premiumLeg, survivalCurve }
}

/** Implied hazard rate from CDS spread */
export function hazardRateFromSpread(spread: number, recoveryRate: number): number {
  return spread / (1 - recoveryRate)
}

/** Expected loss */
export function expectedLoss(pd: number, lgd: number, ead: number): number {
  return pd * lgd * ead
}

/** Portfolio Credit VaR (Vasicek single-factor model) */
export function creditVaR(exposures: number[], pds: number[], lgds: number[], rho: number, alpha: number, nSim: number): {
  var: number; es: number; expectedLoss: number
  lossDistribution: { bucket: number; count: number }[]
  contributionByExposure: { idx: number; contribution: number }[]
} {
  const n = exposures.length
  const el = exposures.reduce((s, e, i) => s + e * pds[i] * lgds[i], 0)
  const losses: number[] = []
  for (let sim = 0; sim < nSim; sim++) {
    const Z = randn()
    let totalLoss = 0
    for (let i = 0; i < n; i++) {
      const eps = randn()
      const asset = Math.sqrt(rho) * Z + Math.sqrt(1 - rho) * eps
      const defaultThreshold = normalInvCDF(pds[i])
      if (asset < defaultThreshold) {
        totalLoss += exposures[i] * lgds[i]
      }
    }
    losses.push(totalLoss)
  }
  losses.sort((a, b) => a - b)
  const varIdx = Math.floor(alpha * nSim)
  const varValue = losses[varIdx] || 0
  const esValue = losses.slice(varIdx).reduce((s, v) => s + v, 0) / Math.max(1, nSim - varIdx)
  const maxLoss = Math.max(...losses)
  const nBuckets = 40
  const bucketSize = maxLoss / nBuckets
  const hist = new Array(nBuckets).fill(0)
  for (const l of losses) {
    const b = Math.min(Math.floor(l / bucketSize), nBuckets - 1)
    hist[b]++
  }
  const lossDistribution = hist.map((c, i) => ({ bucket: (i + 0.5) * bucketSize, count: c }))
  const contributionByExposure = exposures.map((e, i) => ({
    idx: i, contribution: e * pds[i] * lgds[i] / el * varValue
  }))
  return { var: varValue, es: esValue, expectedLoss: el, lossDistribution, contributionByExposure }
}

/** Credit rating transition matrix (simplified) */
export function transitionMatrix(): { matrix: number[][]; labels: string[] } {
  const labels = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']
  const matrix = [
    [0.9081, 0.0833, 0.0068, 0.0006, 0.0012, 0.0000, 0.0000, 0.0000],
    [0.0070, 0.9065, 0.0779, 0.0064, 0.0006, 0.0014, 0.0002, 0.0000],
    [0.0009, 0.0227, 0.9105, 0.0552, 0.0074, 0.0026, 0.0001, 0.0006],
    [0.0002, 0.0033, 0.0595, 0.8693, 0.0530, 0.0117, 0.0012, 0.0018],
    [0.0003, 0.0014, 0.0067, 0.0773, 0.8053, 0.0884, 0.0100, 0.0106],
    [0.0000, 0.0011, 0.0024, 0.0043, 0.0648, 0.8346, 0.0407, 0.0521],
    [0.0022, 0.0000, 0.0022, 0.0130, 0.0238, 0.1124, 0.6486, 0.1978],
    [0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 1.0000],
  ]
  return { matrix, labels }
}

function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
