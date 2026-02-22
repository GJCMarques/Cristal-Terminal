// ============================================================
// CRISTAL CAPITAL TERMINAL — API Crypto Live (CoinGecko)
// ============================================================

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const COINGECKO_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'avalanche-2', 'polkadot', 'chainlink', 'uniswap',
  'dogecoin', 'shiba-inu', 'litecoin', 'bitcoin-cash', 'stellar',
]

const TICKER_MAP: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', binancecoin: 'BNB',
  ripple: 'XRP', cardano: 'ADA', 'avalanche-2': 'AVAX', polkadot: 'DOT',
  chainlink: 'LINK', uniswap: 'UNI', dogecoin: 'DOGE', 'shiba-inu': 'SHIB',
  litecoin: 'LTC', 'bitcoin-cash': 'BCH', stellar: 'XLM',
}

const COR_MAP: Record<string, string> = {
  BTC:'#F7931A', ETH:'#627EEA', SOL:'#9945FF', BNB:'#F3BA2F', XRP:'#00AAE4',
  ADA:'#0033AD', AVAX:'#E84142', DOT:'#E6007A', LINK:'#2A5ADA', UNI:'#FF007A',
  DOGE:'#C2A633', SHIB:'#FFA409', LTC:'#BFBBBB', BCH:'#8DC351', XLM:'#14B6E7',
}

// ── Mock fallback ─────────────────────────────────────────────
const MOCK_CRYPTO = [
  { ticker:'BTC',  rank:1,  preco:95820,  variacao1h:+0.42, variacao24h:+4.20, variacao7d:+12.4, capMerc:1.882e12, vol24h:4.28e10, cor:'#F7931A' },
  { ticker:'ETH',  rank:2,  preco:3342,   variacao1h:-0.12, variacao24h:+2.14, variacao7d:+8.2,  capMerc:4.02e11, vol24h:1.84e10, cor:'#627EEA' },
  { ticker:'SOL',  rank:5,  preco:194.2,  variacao1h:+1.24, variacao24h:+6.84, variacao7d:+24.2, capMerc:9.14e10, vol24h:8.24e9,  cor:'#9945FF' },
  { ticker:'BNB',  rank:4,  preco:412,    variacao1h:-0.08, variacao24h:+1.82, variacao7d:+4.8,  capMerc:6.28e10, vol24h:1.42e9,  cor:'#F3BA2F' },
  { ticker:'XRP',  rank:6,  preco:2.48,   variacao1h:+0.84, variacao24h:+8.42, variacao7d:+18.4, capMerc:1.42e11, vol24h:6.84e9,  cor:'#00AAE4' },
  { ticker:'ADA',  rank:9,  preco:1.08,   variacao1h:-0.24, variacao24h:+3.24, variacao7d:+14.2, capMerc:3.82e10, vol24h:1.24e9,  cor:'#0033AD' },
  { ticker:'AVAX', rank:11, preco:42.8,   variacao1h:+1.84, variacao24h:+5.82, variacao7d:+22.4, capMerc:1.74e10, vol24h:8.42e8,  cor:'#E84142' },
  { ticker:'DOT',  rank:15, preco:8.42,   variacao1h:-0.42, variacao24h:+1.24, variacao7d:+6.4,  capMerc:1.22e10, vol24h:4.82e8,  cor:'#E6007A' },
  { ticker:'LINK', rank:14, preco:18.4,   variacao1h:+0.62, variacao24h:+4.12, variacao7d:+16.8, capMerc:1.08e10, vol24h:6.24e8,  cor:'#2A5ADA' },
  { ticker:'UNI',  rank:20, preco:12.8,   variacao1h:-0.18, variacao24h:+2.84, variacao7d:+8.4,  capMerc:7.64e9,  vol24h:2.84e8,  cor:'#FF007A' },
  { ticker:'DOGE', rank:8,  preco:0.342,  variacao1h:+0.28, variacao24h:+3.42, variacao7d:+12.4, capMerc:4.98e10, vol24h:2.14e9,  cor:'#C2A633' },
  { ticker:'SHIB', rank:12, preco:0.0000242, variacao1h:-0.84, variacao24h:+2.14, variacao7d:+4.2, capMerc:1.42e10, vol24h:8.24e8, cor:'#FFA409' },
  { ticker:'LTC',  rank:18, preco:128.4,  variacao1h:+0.14, variacao24h:+1.82, variacao7d:+4.8,  capMerc:9.62e9,  vol24h:4.24e8,  cor:'#BFBBBB' },
  { ticker:'BCH',  rank:22, preco:548,    variacao1h:-0.24, variacao24h:+3.24, variacao7d:+8.4,  capMerc:1.08e10, vol24h:3.24e8,  cor:'#8DC351' },
  { ticker:'XLM',  rank:24, preco:0.384,  variacao1h:+0.48, variacao24h:+5.24, variacao7d:+18.4, capMerc:1.12e10, vol24h:4.84e8,  cor:'#14B6E7' },
]

export async function GET() {
  // ── Tenta CoinGecko free API ──────────────────────────────
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINGECKO_IDS.join(',')}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next:    { revalidate: 60 },
    })

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any[] = await res.json()
      const cryptos = data.map((c, i) => ({
        ticker:       TICKER_MAP[c.id] ?? c.symbol?.toUpperCase() ?? c.id,
        rank:         c.market_cap_rank ?? i + 1,
        preco:        c.current_price ?? 0,
        variacao1h:   c.price_change_percentage_1h_in_currency ?? 0,
        variacao24h:  c.price_change_percentage_24h_in_currency ?? 0,
        variacao7d:   c.price_change_percentage_7d_in_currency ?? 0,
        capMerc:      c.market_cap ?? 0,
        vol24h:       c.total_volume ?? 0,
        cor:          COR_MAP[TICKER_MAP[c.id] ?? ''] ?? '#ffffff',
        nome:         c.name,
        imagem:       c.image,
      }))

      const capTotal  = cryptos.reduce((s, c) => s + c.capMerc, 0)
      const btcCap    = cryptos.find((c) => c.ticker === 'BTC')?.capMerc ?? 0
      const dominancia = capTotal > 0 ? (btcCap / capTotal) * 100 : 0

      return NextResponse.json({
        cryptos,
        meta: { capTotal, dominanciaBTC: dominancia },
        fonte: 'coingecko',
      })
    }
  } catch {
    // fall through
  }

  // ── Fallback mock ─────────────────────────────────────────
  const capTotal   = MOCK_CRYPTO.reduce((s, c) => s + c.capMerc, 0)
  const dominancia = (MOCK_CRYPTO[0]!.capMerc / capTotal) * 100

  return NextResponse.json({
    cryptos: MOCK_CRYPTO,
    meta:    { capTotal, dominanciaBTC: dominancia },
    fonte:   'mock',
  })
}
