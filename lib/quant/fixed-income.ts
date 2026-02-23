// ============================================================
// CRISTAL CAPITAL TERMINAL — Fixed Income (TypeScript)
// Obrigações: preço, YTM, duration, convexidade, DV01, Z-spread
// ============================================================

// ── Preço de Obrigação ────────────────────────────────────────

export interface ParametrosBond {
  valorNominal: number    // Face value (ex: 1000)
  cupao: number           // Cupão anual (decimal, ex: 0.05 = 5%)
  ytm: number             // Yield to maturity (decimal)
  maturidade: number      // Anos até maturidade
  frequencia?: number     // Pagamentos/ano (1=anual, 2=semestral, 4=trimestral)
}

export interface ResultadoBond {
  preco: number
  duracaoMacaulay: number
  duracaoModificada: number
  convexidade: number
  dv01: number            // Dollar Value of 1bp
  pvbp: number            // Price Value of Basis Point
  acruedInterest: number
  yieldSpread?: number
}

export function precoBond(p: ParametrosBond): ResultadoBond {
  const { valorNominal: N, cupao: c, ytm: y, maturidade: T } = p
  const freq = p.frequencia ?? 2   // semestral por defeito
  const n = Math.round(T * freq)   // número total de períodos
  const C = (c * N) / freq         // cupão por período
  const r = y / freq               // taxa por período

  if (r === 0) {
    const preco = C * n + N
    return { preco, duracaoMacaulay: T / 2, duracaoModificada: T / 2, convexidade: 0, dv01: 0, pvbp: 0, acruedInterest: 0 }
  }

  // Preço: soma dos cash flows descontados
  let preco = 0
  let duracaoNumerador = 0
  let convexNumerador = 0

  for (let t = 1; t <= n; t++) {
    const cf = t === n ? C + N : C
    const df = cf / Math.pow(1 + r, t)
    preco += df
    duracaoNumerador += (t / freq) * df
    convexNumerador += df * (t / freq) * ((t / freq) + 1 / freq)
  }

  const duracaoMacaulay = duracaoNumerador / preco
  const duracaoModificada = duracaoMacaulay / (1 + r)
  const convexidade = convexNumerador / (preco * Math.pow(1 + r, 2))

  // DV01: variação de preço para 1bp de variação em yield
  const dv01 = duracaoModificada * preco * 0.0001
  const pvbp = dv01  // equivalente

  // Juro acumulado (assumindo início de período)
  const acruedInterest = 0

  return { preco, duracaoMacaulay, duracaoModificada, convexidade, dv01, pvbp, acruedInterest }
}

// ── Yield to Maturity (Newton-Raphson) ────────────────────────

export function ytmBond(
  preco: number,
  p: Omit<ParametrosBond, 'ytm'>,
  maxIter = 200,
  tol = 1e-10,
): number {
  let ytm = (p.cupao * p.valorNominal) / preco  // estimativa inicial

  for (let i = 0; i < maxIter; i++) {
    const { preco: p_calc, dv01 } = precoBond({ ...p, ytm })
    const diff = p_calc - preco
    if (Math.abs(diff) < tol) break
    if (Math.abs(dv01) < 1e-12) break
    ytm += diff * 0.0001 / dv01   // Newton step (dv01 = dp/dy * 0.0001)
    ytm = Math.max(0.0001, Math.min(ytm, 2.0))
  }

  return ytm
}

// ── Z-Spread (spread sobre a curva spot) ──────────────────────

export interface ParametrosZSpread {
  preco: number
  cashflows: { t: number; cf: number }[]   // (tempo em anos, cash flow)
  taxasSpot: { t: number; taxa: number }[]  // curva spot (interpolada linearmente)
}

function interpolarTaxa(taxasSpot: { t: number; taxa: number }[], t: number): number {
  const sorted = [...taxasSpot].sort((a, b) => a.t - b.t)
  if (t <= sorted[0].t) return sorted[0].taxa
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].taxa
  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].t && t <= sorted[i + 1].t) {
      const w = (t - sorted[i].t) / (sorted[i + 1].t - sorted[i].t)
      return sorted[i].taxa + w * (sorted[i + 1].taxa - sorted[i].taxa)
    }
  }
  return sorted[sorted.length - 1].taxa
}

export function zSpread(p: ParametrosZSpread, maxIter = 200, tol = 1e-8): number {
  let spread = 0

  for (let iter = 0; iter < maxIter; iter++) {
    let pv = 0
    let dpv = 0
    for (const { t, cf } of p.cashflows) {
      const r = interpolarTaxa(p.taxasSpot, t) + spread
      const df = Math.exp(-r * t)
      pv += cf * df
      dpv -= cf * t * df
    }
    const diff = pv - p.preco
    if (Math.abs(diff) < tol) break
    if (Math.abs(dpv) < 1e-12) break
    spread -= diff / dpv
    spread = Math.max(-0.5, Math.min(spread, 2.0))
  }

  return spread
}

// ── Curva de Taxas — Interpolação ─────────────────────────────

export type MetodoInterpolacao = 'linear' | 'cubicSpline' | 'bootstrapZero'

export function interpolarCurva(
  nos: { t: number; taxa: number }[],
  pontos: number[],
  metodo: MetodoInterpolacao = 'linear',
): number[] {
  const sorted = [...nos].sort((a, b) => a.t - b.t)
  return pontos.map(t => interpolarTaxa(sorted, t))
}

// ── Análise de Cenários de Taxa (Yield Shock) ─────────────────

export interface CenarioTaxa {
  nome: string
  choque: number   // bps
}

export function analiseCenarios(
  bond: ParametrosBond,
  cenarios: CenarioTaxa[],
): { cenario: string; preco: number; variacao: number; variacaoPct: number }[] {
  const base = precoBond(bond)
  return cenarios.map(c => {
    const ytmChoque = bond.ytm + c.choque / 10000
    const { preco } = precoBond({ ...bond, ytm: ytmChoque })
    return {
      cenario: c.nome,
      preco,
      variacao: preco - base.preco,
      variacaoPct: (preco - base.preco) / base.preco,
    }
  })
}

// ── Immunização de Portfolio ──────────────────────────────────

export interface BondPortfolio {
  bonds: { bond: ParametrosBond; quantidade: number }[]
}

export function analisarPortfolioBonds(p: BondPortfolio) {
  let precoTotal = 0
  let duracaoPonderada = 0
  let convexidadePonderada = 0
  let dv01Total = 0

  for (const { bond, quantidade } of p.bonds) {
    const r = precoBond(bond)
    const valor = r.preco * quantidade
    precoTotal += valor
    duracaoPonderada += r.duracaoModificada * valor
    convexidadePonderada += r.convexidade * valor
    dv01Total += r.dv01 * quantidade
  }

  return {
    precoTotal,
    duracaoModificada: duracaoPonderada / precoTotal,
    convexidade: convexidadePonderada / precoTotal,
    dv01Total,
    ytmCarteira: 0,  // simplificado
  }
}
