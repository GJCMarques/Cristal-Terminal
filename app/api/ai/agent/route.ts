import { auth } from '@/auth'
import { getDb } from '@/lib/db'

export const maxDuration = 45

const SYSTEM_PROMPT = `Tu és o Agente Quant do Cristal Terminal.
O teu objetivo é receber pedidos em linguagem natural de traders e convertê-los em código Python (numpy/pandas) para backtest, e extrair parâmetros de uma ordem de mercado.

LIVRARIAS DISPONÍVEIS NO AMBIENTE: numpy, pandas, scipy, statsmodels.
NÃO USE YFINANCE, YAHOO, NEM LIGAÇÕES DE REDE. Apenas gere dados sintéticos mock se necessário, ou use dados aleatórios lógicos (ex: random walk para preços).

Deves OBRIGATORIAMENTE responder em formato JSON estrito, sem markdown, contendo a seguinte estrutura exata:
{
  "script_python": "import numpy as np\\n\\n# O teu código quant aqui (use prints para output e tabelas)\\n# Exemplo: print('Backtest concluído\\nRetorno: 15%')",
  "acao_ui": {
    "abrir_ticket": true se o user expressou intenção de comprar/vender ativamente (ex: 'Comprar 100 shares'),
    "ativo": "TICKER (ex: AAPL, BTC, NVDA)",
    "quantidade": 100 (número inteiro ou float representativo),
    "lado": "compra" ou "venda"
  },
  "mensagem_utilizador": "Uma resposta curta como um Jarvis dizendo 'Preparei o backtest e abri a janela de trade para a sua ação.'"
}

Se for apenas uma simulação e não houver intenção de comprar/vender explicitamente (apenas analisar), coloca "abrir_ticket": false.
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
