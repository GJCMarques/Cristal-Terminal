// ============================================================
// CRISTAL CAPITAL TERMINAL — Factor Models
// PCA · Fama-French · APT · Risk Attribution · Alpha
// ============================================================

import { media, desvioPadrao, covariancia, correlacao } from './statistics'

/** PCA factor decomposition */
export function pcaFactors(returns: number[][], nFactors: number): {
  eigenvalues: number[]; eigenvectors: number[][]
  explainedVariance: number[]; cumulativeVariance: number[]
  factorReturns: number[][]; loadings: number[][]
} {
  const nAssets = returns.length
  const nObs = returns[0].length
  // Compute covariance matrix
  const cov: number[][] = Array.from({ length: nAssets }, (_, i) =>
    Array.from({ length: nAssets }, (_, j) => covariancia(returns[i], returns[j]))
  )
  // Power iteration for eigenvalue decomposition
  const eigenvalues: number[] = []
  const eigenvectors: number[][] = []
  const A = cov.map(row => [...row])
  for (let f = 0; f < nFactors; f++) {
    let v = Array.from({ length: nAssets }, () => Math.random())
    let eigenvalue = 0
    for (let iter = 0; iter < 100; iter++) {
      const Av = A.map(row => row.reduce((s, val, j) => s + val * v[j], 0))
      eigenvalue = Math.sqrt(Av.reduce((s, x) => s + x * x, 0))
      if (eigenvalue === 0) break
      v = Av.map(x => x / eigenvalue)
    }
    eigenvalues.push(eigenvalue)
    eigenvectors.push(v)
    // Deflate matrix
    for (let i = 0; i < nAssets; i++) {
      for (let j = 0; j < nAssets; j++) {
        A[i][j] -= eigenvalue * v[i] * v[j]
      }
    }
  }
  const totalVar = eigenvalues.reduce((s, v) => s + v, 0) || 1
  const explainedVariance = eigenvalues.map(e => e / totalVar)
  const cumulativeVariance: number[] = []
  let cum = 0
  for (const ev of explainedVariance) {
    cum += ev
    cumulativeVariance.push(cum)
  }
  // Factor returns: project data onto eigenvectors
  const factorReturns: number[][] = eigenvectors.map(v =>
    Array.from({ length: nObs }, (_, t) =>
      returns.reduce((s, r, i) => s + v[i] * r[t], 0)
    )
  )
  const loadings = eigenvectors.map(v => v.map(x => x))
  return { eigenvalues, eigenvectors, explainedVariance, cumulativeVariance, factorReturns, loadings }
}

/** Fama-French 3-factor regression for single asset */
export function famaFrench3(assetReturns: number[], mktRf: number[], smb: number[], hml: number[], rf: number[]): {
  alpha: number; betaMkt: number; betaSMB: number; betaHML: number
  rSquared: number; residuals: number[]; tStats: { alpha: number; mkt: number; smb: number; hml: number }
} {
  const n = assetReturns.length
  const excessRet = assetReturns.map((r, i) => r - (rf[i] || 0))
  // OLS regression: y = alpha + b1*mkt + b2*smb + b3*hml
  // Using normal equations (X'X)^-1 X'y
  // For simplicity, use iterative least squares
  const X = Array.from({ length: n }, (_, i) => [1, mktRf[i], smb[i], hml[i]])
  const y = excessRet
  // X'X
  const k = 4
  const XtX: number[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0)
    )
  )
  // X'y
  const Xty = Array.from({ length: k }, (_, i) => X.reduce((s, row, t) => s + row[i] * y[t], 0))
  // Solve via Gauss elimination
  const coeffs = solveLinear(XtX, Xty)
  const [alpha, betaMkt, betaSMB, betaHML] = coeffs
  const residuals = y.map((yi, i) => yi - X[i].reduce((s, xij, j) => s + xij * coeffs[j], 0))
  const ssRes = residuals.reduce((s, r) => s + r * r, 0)
  const mY = media(y)
  const ssTot = y.reduce((s, yi) => s + (yi - mY) ** 2, 0)
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0
  const sigmaRes = Math.sqrt(ssRes / Math.max(n - k, 1))
  // Approximate t-statistics
  const diagXtXinv = invertDiag(XtX)
  const tStats = {
    alpha: diagXtXinv[0] > 0 ? alpha / (sigmaRes * Math.sqrt(diagXtXinv[0])) : 0,
    mkt: diagXtXinv[1] > 0 ? betaMkt / (sigmaRes * Math.sqrt(diagXtXinv[1])) : 0,
    smb: diagXtXinv[2] > 0 ? betaSMB / (sigmaRes * Math.sqrt(diagXtXinv[2])) : 0,
    hml: diagXtXinv[3] > 0 ? betaHML / (sigmaRes * Math.sqrt(diagXtXinv[3])) : 0,
  }
  return { alpha, betaMkt, betaSMB, betaHML, rSquared, residuals, tStats }
}

/** Factor risk attribution */
export function riskAttribution(weights: number[], factorBetas: number[][], factorCov: number[][]): {
  totalRisk: number; factorRisk: number; specificRisk: number
  contributions: number[]; percentages: number[]
} {
  const nFactors = factorCov.length
  const nAssets = weights.length
  // Portfolio factor betas = sum(w_i * beta_ij)
  const portfolioBetas = Array.from({ length: nFactors }, (_, j) =>
    weights.reduce((s, w, i) => s + w * (factorBetas[i]?.[j] || 0), 0)
  )
  // Factor variance contribution
  let factorVar = 0
  for (let i = 0; i < nFactors; i++) {
    for (let j = 0; j < nFactors; j++) {
      factorVar += portfolioBetas[i] * portfolioBetas[j] * factorCov[i][j]
    }
  }
  const totalRisk = Math.sqrt(Math.max(factorVar * 1.2, 0.0001))
  const factorRisk = Math.sqrt(Math.max(factorVar, 0))
  const specificRisk = Math.sqrt(Math.max(totalRisk ** 2 - factorRisk ** 2, 0))
  const contributions = portfolioBetas.map((b, i) => {
    let contrib = 0
    for (let j = 0; j < nFactors; j++) {
      contrib += b * portfolioBetas[j] * factorCov[i][j]
    }
    return contrib
  })
  const totalContrib = contributions.reduce((s, c) => s + Math.abs(c), 0) || 1
  const percentages = contributions.map(c => Math.abs(c) / totalContrib * 100)
  return { totalRisk, factorRisk, specificRisk, contributions, percentages }
}

/** Jensen's alpha */
export function jensensAlpha(assetReturns: number[], benchmarkReturns: number[], rf: number): {
  alpha: number; beta: number; rSquared: number; trackingError: number; informationRatio: number
} {
  const n = assetReturns.length
  const excessAsset = assetReturns.map(r => r - rf / 252)
  const excessBench = benchmarkReturns.map(r => r - rf / 252)
  const mX = media(excessBench)
  const mY = media(excessAsset)
  let covXY = 0, varX = 0
  for (let i = 0; i < n; i++) {
    covXY += (excessBench[i] - mX) * (excessAsset[i] - mY)
    varX += (excessBench[i] - mX) ** 2
  }
  const beta = varX > 0 ? covXY / varX : 1
  const alpha = (mY - beta * mX) * 252
  const residuals = excessAsset.map((y, i) => y - (mY - beta * mX) - beta * excessBench[i])
  const ssRes = residuals.reduce((s, r) => s + r * r, 0)
  const ssTot = excessAsset.reduce((s, y) => s + (y - mY) ** 2, 0)
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0
  const activeReturns = assetReturns.map((r, i) => r - benchmarkReturns[i])
  const trackingError = desvioPadrao(activeReturns) * Math.sqrt(252)
  const informationRatio = trackingError > 0 ? media(activeReturns) * 252 / trackingError : 0
  return { alpha, beta, rSquared, trackingError, informationRatio }
}

/** Generate correlated returns for testing */
export function generateCorrelatedReturns(nAssets: number, nObs: number, means: number[], vols: number[]): number[][] {
  // Cholesky decomposition of correlation matrix
  const corr: number[][] = Array.from({ length: nAssets }, (_, i) =>
    Array.from({ length: nAssets }, (_, j) => {
      if (i === j) return 1
      return 0.3 + 0.4 * Math.sin(i + j) // Structured correlation
    })
  )
  const L = choleskyDecomp(corr)
  const returns: number[][] = Array.from({ length: nAssets }, () => [])
  for (let t = 0; t < nObs; t++) {
    const z = Array.from({ length: nAssets }, () => randn())
    const correlated = L.map(row => row.reduce((s, val, j) => s + val * z[j], 0))
    for (let i = 0; i < nAssets; i++) {
      returns[i].push(means[i] / 252 + vols[i] / Math.sqrt(252) * correlated[i])
    }
  }
  return returns
}

// ── Helpers ──────────────────────────────────────────────────

function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length
  const aug = A.map((row, i) => [...row, b[i]])
  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]]
    if (Math.abs(aug[i][i]) < 1e-12) continue
    for (let k = i + 1; k < n; k++) {
      const f = aug[k][i] / aug[i][i]
      for (let j = i; j <= n; j++) aug[k][j] -= f * aug[i][j]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n]
    for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j]
    x[i] = Math.abs(aug[i][i]) > 1e-12 ? x[i] / aug[i][i] : 0
  }
  return x
}

function invertDiag(A: number[][]): number[] {
  const n = A.length
  const diag: number[] = []
  for (let i = 0; i < n; i++) {
    const minor: number[][] = []
    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const row: number[] = []
      for (let c = 0; c < n; c++) {
        if (c === i) continue
        row.push(A[r][c])
      }
      minor.push(row)
    }
    const det = detMatrix(A)
    const minorDet = detMatrix(minor)
    diag.push(det !== 0 ? minorDet / det : 0)
  }
  return diag
}

function detMatrix(M: number[][]): number {
  const n = M.length
  if (n === 1) return M[0][0]
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0]
  let det = 0
  for (let j = 0; j < n; j++) {
    const minor = M.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)])
    det += (j % 2 === 0 ? 1 : -1) * M[0][j] * detMatrix(minor)
  }
  return det
}

function choleskyDecomp(A: number[][]): number[][] {
  const n = A.length
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k]
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(A[i][i] - sum, 1e-10))
      } else {
        L[i][j] = (A[i][j] - sum) / (L[j][j] || 1e-10)
      }
    }
  }
  return L
}

function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
