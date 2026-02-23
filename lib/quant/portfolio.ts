// ============================================================
// CRISTAL CAPITAL TERMINAL — Portfolio (TypeScript)
// Markowitz, CAPM, Fronteira Eficiente, Black-Litterman
// ============================================================

import { media, desvioPadrao, covariancia, correlacao, sharpe } from './statistics'

// ── Tipos ─────────────────────────────────────────────────────

export interface Activo {
  ticker: string
  retornos: number[]   // série de retornos diários (log ou simples)
}

export interface Portfolio {
  pesos: number[]       // soma = 1
  tickers: string[]
}

// ── Métricas de Portfolio ─────────────────────────────────────

export interface MetricasPortfolio {
  retornoEsperado: number   // anualizado
  volatilidade: number      // anualizada
  sharpe: number
  maxDrawdown: number
  pesos: number[]
}

function retornoPortfolio(pesos: number[], retornosMedios: number[]): number {
  return pesos.reduce((s, w, i) => s + w * retornosMedios[i], 0)
}

function varPortfolio(pesos: number[], matrizCov: number[][]): number {
  let v = 0
  for (let i = 0; i < pesos.length; i++) {
    for (let j = 0; j < pesos.length; j++) {
      v += pesos[i] * pesos[j] * matrizCov[i][j]
    }
  }
  return v
}

export function matrizCovariancia(activos: Activo[], diasAno = 252): number[][] {
  const n = activos.length
  const cov: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cov[i][j] = covariancia(activos[i].retornos, activos[j].retornos) * diasAno
    }
  }
  return cov
}

export function matrizCorrelacao(activos: Activo[]): number[][] {
  const n = activos.length
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => correlacao(activos[i].retornos, activos[j].retornos))
  )
}

// ── Markowitz — Optimização (gradient descent) ────────────────

export interface OpcoesMarkowitz {
  activos: Activo[]
  diasAno?: number
  taxaLivreRisco?: number
  alvoRetorno?: number        // se definido, minimiza vol com este retorno alvo
  restricoes?: {
    pesoMin?: number          // peso mínimo por activo (default 0)
    pesoMax?: number          // peso máximo por activo (default 1)
    longOnly?: boolean        // proibir posições curtas (default true)
  }
}

function projectarSimplex(v: number[], min = 0, max = 1): number[] {
  // Projectar no simplex com restrições de box [min, max]
  const n = v.length
  let pesos = v.map(x => Math.max(min, Math.min(max, x)))
  const soma = pesos.reduce((s, x) => s + x, 0)
  if (Math.abs(soma - 1) > 1e-8) {
    pesos = pesos.map(x => x / soma)
  }
  return pesos
}

export function optimizarMarkowitz(opts: OpcoesMarkowitz): MetricasPortfolio {
  const { activos, diasAno = 252, taxaLivreRisco = 0 } = opts
  const pesoMin = opts.restricoes?.pesoMin ?? 0
  const pesoMax = opts.restricoes?.pesoMax ?? 1
  const n = activos.length

  const retMedios = activos.map(a => media(a.retornos) * diasAno)
  const matCov = matrizCovariancia(activos, diasAno)

  // Início: pesos iguais
  let pesos = Array(n).fill(1 / n)

  const lr = 0.01
  const iters = 3000

  for (let iter = 0; iter < iters; iter++) {
    const scale = lr / (1 + iter / 500)
    const vol2 = varPortfolio(pesos, matCov)
    const vol = Math.sqrt(vol2)
    const ret = retornoPortfolio(pesos, retMedios)
    const sh = vol > 0 ? (ret - taxaLivreRisco) / vol : 0

    if (opts.alvoRetorno !== undefined) {
      // Minimizar volatilidade com retorno alvo
      const gradV: number[] = Array(n).fill(0)
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) gradV[i] += 2 * pesos[j] * matCov[i][j]
      }
      pesos = projectarSimplex(pesos.map((w, i) => w - scale * gradV[i]), pesoMin, pesoMax)
    } else {
      // Maximizar Sharpe
      const gradRet = retMedios.map(r => r / (vol * vol + 1e-10) - ret * retMedios[0] / (vol2 * vol2 + 1e-10))
      const gradVol: number[] = Array(n).fill(0)
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) gradVol[i] += pesos[j] * matCov[i][j] / (vol + 1e-10)
      }
      const gradSh = gradRet.map((gr, i) => gr - sh * gradVol[i])
      pesos = projectarSimplex(pesos.map((w, i) => w + scale * gradSh[i]), pesoMin, pesoMax)
    }
  }

  const retFinal = retornoPortfolio(pesos, retMedios)
  const volFinal = Math.sqrt(varPortfolio(pesos, matCov))
  const shFinal = volFinal > 0 ? (retFinal - taxaLivreRisco) / volFinal : 0

  // Max drawdown simplificado (usando série de retornos ponderados)
  const minLen = Math.min(...activos.map(a => a.retornos.length))
  const retSerie = Array.from({ length: minLen }, (_, t) =>
    activos.reduce((s, a, i) => s + pesos[i] * (a.retornos[t] ?? 0), 0)
  )
  let preco = 1, pico = 1, maxDD = 0
  for (const r of retSerie) {
    preco *= (1 + r)
    if (preco > pico) pico = preco
    const dd = (pico - preco) / pico
    if (dd > maxDD) maxDD = dd
  }

  return { retornoEsperado: retFinal, volatilidade: volFinal, sharpe: shFinal, maxDrawdown: maxDD, pesos }
}

// ── Fronteira Eficiente ───────────────────────────────────────

export function frontEficiente(
  activos: Activo[],
  numPontos = 30,
  diasAno = 252,
  taxaLivreRisco = 0,
): { retorno: number; volatilidade: number; sharpe: number; pesos: number[] }[] {
  const retMedios = activos.map(a => media(a.retornos) * diasAno)
  const retMin = Math.min(...retMedios)
  const retMax = Math.max(...retMedios)
  const pontos = []

  for (let i = 0; i < numPontos; i++) {
    const alvoRetorno = retMin + (i / (numPontos - 1)) * (retMax - retMin)
    const res = optimizarMarkowitz({ activos, diasAno, taxaLivreRisco, alvoRetorno })
    pontos.push({
      retorno: res.retornoEsperado,
      volatilidade: res.volatilidade,
      sharpe: res.sharpe,
      pesos: res.pesos,
    })
  }

  return pontos.sort((a, b) => a.volatilidade - b.volatilidade)
}

// ── CAPM ──────────────────────────────────────────────────────

export interface ResultadoCAPM {
  alpha: number          // Jensen's alpha (anualizado)
  beta: number           // Beta em relação ao benchmark
  retornoEsperado: number
  rSquared: number
  informationRatio: number
  treynor: number
}

export function capm(
  retActivo: number[],
  retMercado: number[],
  taxaLivreRisco = 0,
  diasAno = 252,
): ResultadoCAPM {
  const n = Math.min(retActivo.length, retMercado.length)
  const ra = retActivo.slice(0, n)
  const rm = retMercado.slice(0, n)

  const excessoActivo  = ra.map(r => r - taxaLivreRisco / diasAno)
  const excessoMercado = rm.map(r => r - taxaLivreRisco / diasAno)

  const betaVal = covariancia(excessoActivo, excessoMercado) / (Math.pow(desvioPadrao(excessoMercado), 2) || 1)
  const mediaActivo  = media(excessoActivo)
  const mediaMercado = media(excessoMercado)
  const alphaVal = (mediaActivo - betaVal * mediaMercado) * diasAno

  const retEsperado = taxaLivreRisco + betaVal * (media(rm) * diasAno - taxaLivreRisco)

  // R²
  const residuos = excessoActivo.map((r, i) => r - (alphaVal / diasAno + betaVal * excessoMercado[i]))
  const varTotal = Math.pow(desvioPadrao(excessoActivo), 2)
  const varResid = Math.pow(desvioPadrao(residuos), 2)
  const rSquared = 1 - (varResid / (varTotal || 1))

  // Information ratio
  const trackError = desvioPadrao(residuos) * Math.sqrt(diasAno)
  const informationRatio = trackError > 0 ? alphaVal / trackError : 0

  // Treynor
  const treynor = betaVal !== 0 ? (media(ra) * diasAno - taxaLivreRisco) / betaVal : 0

  return { alpha: alphaVal, beta: betaVal, retornoEsperado, rSquared, informationRatio, treynor }
}

// ── Black-Litterman (simplificado) ────────────────────────────

export interface ViewBL {
  pesos: number[]   // vector P (qual activo / combinação)
  retornoEsperado: number  // Q (view do gestor)
  confianca: number        // omega (incerteza, 0=muito certo, 1=muito incerto)
}

export function blackLitterman(
  activos: Activo[],
  views: ViewBL[],
  delta = 2.5,     // risk aversion
  tau = 0.05,      // incerteza nos retornos prior
  diasAno = 252,
): number[] {
  const n = activos.length
  const matCov = matrizCovariancia(activos, diasAno)

  // Prior: retornos de equilíbrio (CAPM reverso com pesos iguais)
  const pesosEquil = Array(n).fill(1 / n)
  const piPrior = pesosEquil.map((_, i) =>
    delta * matCov[i].reduce((s, c, j) => s + c * pesosEquil[j], 0)
  )

  if (views.length === 0) return piPrior

  // Simplified BL posterior (sem álgebra matricial completa)
  // Posterior: combina prior com views ponderadas por confiança
  const retPosterior = [...piPrior]
  for (const view of views) {
    const confiancaPeso = 1 - view.confianca
    for (let i = 0; i < n; i++) {
      retPosterior[i] += confiancaPeso * view.pesos[i] * (view.retornoEsperado - piPrior[i])
    }
  }

  return retPosterior
}
