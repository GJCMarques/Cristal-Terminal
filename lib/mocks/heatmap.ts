// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock do Mapa de Calor de Sectores
// ============================================================

export interface AccaoSector {
  ticker: string
  nome: string
  variacao: number
  capMerc: number   // em mil milhões USD
}

export interface Sector {
  id: string
  nome: string
  variacao: number
  capMerc: number   // em biliões USD
  peso: number      // peso no S&P 500 (%)
  acoes: AccaoSector[]
}

export const SECTORES_SP500: Sector[] = [
  {
    id: 'tech', nome: 'Tecnologia', variacao: +1.82, capMerc: 14.2, peso: 31.2,
    acoes: [
      { ticker: 'AAPL',  nome: 'Apple',         variacao: +2.14, capMerc: 3_400 },
      { ticker: 'MSFT',  nome: 'Microsoft',     variacao: +1.82, capMerc: 3_100 },
      { ticker: 'NVDA',  nome: 'NVIDIA',        variacao: +3.42, capMerc: 3_380 },
      { ticker: 'GOOGL', nome: 'Alphabet',      variacao: +0.82, capMerc: 2_480 },
      { ticker: 'META',  nome: 'Meta',          variacao: +1.42, capMerc: 1_820 },
      { ticker: 'TSMC',  nome: 'TSMC',          variacao: +2.81, capMerc: 920 },
      { ticker: 'AVGO',  nome: 'Broadcom',      variacao: +1.24, capMerc: 840 },
      { ticker: 'ORCL',  nome: 'Oracle',        variacao: +0.64, capMerc: 510 },
    ],
  },
  {
    id: 'health', nome: 'Saúde', variacao: -0.24, capMerc: 5.8, peso: 12.8,
    acoes: [
      { ticker: 'LLY',   nome: 'Eli Lilly',     variacao: -0.82, capMerc: 720 },
      { ticker: 'UNH',   nome: 'UnitedHealth',  variacao: +0.42, capMerc: 580 },
      { ticker: 'JNJ',   nome: 'J&J',           variacao: -0.21, capMerc: 370 },
      { ticker: 'ABBV',  nome: 'AbbVie',        variacao: -0.64, capMerc: 310 },
      { ticker: 'MRK',   nome: 'Merck',         variacao: +0.14, capMerc: 280 },
    ],
  },
  {
    id: 'finance', nome: 'Financeiro', variacao: +0.91, capMerc: 7.2, peso: 13.4,
    acoes: [
      { ticker: 'BRK',   nome: 'Berkshire',     variacao: +0.42, capMerc: 1_020 },
      { ticker: 'JPM',   nome: 'JPMorgan',      variacao: +1.42, capMerc: 720 },
      { ticker: 'V',     nome: 'Visa',          variacao: +0.82, capMerc: 580 },
      { ticker: 'MA',    nome: 'Mastercard',    variacao: +0.92, capMerc: 480 },
      { ticker: 'BAC',   nome: 'Bank of Am.',   variacao: +1.12, capMerc: 340 },
      { ticker: 'GS',    nome: 'Goldman Sachs', variacao: +1.84, capMerc: 210 },
    ],
  },
  {
    id: 'consumer_disc', nome: 'Consumo Disc.', variacao: +0.43, capMerc: 4.1, peso: 10.2,
    acoes: [
      { ticker: 'AMZN',  nome: 'Amazon',        variacao: +0.82, capMerc: 2_420 },
      { ticker: 'TSLA',  nome: 'Tesla',         variacao: -1.42, capMerc: 1_100 },
      { ticker: 'HD',    nome: 'Home Depot',    variacao: +0.62, capMerc: 370 },
      { ticker: 'NKE',   nome: 'Nike',          variacao: -0.24, capMerc: 140 },
    ],
  },
  {
    id: 'industrial', nome: 'Industrial', variacao: +0.62, capMerc: 3.4, peso: 8.4,
    acoes: [
      { ticker: 'CAT',   nome: 'Caterpillar',   variacao: +0.82, capMerc: 210 },
      { ticker: 'RTX',   nome: 'RTX Corp',      variacao: +1.21, capMerc: 180 },
      { ticker: 'HON',   nome: 'Honeywell',     variacao: +0.42, capMerc: 140 },
      { ticker: 'UPS',   nome: 'UPS',           variacao: -0.21, capMerc: 120 },
    ],
  },
  {
    id: 'energy', nome: 'Energia', variacao: -1.64, capMerc: 2.8, peso: 3.8,
    acoes: [
      { ticker: 'XOM',   nome: 'ExxonMobil',    variacao: -1.82, capMerc: 480 },
      { ticker: 'CVX',   nome: 'Chevron',       variacao: -1.42, capMerc: 280 },
      { ticker: 'COP',   nome: 'ConocoPhillips',variacao: -1.21, capMerc: 140 },
    ],
  },
  {
    id: 'comm', nome: 'Comunicação', variacao: +0.58, capMerc: 3.8, peso: 8.9,
    acoes: [
      { ticker: 'GOOGL', nome: 'Alphabet',      variacao: +0.82, capMerc: 2_480 },
      { ticker: 'META',  nome: 'Meta',          variacao: +1.42, capMerc: 1_820 },
      { ticker: 'NFLX',  nome: 'Netflix',       variacao: +0.42, capMerc: 340 },
      { ticker: 'DIS',   nome: 'Disney',        variacao: -0.21, capMerc: 190 },
    ],
  },
  {
    id: 'consumer_stap', nome: 'Consumo Básico', variacao: -0.12, capMerc: 2.4, peso: 6.1,
    acoes: [
      { ticker: 'PG',    nome: 'P&G',           variacao: -0.14, capMerc: 380 },
      { ticker: 'KO',    nome: 'Coca-Cola',     variacao: +0.12, capMerc: 280 },
      { ticker: 'COST',  nome: 'Costco',        variacao: +0.42, capMerc: 340 },
      { ticker: 'WMT',   nome: 'Walmart',       variacao: +0.82, capMerc: 740 },
    ],
  },
  {
    id: 'materials', nome: 'Materiais', variacao: -0.82, capMerc: 0.9, peso: 2.4,
    acoes: [
      { ticker: 'LIN',   nome: 'Linde',         variacao: -0.42, capMerc: 230 },
      { ticker: 'APD',   nome: 'Air Products',  variacao: -1.12, capMerc: 58 },
    ],
  },
  {
    id: 'realestate', nome: 'Imobiliário', variacao: -0.31, capMerc: 1.2, peso: 2.4,
    acoes: [
      { ticker: 'PLD',   nome: 'Prologis',      variacao: -0.42, capMerc: 120 },
      { ticker: 'AMT',   nome: 'Am. Tower',     variacao: -0.12, capMerc: 90 },
    ],
  },
  {
    id: 'utilities', nome: 'Utilities', variacao: +0.12, capMerc: 0.8, peso: 2.3,
    acoes: [
      { ticker: 'NEE',   nome: 'NextEra Energy',variacao: +0.21, capMerc: 120 },
      { ticker: 'SO',    nome: 'Southern',      variacao: +0.04, capMerc: 75 },
    ],
  },
]
