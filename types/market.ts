// ============================================================
// CRISTAL CAPITAL TERMINAL — Tipos de Mercado Financeiro
// ============================================================

export type ClasseAtivo =
  | 'Equity'
  | 'Currency'
  | 'Commodity'
  | 'Index'
  | 'Corp'
  | 'Govt'

// ── Candlestick / OHLCV ─────────────────────────────────────

export interface BarraOHLCV {
  /** Unix timestamp em segundos */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface SerieIntradiaMinuto {
  ticker: string
  intervalo: '1m' | '5m' | '15m' | '30m' | '60m'
  dados: BarraOHLCV[]
  moeda: string
  ultimaAtualizacao: string
}

// ── Livro de Ordens ──────────────────────────────────────────

export interface NivelOrdem {
  preco: number
  quantidade: number
  total: number
  numOrdens: number
}

export interface LivroOrdens {
  ticker: string
  timestamp: number
  ofertas: NivelOrdem[]   // bids
  pedidos: NivelOrdem[]   // asks
  spread: number
  precoMedio: number
  moeda: string
}

// ── Curva de Rendimento ───────────────────────────────────────

export interface PontoCurvaRendimento {
  maturidade: string     // "3M", "6M", "1Y", "2Y", "5Y", "10Y", "30Y"
  meses: number          // para ordenação numérica
  rendimento: number     // em percentagem, e.g. 4.25
  variacao: number       // vs dia anterior
  pais: string
  benchmark: string      // "UST" | "Bund" | "OT"
}

export interface CurvaRendimento {
  pais: string
  benchmark: string
  cor: string
  pontos: PontoCurvaRendimento[]
  dataReferencia: string
}

// ── Intradía tick ─────────────────────────────────────────────

export interface TickIntradio {
  timestamp: number
  preco: number
  volume: number
  ofertaCompra: number
  ofertaVenda: number
}

// ── Notícias ─────────────────────────────────────────────────

export type CategoriaNoticia =
  | 'mercado'
  | 'macro'
  | 'empresa'
  | 'politica'
  | 'commodities'
  | 'cripto'

export type Sentimento = 'positivo' | 'negativo' | 'neutro'

export interface Noticia {
  id: string
  titulo: string
  resumo: string
  fonte: string
  timestamp: string
  tickers: string[]
  sentimento?: Sentimento
  pontuacaoSentimento?: number   // -1.0 a +1.0
  categoria: CategoriaNoticia
  urgente?: boolean
}

// ── Segurança / Ticker ────────────────────────────────────────

export interface Seguranca {
  ticker: string
  nome: string
  classeAtivo: ClasseAtivo
  bolsa: string
  moeda: string
  pais: string
  setor?: string
}

// ── Dados de Mercado Geral ────────────────────────────────────

export interface ItemMercado {
  id: string
  ticker: string
  nome: string
  valor: number
  variacao: number
  variacaoPct: number
  volume: number
  ytd: number
  sparkline: number[]
  moeda: string
  classeAtivo: ClasseAtivo
  ultimaAtualizacao: string
}

// ── Mensagem IA ───────────────────────────────────────────────

export interface MensagemIA {
  papel: 'utilizador' | 'assistente'
  conteudo: string
  timestamp: string
}
