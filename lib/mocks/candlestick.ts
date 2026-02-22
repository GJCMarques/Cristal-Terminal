// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock de Dados Candlestick (OHLCV)
// ============================================================

import type { BarraOHLCV, SerieIntradiaMinuto } from '../../types/market'

/** Gerador de série OHLCV realista com random walk + tendência */
export function gerarSerieOHLCV(
  ticker: string,
  precoInicial: number,
  dias = 90,
  volatilidade = 0.015,
  tendencia = 0.0003,
): BarraOHLCV[] {
  const barras: BarraOHLCV[] = []
  let preco = precoInicial
  const agora = Date.now()
  const umDiaMs = 86_400_000

  for (let i = dias; i >= 0; i--) {
    const data = new Date(agora - i * umDiaMs)
    // Ignorar fins de semana
    if (data.getDay() === 0 || data.getDay() === 6) continue

    const timestamp = Math.floor(data.getTime() / 1000)

    // Random walk com tendência
    const retorno = tendencia + (Math.random() - 0.48) * volatilidade * 2
    const open = preco
    const close = preco * (1 + retorno)
    const amplitude = Math.abs(retorno) * 1.5 + volatilidade * 0.5
    const high = Math.max(open, close) * (1 + Math.random() * amplitude)
    const low = Math.min(open, close) * (1 - Math.random() * amplitude)

    // Volume realista: maior em dias com maior movimento
    const movimentoRelativo = Math.abs(retorno) / volatilidade
    const volumeBase = precoInicial > 1000 ? 1_500_000 : 45_000_000
    const volume = Math.floor(volumeBase * (0.5 + movimentoRelativo) * (0.7 + Math.random() * 0.6))

    barras.push({
      time: timestamp,
      open: arredondar(open, 2),
      high: arredondar(high, 2),
      low: arredondar(low, 2),
      close: arredondar(close, 2),
      volume,
    })

    preco = close
  }

  return barras
}

/** Gera dados intradiários de 1 minuto para o dia de hoje */
export function gerarIntradiaMinuto(
  ticker: string,
  precoBase: number,
  minutos = 390,
): BarraOHLCV[] {
  const barras: BarraOHLCV[] = []
  const hoje = new Date()
  hoje.setHours(9, 30, 0, 0) // Abertura NYSE
  let preco = precoBase * (0.98 + Math.random() * 0.04)
  const volatMin = 0.003

  for (let i = 0; i < minutos; i++) {
    const ts = new Date(hoje.getTime() + i * 60_000)
    const timestamp = Math.floor(ts.getTime() / 1000)

    const retorno = (Math.random() - 0.49) * volatMin
    const open = preco
    const close = preco * (1 + retorno)
    const high = Math.max(open, close) * (1 + Math.random() * 0.002)
    const low = Math.min(open, close) * (1 - Math.random() * 0.002)

    // Volume em U: alto no início e fim da sessão
    const progresso = i / minutos
    const factorU = 0.4 + Math.pow(progresso - 0.5, 2) * 3
    const volume = Math.floor(200_000 * factorU * (0.5 + Math.random()))

    barras.push({
      time: timestamp,
      open: arredondar(open, 2),
      high: arredondar(high, 2),
      low: arredondar(low, 2),
      close: arredondar(close, 2),
      volume,
    })

    preco = close
  }

  return barras
}

// ── Dados pré-gerados por ticker ─────────────────────────────

interface ConfigTicker {
  preco: number
  volatilidade: number
  tendencia: number
}

const CONFIGS: Record<string, ConfigTicker> = {
  AAPL:   { preco: 227.52, volatilidade: 0.014, tendencia: 0.0004 },
  MSFT:   { preco: 415.30, volatilidade: 0.013, tendencia: 0.0005 },
  GOOGL:  { preco: 198.70, volatilidade: 0.016, tendencia: 0.0003 },
  AMZN:   { preco: 228.90, volatilidade: 0.017, tendencia: 0.0004 },
  NVDA:   { preco: 138.50, volatilidade: 0.032, tendencia: 0.0008 },
  META:   { preco: 712.40, volatilidade: 0.020, tendencia: 0.0006 },
  TSLA:   { preco: 342.10, volatilidade: 0.040, tendencia: 0.0002 },
  EURUSD: { preco: 1.0823, volatilidade: 0.004, tendencia: 0.00005 },
  GBPUSD: { preco: 1.2641, volatilidade: 0.005, tendencia: 0.00003 },
  USDJPY: { preco: 149.82, volatilidade: 0.006, tendencia: -0.0001 },
  'XAU':  { preco: 2932.50, volatilidade: 0.010, tendencia: 0.0003 },
  'CL1':  { preco: 70.85, volatilidade: 0.022, tendencia: -0.0002 },
  'CO1':  { preco: 74.20, volatilidade: 0.021, tendencia: -0.0002 },
  SPX:    { preco: 6118.71, volatilidade: 0.010, tendencia: 0.0003 },
  NDX:    { preco: 21_956.40, volatilidade: 0.013, tendencia: 0.0004 },
  PSI20:  { preco: 6832.14, volatilidade: 0.009, tendencia: 0.0002 },
  DAX:    { preco: 22_412.30, volatilidade: 0.011, tendencia: 0.0003 },
}

const _cache = new Map<string, BarraOHLCV[]>()

export function obterDadosCandlestick(ticker: string): BarraOHLCV[] {
  if (_cache.has(ticker)) return _cache.get(ticker)!

  const config = CONFIGS[ticker] ?? { preco: 100, volatilidade: 0.015, tendencia: 0.0002 }
  const dados = gerarSerieOHLCV(ticker, config.preco, 90, config.volatilidade, config.tendencia)
  _cache.set(ticker, dados)
  return dados
}

export function obterPrecoActual(ticker: string): number {
  const dados = obterDadosCandlestick(ticker)
  return dados[dados.length - 1]?.close ?? 100
}

function arredondar(n: number, casas: number): number {
  const factor = Math.pow(10, casas)
  return Math.round(n * factor) / factor
}
