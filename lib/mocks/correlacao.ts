// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock: Matriz de Correlação
// ============================================================

export interface MatrizCorrelacao {
  activos: string[]
  matrix: number[][]   // -1 a +1
  nomes: Record<string, string>
  categorias: Record<string, string>
}

// Activos: 12 principais classes de activos e instrumentos
const ACTIVOS = ['SPX','NDX','XAU','CO1','BTC','EURUSD','USDJPY','UST10','DAX','NVDA','AAPL','MSFT']

const NOMES: Record<string, string> = {
  SPX:    'S&P 500',
  NDX:    'Nasdaq 100',
  XAU:    'Ouro',
  CO1:    'Petróleo Brent',
  BTC:    'Bitcoin',
  EURUSD: 'EUR/USD',
  USDJPY: 'USD/JPY',
  UST10:  'US T-Note 10A',
  DAX:    'DAX 40',
  NVDA:   'NVIDIA',
  AAPL:   'Apple',
  MSFT:   'Microsoft',
}

const CATEGORIAS: Record<string, string> = {
  SPX:    'Índice',
  NDX:    'Índice',
  XAU:    'Commodity',
  CO1:    'Commodity',
  BTC:    'Crypto',
  EURUSD: 'FX',
  USDJPY: 'FX',
  UST10:  'Obrigação',
  DAX:    'Índice',
  NVDA:   'Acção',
  AAPL:   'Acção',
  MSFT:   'Acção',
}

// Matriz simétrica de correlações (60 dias de dados diários — período actual)
// Valores realistas baseados em correlações históricas típicas
const MATRIX: number[][] = [
  // SPX    NDX    XAU    CO1    BTC    EURUSD USDJPY UST10  DAX    NVDA   AAPL   MSFT
  [ 1.00,  0.95,  0.12, -0.24,  0.48,  0.32, -0.18, -0.54,  0.82,  0.72,  0.78,  0.82], // SPX
  [ 0.95,  1.00,  0.08, -0.21,  0.52,  0.28, -0.16, -0.58,  0.74,  0.84,  0.75,  0.80], // NDX
  [ 0.12,  0.08,  1.00,  0.24, -0.08,  0.42, -0.38, -0.12,  0.14,  0.04,  0.08,  0.06], // XAU
  [-0.24, -0.21,  0.24,  1.00,  0.04,  0.14, -0.08, -0.04, -0.18, -0.14, -0.18, -0.16], // CO1
  [ 0.48,  0.52, -0.08,  0.04,  1.00,  0.18, -0.12, -0.28,  0.42,  0.48,  0.38,  0.42], // BTC
  [ 0.32,  0.28,  0.42,  0.14,  0.18,  1.00, -0.72,  0.18,  0.48,  0.22,  0.28,  0.26], // EURUSD
  [-0.18, -0.16, -0.38, -0.08, -0.12, -0.72,  1.00, -0.14, -0.22, -0.12, -0.16, -0.14], // USDJPY
  [-0.54, -0.58, -0.12, -0.04, -0.28,  0.18, -0.14,  1.00, -0.48, -0.42, -0.52, -0.48], // UST10
  [ 0.82,  0.74,  0.14, -0.18,  0.42,  0.48, -0.22, -0.48,  1.00,  0.62,  0.68,  0.72], // DAX
  [ 0.72,  0.84,  0.04, -0.14,  0.48,  0.22, -0.12, -0.42,  0.62,  1.00,  0.68,  0.72], // NVDA
  [ 0.78,  0.75,  0.08, -0.18,  0.38,  0.28, -0.16, -0.52,  0.68,  0.68,  1.00,  0.88], // AAPL
  [ 0.82,  0.80,  0.06, -0.16,  0.42,  0.26, -0.14, -0.48,  0.72,  0.72,  0.88,  1.00], // MSFT
]

export const CORRELACAO_DADOS: MatrizCorrelacao = {
  activos: ACTIVOS,
  matrix: MATRIX,
  nomes: NOMES,
  categorias: CATEGORIAS,
}

export function getCorCorrelacao(valor: number): string {
  if (valor >= 0.8)  return '#1b5e20'  // forte positiva
  if (valor >= 0.5)  return '#388e3c'  // moderada positiva
  if (valor >= 0.2)  return '#66bb6a'  // fraca positiva
  if (valor >= -0.2) return '#1a1a2e'  // neutral (diagonal ou sem corr)
  if (valor >= -0.5) return '#e53935'  // fraca negativa
  if (valor >= -0.8) return '#b71c1c'  // moderada negativa
  return '#7f0000'                      // forte negativa
}

export function getTextCorrelacao(valor: number): string {
  if (Math.abs(valor) >= 0.8) return '#ffffff'
  if (Math.abs(valor) >= 0.5) return '#e0e0e0'
  if (Math.abs(valor) >= 0.2) return '#bdbdbd'
  return '#757575'
}
