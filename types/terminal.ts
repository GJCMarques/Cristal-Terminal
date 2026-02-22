// ============================================================
// CRISTAL CAPITAL TERMINAL — Tipos do Terminal
// ============================================================

import type { ClasseAtivo, MensagemIA } from './market'

// ── Vistas disponíveis ────────────────────────────────────────

export type VistaTerminal =
  | 'mercado'        // Monitor de Mercado Global (MKTM)
  | 'candlestick'    // Gráfico de Velas (GP)
  | 'chat'           // Chat Institucional (MSG)
  | 'livro-ordens'   // Livro de Ordens (ALLQ)
  | 'yield-curve'    // Curva de Rendimento (YAS)
  | 'noticias'       // Monitor de Notícias (NWSM)
  | 'watchlist'      // Lista de Observação (WL)
  | 'analise'        // Análise IA (DES)
  | 'ajuda'          // Ajuda (HELP)
  | 'cripto'         // Mercado Cripto (CRYPTO)
  | 'macro'          // Monitor Macroeconómico (MACRO)
  | 'heatmap'        // Mapa de Calor de Sectores (HEAT)
  | 'calendario'     // Calendário Económico (CAL)
  | 'portfolio'      // Carteira de Investimento (PORT)
  | 'mapa-mundo'     // Mapa Mundial Económico (MAP)
  | 'bolhas'         // Gráfico de Bolhas de Mercado (BUBBLE)
  | 'screener'       // Screener de Acções (SCR)
  | 'correlacao'     // Matriz de Correlação (CORR)
  | 'defi'           // DeFi/On-Chain Tracker (DEFI)
  | 'sentinela'      // Sentinel IA de Alertas (ALERT)

// ── Context menu ──────────────────────────────────────────────

export interface ContextMenuEstado {
  visivel: boolean
  x: number
  y: number
  ticker?: string
  vista?: VistaTerminal
  nomeActivo?: string
  classeAtivo?: ClasseAtivo
}

// ── Painel do layout ─────────────────────────────────────────

export interface Painel {
  id: string
  tipo: VistaTerminal
  titulo: string
  ticker?: string
  classeAtivo?: ClasseAtivo
}

// ── Comando parseado ──────────────────────────────────────────

export interface ComandoParseado {
  raw: string
  ticker?: string
  classeAtivo?: ClasseAtivo
  funcao?: string
  vista?: VistaTerminal
  erro?: string
}

// ── Posição de Portfolio ──────────────────────────────────────

export interface PosicaoPortfolio {
  ticker: string
  nome: string
  classeAtivo: string
  sector: string
  quantidade: number
  custoMedio: number
  precoActual: number
  variacao1D: number
  beta: number
  moeda: string
}

// ── Trade Ticket ──────────────────────────────────────────────

export interface TradeTicketEstado {
  aberto: boolean
  ticker: string
  nome: string
  precoReferencia: number
  lado: 'compra' | 'venda'
}

// ── Alerta Sentinela ──────────────────────────────────────────

export type TipoAlerta = 'preco_acima' | 'preco_abaixo' | 'variacao_pct' | 'volume_spike' | 'noticia'

export interface AlertaSentinela {
  id: string
  ticker?: string
  tipo: TipoAlerta
  valor: number
  label: string
  ativo: boolean
  criadoEm: string
  disparadoEm?: string
  mensagem?: string
}

// ── Estado global do terminal ─────────────────────────────────

export interface EstadoTerminal {
  // Ticker activo
  tickerActivo: string | null
  classeActivaAtivo: ClasseAtivo | null
  nomeActivoAtivo: string | null

  // Vista actual
  vistaActual: VistaTerminal
  vistaAnterior: VistaTerminal | null

  // Linha de comando
  inputComando: string
  historicoComandos: string[]
  indiceHistorico: number

  // Estado de carregamento
  aCarregar: boolean
  erro: string | null

  // Painel lateral visível
  painelLateralVisivel: boolean

  // Watchlist
  watchlists: WatchlistItem[][]
  watchlistActiva: number
  nomesWatchlist: string[]

  // IA
  mensagensIA: MensagemIA[]
  iaACarregar: boolean
  iaDisponivel: boolean | null

  // Tema
  temaActual: 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'cyan' | 'rose' | 'slate'

  // Locale / i18n
  locale: 'pt' | 'en' | 'es'

  // Chat
  chatNaoLidas: number

  // Context menu
  contextMenu: ContextMenuEstado

  // Command palette
  commandPaletteAberto: boolean

  // Trade Ticket
  tradeTicket: TradeTicketEstado

  // Alertas Sentinela
  alertasSentinela: AlertaSentinela[]

  // Acções
  definirTickerActivo: (ticker: string, classeAtivo?: ClasseAtivo, nome?: string) => void
  definirVista: (vista: VistaTerminal) => void
  voltarVista: () => void
  definirInputComando: (input: string) => void
  executarComando: (comando: string) => void
  navegarHistorico: (direccao: 'cima' | 'baixo') => void
  limparErro: () => void
  alternarPainelLateral: () => void
  adicionarAoWatchlist: (ticker: string, nome: string) => void
  removerDoWatchlist: (ticker: string) => void
  definirWatchlistActiva: (indice: number) => void
  adicionarMensagemIA: (mensagem: MensagemIA) => void
  definirIACarregando: (aCarregar: boolean) => void
  definirIADisponivel: (disponivel: boolean) => void
  definirTema: (tema: 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'cyan' | 'rose' | 'slate') => void
  definirLocale: (locale: 'pt' | 'en' | 'es') => void
  incrementarChatNaoLidas: () => void
  limparChatNaoLidas: () => void
  criarWatchlist: (nome: string) => void
  removerWatchlist: (indice: number) => void
  renomearWatchlist: (indice: number, nome: string) => void
  abrirContextMenu: (estado: Omit<ContextMenuEstado, 'visivel'>) => void
  fecharContextMenu: () => void
  alternarCommandPalette: () => void
  fecharCommandPalette: () => void
  // Trade ticket
  abrirTradeTicket: (ticker: string, nome: string, preco: number, lado?: 'compra' | 'venda') => void
  fecharTradeTicket: () => void
  // Alertas
  adicionarAlerta: (alerta: Omit<AlertaSentinela, 'id' | 'criadoEm'>) => void
  removerAlerta: (id: string) => void
  toggleAlerta: (id: string) => void
}

// ── Watchlist ─────────────────────────────────────────────────

export interface WatchlistItem {
  ticker: string
  nome: string
  adicionadoEm: string
}

// ── Sugestão autocomplete ─────────────────────────────────────

export interface SugestaoComando {
  texto: string
  descricao: string
  categoria: 'funcao' | 'ticker' | 'comando'
}
