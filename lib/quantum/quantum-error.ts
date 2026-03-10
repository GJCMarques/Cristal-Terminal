// ============================================================
// CRISTAL CAPITAL TERMINAL — Quantum Error Correction
// Bit Flip · Phase Flip · Shor · Surface Code
// ============================================================

/** 3-qubit bit flip code */
export function bitFlipCode(errorRate: number, nTrials: number): {
  uncorrectedErrorRate: number; correctedErrorRate: number; improvement: number
  syndromeDistribution: { syndrome: string; count: number }[]
  trials: { trial: number; error: boolean; corrected: boolean }[]
} {
  const syndromes: Record<string, number> = { '00': 0, '01': 0, '10': 0, '11': 0 }
  let uncorrectedErrors = 0
  let correctedErrors = 0
  const trials: { trial: number; error: boolean; corrected: boolean }[] = []
  for (let t = 0; t < nTrials; t++) {
    // Encode: |ψ> → |ψψψ>
    const q = [0, 0, 0] // 0 = no error, 1 = flipped
    // Apply errors
    for (let i = 0; i < 3; i++) {
      if (Math.random() < errorRate) q[i] = 1
    }
    // Syndrome measurement
    const s1 = q[0] ^ q[1]
    const s2 = q[1] ^ q[2]
    const syndrome = `${s1}${s2}`
    syndromes[syndrome] = (syndromes[syndrome] || 0) + 1
    // Error detection
    const hasError = q.some(x => x === 1)
    if (hasError) uncorrectedErrors++
    // Correction via majority vote
    const majority = (q[0] + q[1] + q[2]) >= 2 ? 1 : 0
    const corrected = q.filter(x => x !== majority).length <= 1
    if (hasError && !corrected) correctedErrors++
    if (t < 50) trials.push({ trial: t, error: hasError, corrected })
  }
  const syndromeDistribution = Object.entries(syndromes).map(([syndrome, count]) => ({ syndrome, count }))
  return {
    uncorrectedErrorRate: uncorrectedErrors / nTrials,
    correctedErrorRate: correctedErrors / nTrials,
    improvement: uncorrectedErrors > 0 ? (1 - correctedErrors / uncorrectedErrors) * 100 : 100,
    syndromeDistribution, trials
  }
}

/** Phase flip code */
export function phaseFlipCode(errorRate: number, nTrials: number): {
  uncorrectedErrorRate: number; correctedErrorRate: number; improvement: number
  syndromeDistribution: { syndrome: string; count: number }[]
} {
  // Phase flip code: encode in Hadamard basis, same structure as bit flip
  const syndromes: Record<string, number> = { '00': 0, '01': 0, '10': 0, '11': 0 }
  let uncorrectedErrors = 0, correctedErrors = 0
  for (let t = 0; t < nTrials; t++) {
    const q = [0, 0, 0]
    for (let i = 0; i < 3; i++) {
      if (Math.random() < errorRate) q[i] = 1
    }
    const s1 = q[0] ^ q[1]
    const s2 = q[1] ^ q[2]
    syndromes[`${s1}${s2}`]++
    const hasError = q.some(x => x === 1)
    if (hasError) uncorrectedErrors++
    const majority = (q[0] + q[1] + q[2]) >= 2 ? 1 : 0
    if (hasError && q.filter(x => x !== majority).length > 1) correctedErrors++
  }
  return {
    uncorrectedErrorRate: uncorrectedErrors / nTrials,
    correctedErrorRate: correctedErrors / nTrials,
    improvement: uncorrectedErrors > 0 ? (1 - correctedErrors / uncorrectedErrors) * 100 : 100,
    syndromeDistribution: Object.entries(syndromes).map(([s, c]) => ({ syndrome: s, count: c }))
  }
}

/** 9-qubit Shor code (combined bit+phase flip) */
export function shorCode(errorRate: number, nTrials: number): {
  physicalErrorRate: number; logicalErrorRate: number
  nPhysicalQubits: number; nLogicalQubits: number; overhead: number
  thresholdEstimate: number
  errorTypes: { type: string; count: number }[]
} {
  let logicalErrors = 0
  const errorTypes: Record<string, number> = { 'none': 0, 'single_bit': 0, 'single_phase': 0, 'multi': 0, 'uncorrectable': 0 }
  for (let t = 0; t < nTrials; t++) {
    // 9 physical qubits
    const bitErrors = Array.from({ length: 9 }, () => Math.random() < errorRate ? 1 : 0)
    const phaseErrors = Array.from({ length: 9 }, () => Math.random() < errorRate ? 1 : 0)
    const totalErrors = bitErrors.reduce((s, e) => s + e, 0) + phaseErrors.reduce((s, e) => s + e, 0)
    if (totalErrors === 0) { errorTypes['none']++; continue }
    // Shor code can correct any single-qubit error
    if (totalErrors === 1) {
      if (bitErrors.reduce((s, e) => s + e, 0) === 1) errorTypes['single_bit']++
      else errorTypes['single_phase']++
    } else if (totalErrors <= 2) {
      // Can sometimes correct 2 errors if they're in different blocks
      const block1Errors = bitErrors.slice(0, 3).reduce((s, e) => s + e, 0) + phaseErrors.slice(0, 3).reduce((s, e) => s + e, 0)
      const block2Errors = bitErrors.slice(3, 6).reduce((s, e) => s + e, 0) + phaseErrors.slice(3, 6).reduce((s, e) => s + e, 0)
      const block3Errors = bitErrors.slice(6, 9).reduce((s, e) => s + e, 0) + phaseErrors.slice(6, 9).reduce((s, e) => s + e, 0)
      if (block1Errors <= 1 && block2Errors <= 1 && block3Errors <= 1) {
        errorTypes['multi']++
      } else {
        errorTypes['uncorrectable']++
        logicalErrors++
      }
    } else {
      errorTypes['uncorrectable']++
      logicalErrors++
    }
  }
  const threshold = 3 * errorRate * errorRate // Approximate threshold for distance-3 code
  return {
    physicalErrorRate: errorRate,
    logicalErrorRate: logicalErrors / nTrials,
    nPhysicalQubits: 9, nLogicalQubits: 1, overhead: 9,
    thresholdEstimate: Math.sqrt(errorRate) * 0.5,
    errorTypes: Object.entries(errorTypes).map(([type, count]) => ({ type, count }))
  }
}

/** Surface code analysis */
export function surfaceCode(distance: number, physicalErrorRate: number): {
  logicalErrorRate: number; nPhysicalQubits: number; threshold: number
  belowThreshold: boolean
  distanceScaling: { distance: number; logicalRate: number }[]
  qubitOverhead: { distance: number; qubits: number }[]
} {
  const threshold = 0.01 // ~1% for surface code
  const belowThreshold = physicalErrorRate < threshold
  // Logical error rate ≈ (p/p_th)^((d+1)/2)
  const logicalErrorRate = belowThreshold
    ? Math.pow(physicalErrorRate / threshold, (distance + 1) / 2)
    : 1 - Math.pow(1 - physicalErrorRate, distance)
  const nPhysicalQubits = 2 * distance * distance - 1
  const distanceScaling = Array.from({ length: 10 }, (_, i) => {
    const d = (i + 1) * 2 + 1
    const lr = belowThreshold
      ? Math.pow(physicalErrorRate / threshold, (d + 1) / 2)
      : 1 - Math.pow(1 - physicalErrorRate, d)
    return { distance: d, logicalRate: Math.max(1e-15, lr) }
  })
  const qubitOverhead = Array.from({ length: 10 }, (_, i) => {
    const d = (i + 1) * 2 + 1
    return { distance: d, qubits: 2 * d * d - 1 }
  })
  return { logicalErrorRate, nPhysicalQubits, threshold, belowThreshold, distanceScaling, qubitOverhead }
}

/** Quantum error correction comparison */
export function qecComparison(physicalErrorRate: number): {
  codes: { name: string; nPhysical: number; nLogical: number; logicalRate: number; threshold: number }[]
} {
  const p = physicalErrorRate
  return {
    codes: [
      { name: '3-qubit Repetition', nPhysical: 3, nLogical: 1, logicalRate: 3 * p * p, threshold: 0.5 },
      { name: 'Steane [[7,1,3]]', nPhysical: 7, nLogical: 1, logicalRate: 21 * p * p, threshold: 0.047 },
      { name: 'Shor [[9,1,3]]', nPhysical: 9, nLogical: 1, logicalRate: 36 * p * p, threshold: 0.028 },
      { name: 'Surface d=3', nPhysical: 17, nLogical: 1, logicalRate: Math.pow(p / 0.01, 2), threshold: 0.01 },
      { name: 'Surface d=5', nPhysical: 49, nLogical: 1, logicalRate: Math.pow(p / 0.01, 3), threshold: 0.01 },
      { name: 'Surface d=7', nPhysical: 97, nLogical: 1, logicalRate: Math.pow(p / 0.01, 4), threshold: 0.01 },
      { name: 'Surface d=11', nPhysical: 241, nLogical: 1, logicalRate: Math.pow(p / 0.01, 6), threshold: 0.01 },
    ]
  }
}
