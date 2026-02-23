// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock do Livro de Ordens
// ============================================================

import type { NivelOrdem, LivroOrdens } from '../../types/market'
import { obterPrecoActual } from './candlestick'

interface ConfigSpread {
  spreadPct: number   // spread como % do preço médio
  decimais: number    // casas decimais do preço
  tamanhoBase: number // tamanho base em lote
}

const CONFIGS_SPREAD: Record<string, ConfigSpread> = {
  // Ações americanas
  AAPL: { spreadPct: 0.0001, decimais: 2, tamanhoBase: 500 },
  MSFT: { spreadPct: 0.0001, decimais: 2, tamanhoBase: 400 },
  GOOGL: { spreadPct: 0.0002, decimais: 2, tamanhoBase: 300 },
  NVDA: { spreadPct: 0.0002, decimais: 2, tamanhoBase: 600 },
  TSLA: { spreadPct: 0.0003, decimais: 2, tamanhoBase: 700 },
  // Pares de moeda (spread muito apertado)
  EURUSD: { spreadPct: 0.00002, decimais: 5, tamanhoBase: 1_000_000 },
  GBPUSD: { spreadPct: 0.00003, decimais: 5, tamanhoBase: 800_000 },
  USDJPY: { spreadPct: 0.00002, decimais: 3, tamanhoBase: 1_000_000 },
  // Commodities
  'XAU': { spreadPct: 0.0003, decimais: 2, tamanhoBase: 50 },
  'CL1': { spreadPct: 0.0005, decimais: 2, tamanhoBase: 1_000 },
  'CO1': { spreadPct: 0.0005, decimais: 2, tamanhoBase: 1_000 },
  // Índices / ETF
  SPX: { spreadPct: 0.0001, decimais: 2, tamanhoBase: 200 },
  DAX: { spreadPct: 0.0002, decimais: 2, tamanhoBase: 150 },
  PSI20: { spreadPct: 0.0008, decimais: 2, tamanhoBase: 100 },
}

function arredondar(n: number, decimais: number): number {
  const f = Math.pow(10, decimais)
  return Math.round(n * f) / f
}

function gerarNiveis(
  precoBase: number,
  lado: 'oferta' | 'pedido',
  config: ConfigSpread,
  niveis = 10,
): NivelOrdem[] {
  const halfSpread = (precoBase * config.spreadPct) / 2
  const resultado: NivelOrdem[] = []
  let total = 0

  for (let i = 0; i < niveis; i++) {
    // Quanto mais afastado do mid, maior o step de preço
    const step = precoBase * config.spreadPct * (1 + i * 0.8)
    const preco =
      lado === 'oferta'
        ? arredondar(precoBase - halfSpread - step * i, config.decimais)
        : arredondar(precoBase + halfSpread + step * i, config.decimais)

    // Tamanho: exponencial decrescente à medida que se afasta do mid
    const decay = Math.exp(-i * 0.3)
    const quantidade = Math.max(
      1,
      Math.floor(config.tamanhoBase * decay * (0.6 + Math.random() * 0.8)),
    )

    total += quantidade
    resultado.push({
      preco,
      quantidade,
      total,
      numOrdens: Math.max(1, Math.floor(quantidade / (config.tamanhoBase / 10))),
    })
  }

  return resultado
}

export function gerarLivroOrdens(ticker: string, niveis = 10): LivroOrdens {
  const precoActual = obterPrecoActual(ticker)
  const config = CONFIGS_SPREAD[ticker] ?? {
    spreadPct: 0.0005,
    decimais: 2,
    tamanhoBase: 200,
  }

  const halfSpread = (precoActual * config.spreadPct) / 2
  const precoMedio = arredondar(precoActual, config.decimais)
  const spread = arredondar(halfSpread * 2, config.decimais)

  return {
    ticker,
    timestamp: Date.now(),
    ofertas: gerarNiveis(precoActual, 'oferta', config, niveis),
    pedidos: gerarNiveis(precoActual, 'pedido', config, niveis),
    spread,
    precoMedio,
    moeda: ticker.includes('JPY') ? 'JPY' : 'USD',
  }
}

/** Simula actualização em tempo real do livro de ordens */
export function actualizarLivroOrdens(livro: LivroOrdens): LivroOrdens {
  const config = CONFIGS_SPREAD[livro.ticker] ?? {
    spreadPct: 0.0005,
    decimais: 2,
    tamanhoBase: 200,
  }

  // Deriva ligeira do preço médio
  const deriva = livro.precoMedio * (Math.random() - 0.495) * config.spreadPct
  const novoPreco = arredondar(livro.precoMedio + deriva, config.decimais)

  return {
    ...gerarLivroOrdens(livro.ticker, livro.pedidos.length),
    precoMedio: novoPreco,
    timestamp: Date.now(),
  }
}
