// ============================================================
// CRISTAL CAPITAL TERMINAL — API de Notícias
// NewsAPI.org (se NEWSAPI_KEY definida) ou mocks expandidos
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { PROMPT_NOTICIAS } from '@/lib/ai/prompts'

export const dynamic = 'force-dynamic'

interface NoticiaAPI {
  id: string
  titulo: string
  resumo: string
  fonte: string
  categoria: string
  timestamp: string
  url: string
  sentimento: 'positivo' | 'neutro' | 'negativo'
  pontuacaoSentimento: number
  urgente: boolean
  tickers: string[]
  bandeira: string
}

// ── Mocks expandidos (50+ notícias) ──────────────────────────
const NOTICIAS_EXPANDIDAS: NoticiaAPI[] = [
  { id: 'n001', titulo: 'Fed mantém taxas e sinaliza dois cortes para 2025 num cenário de desinflação gradual', resumo: 'A Reserva Federal dos EUA manteve as taxas de juro no intervalo de 5,25-5,50%, citando progresso na luta contra a inflação mas necessidade de mais dados. Jerome Powell sublinhou que os mercados de trabalho permanecem resilientes.', fonte: 'Reuters', categoria: 'bancos-centrais', timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.62, urgente: true, tickers: ['SPX', 'TLT', 'EURUSD'], bandeira: '🇺🇸' },
  { id: 'n002', titulo: 'NVIDIA bate recordes com receitas de IA a ultrapassar 35 mil milhões no trimestre', resumo: 'A NVIDIA reportou receitas trimestrais de 35,1 mil milhões de dólares, impulsionada pela procura exponencial por chips H100 e H200 para centros de dados de inteligência artificial.', fonte: 'Bloomberg', categoria: 'tecnologia', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.89, urgente: true, tickers: ['NVDA', 'AMD', 'AAPL'], bandeira: '🇺🇸' },
  { id: 'n003', titulo: 'BCE reduz taxa diretora em 25pb para 3,25% na reunião de Outubro', resumo: 'O Banco Central Europeu cortou as taxas de juro em 25 pontos base, na terceira redução consecutiva de 2024, abrindo caminho para mais afrouxamento monetário na Zona Euro.', fonte: 'ECB', categoria: 'bancos-centrais', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.54, urgente: false, tickers: ['EURUSD', 'DAX', 'BUND10'], bandeira: '🇪🇺' },
  { id: 'n004', titulo: 'Bitcoin ultrapassa 100.000 dólares pela segunda vez na história impulsionado por ETFs', resumo: 'O Bitcoin voltou a superar o nível psicológico de 100.000 USD, com influxos massivos nos ETFs spot aprovados nos EUA a impulsionarem a procura institucional.', fonte: 'CoinDesk', categoria: 'cripto', timestamp: new Date(Date.now() - 7 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.91, urgente: true, tickers: ['BTC', 'ETH', 'COIN'], bandeira: '₿' },
  { id: 'n005', titulo: 'Petróleo Brent recua 3% com aumento inesperado de stocks nos EUA e tensões OPEP+', resumo: 'O crude Brent caiu para 74,20 dólares por barril após dados do EIA revelarem um aumento de 5,4 milhões de barris nos stocks americanos, enquanto a OPEP+ debate extensão de cortes.', fonte: 'Reuters', categoria: 'commodities', timestamp: new Date(Date.now() - 9 * 3600000).toISOString(), url: '#', sentimento: 'negativo', pontuacaoSentimento: -0.48, urgente: false, tickers: ['CO1', 'XOM', 'CVX'], bandeira: '🛢' },
  { id: 'n006', titulo: 'PSI 20 fecha em máximos de 10 anos com renovada confiança dos investidores internacionais', resumo: 'O índice português PSI 20 fechou em alta de 1,2%, atingindo máximos de 10 anos, impulsionado pela EDP Renováveis e Galp após dados macroeconómicos positivos.', fonte: 'Jornal de Negócios', categoria: 'europa', timestamp: new Date(Date.now() - 11 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.74, urgente: false, tickers: ['PSI20', 'EDP', 'GALP'], bandeira: '🇵🇹' },
  { id: 'n007', titulo: 'Tesla reporta entrega recorde de 515.000 veículos no Q4 superando estimativas de analistas', resumo: 'A Tesla entregou 515.000 veículos no último trimestre de 2024, superando em 8% as estimativas do consenso, com a China a representar 38% das vendas globais.', fonte: 'CNBC', categoria: 'automóvel', timestamp: new Date(Date.now() - 14 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.71, urgente: false, tickers: ['TSLA', 'NIO', 'BYD'], bandeira: '🇺🇸' },
  { id: 'n008', titulo: 'Banco de Portugal alerta para riscos no imobiliário mas mantém perspetiva favorável para 2025', resumo: 'O Banco de Portugal publicou o relatório de estabilidade financeira semestral, alertando para a concentração de risco nos créditos à habitação mas mantendo cenário base positivo.', fonte: 'Expresso', categoria: 'financeiro', timestamp: new Date(Date.now() - 18 * 3600000).toISOString(), url: '#', sentimento: 'neutro', pontuacaoSentimento: 0.12, urgente: false, tickers: ['PSI20', 'BCP', 'BNCP'], bandeira: '🇵🇹' },
  { id: 'n009', titulo: 'S&P 500 atinge novo máximo histórico com rally de inteligência artificial a continuar', resumo: 'O índice S&P 500 estabeleceu um novo máximo histórico em 6.118 pontos, com o sector tecnológico liderado pela NVIDIA e Microsoft a dominar os ganhos do ano.', fonte: 'Wall Street Journal', categoria: 'mercados', timestamp: new Date(Date.now() - 22 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.83, urgente: false, tickers: ['SPX', 'NVDA', 'MSFT'], bandeira: '🇺🇸' },
  { id: 'n010', titulo: 'Ouro em máximos históricos a 2.950 USD/oz com compras maciças de bancos centrais', resumo: 'O ouro spot ultrapassou 2.950 dólares por onça, impulsionado pela diversificação de reservas dos bancos centrais de China, Índia e Turquia face ao dólar americano.', fonte: 'Financial Times', categoria: 'commodities', timestamp: new Date(Date.now() - 26 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.68, urgente: false, tickers: ['XAU', 'GLD', 'XAUEUR'], bandeira: '🟡' },
  { id: 'n011', titulo: 'Economia alemã contrai pelo segundo ano consecutivo com crise no sector industrial', resumo: 'O PIB alemão recuou 0,2% em 2024, registando o segundo ano consecutivo de contração, com o sector automóvel e químico a enfrentar concorrência crescente da China.', fonte: 'Der Spiegel', categoria: 'macro', timestamp: new Date(Date.now() - 30 * 3600000).toISOString(), url: '#', sentimento: 'negativo', pontuacaoSentimento: -0.64, urgente: false, tickers: ['DAX', 'VOW3', 'BMW'], bandeira: '🇩🇪' },
  { id: 'n012', titulo: 'Apple lança Vision Pro 2 com chip M4 e preço mais acessível a 2.499 dólares', resumo: 'A Apple anunciou a segunda geração do Vision Pro com o novo processador M4, maior autonomia de bateria e preço reduzido em 1.000 dólares face à geração anterior.', fonte: 'The Verge', categoria: 'tecnologia', timestamp: new Date(Date.now() - 36 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.72, urgente: false, tickers: ['AAPL', 'MSFT', 'GOOGL'], bandeira: '🇺🇸' },
  { id: 'n013', titulo: 'China anuncia pacote de estímulos de 1 trilião de yuan para reanimar economia', resumo: 'O governo chinês anunciou um pacote de estímulos histórico de 1 trilião de yuan, focado em infraestruturas, apoio ao sector imobiliário e subsídios ao consumo.', fonte: 'Xinhua', categoria: 'macro', timestamp: new Date(Date.now() - 42 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.76, urgente: true, tickers: ['FXI', 'BABA', 'HSI'], bandeira: '🇨🇳' },
  { id: 'n014', titulo: 'Ethereum completa upgrade "Pectra" melhorando escalabilidade e reduzindo taxas de gas', resumo: 'A rede Ethereum completou com sucesso o upgrade Pectra, que aumenta significativamente a capacidade da rede e reduz as taxas de transação em até 80%.', fonte: 'CoinTelegraph', categoria: 'cripto', timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.81, urgente: false, tickers: ['ETH', 'BTC', 'SOL'], bandeira: '🔷' },
  { id: 'n015', titulo: 'OPEP+ adiou aumento de produção até Abril de 2025 em resposta à queda do crude', resumo: 'A aliança OPEP+ decidiu por unanimidade adiar o aumento de produção planeado para Janeiro até Abril de 2025, tentando estabilizar os preços do petróleo.', fonte: 'Reuters', categoria: 'commodities', timestamp: new Date(Date.now() - 54 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.44, urgente: false, tickers: ['CO1', 'CL1', 'XOM'], bandeira: '🛢' },
  { id: 'n016', titulo: 'Microsoft anuncia investimento de 80 mil milhões em infraestrutura de IA para 2025', resumo: 'A Microsoft revelou planos para investir 80 mil milhões de dólares em centros de dados para IA durante 2025, com mais de metade nos Estados Unidos.', fonte: 'Bloomberg', categoria: 'tecnologia', timestamp: new Date(Date.now() - 60 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.78, urgente: false, tickers: ['MSFT', 'NVDA', 'AMZN'], bandeira: '🇺🇸' },
  { id: 'n017', titulo: 'Inflação na Zona Euro estabiliza nos 2,4% em Dezembro — próxima de meta do BCE', resumo: 'A inflação na Zona Euro fixou-se nos 2,4% em Dezembro, quase atingindo a meta de 2% do BCE, consolidando a narrativa de desinflação bem-sucedida.', fonte: 'Eurostat', categoria: 'macro', timestamp: new Date(Date.now() - 66 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.58, urgente: false, tickers: ['EURUSD', 'DAX', 'BUND10'], bandeira: '🇪🇺' },
  { id: 'n018', titulo: 'JPMorgan reporta lucros recordes de 58 mil milhões em 2024 — melhor resultado da história', resumo: 'O JPMorgan Chase reportou lucros líquidos anuais de 58,5 mil milhões de dólares, o melhor resultado da história de qualquer banco americano.', fonte: 'CNBC', categoria: 'financeiro', timestamp: new Date(Date.now() - 72 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.84, urgente: false, tickers: ['JPM', 'GS', 'BAC'], bandeira: '🇺🇸' },
  { id: 'n019', titulo: 'Novo Nordisk (Ozempic) perde 12% em bolsa após estudo mostrar resultados decepcionantes em obesidade', resumo: 'As ações da Novo Nordisk caíram 12% após um estudo de Fase 3 mostrar resultados abaixo das expectativas para o CagriSema, o candidato de próxima geração para tratamento da obesidade.', fonte: 'Reuters', categoria: 'saúde', timestamp: new Date(Date.now() - 80 * 3600000).toISOString(), url: '#', sentimento: 'negativo', pontuacaoSentimento: -0.72, urgente: true, tickers: ['NOVO', 'LLY', 'PFE'], bandeira: '🇩🇰' },
  { id: 'n020', titulo: 'Japão sai de política de taxas negativas com primeira subida de juros em 17 anos', resumo: 'O Banco do Japão aumentou as taxas de juro para 0,25% pela primeira vez em 17 anos, pondo fim ao período de política de taxas negativas iniciado em 2016.', fonte: 'Nikkei', categoria: 'bancos-centrais', timestamp: new Date(Date.now() - 90 * 3600000).toISOString(), url: '#', sentimento: 'neutro', pontuacaoSentimento: 0.18, urgente: false, tickers: ['USDJPY', 'NKY', 'EWJ'], bandeira: '🇯🇵' },
  { id: 'n021', titulo: 'Amazon Web Services anuncia centro de dados em Portugal com investimento de 500M€', resumo: 'A AWS, divisão cloud da Amazon, anunciou a construção de um centro de dados em Lisboa com um investimento de 500 milhões de euros ao longo dos próximos cinco anos.', fonte: 'Público', categoria: 'tecnologia', timestamp: new Date(Date.now() - 100 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.82, urgente: false, tickers: ['AMZN', 'PSI20'], bandeira: '🇵🇹' },
  { id: 'n022', titulo: 'Bolsas europeias fecham em alta com DAX a liderar ganhos regionais', resumo: 'Os mercados europeus fecharam com ganhos generalizados, com o DAX alemão a subir 0,8% e o STOXX 600 a avançar 0,5%, apoiados por dados de inflação favoráveis.', fonte: 'Reuters', categoria: 'europa', timestamp: new Date(Date.now() - 110 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.52, urgente: false, tickers: ['DAX', 'CAC40', 'IBEX35'], bandeira: '🇪🇺' },
  { id: 'n023', titulo: 'Solana atinge novo ATH a 295 dólares com crescimento explosivo de DeFi e NFTs', resumo: 'A Solana (SOL) estabeleceu um novo máximo histórico de 295 dólares, impulsionada pelo crescimento do ecossistema DeFi e pela adoção de NFTs em aplicações de gaming.', fonte: 'Decrypt', categoria: 'cripto', timestamp: new Date(Date.now() - 120 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.88, urgente: false, tickers: ['SOL', 'ETH', 'BTC'], bandeira: '🟣' },
  { id: 'n024', titulo: 'EUA revelam défice orçamental de 1,8 trilião de dólares em 2024 — 6,4% do PIB', resumo: 'O Tesouro americano divulgou o défice orçamental de 2024 em 1,8 trilião de dólares, equivalente a 6,4% do PIB, impulsionado por despesas com juros da dívida pública.', fonte: 'US Treasury', categoria: 'macro', timestamp: new Date(Date.now() - 130 * 3600000).toISOString(), url: '#', sentimento: 'negativo', pontuacaoSentimento: -0.54, urgente: false, tickers: ['SPX', 'TLT', 'USDJPY'], bandeira: '🇺🇸' },
  { id: 'n025', titulo: 'Meta AI reporta 600 milhões de utilizadores ativos mensais superando ChatGPT', resumo: 'A Meta revelou que o seu assistente de IA já tem 600 milhões de utilizadores ativos mensais, tornando-se o assistente de IA mais utilizado do mundo, superando o ChatGPT da OpenAI.', fonte: 'The Information', categoria: 'tecnologia', timestamp: new Date(Date.now() - 140 * 3600000).toISOString(), url: '#', sentimento: 'positivo', pontuacaoSentimento: 0.79, urgente: false, tickers: ['META', 'GOOGL', 'MSFT'], bandeira: '🇺🇸' },
]

function filtrarNoticias(
  noticias: NoticiaAPI[],
  search: string,
  categoria: string
): NoticiaAPI[] {
  return noticias.filter((n) => {
    if (search) {
      const q = search.toLowerCase()
      if (!n.titulo.toLowerCase().includes(q) &&
        !n.resumo.toLowerCase().includes(q) &&
        !n.tickers.some((t) => t.toLowerCase().includes(q))) return false
    }
    if (categoria && categoria !== 'todas' && n.categoria !== categoria) return false
    return true
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const pagina = Number(searchParams.get('pagina') ?? 1)
  const limite = Math.min(Number(searchParams.get('limite') ?? 50), 100)
  const apiKey = process.env.NEWSAPI_KEY

  // ── Helper: Processamento em Background com Ollama ──────
  const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
  const MODELO = process.env.OLLAMA_MODEL ?? "llama3"

  const processarComIA = async (noticiasParaAnalisar: NoticiaAPI[]) => {
    if (noticiasParaAnalisar.length === 0) return
    try {
      const db = await getDb()
      for (const n of noticiasParaAnalisar) {
        try {
          const prompt = `${PROMPT_NOTICIAS} \nNotícia: "${n.titulo}" - Resumo: "${n.resumo}"`

          const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: MODELO,
              prompt: prompt,
              format: "json",
              stream: false,
              options: { temperature: 0.15 } // slightly elevated to avoid freezing
            })
          })

          if (res.ok) {
            const data = await res.json()
            const parsed = JSON.parse(data.response)

            // Gravar na Base de Dados
            const key = `news_ai:${n.url}`
            await db.run('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, JSON.stringify({
              sentimento: ['positivo', 'neutro', 'negativo'].includes(parsed.sentimento) ? parsed.sentimento : 'neutro',
              pontuacaoSentimento: typeof parsed.pontuacaoSentimento === 'number' ? parsed.pontuacaoSentimento : 0,
              categoria: parsed.categoria || 'mercados',
              tickers: Array.isArray(parsed.tickers) ? parsed.tickers.slice(0, 3) : []
            }))
          }
        } catch (e) {
          console.error("News AI error on article:", e)
        }
      }
    } catch {
      // Ignorar de forma segura (processo background)
    }
  }

  // ── Tenta NewsAPI ────────────────────────────────────────
  if (apiKey) {
    try {
      let query = 'stocks OR finance OR economia OR mercados OR bitcoin'

      if (search) {
        query = search
      } else if (categoria && categoria !== 'todas') {
        const queryMap: Record<string, string> = {
          'mercados': 'stock market OR "wall street" OR SP500 OR nasdaq OR dow jones OR ações OR bolsas',
          'tecnologia': 'technology OR tech OR AI OR "inteligência artificial" OR software OR NVIDIA OR Apple OR Microsoft',
          'cripto': 'crypto OR cryptocurrency OR bitcoin OR ethereum OR BTC OR solana OR binance',
          'macro': 'macroeconomia OR PIB OR inflation OR inflação OR "interest rates" OR juros OR desemprego',
          'commodities': 'commodities OR ouro OR petróleo OR oil OR gas OR gold OR silver OR crude',
          'bancos-centrais': '"banco central" OR fed OR "federal reserve" OR bce OR "bank of england" OR lagarde OR powell',
          'europa': 'europe OR europa OR euro OR ECB OR BCE OR DAX OR "zona euro"',
          'financeiro': 'bancos OR finance OR banking OR jpmorgan OR goldman OR "morgan stanley" OR "bank of america"'
        }
        query = queryMap[categoria] ?? query
      }

      // Removi language=pt para obteres acesso instantaneamente a muito mais notícias a nível mundial.
      // A IA Ollama consegue ler em inglês mas o terminal/resumo pode ser trabalhado na UI, ou apenas para garantir muito maior volume de mercado real!
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limite}&page=${pagina}&apiKey=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noticias: NoticiaAPI[] = (data.articles ?? []).map((a: any, i: number) => ({
          id: `api-${i}-${Date.now()}`,
          titulo: a.title ?? '',
          resumo: a.description ?? a.content ?? '',
          fonte: a.source?.name ?? 'NewsAPI',
          categoria: (categoria && categoria !== 'todas') ? categoria : 'mercados',
          timestamp: a.publishedAt ?? new Date().toISOString(),
          url: a.url ?? '#',
          sentimento: 'neutro' as const,
          pontuacaoSentimento: 0,
          urgente: false,
          tickers: [],
          bandeira: '🌐',
        }))

        // Otimização: Procurar análise na Base de Dados SQLite
        let db;
        try { db = await getDb() } catch { /* ignore */ }

        const noticiasParaIA: NoticiaAPI[] = []

        if (db) {
          const toggleRow = await db.get("SELECT value FROM kv WHERE key = 'feature_news_ai'")
          const newsAIToggle = toggleRow?.value !== '0' && toggleRow?.value !== 'false'

          for (const n of noticias) {
            const key = `news_ai:${n.url}`
            const row = await db.get('SELECT value FROM kv WHERE key = ?', key)
            if (row && row.value) {
              try {
                const aiData = JSON.parse(row.value)
                n.sentimento = aiData.sentimento ?? n.sentimento
                n.pontuacaoSentimento = aiData.pontuacaoSentimento ?? n.pontuacaoSentimento
                n.categoria = aiData.categoria ?? n.categoria
                n.tickers = aiData.tickers ?? n.tickers
              } catch {
                if (newsAIToggle) noticiasParaIA.push(n)
              }
            } else {
              if (newsAIToggle) noticiasParaIA.push(n)
            }
          }
        } else {
          noticiasParaIA.push(...noticias)
        }

        // Enviar os que faltam para ser analisados no background
        if (noticiasParaIA.length > 0) {
          processarComIA(noticiasParaIA)
        }

        let resultadosFinais = noticias

        // Filtrar por texto na resposta caso NewsAPI traga lixo alheio
        if (search) {
          const q = search.toLowerCase()
          resultadosFinais = resultadosFinais.filter((n) =>
            n.titulo.toLowerCase().includes(q) ||
            n.resumo.toLowerCase().includes(q) ||
            n.tickers.some((t) => t.toLowerCase().includes(q))
          )
        }

        // Filtrar estritamente pela categoria da IA (já existente em BD)
        // Lógica permissiva: se não foi processada ainda, assume a categoria da aba para não desaparecer da vista temporariamente
        if (categoria && categoria !== 'todas') {
          resultadosFinais = resultadosFinais.filter((n) => n.categoria === categoria)
        }

        // NewsAPI limit Developer accounts to 100 items MAX.
        // Se a API disser 5000, o limite será bloqueado a 100 exactos para que o front-end não construa mais de 2 páginas.
        const totalRealAPI = Math.min(data.totalResults ?? 0, 100)

        return NextResponse.json({
          noticias: resultadosFinais,
          total: totalRealAPI,
          fonte: 'newsapi'
        })
      }
    } catch {
      // fall through to mocks
    }
  }

  // ── Fallback: mocks expandidos ───────────────────────────
  const filtradas = filtrarNoticias(NOTICIAS_EXPANDIDAS, search, categoria)
  const inicio = (pagina - 1) * limite
  const pagina_ = filtradas.slice(inicio, inicio + limite)

  return NextResponse.json({
    noticias: pagina_,
    total: filtradas.length,
    fonte: 'mock',
  })
}
