// ============================================================
// CRISTAL CAPITAL TERMINAL — Advanced Risk Models
// Component VaR · Risk Parity · Cornish-Fisher · Stress Testing
// ============================================================

import { media, desvioPadrao, percentil, assimetria, curtose, normalInvCDF } from './statistics'

/** Component VaR decomposition */
export function componentVaR(weights: number[], cov: number[][], alpha = 0.95): {
  portfolioVaR: number; marginalVaR: number[]
  componentVaR: number[]; percentContribution: number[]
} {
  const n = weights.length
  // Portfolio variance
  let portVar = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portVar += weights[i] * weights[j] * cov[i][j]
    }
  }
  const portVol = Math.sqrt(Math.max(portVar, 0))
  const zAlpha = -normalInvCDF(1 - alpha)
  const portfolioVaR = zAlpha * portVol
  // Marginal VaR = z * (Sigma * w) / sigma_p
  const sigmaW = cov.map(row => row.reduce((s, v, j) => s + v * weights[j], 0))
  const marginalVaR = sigmaW.map(sw => portVol > 0 ? zAlpha * sw / portVol : 0)
  const componentVaRArr = marginalVaR.map((mv, i) => mv * weights[i])
  const totalComp = componentVaRArr.reduce((s, c) => s + Math.abs(c), 0) || 1
  const percentContribution = componentVaRArr.map(c => (c / totalComp) * 100)
  return { portfolioVaR, marginalVaR, componentVaR: componentVaRArr, percentContribution }
}

/** Risk parity portfolio */
export function riskParity(cov: number[][]): {
  weights: number[]; riskContributions: number[]
  iterations: { iter: number; maxDiff: number }[]
} {
  const n = cov.length
  let weights = new Array(n).fill(1 / n)
  const iterations: { iter: number; maxDiff: number }[] = []
  for (let iter = 0; iter < 200; iter++) {
    const sigmaW = cov.map(row => row.reduce((s, v, j) => s + v * weights[j], 0))
    let portVar = 0
    for (let i = 0; i < n; i++) portVar += weights[i] * sigmaW[i]
    const portVol = Math.sqrt(Math.max(portVar, 1e-10))
    const riskContrib = weights.map((w, i) => w * sigmaW[i] / portVol)
    const targetRisk = portVol / n
    const newWeights = weights.map((w, i) => {
      const rc = riskContrib[i]
      return w * targetRisk / (rc || targetRisk)
    })
    const sum = newWeights.reduce((s, w) => s + w, 0)
    const normalizedWeights = newWeights.map(w => w / sum)
    const maxDiff = Math.max(...normalizedWeights.map((w, i) => Math.abs(w - weights[i])))
    iterations.push({ iter, maxDiff })
    weights = normalizedWeights
    if (maxDiff < 1e-8) break
  }
  // Final risk contributions
  const sigmaW = cov.map(row => row.reduce((s, v, j) => s + v * weights[j], 0))
  let portVar = 0
  for (let i = 0; i < n; i++) portVar += weights[i] * sigmaW[i]
  const portVol = Math.sqrt(Math.max(portVar, 1e-10))
  const riskContributions = weights.map((w, i) => w * sigmaW[i] / portVol)
  return { weights, riskContributions, iterations }
}

/** Cornish-Fisher VaR (skewness/kurtosis adjusted) */
export function cornishFisherVaR(returns: number[], alpha = 0.95): {
  cfVaR: number; normalVaR: number; skew: number; kurtosis: number
  zCF: number; zNormal: number
} {
  const mu = media(returns)
  const sigma = desvioPadrao(returns)
  const skew = assimetria(returns)
  const kurt = curtose(returns) // excess kurtosis
  const zAlpha = -normalInvCDF(1 - alpha)
  // Cornish-Fisher expansion
  const zCF = zAlpha + (zAlpha * zAlpha - 1) * skew / 6
    + (zAlpha ** 3 - 3 * zAlpha) * kurt / 24
    - (2 * zAlpha ** 3 - 5 * zAlpha) * skew ** 2 / 36
  const cfVaR = -(mu - zCF * sigma)
  const normalVaR = -(mu - zAlpha * sigma)
  return { cfVaR, normalVaR, skew, kurtosis: kurt, zCF, zNormal: zAlpha }
}

/** Drawdown analysis */
export function drawdownAnalysis(returns: number[]): {
  maxDrawdown: number; avgDrawdown: number; maxDrawdownDuration: number
  drawdownSeries: number[]; drawdownPeriods: { start: number; end: number; depth: number; duration: number }[]
  underwaterSeries: number[]
} {
  const n = returns.length
  // Build cumulative returns
  const cumulative = [1]
  for (let i = 0; i < n; i++) cumulative.push(cumulative[i] * (1 + returns[i]))
  let peak = cumulative[0]
  const drawdownSeries: number[] = []
  const underwaterSeries: number[] = []
  const drawdownPeriods: { start: number; end: number; depth: number; duration: number }[] = []
  let currentDrawdownStart = -1
  let currentMaxDepth = 0
  for (let i = 0; i < cumulative.length; i++) {
    if (cumulative[i] > peak) peak = cumulative[i]
    const dd = (peak - cumulative[i]) / peak
    drawdownSeries.push(dd)
    underwaterSeries.push(cumulative[i] / peak - 1)
    if (dd > 0.001 && currentDrawdownStart === -1) {
      currentDrawdownStart = i
      currentMaxDepth = dd
    } else if (dd > currentMaxDepth) {
      currentMaxDepth = dd
    } else if (dd < 0.001 && currentDrawdownStart !== -1) {
      drawdownPeriods.push({
        start: currentDrawdownStart, end: i, depth: currentMaxDepth,
        duration: i - currentDrawdownStart
      })
      currentDrawdownStart = -1
      currentMaxDepth = 0
    }
  }
  if (currentDrawdownStart !== -1) {
    drawdownPeriods.push({
      start: currentDrawdownStart, end: cumulative.length - 1,
      depth: currentMaxDepth, duration: cumulative.length - 1 - currentDrawdownStart
    })
  }
  const maxDrawdown = Math.max(...drawdownSeries)
  const avgDrawdown = drawdownPeriods.length > 0
    ? drawdownPeriods.reduce((s, p) => s + p.depth, 0) / drawdownPeriods.length : 0
  const maxDrawdownDuration = drawdownPeriods.length > 0
    ? Math.max(...drawdownPeriods.map(p => p.duration)) : 0
  return { maxDrawdown, avgDrawdown, maxDrawdownDuration, drawdownSeries, drawdownPeriods, underwaterSeries }
}

/** Stress test scenarios */
export function stressTest(portfolioValue: number, weights: number[], assetVols: number[]): {
  scenarios: { name: string; shock: number[]; portfolioLoss: number; portfolioReturn: number }[]
} {
  const scenarios = [
    { name: '2008 GFC', shock: weights.map((_, i) => -0.35 - i * 0.05) },
    { name: 'COVID Crash', shock: weights.map((_, i) => -0.25 - i * 0.03) },
    { name: 'Rate Shock +300bp', shock: weights.map((_, i) => -0.10 - i * 0.02) },
    { name: 'Inflation Spike', shock: weights.map((_, i) => -0.08 + (i % 2) * 0.04) },
    { name: 'USD Crash', shock: weights.map((_, i) => 0.05 - i * 0.08) },
    { name: 'Tech Bubble Pop', shock: weights.map((_, i) => -0.50 + i * 0.10) },
    { name: 'Emerging Market Crisis', shock: weights.map((_, i) => -0.20 - i * 0.04) },
    { name: 'Flash Crash', shock: weights.map((_, i) => -0.15 * (1 + Math.sin(i))) },
    { name: 'Sovereign Default', shock: weights.map((_, i) => -0.30 + i * 0.05) },
    { name: 'Best Case', shock: weights.map((_, i) => 0.15 + i * 0.02) },
  ]
  return {
    scenarios: scenarios.map(s => {
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * s.shock[i], 0)
      return {
        name: s.name, shock: s.shock,
        portfolioReturn,
        portfolioLoss: -portfolioReturn * portfolioValue
      }
    })
  }
}

/** Tail risk metrics (EVT-inspired) */
export function tailRisk(returns: number[], threshold = 0.05): {
  tailMean: number; tailVol: number; tailRatio: number
  exceedances: number; exceedanceRate: number
  hillEstimator: number
} {
  const sorted = [...returns].sort((a, b) => a - b)
  const n = sorted.length
  const cutoffIdx = Math.floor(n * threshold)
  const tailReturns = sorted.slice(0, cutoffIdx)
  const tailMean = media(tailReturns)
  const tailVol = desvioPadrao(tailReturns)
  const overallVol = desvioPadrao(returns)
  const tailRatio = overallVol > 0 ? tailVol / overallVol : 1
  // Hill estimator for tail index
  const k = Math.max(cutoffIdx, 1)
  const threshold_val = sorted[k]
  let hillSum = 0
  for (let i = 0; i < k; i++) {
    hillSum += Math.log(Math.abs(sorted[i]) / Math.abs(threshold_val || 1))
  }
  const hillEstimator = k > 0 ? k / hillSum : 2
  return {
    tailMean, tailVol, tailRatio,
    exceedances: cutoffIdx, exceedanceRate: threshold,
    hillEstimator: Math.max(0.5, Math.min(10, hillEstimator))
  }
}
