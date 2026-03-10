// ============================================================
// CRISTAL CAPITAL TERMINAL — Signal Processing & Technical Analysis
// FFT · Wavelets · Bollinger · RSI · MACD · Decomposition
// ============================================================

import { media, desvioPadrao } from './statistics'

/** Moving average (SMA, EMA, WMA) */
export function movingAverage(data: number[], window: number, type: 'sma' | 'ema' | 'wma' = 'sma'): number[] {
  const result: number[] = []
  if (type === 'sma') {
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) { result.push(NaN); continue }
      const slice = data.slice(i - window + 1, i + 1)
      result.push(media(slice))
    }
  } else if (type === 'ema') {
    const k = 2 / (window + 1)
    result.push(data[0])
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k))
    }
  } else { // WMA
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) { result.push(NaN); continue }
      let wSum = 0, wTotal = 0
      for (let j = 0; j < window; j++) {
        const w = j + 1
        wSum += data[i - window + 1 + j] * w
        wTotal += w
      }
      result.push(wSum / wTotal)
    }
  }
  return result
}

/** Bollinger Bands */
export function bollingerBands(data: number[], window = 20, nStd = 2): {
  middle: number[]; upper: number[]; lower: number[]; bandwidth: number[]; percentB: number[]
} {
  const middle = movingAverage(data, window, 'sma')
  const upper: number[] = []
  const lower: number[] = []
  const bandwidth: number[] = []
  const percentB: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      upper.push(NaN); lower.push(NaN); bandwidth.push(NaN); percentB.push(NaN)
      continue
    }
    const slice = data.slice(i - window + 1, i + 1)
    const std = desvioPadrao(slice, false)
    upper.push(middle[i] + nStd * std)
    lower.push(middle[i] - nStd * std)
    const bw = middle[i] > 0 ? (2 * nStd * std) / middle[i] : 0
    bandwidth.push(bw)
    const range = upper[i] - lower[i]
    percentB.push(range > 0 ? (data[i] - lower[i]) / range : 0.5)
  }
  return { middle, upper, lower, bandwidth, percentB }
}

/** Relative Strength Index (RSI) */
export function rsi(data: number[], period = 14): number[] {
  const result: number[] = [50] // First value undefined, use 50
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(Math.max(change, 0))
    losses.push(Math.max(-change, 0))
    if (i < period) { result.push(50); continue }
    const avgGain = i === period
      ? media(gains.slice(0, period))
      : (result[i - 1] / 100 * media(gains.slice(Math.max(0, i - period), i)) * (period - 1) + gains[i - 1]) / period
    const avgLoss = i === period
      ? media(losses.slice(0, period))
      : ((100 - result[i - 1]) / 100 * media(losses.slice(Math.max(0, i - period), i)) * (period - 1) + losses[i - 1]) / period
    if (avgLoss === 0) { result.push(100); continue }
    const rs = avgGain / avgLoss
    result.push(100 - 100 / (1 + rs))
  }
  return result
}

/** MACD (Moving Average Convergence Divergence) */
export function macd(data: number[], fast = 12, slow = 26, signal = 9): {
  macd: number[]; signal: number[]; histogram: number[]
} {
  const emaFast = movingAverage(data, fast, 'ema')
  const emaSlow = movingAverage(data, slow, 'ema')
  const macdLine = emaFast.map((f, i) => f - emaSlow[i])
  const signalLine = movingAverage(macdLine, signal, 'ema')
  const histogram = macdLine.map((m, i) => m - signalLine[i])
  return { macd: macdLine, signal: signalLine, histogram }
}

/** FFT-based spectral analysis */
export function fftSpectrum(data: number[]): { frequencies: number[]; magnitudes: number[]; phases: number[]; dominantFreq: number } {
  // Pad to power of 2
  let n = 1
  while (n < data.length) n *= 2
  const padded = [...data]
  while (padded.length < n) padded.push(0)
  // Cooley-Tukey FFT
  const real = [...padded]
  const imag = new Array(n).fill(0)
  fftInPlace(real, imag, false)
  const half = Math.floor(n / 2)
  const frequencies: number[] = []
  const magnitudes: number[] = []
  const phases: number[] = []
  let maxMag = 0, dominantIdx = 0
  for (let k = 0; k < half; k++) {
    frequencies.push(k / n)
    const mag = Math.sqrt(real[k] ** 2 + imag[k] ** 2) / n
    magnitudes.push(mag)
    phases.push(Math.atan2(imag[k], real[k]))
    if (k > 0 && mag > maxMag) { maxMag = mag; dominantIdx = k }
  }
  return { frequencies, magnitudes, phases, dominantFreq: dominantIdx / n }
}

/** Haar wavelet decomposition */
export function haarWavelet(data: number[], levels: number): {
  approximation: number[]; details: number[][]
  levelEnergies: number[]
} {
  let current = [...data]
  // Pad to power of 2
  while (current.length & (current.length - 1)) current.push(current[current.length - 1])
  const details: number[][] = []
  for (let l = 0; l < levels && current.length >= 2; l++) {
    const n = current.length
    const approx: number[] = []
    const detail: number[] = []
    for (let i = 0; i < n; i += 2) {
      approx.push((current[i] + current[i + 1]) / Math.SQRT2)
      detail.push((current[i] - current[i + 1]) / Math.SQRT2)
    }
    details.push(detail)
    current = approx
  }
  const levelEnergies = details.map(d => d.reduce((s, x) => s + x * x, 0))
  return { approximation: current, details, levelEnergies }
}

/** Time series decomposition (additive: trend + seasonal + residual) */
export function decompose(data: number[], period: number): {
  trend: number[]; seasonal: number[]; residual: number[]
} {
  const n = data.length
  // Trend: centered moving average
  const trend = movingAverage(data, period, 'sma')
  // Fill NaN edges with nearest valid
  for (let i = 0; i < n; i++) {
    if (isNaN(trend[i])) {
      trend[i] = i < period ? trend.find(x => !isNaN(x)) || data[i] : trend[n - 1 - (n - 1 - i)] || data[i]
    }
  }
  // Seasonal: average detrended values by position in cycle
  const detrended = data.map((x, i) => x - trend[i])
  const seasonalAvg = new Array(period).fill(0)
  const seasonalCount = new Array(period).fill(0)
  for (let i = 0; i < n; i++) {
    seasonalAvg[i % period] += detrended[i]
    seasonalCount[i % period]++
  }
  for (let i = 0; i < period; i++) {
    seasonalAvg[i] = seasonalCount[i] > 0 ? seasonalAvg[i] / seasonalCount[i] : 0
  }
  // Center seasonal component
  const seasonalMean = media(seasonalAvg)
  const seasonal = data.map((_, i) => seasonalAvg[i % period] - seasonalMean)
  const residual = data.map((x, i) => x - trend[i] - seasonal[i])
  return { trend, seasonal, residual }
}

/** Stochastic Oscillator */
export function stochastic(high: number[], low: number[], close: number[], kPeriod = 14, dPeriod = 3): {
  k: number[]; d: number[]
} {
  const k: number[] = []
  for (let i = 0; i < close.length; i++) {
    if (i < kPeriod - 1) { k.push(50); continue }
    const hh = Math.max(...high.slice(i - kPeriod + 1, i + 1))
    const ll = Math.min(...low.slice(i - kPeriod + 1, i + 1))
    k.push(hh !== ll ? ((close[i] - ll) / (hh - ll)) * 100 : 50)
  }
  const d = movingAverage(k, dPeriod, 'sma')
  return { k, d }
}

// ── FFT helper (Cooley-Tukey in-place) ──────────────────────

function fftInPlace(real: number[], imag: number[], inverse: boolean): void {
  const n = real.length
  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]]
    }
  }
  // FFT
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (2 * Math.PI / len) * (inverse ? -1 : 1)
    const wReal = Math.cos(angle)
    const wImag = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let curR = 1, curI = 0
      for (let j = 0; j < len / 2; j++) {
        const uR = real[i + j], uI = imag[i + j]
        const vR = real[i + j + len / 2] * curR - imag[i + j + len / 2] * curI
        const vI = real[i + j + len / 2] * curI + imag[i + j + len / 2] * curR
        real[i + j] = uR + vR
        imag[i + j] = uI + vI
        real[i + j + len / 2] = uR - vR
        imag[i + j + len / 2] = uI - vI
        const tmpR = curR * wReal - curI * wImag
        curI = curR * wImag + curI * wReal
        curR = tmpR
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) { real[i] /= n; imag[i] /= n }
  }
}
