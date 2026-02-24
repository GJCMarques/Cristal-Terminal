/**
 * Rigorous N-Qubit Statevector Simulator
 * Representing full 2^n complex dimensions realistically using highly optimized Float64Arrays.
 */
export class QuantumSimulator {
    public numQubits: number
    public dim: number
    public stateRe: Float64Array
    public stateIm: Float64Array

    constructor(numQubits: number) {
        this.numQubits = numQubits
        this.dim = 1 << numQubits // 2^n
        this.stateRe = new Float64Array(this.dim)
        this.stateIm = new Float64Array(this.dim)
        this.stateRe[0] = 1.0 // Default state |0...0>
    }

    // Returns the probability of each basis state
    public getProbabilities(): number[] {
        const probs = new Array(this.dim)
        for (let i = 0; i < this.dim; i++) {
            probs[i] = this.stateRe[i] * this.stateRe[i] + this.stateIm[i] * this.stateIm[i]
        }
        return probs
    }

    // Expectation of Pauli Z on a specific qubit
    public getExpectationZ(targetQubit: number): number {
        let exp = 0
        const bitmask = 1 << targetQubit
        for (let i = 0; i < this.dim; i++) {
            const prob = this.stateRe[i] * this.stateRe[i] + this.stateIm[i] * this.stateIm[i]
            if ((i & bitmask) === 0) {
                exp += prob // +1 for |0>
            } else {
                exp -= prob // -1 for |1>
            }
        }
        return exp
    }

    // Normalization check |⟨ψ|ψ⟩|^2 ≈ 1
    public getNormalization(): number {
        return this.getProbabilities().reduce((a, b) => a + b, 0)
    }

    // === CORE GATE APPLICATION ===

    // Apply a single-qubit 2x2 complex unitary matrix
    private applyGate(
        target: number,
        u00Re: number, u00Im: number,
        u01Re: number, u01Im: number,
        u10Re: number, u10Im: number,
        u11Re: number, u11Im: number,
        control: number = -1
    ) {
        const bitmask = 1 << target
        const newStateRe = new Float64Array(this.dim)
        const newStateIm = new Float64Array(this.dim)

        // Copy existing state to new memory first
        newStateRe.set(this.stateRe)
        newStateIm.set(this.stateIm)

        for (let i = 0; i < this.dim; i++) {
            // Skip if this is the target's |1> state to process both in pairs (i where target=0)
            if ((i & bitmask) !== 0) continue

            // Skip if control is active and control bit is 0
            if (control >= 0 && ((i & (1 << control)) === 0)) continue

            const j = i | bitmask // The corresponding state where target is |1>

            const a0Re = this.stateRe[i]
            const a0Im = this.stateIm[i]
            const a1Re = this.stateRe[j]
            const a1Im = this.stateIm[j]

            // new_a0 = u00 * a0 + u01 * a1
            newStateRe[i] = (u00Re * a0Re - u00Im * a0Im) + (u01Re * a1Re - u01Im * a1Im)
            newStateIm[i] = (u00Re * a0Im + u00Im * a0Re) + (u01Re * a1Im + u01Im * a1Re)

            // new_a1 = u10 * a0 + u11 * a1
            newStateRe[j] = (u10Re * a0Re - u10Im * a0Im) + (u11Re * a1Re - u11Im * a1Im)
            newStateIm[j] = (u10Re * a0Im + u10Im * a0Re) + (u11Re * a1Im + u11Im * a1Re)
        }
        this.stateRe = newStateRe
        this.stateIm = newStateIm
        return this
    }

    // === GATES ===

    public H(q: number) {
        const invSqrt2 = 1 / Math.SQRT2
        return this.applyGate(q,
            invSqrt2, 0, invSqrt2, 0,
            invSqrt2, 0, -invSqrt2, 0
        )
    }

    public X(q: number) {
        return this.applyGate(q, 0, 0, 1, 0, 1, 0, 0, 0)
    }

    public Y(q: number) {
        return this.applyGate(q, 0, 0, 0, -1, 0, 1, 0, 0)
    }

    public Z(q: number) {
        return this.applyGate(q, 1, 0, 0, 0, 0, 0, -1, 0)
    }

    public CNOT(control: number, target: number) {
        return this.applyGate(target, 0, 0, 1, 0, 1, 0, 0, 0, control)
    }

    public CZ(control: number, target: number) {
        return this.applyGate(target, 1, 0, 0, 0, 0, 0, -1, 0, control)
    }

    public Rx(q: number, theta: number) {
        const c = Math.cos(theta / 2)
        const s = -Math.sin(theta / 2)
        return this.applyGate(q, c, 0, 0, s, 0, s, c, 0)
    }

    public Ry(q: number, theta: number) {
        const c = Math.cos(theta / 2)
        const s = Math.sin(theta / 2)
        return this.applyGate(q, c, 0, -s, 0, s, 0, c, 0)
    }

    public Rz(q: number, theta: number) {
        const cm = Math.cos(-theta / 2)
        const sm = Math.sin(-theta / 2)
        const cp = Math.cos(theta / 2)
        const sp = Math.sin(theta / 2)
        return this.applyGate(q, cm, sm, 0, 0, 0, 0, cp, sp)
    }

    public CRz(control: number, target: number, theta: number) {
        const cm = Math.cos(-theta / 2)
        const sm = Math.sin(-theta / 2)
        const cp = Math.cos(theta / 2)
        const sp = Math.sin(theta / 2)
        return this.applyGate(target, cm, sm, 0, 0, 0, 0, cp, sp, control)
    }
}
