// ============================================================
// CRISTAL CAPITAL TERMINAL — Funções Estatísticas (TypeScript)
// Espelho das funções em native/quant/statistics.cpp
// ============================================================

// ── Distribuição Normal ───────────────────────────────────────

/**
 * CDF da distribuição normal padrão N(0,1).
 * Aproximação de Hart (1968) — erro < 7.5e-8.
 */
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422820 * Math.exp(-x * x / 2)
  const p = d * t * (0.3193815302 +
    t * (-0.3565637813 +
    t * (1.7814779372 +
    t * (-1.8212559978 +
    t * 1.3302744933))))
  return x > 0 ? 1 - p : p
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
