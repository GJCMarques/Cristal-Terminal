// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock de Curvas de Rendimento
// ============================================================

import type { PontoCurvaRendimento, CurvaRendimento } from '../../types/market'

// ── Maturidades standard ──────────────────────────────────────

const MATURIDADES = [
  { label: '3M',  meses: 3 },
  { label: '6M',  meses: 6 },
  { label: '1A',  meses: 12 },
  { label: '2A',  meses: 24 },
  { label: '3A',  meses: 36 },
  { label: '5A',  meses: 60 },
  { label: '7A',  meses: 84 },
  { label: '10A', meses: 120 },
  { label: '20A', meses: 240 },
  { label: '30A', meses: 360 },
]

// ── Dados de referência (22 Fev 2026, valores realistas) ─────

type DadosCurva = { rendimentos: number[]; variacoes: number[] }

const DADOS_REFERENCIA: Record<string, DadosCurva> = {
  UST: {
    // US Treasury: curva relativamente plana / ligeiramente invertida a curto
    rendimentos: [4.32, 4.28, 4.18, 4.10, 4.05, 4.12, 4.22, 4.48, 4.68, 4.72],
    variacoes:   [+0.02, +0.01, -0.01, -0.02, +0.01, +0.02, +0.03, +0.04, +0.02, +0.01],
  },
  BUND: {
    // Bund alemão: curva com inclinação positiva
    rendimentos: [2.42, 2.35, 2.28, 2.31, 2.38, 2.52, 2.62, 2.72, 2.88, 2.91],
    variacoes:   [+0.01, 0.00, -0.01, +0.01, +0.02, +0.02, +0.03, +0.03, +0.01, +0.01],
  },
  OT: {
    // OT Portuguesa: prémio de risco sobre Bund
    rendimentos: [3.02, 2.95, 2.88, 2.98, 3.12, 3.28, 3.42, 3.58, 3.78, 3.82],
    variacoes:   [+0.02, +0.01, 0.00, +0.01, +0.02, +0.03, +0.02, +0.03, +0.02, +0.01],
  },
  GILT: {
    // UK Gilt: mais elevado que Bund
    rendimentos: [4.52, 4.48, 4.38, 4.32, 4.35, 4.48, 4.58, 4.72, 4.82, 4.85],
    variacoes:   [+0.03, +0.02, +0.01, +0.01, +0.02, +0.03, +0.02, +0.02, +0.01, +0.01],
  },
  BTP: {
    // BTP Italiano: prémio mais alto que Portugal
    rendimentos: [3.32, 3.25, 3.18, 3.28, 3.42, 3.62, 3.78, 3.98, 4.18, 4.22],
    variacoes:   [+0.02, +0.01, 0.00, +0.02, +0.03, +0.03, +0.02, +0.03, +0.02, +0.01],
  },
}

// ── Geração das curvas ────────────────────────────────────────

function gerarCurva(
  pais: string,
  benchmark: string,
  cor: string,
  dados: DadosCurva,
): CurvaRendimento {
  const pontos: PontoCurvaRendimento[] = MATURIDADES.map((mat, i) => ({
    maturidade: mat.label,
    meses: mat.meses,
    rendimento: dados.rendimentos[i],
    variacao: dados.variacoes[i],
    pais,
    benchmark,
  }))

  return {
    pais,
    benchmark,
    cor,
    pontos,
    dataReferencia: new Date().toISOString().split('T')[0],
  }
}

export const CURVAS_RENDIMENTO: CurvaRendimento[] = [
  gerarCurva('Estados Unidos', 'UST',  '#F59E0B', DADOS_REFERENCIA.UST),
  gerarCurva('Alemanha',       'BUND', '#34D399', DADOS_REFERENCIA.BUND),
  gerarCurva('Portugal',       'OT',   '#60A5FA', DADOS_REFERENCIA.OT),
  gerarCurva('Reino Unido',    'GILT', '#F472B6', DADOS_REFERENCIA.GILT),
  gerarCurva('Itália',         'BTP',  '#A78BFA', DADOS_REFERENCIA.BTP),
]

/** Curvas disponíveis por defeito (UST + BUND + OT) */
export function obterCurvasPadrao(): CurvaRendimento[] {
  return CURVAS_RENDIMENTO.filter((c) =>
    ['UST', 'BUND', 'OT'].includes(c.benchmark),
  )
}

/** Spread de crédito: diferença entre curva e Bund */
export function calcularSpreadCurva(
  curva: CurvaRendimento,
  referencia = 'BUND',
): number[] {
  const ref = CURVAS_RENDIMENTO.find((c) => c.benchmark === referencia)
  if (!ref) return curva.pontos.map(() => 0)

  return curva.pontos.map((p, i) => {
    const pRef = ref.pontos[i]
    if (!pRef) return 0
    return arredondar(p.rendimento - pRef.rendimento, 3)
  })
}

function arredondar(n: number, decimais: number): number {
  const f = Math.pow(10, decimais)
  return Math.round(n * f) / f
}
