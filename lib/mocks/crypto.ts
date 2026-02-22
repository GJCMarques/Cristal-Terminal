// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock de Mercado Cripto
// ============================================================

export interface CriptoItem {
  rank: number
  ticker: string
  nome: string
  simbolo: string
  preco: number
  variacao1h: number
  variacao24h: number
  variacao7d: number
  capMerc: number
  vol24h: number
  circulacao: number
  maxHistorico: number
  cor: string
}

export const CRYPTOS: CriptoItem[] = [
  { rank:  1, ticker: 'BTC',   nome: 'Bitcoin',          simbolo: '₿',  preco: 95_800,    variacao1h: +0.21, variacao24h: +4.20,  variacao7d: +8.42,  capMerc: 1_892_000_000_000, vol24h: 42_800_000_000,  circulacao: 19_840_000,   maxHistorico: 108_200, cor: '#F7931A' },
  { rank:  2, ticker: 'ETH',   nome: 'Ethereum',         simbolo: 'Ξ',  preco: 3_412,     variacao1h: +0.14, variacao24h: +2.14,  variacao7d: +5.21,  capMerc: 410_000_000_000,   vol24h: 18_200_000_000,  circulacao: 120_200_000,  maxHistorico: 4_890,   cor: '#627EEA' },
  { rank:  3, ticker: 'SOL',   nome: 'Solana',           simbolo: '◎',  preco: 214.50,    variacao1h: +0.82, variacao24h: +5.82,  variacao7d: +12.40, capMerc: 102_000_000_000,   vol24h: 8_400_000_000,   circulacao: 475_600_000,  maxHistorico: 294.33,  cor: '#9945FF' },
  { rank:  4, ticker: 'BNB',   nome: 'BNB',              simbolo: 'B',  preco: 612.40,    variacao1h: +0.08, variacao24h: +1.21,  variacao7d: +3.14,  capMerc: 88_000_000_000,    vol24h: 2_100_000_000,   circulacao: 143_400_000,  maxHistorico: 788.84,  cor: '#F0B90B' },
  { rank:  5, ticker: 'XRP',   nome: 'XRP',              simbolo: 'X',  preco: 0.8420,    variacao1h: -0.12, variacao24h: -0.42,  variacao7d: -2.14,  capMerc: 76_000_000_000,    vol24h: 3_800_000_000,   circulacao: 57_200_000_000,maxHistorico: 3.40,   cor: '#00AAE4' },
  { rank:  6, ticker: 'USDC',  nome: 'USD Coin',         simbolo: '$',  preco: 1.0001,    variacao1h: +0.01, variacao24h: +0.01,  variacao7d: 0.00,   capMerc: 44_200_000_000,    vol24h: 12_100_000_000,  circulacao: 44_180_000_000,maxHistorico: 1.17,  cor: '#2775CA' },
  { rank:  7, ticker: 'ADA',   nome: 'Cardano',          simbolo: '₳',  preco: 0.9142,    variacao1h: +0.31, variacao24h: +3.42,  variacao7d: +8.91,  capMerc: 32_400_000_000,    vol24h: 1_200_000_000,   circulacao: 35_400_000_000,maxHistorico: 3.09,  cor: '#0033AD' },
  { rank:  8, ticker: 'AVAX',  nome: 'Avalanche',        simbolo: 'A',  preco: 38.42,     variacao1h: -0.42, variacao24h: -1.82,  variacao7d: -3.41,  capMerc: 15_800_000_000,    vol24h: 842_000_000,     circulacao: 411_000_000,  maxHistorico: 144.96,  cor: '#E84142' },
  { rank:  9, ticker: 'DOT',   nome: 'Polkadot',         simbolo: '●',  preco: 8.21,      variacao1h: +0.14, variacao24h: +2.14,  variacao7d: +4.82,  capMerc: 12_400_000_000,    vol24h: 420_000_000,     circulacao: 1_510_000_000,maxHistorico: 54.98,  cor: '#E6007A' },
  { rank: 10, ticker: 'LINK',  nome: 'Chainlink',        simbolo: '⬡',  preco: 14.82,     variacao1h: +0.52, variacao24h: +4.12,  variacao7d: +9.21,  capMerc: 9_200_000_000,     vol24h: 680_000_000,     circulacao: 621_000_000,  maxHistorico: 52.70,   cor: '#375BD2' },
  { rank: 11, ticker: 'MATIC', nome: 'Polygon',          simbolo: 'M',  preco: 0.6142,    variacao1h: +0.21, variacao24h: +1.82,  variacao7d: +3.14,  capMerc: 6_800_000_000,     vol24h: 412_000_000,     circulacao: 11_100_000_000,maxHistorico: 2.92, cor: '#8247E5' },
  { rank: 12, ticker: 'UNI',   nome: 'Uniswap',          simbolo: '🦄', preco: 9.42,      variacao1h: +0.82, variacao24h: +3.21,  variacao7d: +6.14,  capMerc: 5_600_000_000,     vol24h: 284_000_000,     circulacao: 597_000_000,  maxHistorico: 44.97,   cor: '#FF007A' },
  { rank: 13, ticker: 'ATOM',  nome: 'Cosmos',           simbolo: '⚛',  preco: 7.82,      variacao1h: -0.14, variacao24h: -0.82,  variacao7d: -2.14,  capMerc: 3_100_000_000,     vol24h: 184_000_000,     circulacao: 397_000_000,  maxHistorico: 44.45,   cor: '#6F7390' },
  { rank: 14, ticker: 'ICP',   nome: 'Internet Computer',simbolo: 'I',  preco: 8.42,      variacao1h: +0.42, variacao24h: +2.14,  variacao7d: +4.82,  capMerc: 3_900_000_000,     vol24h: 128_000_000,     circulacao: 463_000_000,  maxHistorico: 700.65,  cor: '#29ABE2' },
  { rank: 15, ticker: 'FIL',   nome: 'Filecoin',         simbolo: 'F',  preco: 4.82,      variacao1h: -0.21, variacao24h: -1.14,  variacao7d: -3.82,  capMerc: 2_900_000_000,     vol24h: 184_000_000,     circulacao: 600_000_000,  maxHistorico: 236.84,  cor: '#0090FF' },
]

export const METRICAS_GLOBAIS = {
  capTotalMercado: 3_480_000_000_000,
  dominanciaBTC: 52.3,
  vol24h: 142_800_000_000,
  indedoMedoGanancia: 68,  // 0-100: 0=Medo Extremo, 100=Ganância Extrema
  labelMedoGanancia: 'Ganância',
  btcPreco: 95_800,
  ethPreco: 3_412,
  altcoinsSeason: 62,  // 0-100
  totalCriptos: 14_842,
}

export function formatarCapMerc(v: number): string {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`
  if (v >= 1_000_000_000)     return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)         return `$${(v / 1_000_000).toFixed(0)}M`
  return `$${v.toLocaleString('pt-PT')}`
}

export function formatarPreco(v: number): string {
  if (v >= 10_000) return v.toLocaleString('pt-PT', { maximumFractionDigits: 0 })
  if (v >= 1)      return v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}
