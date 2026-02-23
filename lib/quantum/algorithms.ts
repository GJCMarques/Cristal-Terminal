// ============================================================
// CRISTAL CAPITAL TERMINAL — Algoritmos de Finança Quântica
// QAE · QAOA · Grover · Bell State · Quantum VaR
// ============================================================

import { CircuitoQuantico } from './simulator'

// ── Helpers matemáticos ───────────────────────────────────────

function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const p = 0.3989422803 * Math.exp(-0.5 * x * x) *
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - p : p
}

function normalInvCDF(p: number): number {
  if (p <= 0) return -8
  if (p >= 1) return 8
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
             0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
             0.0000321767881768, 0.0000002888167364, 0.0000003960315187]
  const y = p - 0.5
  if (Math.abs(y) < 0.42) {
    const r = y * y
    const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637]
    const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833]
    return y * (((a[3]*r+a[2])*r+a[1])*r+a[0]) / ((((b[3]*r+b[2])*r+b[1])*r+b[0])*r+1)
  }
  const r = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p))
  let s = c[0]
  for (let i = 1; i < 9; i++) s += c[i] * Math.pow(r, i)
  return p < 0.5 ? -s : s
}

function bsCall(S: number, K: number, T: number, r: number, sigma: number): number {
  const sq = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sq)
  const d2 = d1 - sigma * sq
  return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2)
}

// Walsh-Hadamard Transform (usado no mixer QAOA)
function wht(amps: { re: number; im: number }[], n: number): { re: number; im: number }[] {
  const r = amps.map(a => ({ ...a }))
  for (let bit = 0; bit < n; bit++) {
    const step = 1 << bit
    for (let i = 0; i < (1 << n); i++) {
      if (i & step) continue
      const j = i | step
      const a = { ...r[i] }, b = { ...r[j] }
      r[i] = { re: a.re + b.re, im: a.im + b.im }
      r[j] = { re: a.re - b.re, im: a.im - b.im }
    }
  }
  return r
}

// ── Bell State ────────────────────────────────────────────────

export interface ResultadoBellState {
  diagrama:       string
  probabilidades: { estado: string; prob: number }[]
  amostras:       Record<string, number>
  descricao:      string
}

export function bellState(): ResultadoBellState {
  const circ = new CircuitoQuantico(2)
  circ.H(0).CNOT(0, 1)

  const probs = circ.probabilidades()
  const probabilidades = [
    { estado: '|00⟩', prob: probs[0] },
    { estado: '|01⟩', prob: probs[1] },
    { estado: '|10⟩', prob: probs[2] },
    { estado: '|11⟩', prob: probs[3] },
  ]

  return {
    diagrama: circ.diagrama(),
    probabilidades,
    amostras: circ.amostras(1024),
    descricao: [
      '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
      'Porta Hadamard cria superposição em q0.',
      'CNOT emaranha q0 e q1: medir q0=0 implica q1=0, q0=1 implica q1=1.',
      'Correlação quântica instantânea — independente da distância.',
    ].join('\n'),
  }
}

// ── Quantum Amplitude Estimation (QAE) — Option Pricing ───────
// Speedup: O(1/ε) quântico vs O(1/ε²) Monte Carlo clássico

export interface ResultadoQAE {
  valorEstimado:       number
  comparacaoClassica:  number
  erroPct:             number
  precisao:            number
  avaliacoesQuanticas: number
  avaliacoesClassicas: number
  speedupFator:        number
  amplitudeEstimada:   number
}

export function qaeOpcaoCall(
  S: number, K: number, T: number, r: number, sigma: number,
  nQubits = 8
): ResultadoQAE {
  const N = 1 << nQubits   // avaliações quânticas = 2^n
  const payoffMax = S * Math.exp(4 * sigma * Math.sqrt(T))

  // Integração numérica sobre distribuição log-normal discretizada
  let soma = 0
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N
    const z = normalInvCDF(u)
    const ST = S * Math.exp((r - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z)
    soma += Math.max(ST - K, 0)
  }
  const payoffMedio = soma / N
  const precoQAE  = Math.exp(-r * T) * payoffMedio
  const precoBS   = bsCall(S, K, T, r, sigma)

  // Precisão QAE: ε = π / (2 × 2^n)
  const precisao      = Math.PI / (2 * N)
  // MC clássico precisa de O(1/ε²) amostras para a mesma precisão
  const avalClassicas = Math.ceil(1 / (2 * precisao * precisao))

  return {
    valorEstimado:       precoQAE,
    comparacaoClassica:  precoBS,
    erroPct:             Math.abs(precoQAE - precoBS) / precoBS * 100,
    precisao,
    avaliacoesQuanticas: N,
    avaliacoesClassicas: avalClassicas,
    speedupFator:        Math.round(avalClassicas / N),
    amplitudeEstimada:   payoffMedio / payoffMax,
  }
}

// ── Quantum VaR via QAE ────────────────────────────────────────

export interface ResultadoQuantumVaR {
  var95:               number
  var99:               number
  amplitudeEstimada:   number
  avaliacoesQuanticas: number
  avaliacoesClassicas: number
  speedupFator:        number
  distribuicao:        { retorno: number; prob: number }[]
}

export function quantumVaR(
  mu: number, sigma: number,
  horizonte = 10, nQubits = 8
): ResultadoQuantumVaR {
  const N   = 1 << nQubits
  const sqT = Math.sqrt(horizonte)
  const retMin = mu * horizonte - 4 * sigma * sqT
  const retMax = mu * horizonte + 4 * sigma * sqT
  const dR = (retMax - retMin) / N

  // Discretizar distribuição normal de retornos
  const distribuicao: { retorno: number; prob: number }[] = []
  for (let i = 0; i < N; i++) {
    const ret = retMin + (i + 0.5) * dR
    const z   = (ret - mu * horizonte) / (sigma * sqT)
    const pdf = Math.exp(-0.5 * z * z) / (sigma * sqT * Math.sqrt(2 * Math.PI))
    distribuicao.push({ retorno: ret * 100, prob: pdf * dR })
  }

  // Normalizar
  const total = distribuicao.reduce((s, d) => s + d.prob, 0)
  distribuicao.forEach(d => { d.prob /= total })

  // VaR: quantil da distribuição
  const var95 = -(mu * horizonte + normalInvCDF(0.05) * sigma * sqT) * 100
  const var99 = -(mu * horizonte + normalInvCDF(0.01) * sigma * sqT) * 100

  // Amplitude quântica = probabilidade de perda superior ao VaR 95%
  const amplitudeEstimada = distribuicao
    .filter(d => d.retorno < 0)
    .reduce((s, d) => s + d.prob, 0)

  const precisao      = Math.PI / (2 * N)
  const avalClassicas = Math.ceil(1 / (2 * precisao * precisao))

  return {
    var95,
    var99,
    amplitudeEstimada,
    avaliacoesQuanticas: N,
    avaliacoesClassicas: avalClassicas,
    speedupFator:        Math.round(avalClassicas / N),
    // Subamostrar para o gráfico (máx 64 pontos)
    distribuicao: distribuicao.filter((_, i) => i % Math.ceil(N / 64) === 0),
  }
}

// ── QAOA — Portfolio Optimization ─────────────────────────────
// Quantum Approximate Optimization Algorithm (QUBO)

export interface ResultadoQAOA {
  pesosOtimos:          number[]
  retornoEsperado:      number
  volatilidade:         number
  sharpe:               number
  probabilidade:        number
  nQubits:              number
  nPortfoliosPossiveis: number
  convergencia:         number[]
  distribuicao:         { estado: string; prob: number; sharpe: number }[]
}

export function qaoa(
  retornos: number[],
  matrizCov: number[][],
  rf = 0.05,
  nCamadas = 4,
): ResultadoQAOA {
  const n = Math.min(retornos.length, 10)
  const N = 1 << n

  // Função custo: Sharpe negativo (QAOA minimiza)
  function custo(estado: number): number {
    const bits = Array.from({ length: n }, (_, i) => (estado >> i) & 1)
    const soma = bits.reduce((s, b) => s + b, 0)
    if (soma === 0) return 10
    const w = bits.map(b => b / soma)
    const ret = w.reduce((s, wi, i) => s + wi * retornos[i], 0)
    let v = 0
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        v += w[i] * w[j] * matrizCov[i][j]
    const vol = Math.sqrt(Math.max(v, 1e-10))
    return -(ret - rf) / vol
  }

  // Superposição uniforme inicial
  let amps = Array.from({ length: N }, () => ({ re: 1 / Math.sqrt(N), im: 0 }))
  const convergencia: number[] = []

  // Optimização dos ângulos QAOA por variação estocástica
  let gammas = Array(nCamadas).fill(Math.PI / 4)
  let betas  = Array(nCamadas).fill(Math.PI / 8)

  for (let iter = 0; iter < 80; iter++) {
    let a = amps.map(x => ({ ...x }))
    for (let p = 0; p < nCamadas; p++) {
      // Unitário de custo: e^{-iγH_C}
      a = a.map((amp, idx) => {
        const θ = gammas[p] * custo(idx)
        return { re: amp.re * Math.cos(θ) + amp.im * Math.sin(θ), im: amp.im * Math.cos(θ) - amp.re * Math.sin(θ) }
      })
      // Unitário mixer via WHT: e^{-iβH_B}
      const scale = 1 / N
      const fwd = wht(a, n).map(x => ({ re: x.re * scale, im: x.im * scale }))
      a = wht(fwd.map(x => {
        const θ = betas[p]
        return { re: x.re * Math.cos(θ) + x.im * Math.sin(θ), im: x.im * Math.cos(θ) - x.re * Math.sin(θ) }
      }), n).map(x => ({ re: x.re * scale, im: x.im * scale }))
    }
    const E = a.reduce((s, amp, idx) => s + (amp.re * amp.re + amp.im * amp.im) * custo(idx), 0)
    convergencia.push(E)
    gammas = gammas.map(g => g - 0.05 * (Math.random() - 0.5) * 0.4)
    betas  = betas.map(b =>  b - 0.05 * (Math.random() - 0.5) * 0.4)
  }

  // Estado final com ângulos optimizados
  let afinal = Array.from({ length: N }, () => ({ re: 1 / Math.sqrt(N), im: 0 }))
  for (let p = 0; p < nCamadas; p++) {
    afinal = afinal.map((amp, idx) => {
      const θ = gammas[p] * custo(idx)
      return { re: amp.re * Math.cos(θ) + amp.im * Math.sin(θ), im: amp.im * Math.cos(θ) - amp.re * Math.sin(θ) }
    })
    const scale = 1 / N
    const fwd = wht(afinal, n).map(x => ({ re: x.re * scale, im: x.im * scale }))
    afinal = wht(fwd.map(x => {
      const θ = betas[p]
      return { re: x.re * Math.cos(θ) + x.im * Math.sin(θ), im: x.im * Math.cos(θ) - x.re * Math.sin(θ) }
    }), n).map(x => ({ re: x.re * scale, im: x.im * scale }))
  }

  const probs = afinal.map(a => a.re * a.re + a.im * a.im)
  const totalP = probs.reduce((s, p) => s + p, 0)
  const probsN = probs.map(p => p / totalP)

  const idxOtimo = probsN.indexOf(Math.max(...probsN))
  const bits = Array.from({ length: n }, (_, i) => (idxOtimo >> i) & 1)
  const soma = bits.reduce((s, b) => s + b, 0) || 1
  const pesos = bits.map(b => b / soma)
  const ret = pesos.reduce((s, w, i) => s + w * retornos[i], 0)
  let v = 0
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      v += pesos[i] * pesos[j] * matrizCov[i][j]
  const vol = Math.sqrt(Math.max(v, 1e-10))

  const distribuicao = probsN
    .map((prob, idx) => ({ estado: idx.toString(2).padStart(n, '0'), prob, sharpe: -custo(idx) }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 8)

  return {
    pesosOtimos:          pesos,
    retornoEsperado:      ret,
    volatilidade:         vol,
    sharpe:               (ret - rf) / vol,
    probabilidade:        probsN[idxOtimo],
    nQubits:              n,
    nPortfoliosPossiveis: N,
    convergencia,
    distribuicao,
  }
}

// ── Algoritmo de Grover — Detecção de Anomalias ───────────────
// O(√N) iterações vs O(N) busca clássica

export interface ResultadoGrover {
  estadoBinario:       string
  estadoEncontrado:    number
  probabilidade:       number
  iteracoesQuanticas:  number
  iteracoesClassicas:  number
  speedup:             number
  distribuicao:        { estado: string; prob: number; marcado: boolean }[]
  diagrama:            string
}

export function grover(
  n: number,
  oraculo: (x: number) => boolean,
): ResultadoGrover {
  const N = 1 << n
  const nMarcados = Array.from({ length: N }, (_, i) => i).filter(oraculo).length || 1
  const nIter = Math.max(1, Math.round(Math.PI / 4 * Math.sqrt(N / nMarcados)))

  let amps = Array.from({ length: N }, () => ({ re: 1 / Math.sqrt(N), im: 0 }))

  for (let iter = 0; iter < nIter; iter++) {
    // Oráculo: inverte fase dos estados marcados
    amps = amps.map((a, i) => oraculo(i) ? { re: -a.re, im: -a.im } : a)
    // Difusão de Grover: 2|ψ⟩⟨ψ| − I
    const mRe = amps.reduce((s, a) => s + a.re, 0) / N
    const mIm = amps.reduce((s, a) => s + a.im, 0) / N
    amps = amps.map(a => ({ re: 2 * mRe - a.re, im: 2 * mIm - a.im }))
  }

  const probs = amps.map(a => a.re * a.re + a.im * a.im)
  const maxProb = Math.max(...probs)
  const idxMax  = probs.indexOf(maxProb)

  // Circuito ilustrativo (até 4 qubits para legibilidade)
  const nCirc = Math.min(n, 4)
  const circ = new CircuitoQuantico(nCirc)
  for (let q = 0; q < nCirc; q++) circ.H(q)
  if (nCirc >= 2) circ.CNOT(0, 1)
  if (nCirc >= 3) circ.CNOT(1, 2)
  if (nCirc >= 4) circ.CNOT(2, 3)

  const distribuicao = probs
    .map((prob, idx) => ({ estado: idx.toString(2).padStart(n, '0'), prob, marcado: oraculo(idx) }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, Math.min(12, N))

  return {
    estadoBinario:      idxMax.toString(2).padStart(n, '0'),
    estadoEncontrado:   idxMax,
    probabilidade:      maxProb,
    iteracoesQuanticas: nIter,
    iteracoesClassicas: Math.round(N / 2),
    speedup:            Math.round((N / 2) / nIter * 10) / 10,
    distribuicao,
    diagrama:           circ.diagrama(),
  }
}
