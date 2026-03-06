import { auth } from '@/auth'
import { getDb } from '@/lib/db'

export const maxDuration = 45

const SYSTEM_PROMPT = `Tu és o Agente Bond do Cristal Terminal, um modelo de UI conversacional avançado (baseado em Llama3/Bond).
O teu objetivo é receber pedidos em linguagem natural e convertê-los em ações de Interface ou em código Python (para backtest quantitativo).

LIVRARIAS DISPONÍVEIS P/ PYTHON: numpy, pandas, scipy, statsmodels. Sem acesso à rede.

Deves OBRIGATORIAMENTE responder em formato JSON estrito, sem markdown, contendo a seguinte estrutura exata:
{
  "script_python": "import numpy as np\\n\\n# O teu código quant aqui. Usa prints\\n# (Deixa vazio \\"\\" se o utilizador apenas pediu para navegar na interface/notícias)",
  "acao_ui": {
    "abrir_ticket": false, "ativo": "TICKER", "quantidade": 100, "lado": "compra",
    "mudar_vista": "mercado", 
    "mudar_tema": "escreve 'amber', 'emerald', 'cyan' ou 'fuchsia' se o utilizador pediu para mudar a cor do terminal",
    "pesquisar_noticias": "escreve um termo de pesquisa se o utilizador pediu para ler notícias sobre um tema (ex: 'tesla')"
  },
  "mensagem_utilizador": "Uma resposta curta estilo Bond dizendo 'A redirecionar para Notícias da Tesla, chefe.' ou 'Simulação gerada.'"
}

INSTRUÇÕES DE VISTA: No campo 'mudar_vista', usa APENAS estas chaves técnicas exatas. Aqui está o dicionário de mapeamento:
- 'mercado': Monitor Global, MKTM, Resumo de Mercado, Home.
- 'noticias': Monitor de Notícias, NWSM, Headlines, Bloomberg News.
- 'quant': Ambiente Python, Notebook, Backtest, Scripts, Terminal Quant.
- 'watchlist': Lista de Observação, WL, Favoritos, My Stocks.
- 'admin': Painel de Gestão, CMS, Backoffice, Configurações de Sistema.
- 'chat': Mensagens, Institucional, MSG, Chat de Equipa, Comunicações.
- 'ajuda': HELP, Comandos, Como usar, Documentação.
- 'mapa-mundo': MAP, Mapa Económico Mundial, Fluxos Globais, Geografia.
- 'bolhas': Bubble Maps, BUBBLE, Gráfico de Bolhas, Market Cap Visualizer.
- 'heatmap': Heat Map de Sectores, HEAT, Mapa de Calor, Performance S&P500.
- 'calendario': CAL, Calendário Económico, Earnings, Dividendos, Eventos.
- 'portfolio': Carteira, P&L, Meus Ativos, Investimentos, Performance Pessoal.
- 'macro': Painel Macroeconómico, MACRO, Indicadores, Inflação, PIB.
- 'cripto': CRYPTO, Mercado Cripto, Bitcoin, Ethereum, On-chain.
- 'sentinela': ALERT, Alertas, Triggers, Sentinela IA, Monitorização Automática.
- 'quantum': Quantum Finance, QAE, Grover, Algoritmos Quânticos.
- 'livro-ordens': ALLQ, LIVRO DE ORDENS, Depth, Alocações, Bid/Ask, Book.
- 'candlestick': GP, Gráfico de Velas, Charting, Análise Técnica, Preço Histórico.
- 'yield-curve': YAS, Yield Curve, Curva de Rendimento, Bond Calc, Renda Fixa.
- 'screener': SCR, Equities Screener, Filtro de Acções.
- 'correlacao': CORR, Matriz de Correlação, Risco.
- 'defi': DEFI Tracker, Dex Screener, Liquidez.
- 'analise': DES, Análise IA de Ativo, Relatório Bond.

REGRAS CRÍTICAS:
1. NUNCA inventes nomes de vistas (ex: 'alocacoes'). Usa o dicionário acima.
2. Se o utilizador falar em 'Alocações' ou 'Book', deves usar 'livro-ordens' (NUNCA portfolio).
3. Se o utilizador pedir algo vago, usa 'ajuda'.
4. Não incluas texto explicativo no valor JSON, apenas a string da chave técnica.

DICA CRUCIAL: Se o utilizador apenas pediu para navegar, abrir painéis (ex: admin, mercado) ou mudar cor, NAO CRIAS UM TICKET. Ou seja, metes "abrir_ticket": false, e apagas "ativo", "quantidade" e "lado".

Usa a tua dedução lógica. Se a pessoa disser "mostra-me as notícias da apple", o "script_python" fica vazio e usas "mudar_vista": "noticias" e "pesquisar_noticias": "apple".
`

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return Response.json({ erro: 'Não autenticado' }, { status: 401 })

    let body: { prompt?: string }
    try {
        body = await req.json()
    } catch {
        return Response.json({ erro: 'JSON inválido' }, { status: 400 })
    }

    const { prompt } = body
    if (!prompt || typeof prompt !== 'string') {
        return Response.json({ erro: 'Prompt obrigatório' }, { status: 400 })
    }

    // Verificar toggle feature_ai
    try {
        const db = await getDb()
        const toggleRow = await db.get("SELECT value FROM kv WHERE key = 'feature_ai'")
        if (toggleRow && (toggleRow.value === '0' || toggleRow.value === 'false')) {
            return Response.json({ erro: 'O Agente IA está desativado pelo Administrador.' }, { status: 403 })
        }
    } catch { }

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3:latest',
                prompt: prompt,
                system: SYSTEM_PROMPT,
                format: 'json',
                stream: false,
            }),
        })

        if (!response.ok) {
            return Response.json({ erro: 'Erro no Ollama' }, { status: 500 })
        }

        const data = await response.json()
        const jsonStr = data.response
        const resultadoParser = JSON.parse(jsonStr)

        return Response.json(resultadoParser)

    } catch (err: any) {
        return Response.json({ erro: 'Erro de comunicação com Ollama' }, { status: 500 })
    }
}
