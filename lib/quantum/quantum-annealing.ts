// ============================================================
// CRISTAL CAPITAL TERMINAL — Quantum Annealing Simulation
// SQA · Portfolio Optimization · Ising Model
// ============================================================

/** Simulated Quantum Annealing */
export function simulatedQuantumAnnealing(nVars: number, nSteps: number, T_initial: number, T_final: number): {
  optimalSolution: number[]; optimalCost: number
  convergence: { step: number; cost: number; temperature: number }[]
  energyLandscape: { x: number; energy: number }[]
  classicalComparison: { solution: number[]; cost: number; steps: number }
} {
  // Random cost function (portfolio-like: minimize risk for target return)
  const Q = Array.from({ length: nVars }, (_, i) =>
    Array.from({ length: nVars }, (_, j) => {
      if (i === j) return 0.5 + Math.random() * 0.5
      return (Math.random() - 0.3) * 0.2
    })
  )
  const costFn = (x: number[]) => {
    let cost = 0
    for (let i = 0; i < nVars; i++) {
      for (let j = 0; j < nVars; j++) {
        cost += Q[i][j] * x[i] * x[j]
      }
    }
    return cost
  }
  // Quantum annealing with transverse field
  let solution = Array.from({ length: nVars }, () => Math.random() > 0.5 ? 1 : 0)
  let bestSolution = [...solution]
  let bestCost = costFn(solution)
  const convergence: { step: number; cost: number; temperature: number }[] = []
  for (let step = 0; step < nSteps; step++) {
    const progress = step / nSteps
    const T = T_initial * Math.pow(T_final / T_initial, progress)
    const transverseField = T_initial * (1 - progress)
    // Flip random spin
    const idx = Math.floor(Math.random() * nVars)
    const newSolution = [...solution]
    newSolution[idx] = 1 - newSolution[idx]
    const currentCost = costFn(solution)
    const newCost = costFn(newSolution)
    // Metropolis + quantum tunneling
    const dE = newCost - currentCost
    const quantumTunneling = Math.exp(-transverseField * 0.1) * Math.random()
    if (dE < 0 || Math.random() < Math.exp(-dE / T) + quantumTunneling * 0.1) {
      solution = newSolution
      if (newCost < bestCost) { bestCost = newCost; bestSolution = [...newSolution] }
    }
    if (step % Math.max(1, Math.floor(nSteps / 100)) === 0) {
      convergence.push({ step, cost: costFn(solution), temperature: T })
    }
  }
  // Classical SA comparison
  let classSol = Array.from({ length: nVars }, () => Math.random() > 0.5 ? 1 : 0)
  let classBest = [...classSol]
  let classBestCost = costFn(classSol)
  for (let step = 0; step < nSteps; step++) {
    const T = T_initial * Math.pow(T_final / T_initial, step / nSteps)
    const idx = Math.floor(Math.random() * nVars)
    const newSol = [...classSol]; newSol[idx] = 1 - newSol[idx]
    const dE = costFn(newSol) - costFn(classSol)
    if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
      classSol = newSol
      const c = costFn(classSol)
      if (c < classBestCost) { classBestCost = c; classBest = [...classSol] }
    }
  }
  // Energy landscape (1D projection)
  const energyLandscape = Array.from({ length: 50 }, (_, i) => {
    const x = i / 50
    const testSol = bestSolution.map((s, j) => Math.random() < x ? 1 - s : s)
    return { x, energy: costFn(testSol) }
  })
  return {
    optimalSolution: bestSolution, optimalCost: bestCost,
    convergence, energyLandscape,
    classicalComparison: { solution: classBest, cost: classBestCost, steps: nSteps }
  }
}

/** Quantum Annealing for Portfolio Optimization */
export function quantumAnnealingPortfolio(returns: number[], covariance: number[][], riskAversion: number, nAssets: number): {
  weights: number[]; expectedReturn: number; risk: number; sharpe: number
  convergence: { step: number; objective: number }[]
  classicalWeights: number[]; improvement: number
  efficientFrontier: { ret: number; vol: number }[]
} {
  const nSteps = 2000
  // QUBO formulation: minimize w'Σw - λ*w'μ
  const costFn = (w: number[]) => {
    let risk = 0, ret = 0
    for (let i = 0; i < nAssets; i++) {
      ret += w[i] * returns[i]
      for (let j = 0; j < nAssets; j++) {
        risk += w[i] * w[j] * covariance[i][j]
      }
    }
    return riskAversion * risk - ret
  }
  // Continuous quantum annealing
  let weights = new Array(nAssets).fill(1 / nAssets)
  let bestWeights = [...weights]
  let bestCost = costFn(weights)
  const convergence: { step: number; objective: number }[] = []
  for (let step = 0; step < nSteps; step++) {
    const T = 1.0 * Math.pow(0.001, step / nSteps)
    const tunneling = (1 - step / nSteps) * 0.3
    // Perturb weights with quantum tunneling
    const newWeights = weights.map(w => {
      const perturbation = (Math.random() - 0.5) * (T + tunneling)
      return Math.max(0, w + perturbation)
    })
    const sum = newWeights.reduce((s, w) => s + w, 0) || 1
    const normalized = newWeights.map(w => w / sum)
    const newCost = costFn(normalized)
    const dE = newCost - costFn(weights)
    if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
      weights = normalized
      if (newCost < bestCost) { bestCost = newCost; bestWeights = [...normalized] }
    }
    if (step % 20 === 0) convergence.push({ step, objective: costFn(weights) })
  }
  // Classical Markowitz for comparison
  const classicalWeights = new Array(nAssets).fill(1 / nAssets)
  // Calculate metrics
  let expectedReturn = 0, risk = 0
  for (let i = 0; i < nAssets; i++) {
    expectedReturn += bestWeights[i] * returns[i]
    for (let j = 0; j < nAssets; j++) {
      risk += bestWeights[i] * bestWeights[j] * covariance[i][j]
    }
  }
  const vol = Math.sqrt(Math.max(risk, 0))
  const sharpe = vol > 0 ? (expectedReturn - 0.02) / vol : 0
  // Efficient frontier
  const efficientFrontier: { ret: number; vol: number }[] = []
  for (let lambda = 0.1; lambda <= 5; lambda += 0.2) {
    const w = bestWeights.map((bw, i) => {
      const factor = lambda / riskAversion
      return Math.max(0, bw * factor + (1 - factor) / nAssets)
    })
    const s = w.reduce((a, b) => a + b, 0) || 1
    const wn = w.map(x => x / s)
    let r = 0, v = 0
    for (let i = 0; i < nAssets; i++) {
      r += wn[i] * returns[i]
      for (let j = 0; j < nAssets; j++) v += wn[i] * wn[j] * covariance[i][j]
    }
    efficientFrontier.push({ ret: r, vol: Math.sqrt(Math.max(v, 0)) })
  }
  return {
    weights: bestWeights, expectedReturn, risk: vol, sharpe,
    convergence, classicalWeights,
    improvement: (costFn(classicalWeights) - bestCost) / Math.abs(costFn(classicalWeights)) * 100,
    efficientFrontier
  }
}

/** Ising model solver via quantum annealing */
export function isingModel(n: number, nSteps: number): {
  spins: number[]; energy: number
  convergence: { step: number; energy: number }[]
  energyHistogram: { energy: number; count: number }[]
  magnetization: number
} {
  // Random J couplings and h fields
  const J: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i < j ? (Math.random() - 0.5) * 2 : 0)
  )
  const h = Array.from({ length: n }, () => (Math.random() - 0.5) * 0.5)
  const energy = (spins: number[]) => {
    let E = 0
    for (let i = 0; i < n; i++) {
      E -= h[i] * spins[i]
      for (let j = i + 1; j < n; j++) {
        E -= J[i][j] * spins[i] * spins[j]
      }
    }
    return E
  }
  let spins = Array.from({ length: n }, () => Math.random() > 0.5 ? 1 : -1)
  let bestSpins = [...spins]
  let bestEnergy = energy(spins)
  const convergence: { step: number; energy: number }[] = []
  const energySamples: number[] = []
  for (let step = 0; step < nSteps; step++) {
    const T = 2.0 * Math.pow(0.01, step / nSteps)
    const gamma = 2.0 * (1 - step / nSteps) // Transverse field
    const idx = Math.floor(Math.random() * n)
    const newSpins = [...spins]; newSpins[idx] *= -1
    const dE = energy(newSpins) - energy(spins)
    const tunnelProb = Math.exp(-gamma) * 0.1
    if (dE < 0 || Math.random() < Math.exp(-dE / T) + tunnelProb) {
      spins = newSpins
      const E = energy(spins)
      if (E < bestEnergy) { bestEnergy = E; bestSpins = [...spins] }
    }
    if (step % Math.max(1, Math.floor(nSteps / 100)) === 0) {
      convergence.push({ step, energy: energy(spins) })
      energySamples.push(energy(spins))
    }
  }
  // Energy histogram
  const minE = Math.min(...energySamples)
  const maxE = Math.max(...energySamples)
  const nBuckets = 25
  const bucketSize = (maxE - minE) / nBuckets || 1
  const hist = new Array(nBuckets).fill(0)
  for (const e of energySamples) hist[Math.min(Math.floor((e - minE) / bucketSize), nBuckets - 1)]++
  const energyHistogram = hist.map((c, i) => ({ energy: minE + (i + 0.5) * bucketSize, count: c }))
  const magnetization = bestSpins.reduce((s, sp) => s + sp, 0) / n
  return { spins: bestSpins, energy: bestEnergy, convergence, energyHistogram, magnetization }
}
