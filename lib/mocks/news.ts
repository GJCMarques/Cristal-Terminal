// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock de Notícias Financeiras (PT-PT)
// ============================================================

import type { Noticia, CategoriaNoticia, Sentimento } from '../../types/market'

const NOTICIAS_BASE: Omit<Noticia, 'id' | 'sentimento' | 'pontuacaoSentimento'>[] = [
  {
    titulo: 'Fed mantém taxas de juro inalteradas pela terceira reunião consecutiva',
    resumo:
      'A Reserva Federal norte-americana optou por manter as taxas de juro no intervalo de 4,25%-4,50%, aguardando dados adicionais de inflação antes de iniciar ciclo de cortes.',
    fonte: 'Reuters',
    timestamp: horasAtras(0.5),
    tickers: ['SPX', 'UST10', 'USDJPY', 'EURUSD'],
    categoria: 'macro',
    urgente: true,
  },
  {
    titulo: 'BCE sinaliza possível redução de 25pb nas taxas em Março',
    resumo:
      'Christine Lagarde indicou que o Banco Central Europeu está em posição de reduzir os juros directores em 25 pontos base na próxima reunião, condicionado à evolução do IPC da zona euro.',
    fonte: 'Cristal Capital News',
    timestamp: horasAtras(1.2),
    tickers: ['EURUSD', 'BUND10', 'OT10', 'DAX'],
    categoria: 'macro',
    urgente: false,
  },
  {
    titulo: 'NVIDIA bate recordes: receitas sobem 78% impulsionadas por chips IA',
    resumo:
      'A NVIDIA reportou receitas de $39,3 mil milhões no Q4 FY2025, superando as estimativas em 12%. As vendas de centros de dados cresceram 93% homólogo, impulsionadas pela procura de GPUs H200 para IA.',
    fonte: 'Bloomberg Intelligence',
    timestamp: horasAtras(2),
    tickers: ['NVDA', 'NDX', 'MSFT', 'GOOGL'],
    categoria: 'empresa',
    urgente: true,
  },
  {
    titulo: 'PSI 20 fecha em máximo de três meses apoiado pelo sector bancário',
    resumo:
      'O PSI 20 valorizou 1,14% para 6.832 pontos, com destaque para o BCP (+2,3%) e a NOS (+1,8%). O volume de negociação ficou acima da média de 30 dias.',
    fonte: 'Jornal de Negócios',
    timestamp: horasAtras(3),
    tickers: ['PSI20'],
    categoria: 'mercado',
  },
  {
    titulo: 'Petróleo Brent cai abaixo dos $74 após dados de inventário EUA',
    resumo:
      'Os inventários de crude americano subiram 4,3 milhões de barris na semana passada, acima dos 1,2 milhões esperados. O Brent recuou 1,8% para $73,85/barril.',
    fonte: 'Platts',
    timestamp: horasAtras(3.5),
    tickers: ['CO1', 'CL1', 'XAU'],
    categoria: 'commodities',
  },
  {
    titulo: 'Apple anuncia recompra de acções de $110 mil milhões',
    resumo:
      'Tim Cook anunciou um novo programa de recompra de acções no valor de $110 mil milhões, o maior da história da empresa. As acções subiram 3,2% em after-hours.',
    fonte: 'CNBC',
    timestamp: horasAtras(4),
    tickers: ['AAPL', 'NDX'],
    categoria: 'empresa',
  },
  {
    titulo: 'Ouro atinge novo máximo histórico a $2.932/oz',
    resumo:
      'O ouro spot atingiu $2.932 por onça troy, impulsionado pela incerteza geopolítica e pela procura de activos de refúgio. Os ETFs de ouro registaram entradas de $2,1 mil milhões na semana.',
    fonte: 'World Gold Council',
    timestamp: horasAtras(5),
    tickers: ['XAU', 'EURUSD', 'UST10'],
    categoria: 'commodities',
    urgente: false,
  },
  {
    titulo: 'EUR/USD estabiliza a 1,0823 antes de dados de PMI da zona euro',
    resumo:
      'O euro manteve-se relativamente estável face ao dólar, consolidando os ganhos recentes. Os mercados aguardam os dados do PMI composto da zona euro agendados para amanhã.',
    fonte: 'Forex Factory',
    timestamp: horasAtras(5.5),
    tickers: ['EURUSD', 'EURGBP', 'DAX'],
    categoria: 'mercado',
  },
  {
    titulo: 'Tesla reporta queda de 19% nas entregas no Q1 2026',
    resumo:
      'A Tesla entregou 336.681 veículos no primeiro trimestre, uma queda de 19% face ao mesmo período do ano anterior. A empresa atribui a queda a paragens de produção para actualizações das linhas de montagem.',
    fonte: 'Reuters',
    timestamp: horasAtras(6),
    tickers: ['TSLA', 'NDX'],
    categoria: 'empresa',
  },
  {
    titulo: 'Banco de Portugal revê em alta previsão do PIB para 2026',
    resumo:
      'O Banco de Portugal actualizou as previsões macroeconómicas, projectando crescimento do PIB de 2,3% em 2026, acima dos 2,0% previstos anteriormente, apoiado pelo turismo e exportações.',
    fonte: 'Banco de Portugal',
    timestamp: horasAtras(7),
    tickers: ['PSI20', 'OT10', 'EURUSD'],
    categoria: 'macro',
  },
  {
    titulo: 'DAX 40 supera 22.400 pontos com resultados positivos do sector automóvel',
    resumo:
      'O índice alemão atingiu novos máximos históricos, impulsionado pela Volkswagen (+4,1%) e BMW (+3,2%) após anúncios de reestruturação e cortes de custos superiores ao esperado.',
    fonte: 'Handelsblatt',
    timestamp: horasAtras(8),
    tickers: ['DAX', 'EURUSD'],
    categoria: 'mercado',
  },
  {
    titulo: 'Microsoft expande parceria com OpenAI com investimento adicional de $5MM',
    resumo:
      'A Microsoft anunciou investimento adicional de $5 mil milhões na OpenAI, reforçando a integração da IA Copilot em todo o ecossistema Microsoft 365. As acções sobem 2,1%.',
    fonte: 'Wall Street Journal',
    timestamp: horasAtras(9),
    tickers: ['MSFT', 'NDX', 'SPX'],
    categoria: 'empresa',
  },
  {
    titulo: 'Bitcoin consolida acima de $95.000 após aprovação de ETF spot no Brasil',
    resumo:
      'A CVM brasileira aprovou o primeiro ETF de Bitcoin spot do país. O BTC valorizou 4,2% para $95.800, arrastando altcoins em alta generalizada.',
    fonte: 'CoinDesk',
    timestamp: horasAtras(10),
    tickers: ['BTC'],
    categoria: 'cripto',
  },
  {
    titulo: 'FMI alerta para riscos de fragmentação do comércio global',
    resumo:
      'O Fundo Monetário Internacional publicou nota de alerta sobre a crescente fragmentação do comércio global, que poderia custar até 7% do PIB mundial em caso de blocos económicos separados.',
    fonte: 'FMI',
    timestamp: horasAtras(12),
    tickers: ['SPX', 'EURUSD', 'USDJPY'],
    categoria: 'macro',
  },
  {
    titulo: 'Rendas de habitação em Lisboa sobem 8,2% em Janeiro — INE',
    resumo:
      'O Instituto Nacional de Estatística divulgou que o índice de rendas de habitação aumentou 8,2% em Lisboa e 7,4% no Porto em Janeiro de 2026 face ao mesmo mês do ano anterior.',
    fonte: 'INE Portugal',
    timestamp: horasAtras(14),
    tickers: ['PSI20'],
    categoria: 'macro',
  },
]

// Sentimento pré-calculado (simulando análise da IA)
const SENTIMENTOS_PRE: { sentimento: Sentimento; pontuacao: number }[] = [
  { sentimento: 'neutro',    pontuacao: 0.1 },
  { sentimento: 'positivo',  pontuacao: 0.6 },
  { sentimento: 'positivo',  pontuacao: 0.85 },
  { sentimento: 'positivo',  pontuacao: 0.7 },
  { sentimento: 'negativo',  pontuacao: -0.6 },
  { sentimento: 'positivo',  pontuacao: 0.75 },
  { sentimento: 'positivo',  pontuacao: 0.5 },
  { sentimento: 'neutro',    pontuacao: 0.05 },
  { sentimento: 'negativo',  pontuacao: -0.7 },
  { sentimento: 'positivo',  pontuacao: 0.6 },
  { sentimento: 'positivo',  pontuacao: 0.65 },
  { sentimento: 'positivo',  pontuacao: 0.55 },
  { sentimento: 'positivo',  pontuacao: 0.45 },
  { sentimento: 'negativo',  pontuacao: -0.4 },
  { sentimento: 'neutro',    pontuacao: -0.1 },
]

export const NOTICIAS_MOCK: Noticia[] = NOTICIAS_BASE.map((n, i) => ({
  ...n,
  id: `noticia-${i + 1}`,
  sentimento: SENTIMENTOS_PRE[i]?.sentimento ?? 'neutro',
  pontuacaoSentimento: SENTIMENTOS_PRE[i]?.pontuacao ?? 0,
}))

/** Filtra notícias por ticker */
export function filtrarNoticiasPorTicker(ticker: string): Noticia[] {
  return NOTICIAS_MOCK.filter((n) => n.tickers.includes(ticker.toUpperCase()))
}

/** Filtra notícias por categoria */
export function filtrarNoticiasPorCategoria(cat: CategoriaNoticia): Noticia[] {
  return NOTICIAS_MOCK.filter((n) => n.categoria === cat)
}

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 3_600_000).toISOString()
}
