// ============================================================
// CRISTAL CAPITAL TERMINAL — Quantum Walk Algorithms
// DTQW · CTQW · Option Pricing via Quantum Walk
// ============================================================

/** Discrete-Time Quantum Walk on a line */
export function discreteQuantumWalk(nSteps: number, nPositions: number, coinBias = 0.5): {
  positions: number[]; probabilities: number[]; classicalProbabilities: number[]
  variance: number; classicalVariance: number; spreadRatio: number
  steps: { step: number; distribution: number[] }[]
} {
  const size = 2 * nPositions + 1
  const center = nPositions
  // Quantum state: [left, right] amplitudes at each position
  let stateR = new Array(size).fill(0) // right-moving
  let stateL = new Array(size).fill(0) // left-moving
  stateR[center] = Math.sqrt(coinBias)
  stateL[center] = Math.sqrt(1 - coinBias)
  const steps: { step: number; distribution: number[] }[] = []
  for (let t = 0; t < nSteps; t++) {
    // Coin operation (Hadamard-like)
    const newR = new Array(size).fill(0)
    const newL = new Array(size).fill(0)
    for (let x = 0; x < size; x++) {
      const a = Math.sqrt(coinBias)
      const b = Math.sqrt(1 - coinBias)
      newR[x] = a * stateR[x] + b * stateL[x]
      newL[x] = b * stateR[x] - a * stateL[x]
    }
    // Shift operation
    const shiftR = new Array(size).fill(0)
    const shiftL = new Array(size).fill(0)
    for (let x = 0; x < size; x++) {
      if (x + 1 < size) shiftR[x + 1] = newR[x]
      if (x - 1 >= 0) shiftL[x - 1] = newL[x]
    }
    stateR = shiftR
    stateL = shiftL
    if (t % Math.max(1, Math.floor(nSteps / 20)) === 0) {
      const dist = stateR.map((r, i) => r * r + stateL[i] * stateL[i])
      steps.push({ step: t + 1, distribution: dist })
    }
  }
  const probabilities = stateR.map((r, i) => r * r + stateL[i] * stateL[i])
  const positions = Array.from({ length: size }, (_, i) => i - center)
  // Classical random walk for comparison
  const classicalProbabilities = new Array(size).fill(0)
  classicalProbabilities[center] = 1
  const tempClassical = [...classicalProbabilities]
  for (let t = 0; t < nSteps; t++) {
    const next = new Array(size).fill(0)
    for (let x = 0; x < size; x++) {
      if (x > 0) next[x - 1] += tempClassical[x] * 0.5
      if (x < size - 1) next[x + 1] += tempClassical[x] * 0.5
    }
    for (let x = 0; x < size; x++) tempClassical[x] = next[x]
  }
  // Variances
  const totalQ = probabilities.reduce((s, p) => s + p, 0) || 1
  const totalC = tempClassical.reduce((s, p) => s + p, 0) || 1
  const meanQ = positions.reduce((s, x, i) => s + x * probabilities[i] / totalQ, 0)
  const meanC = positions.reduce((s, x, i) => s + x * tempClassical[i] / totalC, 0)
  const variance = positions.reduce((s, x, i) => s + (x - meanQ) ** 2 * probabilities[i] / totalQ, 0)
  const classicalVariance = positions.reduce((s, x, i) => s + (x - meanC) ** 2 * tempClassical[i] / totalC, 0)
  return {
    positions, probabilities, classicalProbabilities: tempClassical,
    variance, classicalVariance,
    spreadRatio: classicalVariance > 0 ? Math.sqrt(variance / classicalVariance) : 1,
    steps
  }
}

/** Continuous-Time Quantum Walk on a graph */
export function quantumWalkGraph(adjacency: number[][], nSteps: number, startNode: number): {
  probabilities: number[]; nodes: number[]
  evolution: { step: number; distribution: number[] }[]
} {
  const n = adjacency.length
  const nodes = Array.from({ length: n }, (_, i) => i)
  // State vector (complex amplitudes, simplified to real)
  let state = new Array(n).fill(0)
  state[startNode] = 1
  const dt = 0.1
  const totalSteps = Math.round(nSteps / dt)
  const evolution: { step: number; distribution: number[] }[] = []
  for (let t = 0; t < totalSteps; t++) {
    // Evolve: |ψ(t+dt)> ≈ (I - iHdt)|ψ(t)>
    const newState = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      newState[i] = state[i]
      for (let j = 0; j < n; j++) {
        newState[i] -= dt * adjacency[i][j] * state[j] * 0.5
      }
    }
    // Normalize
    const norm = Math.sqrt(newState.reduce((s, v) => s + v * v, 0))
    state = newState.map(v => v / (norm || 1))
    if (t % Math.max(1, Math.floor(totalSteps / 20)) === 0) {
      evolution.push({ step: Math.round(t * dt), distribution: state.map(s => s * s) })
    }
  }
  return { probabilities: state.map(s => s * s), nodes, evolution }
}

/** Quantum Walk-based option pricing */
export function quantumWalkOptionPricing(S: number, K: number, T: number, r: number, sigma: number, nSteps: number): {
  price: number; classicalPrice: number; speedup: string
  walkDistribution: number[]
  convergence: { steps: number; price: number }[]
  priceGrid: number[]
} {
  // Classical BS price
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  const Nd1 = normalCDF(d1)
  const Nd2 = normalCDF(d2)
  const classicalPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2
  // Quantum walk on price lattice
  const dt = T / nSteps
  const u = Math.exp(sigma * Math.sqrt(dt))
  const d = 1 / u
  const p = (Math.exp(r * dt) - d) / (u - d)
  const nNodes = 2 * nSteps + 1
  const center = nSteps
  // Initialize
  let state = new Array(nNodes).fill(0)
  state[center] = 1
  const convergence: { steps: number; price: number }[] = []
  for (let step = 0; step < nSteps; step++) {
    const newState = new Array(nNodes).fill(0)
    for (let i = 0; i < nNodes; i++) {
      if (state[i] === 0) continue
      // Quantum superposition of up and down
      const ampUp = Math.sqrt(p)
      const ampDown = Math.sqrt(1 - p)
      if (i + 1 < nNodes) newState[i + 1] += state[i] * ampUp
      if (i - 1 >= 0) newState[i - 1] += state[i] * ampDown
    }
    // Normalize
    const norm = Math.sqrt(newState.reduce((s, v) => s + v * v, 0))
    state = newState.map(v => v / (norm || 1))
    if (step % Math.max(1, Math.floor(nSteps / 15)) === 0) {
      // Compute option price at this step
      let price = 0
      for (let i = 0; i < nNodes; i++) {
        const ST = S * Math.pow(u, i - center)
        price += state[i] * state[i] * Math.max(ST - K, 0)
      }
      price *= Math.exp(-r * T)
      convergence.push({ steps: step + 1, price })
    }
  }
  // Final price
  const priceGrid = Array.from({ length: nNodes }, (_, i) => S * Math.pow(u, i - center))
  let qwPrice = 0
  for (let i = 0; i < nNodes; i++) {
    qwPrice += state[i] * state[i] * Math.max(priceGrid[i] - K, 0)
  }
  qwPrice *= Math.exp(-r * T)
  return {
    price: qwPrice, classicalPrice,
    speedup: `Quantum walk: ${nSteps} steps, ballistic spread ∝ t vs diffusive √t`,
    walkDistribution: state.map(s => s * s),
    convergence, priceGrid
  }
}

/** Quantum Walk for portfolio rebalancing */
export function quantumWalkRebalance(weights: number[], targetWeights: number[], nSteps: number): {
  finalWeights: number[]; convergence: { step: number; distance: number }[]
  quantumSpread: number; classicalSpread: number
} {
  const n = weights.length
  let current = [...weights]
  const convergence: { step: number; distance: number }[] = []
  for (let step = 0; step < nSteps; step++) {
    const newWeights = current.map((w, i) => {
      const diff = targetWeights[i] - w
      // Quantum-inspired step: larger steps than classical gradient
      const stepSize = diff * (0.3 + 0.1 * Math.sin(step * Math.PI / nSteps))
      return w + stepSize
    })
    // Normalize to sum to 1
    const sum = newWeights.reduce((s, w) => s + Math.abs(w), 0) || 1
    current = newWeights.map(w => Math.max(0, w / sum))
    const dist = Math.sqrt(current.reduce((s, w, i) => s + (w - targetWeights[i]) ** 2, 0))
    convergence.push({ step, distance: dist })
  }
  return {
    finalWeights: current, convergence,
    quantumSpread: Math.sqrt(nSteps), classicalSpread: Math.sqrt(Math.sqrt(nSteps))
  }
}

// Helper
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422820 * Math.exp(-x * x / 2)
  const p = d * t * (0.3193815302 + t * (-0.3565637813 + t * (1.7814779372 + t * (-1.8212559978 + t * 1.3302744933))))
  return x > 0 ? 1 - p : p
}
