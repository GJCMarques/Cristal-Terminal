// ============================================================
// CRISTAL CAPITAL TERMINAL — Parser de Comandos Bloomberg
// ============================================================
// Suporta sintaxe: TICKER <ClasseAtivo> FUNÇÃO
// Exemplos:
//   AAPL <Equity>          → gráfico de velas da Apple
//   EURUSD <Curncy> ALLQ   → livro de ordens EUR/USD
//   HELP                   → ajuda
//   MKTM                   → monitor de mercado

import type { ClasseAtivo } from '../types/market'
import type { VistaTerminal, ComandoParseado } from '../types/terminal'

// ── Mapeamento de comandos globais ────────────────────────────

const MAPA_COMANDOS: Record<string, VistaTerminal> = {
  // Inglês (Bloomberg original)
  HELP:       'ajuda',
  MKTM:       'mercado',
  NWSM:       'noticias',
  WL:         'watchlist',
  YAS:        'yield-curve',
  ALLQ:       'livro-ordens',
  CRYPTO:     'cripto',
  MACRO:      'macro',
  HEAT:       'heatmap',
  HEATMAP:    'heatmap',
  CAL:        'calendario',
  PORT:       'portfolio',
  MAP:        'mapa-mundo',
  WMAP:       'mapa-mundo',
  BUBBLE:     'bolhas',
  BMAP:       'bolhas',
  SCR:        'screener',
  SCREENER:   'screener',
  CORR:       'correlacao',
  MATRIX:     'correlacao',
  // Português
  AJUDA:      'ajuda',
  MERCADO:    'mercado',
  NOTICIAS:   'noticias',
  LISTA:      'watchlist',
  RENDIMENTO: 'yield-curve',
  CRIPTO:     'cripto',
  PIB:        'macro',
  MAPA:       'mapa-mundo',
  MAPAMUND:   'mapa-mundo',
  BOLHAS:     'bolhas',
  CALENDARIO: 'calendario',
  CARTEIRA:   'portfolio',
  FILTRO:     'screener',
  CORRELACAO: 'correlacao',
  // Aliases rápidos
  BTC:        'cripto',
  ETH:        'cripto',
  BITCOIN:    'cripto',
  NEWS:       'noticias',
  CHART:      'candlestick',
  GP:         'candlestick',
  IA:         'analise',
  AI:         'analise',
  // Novas vistas
  DEFI:       'defi',
  ONCHAIN:    'defi',
  CHAIN:      'defi',
  ALERT:      'sentinela',
  SENTINELA:  'sentinela',
  ALERTAS:    'sentinela',
  TRIGGERS:   'sentinela',
  BOND:       'yield-curve',
  BONDS:      'yield-curve',
  OBRIG:      'yield-curve',
  CHAT:       'chat',
  MSG:        'chat',
  MENSAGEM:   'chat',
  IM:         'chat',
}

// ── Mapeamento de funções de segurança ────────────────────────

const MAPA_FUNCOES: Record<string, VistaTerminal> = {
  GP: 'candlestick',        // Graph Price
  GRAFICO: 'candlestick',
  DES: 'analise',           // Description
  ANALISE: 'analise',
  ALLQ: 'livro-ordens',     // All Quotes (order book)
  ORDENS: 'livro-ordens',
  YAS: 'yield-curve',
}

// ── Regex para classe de ativo ────────────────────────────────

const REGEX_CLASSE =
  /<\s*(Equity|Equities|Curncy|Currency|Comdty|Commodity|Index|Corp|Govt|Ações|Ação|Moeda|Commodities|Índice)\s*>/i

// ── Normalização de classe de ativo ───────────────────────────

function normalizarClasse(raw: string): ClasseAtivo {
  const mapa: Record<string, ClasseAtivo> = {
    EQUITY: 'Equity',
    EQUITIES: 'Equity',
    'AÇÕES': 'Equity',
    'AÇÃO': 'Equity',
    CURNCY: 'Currency',
    CURRENCY: 'Currency',
    MOEDA: 'Currency',
    COMDTY: 'Commodity',
    COMMODITY: 'Commodity',
    COMMODITIES: 'Commodity',
    INDEX: 'Index',
    'ÍNDICE': 'Index',
    CORP: 'Corp',
    GOVT: 'Govt',
  }
  return mapa[raw.toUpperCase().trim()] ?? 'Equity'
}

// ── Validação de ticker ────────────────────────────────────────

function eTickerValido(s: string): boolean {
  // Aceita de 1 a 12 caracteres: letras, números, ponto, hífen, barra, circunflexo
  return /^[A-Z0-9.^/\-]{1,12}$/.test(s)
}

// ── Tickers conhecidos (para sugestões) ───────────────────────

export const TICKERS_CONHECIDOS: Record<
  string,
  { nome: string; classe: ClasseAtivo }
> = {
  // Ações
  AAPL: { nome: 'Apple Inc.', classe: 'Equity' },
  MSFT: { nome: 'Microsoft Corp.', classe: 'Equity' },
  GOOGL: { nome: 'Alphabet Inc.', classe: 'Equity' },
  AMZN: { nome: 'Amazon.com Inc.', classe: 'Equity' },
  NVDA: { nome: 'NVIDIA Corp.', classe: 'Equity' },
  META: { nome: 'Meta Platforms Inc.', classe: 'Equity' },
  TSLA: { nome: 'Tesla Inc.', classe: 'Equity' },
  NFLX: { nome: 'Netflix Inc.', classe: 'Equity' },
  // Índices europeus
  'PSI20': { nome: 'PSI 20 (Portugal)', classe: 'Index' },
  'IBEX': { nome: 'IBEX 35 (Espanha)', classe: 'Index' },
  'DAX': { nome: 'DAX 40 (Alemanha)', classe: 'Index' },
  'CAC': { nome: 'CAC 40 (França)', classe: 'Index' },
  'FTSE': { nome: 'FTSE 100 (R. Unido)', classe: 'Index' },
  'MIB': { nome: 'FTSE MIB (Itália)', classe: 'Index' },
  // Índices americanos
  'SPX': { nome: 'S&P 500', classe: 'Index' },
  'NDX': { nome: 'Nasdaq 100', classe: 'Index' },
  'DJIA': { nome: 'Dow Jones Industrial', classe: 'Index' },
  'VIX': { nome: 'CBOE Volatility Index', classe: 'Index' },
  // Pares de moeda
  EURUSD: { nome: 'Euro / Dólar EUA', classe: 'Currency' },
  GBPUSD: { nome: 'Libra / Dólar EUA', classe: 'Currency' },
  USDJPY: { nome: 'Dólar EUA / Iene', classe: 'Currency' },
  USDCHF: { nome: 'Dólar EUA / Franco Suíço', classe: 'Currency' },
  EURGBP: { nome: 'Euro / Libra', classe: 'Currency' },
  USDCAD: { nome: 'Dólar EUA / Dólar Canadiano', classe: 'Currency' },
  // Commodities
  'XAU': { nome: 'Ouro (USD/troy oz)', classe: 'Commodity' },
  'XAG': { nome: 'Prata (USD/troy oz)', classe: 'Commodity' },
  'CL1': { nome: 'Petróleo WTI ($/barril)', classe: 'Commodity' },
  'CO1': { nome: 'Petróleo Brent ($/barril)', classe: 'Commodity' },
  'NG1': { nome: 'Gás Natural (USD/MMBtu)', classe: 'Commodity' },
  // Obrigações de Tesouro
  'UST10': { nome: 'US Treasury 10 Anos', classe: 'Govt' },
  'BUND10': { nome: 'Bund Alemão 10 Anos', classe: 'Govt' },
  'OT10': { nome: 'OT Português 10 Anos', classe: 'Govt' },
}

// ── Função principal de parse ──────────────────────────────────

export function parsearComando(raw: string): ComandoParseado {
  const aparado = raw.trim()
  if (!aparado) return { raw, erro: 'Comando vazio' }

  const maiusculo = aparado.toUpperCase()

  // 1. Comandos globais (sem ticker)
  const vistaGlobal = MAPA_COMANDOS[maiusculo]
  if (vistaGlobal) {
    return { raw, vista: vistaGlobal }
  }

  // 2. Padrão: TICKER <ClasseAtivo> [FUNÇÃO]
  const matchClasse = aparado.match(REGEX_CLASSE)
  if (matchClasse) {
    const indexClasse = aparado.indexOf(matchClasse[0])
    const parteTicker = aparado.slice(0, indexClasse).trim().toUpperCase()
    const classeAtivo = normalizarClasse(matchClasse[1])
    const parteApos = aparado
      .slice(indexClasse + matchClasse[0].length)
      .trim()
      .toUpperCase()

    if (!parteTicker || !eTickerValido(parteTicker)) {
      return { raw, erro: `Ticker inválido: "${parteTicker}"` }
    }

    const funcao = parteApos || undefined
    const vista: VistaTerminal =
      (funcao ? MAPA_FUNCOES[funcao] : undefined) ?? 'candlestick'

    return {
      raw,
      ticker: parteTicker,
      classeAtivo,
      funcao,
      vista,
    }
  }

  // 3. Ticker simples (sem classe) + função opcional
  const partes = maiusculo.split(/\s+/)
  const possibleTicker = partes[0]
  const possibleFn = partes[1]

  if (eTickerValido(possibleTicker)) {
    const conhecido = TICKERS_CONHECIDOS[possibleTicker]
    const vista: VistaTerminal =
      (possibleFn ? MAPA_FUNCOES[possibleFn] : undefined) ?? 'candlestick'

    return {
      raw,
      ticker: possibleTicker,
      classeAtivo: conhecido?.classe ?? 'Equity',
      funcao: possibleFn,
      vista,
    }
  }

  return {
    raw,
    erro: `Comando não reconhecido: "${aparado}". Escreva HELP para ver os comandos.`,
  }
}

// ── Sugestões de autocompletar ────────────────────────────────

export interface SugestaoComando {
  texto: string
  descricao: string
  categoria: 'funcao' | 'ticker' | 'comando'
}

export function obterSugestoes(input: string): SugestaoComando[] {
  if (!input.trim()) return []

  const maiusculo = input.trim().toUpperCase()
  const sugestoes: SugestaoComando[] = []

  // Sugerir comandos globais
  for (const [cmd, vista] of Object.entries(MAPA_COMANDOS)) {
    if (cmd.startsWith(maiusculo)) {
      sugestoes.push({
        texto: cmd,
        descricao: descreverVista(vista),
        categoria: 'comando',
      })
    }
  }

  // Sugerir tickers conhecidos
  for (const [ticker, info] of Object.entries(TICKERS_CONHECIDOS)) {
    if (ticker.startsWith(maiusculo) || sugestoes.length === 0) {
      if (ticker.startsWith(maiusculo)) {
        sugestoes.push({
          texto: `${ticker} <${info.classe}>`,
          descricao: info.nome,
          categoria: 'ticker',
        })
      }
    }
    if (sugestoes.length >= 8) break
  }

  return sugestoes.slice(0, 8)
}

function descreverVista(vista: VistaTerminal): string {
  const descricoes: Record<VistaTerminal, string> = {
    mercado:        'Monitor de Mercado Global',
    candlestick:    'Gráfico de Velas',
    'livro-ordens': 'Livro de Ordens',
    'yield-curve':  'Curva de Rendimento',
    noticias:       'Monitor de Notícias',
    watchlist:      'Lista de Observação',
    analise:        'Análise IA Llama 3',
    cripto:         'Mercado de Criptomoedas',
    macro:          'Monitor Macroeconómico',
    heatmap:        'Mapa de Calor S&P 500',
    calendario:     'Calendário Económico',
    portfolio:      'Carteira de Investimento',
    'mapa-mundo':   'Mapa Mundial Económico',
    bolhas:         'Gráfico de Bolhas de Mercado',
    screener:       'Screener de Acções',
    correlacao:     'Matriz de Correlação',
    defi:           'DeFi / On-Chain Tracker',
    sentinela:      'Sentinela IA — Alertas & Triggers',
    chat:           'Chat Institucional — MSG',
    ajuda:          'Centro de Ajuda',
  }
  return descricoes[vista] ?? vista
}
