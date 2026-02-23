// ============================================================
// CRISTAL CAPITAL TERMINAL — Simulador Quântico (Statevector)
// Suporta até 16 qubits | Portas: H X Y Z S T CNOT Rx Ry Rz
// ============================================================

export type Complexo = { re: number; im: number }
export type Estatovector = Complexo[]

const C = (re: number, im = 0): Complexo => ({ re, im })
const add  = (a: Complexo, b: Complexo): Complexo => ({ re: a.re + b.re, im: a.im + b.im })
const mul  = (a: Complexo, b: Complexo): Complexo => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
})
export const abs2 = (c: Complexo): number => c.re * c.re + c.im * c.im
const S2 = 1 / Math.SQRT2

// Porta de 1 qubit: matriz 2×2 [U00, U01, U10, U11]
type Porta1Q = [Complexo, Complexo, Complexo, Complexo]

export const PORTAS = {
  H:  [C(S2),  C(S2),   C(S2),  C(-S2)] as Porta1Q,
  X:  [C(0),   C(1),    C(1),   C(0)]   as Porta1Q,
  Y:  [C(0),   C(0,-1), C(0,1), C(0)]   as Porta1Q,
  Z:  [C(1),   C(0),    C(0),   C(-1)]  as Porta1Q,
  S:  [C(1),   C(0),    C(0),   C(0,1)] as Porta1Q,
  T:  [C(1),   C(0),    C(0),   C(Math.cos(Math.PI/4), Math.sin(Math.PI/4))] as Porta1Q,
  Rx: (θ: number): Porta1Q => [
    C(Math.cos(θ/2)), C(0, -Math.sin(θ/2)),
    C(0, -Math.sin(θ/2)), C(Math.cos(θ/2)),
  ],
  Ry: (θ: number): Porta1Q => [
    C(Math.cos(θ/2)), C(-Math.sin(θ/2)),
    C(Math.sin(θ/2)), C(Math.cos(θ/2)),
  ],
  Rz: (θ: number): Porta1Q => [
    C(Math.cos(θ/2), -Math.sin(θ/2)), C(0),
    C(0), C(Math.cos(θ/2), Math.sin(θ/2)),
  ],
}

function aplicar1Q(sv: Estatovector, n: number, q: number, U: Porta1Q): Estatovector {
  const out = sv.map(c => ({ ...c }))
  const step = 1 << q
  for (let i = 0; i < (1 << n); i++) {
    if (i & step) continue
    const j = i | step
    out[i] = add(mul(U[0], sv[i]), mul(U[1], sv[j]))
    out[j] = add(mul(U[2], sv[i]), mul(U[3], sv[j]))
  }
  return out
}

function aplicarCNOT(sv: Estatovector, n: number, ctrl: number, alvo: number): Estatovector {
  const out = sv.map(c => ({ ...c }))
  const cb = 1 << ctrl
  const tb = 1 << alvo
  for (let i = 0; i < (1 << n); i++) {
    if ((i & cb) && !(i & tb)) {
      const j = i | tb
      out[i] = sv[j]
      out[j] = sv[i]
    }
  }
  return out
}

export interface OpCircuito {
  porta: string
  qubits: number[]
  param?: number
}

export class CircuitoQuantico {
  private sv: Estatovector
  readonly n: number
  private ops: OpCircuito[] = []

  constructor(nQubits: number) {
    this.n = nQubits
    this.sv = Array.from({ length: 1 << nQubits }, (_, i) => i === 0 ? C(1) : C(0))
  }

  H(q: number)             { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.H);    this.ops.push({porta:'H',   qubits:[q]}); return this }
  X(q: number)             { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.X);    this.ops.push({porta:'X',   qubits:[q]}); return this }
  Y(q: number)             { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.Y);    this.ops.push({porta:'Y',   qubits:[q]}); return this }
  Z(q: number)             { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.Z);    this.ops.push({porta:'Z',   qubits:[q]}); return this }
  S(q: number)             { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.S);    this.ops.push({porta:'S',   qubits:[q]}); return this }
  T(q: number)             { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.T);    this.ops.push({porta:'T',   qubits:[q]}); return this }
  Rx(q: number, θ: number) { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.Rx(θ));this.ops.push({porta:'Rx',  qubits:[q],param:θ}); return this }
  Ry(q: number, θ: number) { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.Ry(θ));this.ops.push({porta:'Ry',  qubits:[q],param:θ}); return this }
  Rz(q: number, θ: number) { this.sv = aplicar1Q(this.sv,this.n,q,PORTAS.Rz(θ));this.ops.push({porta:'Rz',  qubits:[q],param:θ}); return this }
  CNOT(c: number, t: number){ this.sv = aplicarCNOT(this.sv,this.n,c,t);         this.ops.push({porta:'CNOT',qubits:[c,t]}); return this }

  probabilidades(): number[]  { return this.sv.map(abs2) }
  estatovector(): Estatovector { return this.sv }
  operacoes(): OpCircuito[]    { return this.ops }

  medir(): number {
    const p = this.probabilidades()
    let r = Math.random()
    for (let i = 0; i < p.length; i++) { r -= p[i]; if (r <= 0) return i }
    return p.length - 1
  }

  amostras(shots: number): Record<string, number> {
    const counts: Record<string, number> = {}
    for (let s = 0; s < shots; s++) {
      const k = this.medir().toString(2).padStart(this.n, '0')
      counts[k] = (counts[k] ?? 0) + 1
    }
    return counts
  }

  // Coordenadas da esfera de Bloch (só válido para n=1)
  bloch(): { x: number; y: number; z: number } {
    const [a, b] = this.sv
    return {
      x: 2 * (a.re * b.re + a.im * b.im),
      y: 2 * (a.im * b.re - a.re * b.im),
      z: abs2(a) - abs2(b),
    }
  }

  // Diagrama ASCII do circuito
  diagrama(): string {
    const linhas = Array.from({ length: this.n }, (_, i) => `  q${i} |0⟩─`)
    for (const op of this.ops) {
      if (op.porta === 'CNOT') {
        const [c, t] = op.qubits
        for (let i = 0; i < this.n; i++) {
          if (i === c)      linhas[i] += '──●──'
          else if (i === t) linhas[i] += '──⊕──'
          else              linhas[i] += '─────'
        }
      } else {
        const q = op.qubits[0]
        const lbl = op.param !== undefined
          ? `${op.porta}(${(op.param).toFixed(2)})`
          : op.porta
        const w = Math.max(3, lbl.length + 2)
        for (let i = 0; i < this.n; i++) {
          if (i === q) linhas[i] += `─[${lbl}]─`
          else         linhas[i] += '─'.repeat(lbl.length + 4)
        }
      }
    }
    return linhas.map(l => l + '─╢M╟').join('\n')
  }
}
