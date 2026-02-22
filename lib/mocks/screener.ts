// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock: Screener de Acções
// ============================================================

export interface AccaoScreener {
  ticker: string
  nome: string
  sector: string
  pais: string
  capitalMerc: number    // Mil milhões USD
  preco: number
  variacao1D: number     // %
  variacao52s: number    // %
  pe: number             // P/E ratio
  pb: number             // P/B ratio
  eps: number
  dividendo: number      // %
  beta: number
  volumeMedio: number    // Mil
  margem: number         // % margem líquida
  crescimentoReceita: number // % YoY
  roe: number            // Return on Equity %
  divida: number         // Dívida/Equity ratio
  cotacao52sMax: number
  cotacao52sMin: number
}

export const ACOES_SCREENER: AccaoScreener[] = [
  { ticker:'AAPL',  nome:'Apple Inc.',           sector:'Tecnologia',   pais:'🇺🇸', capitalMerc:3120, preco:213.50, variacao1D:+1.24, variacao52s:+28.4,  pe:31.2, pb:47.1, eps:6.85, dividendo:0.44, beta:1.21, volumeMedio:58420, margem:25.3, crescimentoReceita:+4.1,  roe:147.2, divida:1.87, cotacao52sMax:237.23, cotacao52sMin:164.08 },
  { ticker:'MSFT',  nome:'Microsoft Corp.',       sector:'Tecnologia',   pais:'🇺🇸', capitalMerc:2980, preco:399.20, variacao1D:+0.87, variacao52s:+14.2,  pe:35.8, pb:12.4, eps:11.15, dividendo:0.72, beta:0.89, volumeMedio:22180, margem:35.4, crescimentoReceita:+16.0, roe:36.2, divida:0.43, cotacao52sMax:468.35, cotacao52sMin:362.90 },
  { ticker:'NVDA',  nome:'NVIDIA Corp.',          sector:'Tecnologia',   pais:'🇺🇸', capitalMerc:2840, preco:116.40, variacao1D:+3.21, variacao52s:+52.8,  pe:52.4, pb:38.2, eps:2.22, dividendo:0.03, beta:1.98, volumeMedio:192400, margem:55.4, crescimentoReceita:+122.4, roe:85.4, divida:0.42, cotacao52sMax:153.13, cotacao52sMin:47.32 },
  { ticker:'GOOGL', nome:'Alphabet Inc.',         sector:'Tecnologia',   pais:'🇺🇸', capitalMerc:2120, preco:172.30, variacao1D:-0.42, variacao52s:+38.7,  pe:24.6, pb:7.1,  eps:7.00, dividendo:0.00, beta:1.05, volumeMedio:24100, margem:26.7, crescimentoReceita:+13.8, roe:30.6, divida:0.08, cotacao52sMax:207.05, cotacao52sMin:120.21 },
  { ticker:'AMZN',  nome:'Amazon.com Inc.',       sector:'Consumo',      pais:'🇺🇸', capitalMerc:2080, preco:198.90, variacao1D:+0.65, variacao52s:+45.2,  pe:41.2, pb:8.4,  eps:4.82, dividendo:0.00, beta:1.32, volumeMedio:36800, margem:8.6,  crescimentoReceita:+10.5, roe:21.2, divida:0.62, cotacao52sMax:242.52, cotacao52sMin:138.23 },
  { ticker:'META',  nome:'Meta Platforms Inc.',   sector:'Tecnologia',   pais:'🇺🇸', capitalMerc:1540, preco:610.20, variacao1D:+1.83, variacao52s:+62.4,  pe:28.4, pb:8.2,  eps:21.48, dividendo:0.50, beta:1.28, volumeMedio:14900, margem:38.5, crescimentoReceita:+18.5, roe:32.8, divida:0.27, cotacao52sMax:740.91, cotacao52sMin:373.76 },
  { ticker:'TSLA',  nome:'Tesla Inc.',            sector:'Automóvel',    pais:'🇺🇸', capitalMerc:1120, preco:352.56, variacao1D:-2.14, variacao52s:+84.2,  pe:108.7,pb:11.4, eps:3.24, dividendo:0.00, beta:2.31, volumeMedio:98700, margem:13.1, crescimentoReceita:+2.3,  roe:11.0, divida:0.18, cotacao52sMax:488.54, cotacao52sMin:138.80 },
  { ticker:'BRK.B', nome:'Berkshire Hathaway B',  sector:'Financeiro',   pais:'🇺🇸', capitalMerc:1040, preco:462.10, variacao1D:+0.21, variacao52s:+28.8,  pe:22.1, pb:1.6,  eps:20.91, dividendo:0.00, beta:0.58, volumeMedio:3800,  margem:17.2, crescimentoReceita:+4.8,  roe:7.4,  divida:0.45, cotacao52sMax:489.32, cotacao52sMin:352.64 },
  { ticker:'JPM',   nome:'JPMorgan Chase & Co.',  sector:'Financeiro',   pais:'🇺🇸', capitalMerc:820,  preco:278.40, variacao1D:+0.92, variacao52s:+42.1,  pe:13.4, pb:2.4,  eps:20.76, dividendo:2.18, beta:1.12, volumeMedio:9800,  margem:30.2, crescimentoReceita:+8.2,  roe:18.3, divida:1.43, cotacao52sMax:294.18, cotacao52sMin:182.35 },
  { ticker:'V',     nome:'Visa Inc.',             sector:'Financeiro',   pais:'🇺🇸', capitalMerc:615,  preco:296.80, variacao1D:+0.54, variacao52s:+22.6,  pe:29.8, pb:14.2, eps:9.95, dividendo:0.83, beta:0.92, volumeMedio:5900,  margem:53.4, crescimentoReceita:+9.8,  roe:47.8, divida:0.44, cotacao52sMax:352.62, cotacao52sMin:252.75 },
  { ticker:'NFLX',  nome:'Netflix Inc.',          sector:'Entretenimento',pais:'🇺🇸', capitalMerc:408,  preco:946.30, variacao1D:+4.12, variacao52s:+88.4,  pe:52.1, pb:19.8, eps:18.16, dividendo:0.00, beta:1.44, volumeMedio:3200,  margem:22.4, crescimentoReceita:+15.0, roe:40.5, divida:0.95, cotacao52sMax:1064.50,cotacao52sMin:443.54 },
  { ticker:'DIS',   nome:'Walt Disney Co.',       sector:'Entretenimento',pais:'🇺🇸', capitalMerc:198,  preco:108.40, variacao1D:-0.73, variacao52s:-8.4,   pe:42.8, pb:1.9,  eps:2.53, dividendo:0.00, beta:1.28, volumeMedio:11200, margem:5.8,  crescimentoReceita:+2.4,  roe:4.5,  divida:0.73, cotacao52sMax:123.74, cotacao52sMin:83.91 },
  { ticker:'ASML',  nome:'ASML Holding N.V.',     sector:'Tecnologia',   pais:'🇳🇱', capitalMerc:380,  preco:962.10, variacao1D:+1.52, variacao52s:-14.2,  pe:38.4, pb:14.2, eps:25.05, dividendo:1.12, beta:1.18, volumeMedio:1200,  margem:28.4, crescimentoReceita:+11.2, roe:38.2, divida:0.34, cotacao52sMax:1110.09,cotacao52sMin:663.04 },
  { ticker:'SAP',   nome:'SAP SE',                sector:'Tecnologia',   pais:'🇩🇪', capitalMerc:312,  preco:269.80, variacao1D:+0.84, variacao52s:+52.4,  pe:48.2, pb:7.8,  eps:5.60, dividendo:0.92, beta:0.82, volumeMedio:1800,  margem:16.4, crescimentoReceita:+9.4,  roe:16.8, divida:0.38, cotacao52sMax:280.32, cotacao52sMin:167.48 },
  { ticker:'LVMH',  nome:'LVMH Moët Hennessy',    sector:'Luxo',         pais:'🇫🇷', capitalMerc:298,  preco:596.30, variacao1D:-1.24, variacao52s:-22.4,  pe:21.4, pb:5.2,  eps:27.87, dividendo:2.88, beta:0.94, volumeMedio:890,   margem:21.2, crescimentoReceita:-2.1,  roe:24.8, divida:0.87, cotacao52sMax:810.60, cotacao52sMin:520.80 },
  { ticker:'NESN',  nome:'Nestlé S.A.',           sector:'Consumo',      pais:'🇨🇭', capitalMerc:245,  preco:84.20,  variacao1D:-0.34, variacao52s:-18.2,  pe:19.8, pb:5.4,  eps:4.25, dividendo:3.42, beta:0.52, volumeMedio:5400,  margem:11.2, crescimentoReceita:-2.4,  roe:28.4, divida:0.72, cotacao52sMax:106.84, cotacao52sMin:76.04 },
  { ticker:'NOVO',  nome:'Novo Nordisk A/S',      sector:'Saúde',        pais:'🇩🇰', capitalMerc:432,  preco:96.40,  variacao1D:+2.84, variacao52s:-24.2,  pe:28.4, pb:18.4, eps:3.39, dividendo:1.24, beta:0.42, volumeMedio:12400, margem:36.2, crescimentoReceita:+24.8, roe:72.4, divida:0.24, cotacao52sMax:138.87, cotacao52sMin:76.24 },
  { ticker:'MC',    nome:'LVMH (Paris)',          sector:'Luxo',         pais:'🇫🇷', capitalMerc:312,  preco:622.40, variacao1D:-0.82, variacao52s:-18.4,  pe:22.4, pb:5.4,  eps:27.78, dividendo:2.78, beta:0.92, volumeMedio:1240,  margem:20.8, crescimentoReceita:-2.4,  roe:23.8, divida:0.84, cotacao52sMax:841.40, cotacao52sMin:544.60 },
  { ticker:'ROG',   nome:'Roche Holding AG',      sector:'Saúde',        pais:'🇨🇭', capitalMerc:198,  preco:266.30, variacao1D:-0.42, variacao52s:-12.4,  pe:18.2, pb:8.2,  eps:14.63, dividendo:3.74, beta:0.42, volumeMedio:2100,  margem:24.8, crescimentoReceita:-8.4,  roe:44.2, divida:0.84, cotacao52sMax:320.40, cotacao52sMin:240.00 },
  { ticker:'2330',  nome:'TSMC ADR',              sector:'Tecnologia',   pais:'🇹🇼', capitalMerc:948,  preco:183.40, variacao1D:+2.14, variacao52s:+42.8,  pe:24.2, pb:8.8,  eps:7.58, dividendo:1.84, beta:1.08, volumeMedio:14200, margem:38.4, crescimentoReceita:+28.4, roe:37.4, divida:0.22, cotacao52sMax:226.40, cotacao52sMin:110.64 },
  { ticker:'BABA',  nome:'Alibaba Group',         sector:'Tecnologia',   pais:'🇨🇳', capitalMerc:212,  preco:82.40,  variacao1D:+4.82, variacao52s:+24.2,  pe:9.4,  pb:1.2,  eps:8.77, dividendo:0.00, beta:0.84, volumeMedio:24800, margem:18.4, crescimentoReceita:+5.4,  roe:12.8, divida:0.14, cotacao52sMax:117.82, cotacao52sMin:59.22 },
  { ticker:'JNJ',   nome:'Johnson & Johnson',     sector:'Saúde',        pais:'🇺🇸', capitalMerc:382,  preco:162.80, variacao1D:+0.12, variacao52s:+2.4,   pe:22.4, pb:5.8,  eps:7.27, dividendo:3.14, beta:0.54, volumeMedio:6800,  margem:18.2, crescimentoReceita:+3.8,  roe:26.4, divida:0.42, cotacao52sMax:175.18, cotacao52sMin:143.43 },
  { ticker:'PG',    nome:'Procter & Gamble Co.',  sector:'Consumo',      pais:'🇺🇸', capitalMerc:398,  preco:168.40, variacao1D:-0.24, variacao52s:+14.2,  pe:26.4, pb:8.4,  eps:6.38, dividendo:2.38, beta:0.48, volumeMedio:5400,  margem:18.8, crescimentoReceita:+3.4,  roe:32.4, divida:0.62, cotacao52sMax:175.71, cotacao52sMin:143.78 },
  { ticker:'XOM',   nome:'Exxon Mobil Corp.',     sector:'Energia',      pais:'🇺🇸', capitalMerc:548,  preco:128.40, variacao1D:-1.24, variacao52s:+8.4,   pe:14.8, pb:2.4,  eps:8.68, dividendo:3.42, beta:0.94, volumeMedio:14200, margem:11.4, crescimentoReceita:-4.2,  roe:15.8, divida:0.24, cotacao52sMax:143.58, cotacao52sMin:100.36 },
  { ticker:'CVX',   nome:'Chevron Corporation',   sector:'Energia',      pais:'🇺🇸', capitalMerc:278,  preco:152.40, variacao1D:-0.84, variacao52s:-4.2,   pe:13.4, pb:1.8,  eps:11.37, dividendo:4.24, beta:0.88, volumeMedio:8400,  margem:10.8, crescimentoReceita:-8.4,  roe:13.4, divida:0.18, cotacao52sMax:167.11, cotacao52sMin:130.09 },
]

export type FiltroScreener = {
  capitalMercMin?: number
  capitalMercMax?: number
  peMin?: number
  peMax?: number
  dividendoMin?: number
  variacaoMin?: number
  variacaoMax?: number
  betaMax?: number
  sector?: string
  pais?: string
}

export type OrdemScreener = keyof AccaoScreener
export type DirecaoOrdem = 'asc' | 'desc'

export function filtrarEOrdenar(
  acoes: AccaoScreener[],
  filtros: FiltroScreener,
  ordem: OrdemScreener,
  direccao: DirecaoOrdem
): AccaoScreener[] {
  let resultado = acoes.filter((a) => {
    if (filtros.capitalMercMin !== undefined && a.capitalMerc < filtros.capitalMercMin) return false
    if (filtros.capitalMercMax !== undefined && a.capitalMerc > filtros.capitalMercMax) return false
    if (filtros.peMin !== undefined && a.pe < filtros.peMin) return false
    if (filtros.peMax !== undefined && a.pe > filtros.peMax) return false
    if (filtros.dividendoMin !== undefined && a.dividendo < filtros.dividendoMin) return false
    if (filtros.variacaoMin !== undefined && a.variacao52s < filtros.variacaoMin) return false
    if (filtros.variacaoMax !== undefined && a.variacao52s > filtros.variacaoMax) return false
    if (filtros.betaMax !== undefined && a.beta > filtros.betaMax) return false
    if (filtros.sector && a.sector !== filtros.sector) return false
    if (filtros.pais && !a.pais.includes(filtros.pais)) return false
    return true
  })

  resultado.sort((a, b) => {
    const va = a[ordem] as number
    const vb = b[ordem] as number
    return direccao === 'asc' ? va - vb : vb - va
  })

  return resultado
}

export const PRESETS_SCREENER: { nome: string; icone: string; filtros: FiltroScreener; ordem: OrdemScreener }[] = [
  { nome: 'Value Picks',     icone: '💎', filtros: { peMax: 20, dividendoMin: 1.5 },            ordem: 'pe' },
  { nome: 'Growth Leaders',  icone: '🚀', filtros: {},                                          ordem: 'crescimentoReceita' },
  { nome: 'Dividend Kings',  icone: '👑', filtros: { dividendoMin: 2.5 },                        ordem: 'dividendo' },
  { nome: 'Mega Cap',        icone: '🏔', filtros: { capitalMercMin: 500 },                      ordem: 'capitalMerc' },
  { nome: 'Low Volatility',  icone: '🛡', filtros: { betaMax: 0.7 },                             ordem: 'beta' },
  { nome: 'Momentum 52s',    icone: '📈', filtros: { variacaoMin: 20 },                          ordem: 'variacao52s' },
]
