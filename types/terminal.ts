// ============================================================
// CRISTAL CAPITAL TERMINAL — Tipos do Terminal
// ============================================================

import type { ClasseAtivo, MensagemIA } from './market'

// ── Vistas disponíveis ────────────────────────────────────────

export type VistaTerminal =
  | 'mercado'        // Monitor de Mercado Global (MKTM)
  | 'candlestick'    // Gráfico de Velas (GP)
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

  // IA
  mensagensIA: MensagemIA[]
  iaACarregar: boolean
  iaDisponivel: boolean | null

  // Tema
  temaActual: 'amber' | 'green' | 'blue'

  // Context menu
  contextMenu: ContextMenuEstado

  // Command palette
  commandPaletteAberto: boolean

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
  definirTema: (tema: 'amber' | 'green' | 'blue') => void
  abrirContextMenu: (estado: Omit<ContextMenuEstado, 'visivel'>) => void
  fecharContextMenu: () => void
  alternarCommandPalette: () => void
  fecharCommandPalette: () => void
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
