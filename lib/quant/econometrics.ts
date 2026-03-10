// ============================================================
// CRISTAL CAPITAL TERMINAL — Econometrics
// ARIMA · GARCH · Hurst · Regime Detection · Kalman · ACF
// ============================================================

import { media, desvioPadrao, variancia } from './statistics'

/** Autocorrelation function (ACF) */
export function acf(data: number[], maxLag: number): number[] {
  const n = data.length
  const m = media(data)
  const v = data.reduce((s, x) => s + (x - m) ** 2, 0) / n
  if (v === 0) return new Array(maxLag + 1).fill(0)
  const result: number[] = [1]
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < n - lag; i++) {
      sum += (data[i] - m) * (data[i + lag] - m)
    }
    result.push(sum / (n * v))
  }
  return result
}

/** Partial autocorrelation function (PACF) via Durbin-Levinson */
export function pacf(data: number[], maxLag: number): number[] {
  const acfValues = acf(data, maxLag)
  const result: number[] = [1]
  const phi: number[][] = []
  for (let k = 1; k <= maxLag; k++) {
    phi[k] = new Array(k + 1).fill(0)
    if (k === 1) {
      phi[1][1] = acfValues[1]
    } else {
      let num = acfValues[k]
      let den = 1
      for (let j = 1; j < k; j++) {
        num -= phi[k - 1][j] * acfValues[k - j]
        den -= phi[k - 1][j] * acfValues[j]
      }
      phi[k][k] = den !== 0 ? num / den : 0
      for (let j = 1; j < k; j++) {
        phi[k][j] = phi[k - 1][j] - phi[k][k] * phi[k - 1][k - j]
      }
    }
    result.push(phi[k][k])
  }
  return result
}

/** Hurst exponent via R/S analysis */
export function hurstExponent(data: number[]): { H: number; rsValues: { n: number; rs: number }[]; isLongMemory: boolean } {
  const rsValues: { n: number; rs: number }[] = []
  const sizes = [8, 16, 32, 64, 128, 256].filter(s => s < data.length / 2)
  for (const n of sizes) {
    const nBlocks = Math.floor(data.length / n)
    let rsSum = 0
    for (let b = 0; b < nBlocks; b++) {
      const block = data.slice(b * n, (b + 1) * n)
      const m = media(block)
      const std = desvioPadrao(block)
      if (std === 0) continue
      let cumSum = 0
      let maxCum = -Infinity
      let minCum = Infinity
      for (const x of block) {
        cumSum += x - m
        maxCum = Math.max(maxCum, cumSum)
        minCum = Math.min(minCum, cumSum)
      }
      rsSum += (maxCum - minCum) / std
    }
    if (nBlocks > 0) rsValues.push({ n, rs: rsSum / nBlocks })
  }
  // Linear regression of log(R/S) on log(n)
  if (rsValues.length < 2) return { H: 0.5, rsValues, isLongMemory: false }
  const logN = rsValues.map(v => Math.log(v.n))
  const logRS = rsValues.map(v => Math.log(v.rs))
  const mX = media(logN)
  const mY = media(logRS)
  let num = 0, den = 0
  for (let i = 0; i < logN.length; i++) {
    num += (logN[i] - mX) * (logRS[i] - mY)
    den += (logN[i] - mX) ** 2
  }
  const H = den > 0 ? num / den : 0.5
  return { H, rsValues, isLongMemory: H > 0.5 }
}

/** GARCH(1,1) parameter estimation via MLE */
export function garchFit(returns: number[]): {
  omega: number; alpha: number; beta: number
  conditionalVol: number[]; logLikelihood: number
  persistence: number; longRunVar: number
} {
  const n = returns.length
  const unconditionalVar = variancia(returns)
  // Grid search for alpha and beta
  let bestLL = -Infinity
  let bestAlpha = 0.1, bestBeta = 0.85, bestOmega = unconditionalVar * 0.05
  for (let a = 0.01; a <= 0.3; a += 0.02) {
    for (let b = 0.5; b <= 0.98; b += 0.02) {
      if (a + b >= 1) continue
      const om = unconditionalVar * (1 - a - b)
      if (om <= 0) continue
      let ll = 0
      let h = unconditionalVar
      for (let i = 1; i < n; i++) {
        h = om + a * returns[i - 1] ** 2 + b * h
        if (h <= 0) { ll = -Infinity; break }
        ll += -0.5 * (Math.log(2 * Math.PI) + Math.log(h) + returns[i] ** 2 / h)
      }
      if (ll > bestLL) { bestLL = ll; bestAlpha = a; bestBeta = b; bestOmega = om }
    }
  }
  const conditionalVol: number[] = [Math.sqrt(unconditionalVar)]
  let h = unconditionalVar
  for (let i = 1; i < n; i++) {
    h = bestOmega + bestAlpha * returns[i - 1] ** 2 + bestBeta * h
    conditionalVol.push(Math.sqrt(h))
  }
  const persistence = bestAlpha + bestBeta
  const longRunVar = bestOmega / (1 - persistence)
  return { omega: bestOmega, alpha: bestAlpha, beta: bestBeta, conditionalVol, logLikelihood: bestLL, persistence, longRunVar }
}

/** Regime detection (2-state Hamilton filter, simplified) */
export function regimeDetection(data: number[], nRegimes = 2): {
  regimes: number[]; regimeProbs: number[][]
  means: number[]; vols: number[]
  transitionMatrix: number[][]
} {
  const n = data.length
  // K-means initialization
  const sorted = [...data].sort((a, b) => a - b)
  const means = nRegimes === 2
    ? [media(sorted.slice(0, Math.floor(n / 2))), media(sorted.slice(Math.floor(n / 2)))]
    : [sorted[Math.floor(n * 0.25)], sorted[Math.floor(n * 0.5)], sorted[Math.floor(n * 0.75)]]
  const vols = means.map(() => desvioPadrao(data))
  // Iterate EM-like
  for (let iter = 0; iter < 20; iter++) {
    const assignments = data.map(x => {
      let bestR = 0, bestDist = Infinity
      for (let r = 0; r < nRegimes; r++) {
        const d = (x - means[r]) ** 2 / (vols[r] ** 2)
        if (d < bestDist) { bestDist = d; bestR = r }
      }
      return bestR
    })
    for (let r = 0; r < nRegimes; r++) {
      const pts = data.filter((_, i) => assignments[i] === r)
      if (pts.length > 1) {
        means[r] = media(pts)
        vols[r] = desvioPadrao(pts)
      }
    }
  }
  // Assign final regimes and compute probabilities
  const regimeProbs: number[][] = []
  const regimes: number[] = []
  for (const x of data) {
    const probs: number[] = []
    let total = 0
    for (let r = 0; r < nRegimes; r++) {
      const p = Math.exp(-0.5 * ((x - means[r]) / vols[r]) ** 2) / vols[r]
      probs.push(p)
      total += p
    }
    const normalized = probs.map(p => p / (total || 1))
    regimeProbs.push(normalized)
    regimes.push(normalized.indexOf(Math.max(...normalized)))
  }
  // Transition matrix
  const transitionMatrix = Array.from({ length: nRegimes }, () => new Array(nRegimes).fill(0))
  for (let i = 1; i < regimes.length; i++) {
    transitionMatrix[regimes[i - 1]][regimes[i]]++
  }
  for (let r = 0; r < nRegimes; r++) {
    const sum = transitionMatrix[r].reduce((s: number, v: number) => s + v, 0)
    if (sum > 0) transitionMatrix[r] = transitionMatrix[r].map((v: number) => v / sum)
  }
  return { regimes, regimeProbs, means, vols, transitionMatrix }
}

/** Holt-Winters exponential smoothing */
export function holtWinters(data: number[], alpha: number, beta: number, gamma: number, period: number, forecastSteps: number): {
  fitted: number[]; forecast: number[]; trend: number[]; seasonal: number[]
} {
  const n = data.length
  let level = media(data.slice(0, period))
  let trend = (media(data.slice(period, 2 * period)) - media(data.slice(0, period))) / period
  const seasonal = data.slice(0, period).map(x => x - level)
  const fitted: number[] = []
  const trendArr: number[] = []
  for (let i = 0; i < n; i++) {
    const s = seasonal[i % period]
    const newLevel = alpha * (data[i] - s) + (1 - alpha) * (level + trend)
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend
    seasonal[i % period] = gamma * (data[i] - newLevel) + (1 - gamma) * s
    level = newLevel
    trend = newTrend
    fitted.push(level + trend + seasonal[i % period])
    trendArr.push(trend)
  }
  const forecast: number[] = []
  for (let h = 1; h <= forecastSteps; h++) {
    forecast.push(level + h * trend + seasonal[(n + h - 1) % period])
  }
  return { fitted, forecast, trend: trendArr, seasonal }
}

/** Spectral density (periodogram) */
export function spectralDensity(data: number[]): { freq: number[]; power: number[] } {
  const n = data.length
  const m = media(data)
  const centered = data.map(x => x - m)
  const freq: number[] = []
  const power: number[] = []
  for (let k = 1; k <= Math.floor(n / 2); k++) {
    let cosSum = 0, sinSum = 0
    for (let t = 0; t < n; t++) {
      cosSum += centered[t] * Math.cos(2 * Math.PI * k * t / n)
      sinSum += centered[t] * Math.sin(2 * Math.PI * k * t / n)
    }
    freq.push(k / n)
    power.push((cosSum * cosSum + sinSum * sinSum) / n)
  }
  return { freq, power }
}
