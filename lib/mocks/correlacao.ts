// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock: Matriz de Correlação Dinâmica
// ============================================================

export interface MatrizCorrelacao {
  activos: string[]
  matrix: number[][]
  nomes: Record<string, string>
  categorias: Record<string, string>
}

interface AssetProfile {
  id: string
  nome: string
  cat: string
  // factors: growth, yield/safe, crypto, eur, usd, oil
  g: number // growth / risk on
  s: number // safety / rates
  c: number // crypto
  e: number // european exposure
  u: number // usd strength
  o: number // oil/commodities
}

const ASSETS: AssetProfile[] = [
  // Índices globais
  { id: 'SPX', nome: 'S&P 500', cat: 'Índice', g: 0.8, s: 0.1, c: 0.3, e: 0.2, u: 0.1, o: 0.2 },
  { id: 'NDX', nome: 'Nasdaq 100', cat: 'Índice', g: 1.0, s: 0.0, c: 0.4, e: 0.1, u: 0.1, o: 0.0 },
  { id: 'DAX', nome: 'DAX 40', cat: 'Índice', g: 0.7, s: 0.2, c: 0.2, e: 0.9, u: -0.2, o: 0.3 },
  { id: 'PSI', nome: 'PSI 20', cat: 'Índice', g: 0.5, s: 0.4, c: 0.1, e: 0.8, u: -0.3, o: 0.4 },

  // Tech Titans US
  { id: 'AAPL', nome: 'Apple', cat: 'Acção', g: 0.9, s: 0.2, c: 0.3, e: 0.1, u: 0.1, o: 0.0 },
  { id: 'MSFT', nome: 'Microsoft', cat: 'Acção', g: 0.9, s: 0.2, c: 0.4, e: 0.1, u: 0.1, o: 0.0 },
  { id: 'NVDA', nome: 'NVIDIA', cat: 'Acção', g: 1.0, s: -0.1, c: 0.6, e: 0.0, u: 0.1, o: 0.0 },
  { id: 'TSLA', nome: 'Tesla', cat: 'Acção', g: 0.9, s: -0.2, c: 0.5, e: 0.1, u: 0.0, o: -0.2 },

  // Core Europeu & Portugal
  { id: 'LVMH', nome: 'LVMH', cat: 'Acção', g: 0.6, s: 0.3, c: 0.2, e: 0.8, u: -0.1, o: 0.1 },
  { id: 'ASML', nome: 'ASML', cat: 'Acção', g: 0.9, s: 0.1, c: 0.3, e: 0.8, u: -0.1, o: 0.0 },
  { id: 'EDP', nome: 'EDP Energias', cat: 'Acção', g: 0.3, s: 0.8, c: 0.0, e: 0.7, u: -0.2, o: 0.1 },
  { id: 'GALP', nome: 'Galp Energia', cat: 'Acção', g: 0.4, s: 0.4, c: 0.1, e: 0.6, u: -0.1, o: 0.9 },
  { id: 'BCP', nome: 'Banco BCP', cat: 'Acção', g: 0.6, s: 0.5, c: 0.1, e: 0.7, u: -0.2, o: 0.1 },

  // Macros, FI & FX
  { id: 'UST10', nome: 'US T-Note 10A', cat: 'Obrigação', g: -0.5, s: 1.0, c: -0.3, e: 0.1, u: 0.4, o: -0.3 },
  { id: 'EURUSD', nome: 'EUR/USD', cat: 'FX', g: 0.3, s: 0.1, c: 0.2, e: 0.8, u: -1.0, o: 0.2 },
  { id: 'USDJPY', nome: 'USD/JPY', cat: 'FX', g: 0.2, s: -0.5, c: 0.1, e: -0.4, u: 0.8, o: 0.1 },

  // Commodities & Crypto
  { id: 'XAU', nome: 'Ouro', cat: 'Commodity', g: -0.2, s: 0.8, c: 0.4, e: 0.2, u: -0.6, o: 0.4 },
  { id: 'CO1', nome: 'Petróleo Brent', cat: 'Commodity', g: 0.1, s: 0.2, c: 0.1, e: 0.3, u: -0.3, o: 1.0 },
  { id: 'BTC', nome: 'Bitcoin', cat: 'Crypto', g: 0.6, s: -0.2, c: 1.0, e: 0.1, u: -0.2, o: 0.1 },
  { id: 'ETH', nome: 'Ethereum', cat: 'Crypto', g: 0.7, s: -0.3, c: 0.9, e: 0.1, u: -0.2, o: 0.1 },
]

function calcCorrel(a: AssetProfile, b: AssetProfile): number {
  if (a.id === b.id) return 1.0
  const dot = a.g * b.g + a.s * b.s + a.c * b.c + a.e * b.e + a.u * b.u + a.o * b.o
  const magA = Math.sqrt(a.g ** 2 + a.s ** 2 + a.c ** 2 + a.e ** 2 + a.u ** 2 + a.o ** 2)
  const magB = Math.sqrt(b.g ** 2 + b.s ** 2 + b.c ** 2 + b.e ** 2 + b.u ** 2 + b.o ** 2)
  return dot / (magA * magB)
}

const ACTIVOS = ASSETS.map(a => a.id)
const NOMES: Record<string, string> = {}
const CATEGORIAS: Record<string, string> = {}
const MATRIX: number[][] = []

ASSETS.forEach((a) => {
  NOMES[a.id] = a.nome
  CATEGORIAS[a.id] = a.cat
  const row: number[] = []
  ASSETS.forEach((b) => {
    row.push(calcCorrel(a, b))
  })
  MATRIX.push(row)
})

export const CORRELACAO_DADOS: MatrizCorrelacao = {
  activos: ACTIVOS,
  matrix: MATRIX,
  nomes: NOMES,
  categorias: CATEGORIAS,
}

// Escala visual High-Frequency (Bloomberg Style)
export function getCorCorrelacao(valor: number): string {
  if (valor === 1) return '#000000'
  if (valor >= 0.8) return '#00FF00'
  if (valor >= 0.6) return '#00C000'
  if (valor >= 0.4) return '#008000'
  if (valor >= 0.2) return '#004000'
  if (valor >= -0.19 && valor <= 0.19) return '#1A1A1A'
  if (valor >= -0.4) return '#400000'
  if (valor >= -0.6) return '#800000'
  if (valor >= -0.8) return '#C00000'
  return '#FF0000'
}

export function getTextCorrelacao(valor: number): string {
  // Always white, will use drop-shadow for contrast in TSX
  return '#ffffff'
}
