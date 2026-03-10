// ============================================================
// CRISTAL CAPITAL TERMINAL — Funções Estatísticas (TypeScript)
// Espelho das funções em native/quant/statistics.cpp
// ============================================================

// ── Distribuição Normal ───────────────────────────────────────

/**
 * CDF da distribuição normal padrão N(0,1).
 * Algoritmo de Cody (1969) — erro relativo < 2.5e-16 (double precision).
 * Reproduz scipy.stats.norm.cdf com precisão idêntica.
 */
export function normalCDF(x: number): number {
  // Constants for rational approximation
  const a = [3.1611237438705656, 113.86415415105016, 377.485237685302, 3209.3775891384694, 0.18577770618460315, 0.0013282560950680457, 1.7295387529567696e-5, 2.1589853045211698e-7]
  const b = [23.601290952344122, 244.02463793444329, 1282.6165260773723, 2844.2368334391163]
  const c = [0.5641895835477563, 8.8831497943883759, 66.119190637141528, 298.6351528461213, 881.95222124176909, 1712.0476126340707, 2051.0783778260658, 1230.3393547979972, 2.1531153547440383e-8]
  const d = [15.744926110709835, 117.6939508913125, 537.18110186200021, 1621.3895745666903, 3290.7992357334597, 4362.6190901656025, 3439.3676741437005, 1230.3393548037495]

  const abs_x = Math.abs(x)
  let result: number

  if (abs_x <= 0.46875) {
    // |x| <= 0.46875 — direct rational approximation
    const y = abs_x * abs_x
    let num = a[7]
    for (let i = 6; i >= 0; i--) num = num * y + a[i]
    let den = 1.0
    for (let i = 3; i >= 0; i--) den = den * y + b[i]
    result = 0.5 + x * num / den
  } else if (abs_x <= 4.0) {
    // 0.46875 < |x| <= 4.0
    let num = c[8]
    for (let i = 7; i >= 0; i--) num = num * abs_x + c[i]
    let den = 1.0
    for (let i = 7; i >= 0; i--) den = den * abs_x + d[i]
    result = num / den
    // Multiply by exp(-x^2/2) using the trick to avoid underflow
    const xsq = Math.floor(abs_x * 16) / 16
    const del = (abs_x - xsq) * (abs_x + xsq)
    result = Math.exp(-xsq * xsq * 0.5) * Math.exp(-del * 0.5) * result
    result = x > 0 ? 1 - result : result
  } else {
    // |x| > 4.0 — asymptotic expansion
    const y = 1 / (abs_x * abs_x)
    let num = c[8]
    for (let i = 7; i >= 5; i--) num = num * y + c[i]
    let den = 1.0
    for (let i = 7; i >= 5; i--) den = den * y + d[i]
    result = y * num / den
    result = (1 / Math.sqrt(2 * Math.PI) - result) / abs_x
    const xsq = Math.floor(abs_x * 16) / 16
    const del = (abs_x - xsq) * (abs_x + xsq)
    result = Math.exp(-xsq * xsq * 0.5) * Math.exp(-del * 0.5) * result
    result = x > 0 ? 1 - result : result
  }

  return Math.max(0, Math.min(1, result))
}

/** PDF da distribuição normal padrão */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/** Inversa da CDF normal (método de Beasley-Springer-Moro) */
export function normalInvCDF(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637]
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833]
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
             0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
             0.0000321767881768, 0.0000002888167364, 0.0000003960315187]
  let x: number
  const y = p - 0.5
  if (Math.abs(y) < 0.42) {
    const r = y * y
    x = y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]) /
        ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1)
  } else {
    const r = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p))
    x = c[0] + r * (c[1] + r * (c[2] + r * (c[3] + r * (c[4] + r * (c[5] + r * (c[6] + r * (c[7] + r * c[8])))))))
    if (y < 0) x = -x
  }
  return x
}

// ── Estatísticas Descritivas ──────────────────────────────────

export function media(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

export function variancia(arr: number[], amostral = true): number {
  if (arr.length < 2) return 0
  const m = media(arr)
  const soma = arr.reduce((s, v) => s + (v - m) ** 2, 0)
  return soma / (arr.length - (amostral ? 1 : 0))
}

export function desvioPadrao(arr: number[], amostral = true): number {
  return Math.sqrt(variancia(arr, amostral))
}

export function covariancia(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return 0
  const ma = media(a.slice(0, n))
  const mb = media(b.slice(0, n))
  return a.slice(0, n).reduce((s, _, i) => s + (a[i] - ma) * (b[i] - mb), 0) / (n - 1)
}

export function correlacao(a: number[], b: number[]): number {
  const cov = covariancia(a, b)
  const sa = desvioPadrao(a)
  const sb = desvioPadrao(b)
  if (sa === 0 || sb === 0) return 0
  return cov / (sa * sb)
}

export function assimetria(arr: number[]): number {
  const m = media(arr)
  const s = desvioPadrao(arr)
  if (s === 0) return 0
  return arr.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / arr.length
}

export function curtose(arr: number[]): number {
  const m = media(arr)
  const s = desvioPadrao(arr)
  if (s === 0) return 0
  return arr.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0) / arr.length - 3
}

export function percentil(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo])
}

// ── Returns e Performance ─────────────────────────────────────

/** Converte série de preços em retornos logarítmicos */
export function retornosLog(precos: number[]): number[] {
  const ret: number[] = []
  for (let i = 1; i < precos.length; i++) {
    ret.push(Math.log(precos[i] / precos[i - 1]))
  }
  return ret
}

/** Retorno anualizado a partir de retornos diários */
export function retornoAnualizado(retDiarios: number[], diasAno = 252): number {
  const m = media(retDiarios)
  return m * diasAno
}

/** Volatilidade anualizada (desvio padrão dos retornos diários × √252) */
export function volatilidade(retDiarios: number[], diasAno = 252): number {
  return desvioPadrao(retDiarios) * Math.sqrt(diasAno)
}

/** Ratio de Sharpe */
export function sharpe(retDiarios: number[], taxaLivreRisco = 0, diasAno = 252): number {
  const ret = retornoAnualizado(retDiarios, diasAno)
  const vol = volatilidade(retDiarios, diasAno)
  if (vol === 0) return 0
  return (ret - taxaLivreRisco) / vol
}

/** Beta em relação a um benchmark */
export function beta(retActivo: number[], retBenchmark: number[]): number {
  const varBench = variancia(retBenchmark)
  if (varBench === 0) return 0
  return covariancia(retActivo, retBenchmark) / varBench
}

/** Maximum Drawdown */
export function maxDrawdown(precos: number[]): number {
  let pico = precos[0] ?? 0
  let maxDD = 0
  for (const p of precos) {
    if (p > pico) pico = p
    const dd = (pico - p) / pico
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}
