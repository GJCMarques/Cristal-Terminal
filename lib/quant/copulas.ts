// ============================================================
// CRISTAL CAPITAL TERMINAL — Copula Models
// Gaussian · Student-t · Clayton · Frank · Gumbel
// ============================================================

import { normalCDF, normalInvCDF, normalPDF } from './statistics'

/** Gaussian copula density */
export function gaussianCopulaDensity(u: number, v: number, rho: number): number {
  const x = normalInvCDF(Math.max(0.001, Math.min(0.999, u)))
  const y = normalInvCDF(Math.max(0.001, Math.min(0.999, v)))
  const det = 1 - rho * rho
  if (det <= 0) return 0
  return Math.exp(-(rho * rho * (x * x + y * y) - 2 * rho * x * y) / (2 * det)) / Math.sqrt(det)
}

/** Gaussian copula CDF */
export function gaussianCopulaCDF(u: number, v: number, rho: number): number {
  // Numerical approximation via bivariate normal
  const x = normalInvCDF(Math.max(0.001, Math.min(0.999, u)))
  const y = normalInvCDF(Math.max(0.001, Math.min(0.999, v)))
  return bivariateNormalCDF(x, y, rho)
}

/** Clayton copula CDF */
export function claytonCopula(u: number, v: number, theta: number): number {
  if (theta <= 0) return u * v
  return Math.pow(Math.max(Math.pow(u, -theta) + Math.pow(v, -theta) - 1, 0), -1 / theta)
}

/** Frank copula CDF */
export function frankCopula(u: number, v: number, theta: number): number {
  if (Math.abs(theta) < 1e-10) return u * v
  const num = (Math.exp(-theta * u) - 1) * (Math.exp(-theta * v) - 1)
  const den = Math.exp(-theta) - 1
  return -Math.log(1 + num / den) / theta
}

/** Gumbel copula CDF */
export function gumbelCopula(u: number, v: number, theta: number): number {
  if (theta < 1) return u * v
  const lu = -Math.log(Math.max(u, 1e-10))
  const lv = -Math.log(Math.max(v, 1e-10))
  return Math.exp(-Math.pow(Math.pow(lu, theta) + Math.pow(lv, theta), 1 / theta))
}

/** Generate copula samples */
export function copulaSample(type: 'gaussian' | 'clayton' | 'frank' | 'gumbel' | 't', params: { rho?: number; theta?: number; nu?: number }, n: number): { u: number[]; v: number[] } {
  const u: number[] = []
  const v: number[] = []
  if (type === 'gaussian' || type === 't') {
    const rho = params.rho || 0.5
    for (let i = 0; i < n; i++) {
      const z1 = randn()
      const z2 = rho * z1 + Math.sqrt(1 - rho * rho) * randn()
      if (type === 't' && params.nu) {
        const chi = chiSquaredSample(params.nu) / params.nu
        u.push(normalCDF(z1 / Math.sqrt(chi)))
        v.push(normalCDF(z2 / Math.sqrt(chi)))
      } else {
        u.push(normalCDF(z1))
        v.push(normalCDF(z2))
      }
    }
  } else if (type === 'clayton') {
    const theta = params.theta || 2
    for (let i = 0; i < n; i++) {
      const u1 = Math.random()
      const w = Math.random()
      const v1 = u1 * Math.pow(Math.pow(w, -theta / (theta + 1)) - 1 + Math.pow(u1, theta), -1 / theta)
      u.push(u1)
      v.push(Math.max(0, Math.min(1, v1)))
    }
  } else if (type === 'frank') {
    const theta = params.theta || 5
    for (let i = 0; i < n; i++) {
      const u1 = Math.random()
      const w = Math.random()
      const v1 = -Math.log(1 - (1 - Math.exp(-theta)) / (1 + (Math.exp(-theta * u1) - 1) * ((1 - w) / w))) / theta
      u.push(u1)
      v.push(Math.max(0, Math.min(1, v1)))
    }
  } else { // gumbel
    const theta = params.theta || 2
    for (let i = 0; i < n; i++) {
      // Approximate Gumbel via Marshall-Olkin
      const s = stableSample(1 / theta)
      const e1 = -Math.log(Math.random())
      const e2 = -Math.log(Math.random())
      u.push(Math.exp(-Math.pow(e1 / s, 1 / theta)))
      v.push(Math.exp(-Math.pow(e2 / s, 1 / theta)))
    }
  }
  return { u, v }
}

/** Tail dependence coefficients */
export function tailDependence(type: 'gaussian' | 'clayton' | 'frank' | 'gumbel' | 't', params: { rho?: number; theta?: number; nu?: number }): {
  lower: number; upper: number
} {
  const rho = params.rho || 0
  const theta = params.theta || 1
  const nu = params.nu || 5
  switch (type) {
    case 'gaussian': return { lower: 0, upper: 0 }
    case 't': {
      const tVal = Math.sqrt((nu + 1) * (1 - rho) / (1 + rho))
      // Approximate: 2 * t_cdf(-tVal, nu+1)
      const approx = 2 * normalCDF(-tVal * Math.sqrt(nu / (nu + 1)))
      return { lower: approx, upper: approx }
    }
    case 'clayton': return { lower: Math.pow(2, -1 / theta), upper: 0 }
    case 'frank': return { lower: 0, upper: 0 }
    case 'gumbel': return { lower: 0, upper: 2 - Math.pow(2, 1 / theta) }
    default: return { lower: 0, upper: 0 }
  }
}

/** Fit copula parameter from data (Kendall's tau) */
export function fitCopula(u: number[], v: number[], type: 'gaussian' | 'clayton' | 'frank' | 'gumbel'): {
  parameter: number; kendallTau: number
} {
  // Compute Kendall's tau
  const n = u.length
  let concordant = 0, discordant = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < Math.min(n, i + 200); j++) { // Sample for speed
      const du = u[i] - u[j]
      const dv = v[i] - v[j]
      if (du * dv > 0) concordant++
      else if (du * dv < 0) discordant++
    }
  }
  const total = concordant + discordant || 1
  const tau = (concordant - discordant) / total
  // Convert tau to copula parameter
  let parameter: number
  switch (type) {
    case 'gaussian': parameter = Math.sin(Math.PI * tau / 2); break
    case 'clayton': parameter = 2 * tau / (1 - tau); break
    case 'frank': parameter = tau * 10; break // Approximate
    case 'gumbel': parameter = 1 / (1 - tau); break
    default: parameter = tau
  }
  return { parameter: Math.max(0.01, parameter), kendallTau: tau }
}

/** Copula contour density grid */
export function copulaContourGrid(type: 'gaussian' | 'clayton' | 'frank' | 'gumbel', param: number, gridSize = 50): {
  x: number[]; y: number[]; z: number[][]
} {
  const x = Array.from({ length: gridSize }, (_, i) => (i + 0.5) / gridSize)
  const y = [...x]
  const z: number[][] = []
  for (let i = 0; i < gridSize; i++) {
    const row: number[] = []
    for (let j = 0; j < gridSize; j++) {
      const u = x[i]
      const v = y[j]
      let density: number
      switch (type) {
        case 'gaussian': density = gaussianCopulaDensity(u, v, param); break
        case 'clayton': {
          const theta = param
          if (theta <= 0) { density = 1; break }
          const C = claytonCopula(u, v, theta)
          density = (1 + theta) * Math.pow(u * v, -(1 + theta)) * Math.pow(C, 2 + 1 / theta)
          break
        }
        default: density = gaussianCopulaDensity(u, v, param)
      }
      row.push(Math.min(density, 10))
    }
    z.push(row)
  }
  return { x, y, z }
}

// ── Helpers ──────────────────────────────────────────────────

function bivariateNormalCDF(x: number, y: number, rho: number): number {
  // Drezner-Wesolowsky approximation
  if (rho === 0) return normalCDF(x) * normalCDF(y)
  const r = Math.abs(rho)
  // Gauss-Legendre quadrature points
  const weights = [0.1713244924, 0.3607615730, 0.4679139346]
  const abscissae = [0.9324695142, 0.6612093865, 0.2386191861]
  let sum = 0
  const asinr = Math.asin(rho)
  for (let i = 0; i < 3; i++) {
    for (const sign of [-1, 1]) {
      const t = asinr * (sign * abscissae[i] + 1) / 2
      const sinT = Math.sin(t)
      const cosT = Math.cos(t)
      sum += weights[i] * Math.exp(-(x * x + y * y - 2 * x * y * sinT) / (2 * cosT * cosT))
    }
  }
  return normalCDF(x) * normalCDF(y) + sum * asinr / (4 * Math.PI)
}

function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function chiSquaredSample(df: number): number {
  let sum = 0
  for (let i = 0; i < df; i++) { const z = randn(); sum += z * z }
  return sum
}

function stableSample(alpha: number): number {
  const U = (Math.random() - 0.5) * Math.PI
  const W = -Math.log(Math.random())
  const t = Math.sin(alpha * U) / Math.pow(Math.cos(U), 1 / alpha)
  return t * Math.pow(Math.cos(U * (1 - alpha)) / W, (1 - alpha) / alpha)
}
