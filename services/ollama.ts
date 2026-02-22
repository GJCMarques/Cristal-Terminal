// ============================================================
// CRISTAL CAPITAL TERMINAL — Serviço Ollama / Llama 3
// ============================================================

export interface MensagemOllama {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpcoesOllama {
  temperature?: number
  num_predict?: number
  top_p?: number
  top_k?: number
  stop?: string[]
}

export interface ChunkStreamOllama {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  done_reason?: string
}

export interface RespostaOllama {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  eval_count?: number
}

// ── Serviço principal ─────────────────────────────────────────

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const MODELO_PADRAO = process.env.OLLAMA_MODEL ?? 'llama3'
const TIMEOUT_MS = 30_000

export class ServicoOllama {
  private readonly url: string
  private readonly modelo: string

  constructor(url = OLLAMA_URL, modelo = MODELO_PADRAO) {
    this.url = url
    this.modelo = modelo
  }

  /** Verifica se o Ollama está disponível localmente */
  async estaDisponivel(): Promise<boolean> {
    try {
      const res = await fetch(`${this.url}/api/tags`, {
        signal: AbortSignal.timeout(2_000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  /** Lista modelos instalados */
  async listarModelos(): Promise<string[]> {
    const res = await fetch(`${this.url}/api/tags`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.models ?? []).map((m: { name: string }) => m.name)
  }

  /**
   * Chat com streaming — devolve um ReadableStream<string>
   * onde cada chunk é um fragmento de texto do assistente.
   */
  async chatStream(
    mensagens: MensagemOllama[],
    opcoes?: OpcoesOllama,
  ): Promise<ReadableStream<string>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: this.modelo,
        messages: mensagens,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 600,
          top_p: 0.9,
          ...opcoes,
        },
      }),
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const texto = await res.text()
      throw new Error(`Ollama: ${res.status} — ${texto}`)
    }

    // Transforma NDJSON → ReadableStream<string>
    return res.body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream<string, string>({
          transform(chunk, ctrl) {
            for (const linha of chunk.split('\n').filter(Boolean)) {
              try {
                const parsed = JSON.parse(linha) as ChunkStreamOllama
                if (parsed.message?.content) {
                  ctrl.enqueue(parsed.message.content)
                }
              } catch {
                // linha incompleta/inválida — ignorar
              }
            }
          },
        }),
      )
  }

  /**
   * Geração simples sem streaming — devolve o texto completo.
   */
  async gerar(
    prompt: string,
    sistemaMensagem?: string,
    opcoes?: OpcoesOllama,
  ): Promise<string> {
    const mensagens: MensagemOllama[] = []

    if (sistemaMensagem) {
      mensagens.push({ role: 'system', content: sistemaMensagem })
    }
    mensagens.push({ role: 'user', content: prompt })

    const res = await fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model: this.modelo,
        messages: mensagens,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 400,
          ...opcoes,
        },
      }),
    })

    if (!res.ok) {
      throw new Error(`Ollama: ${res.status}`)
    }

    const data = (await res.json()) as RespostaOllama
    return data.message?.content ?? ''
  }

  /**
   * Análise de sentimento de uma notícia (−1.0 a +1.0).
   * Usa temperatura baixa para consistência.
   */
  async analisarSentimento(titulo: string, resumo: string): Promise<number> {
    const prompt = `Analisa o sentimento desta notícia financeira.
Responde APENAS com um número decimal entre -1.0 (muito negativo) e +1.0 (muito positivo).
Sem texto adicional — só o número.

Título: ${titulo}
Resumo: ${resumo}`

    try {
      const resposta = await this.gerar(prompt, undefined, {
        temperature: 0.1,
        num_predict: 10,
      })
      const num = parseFloat(resposta.trim())
      if (Number.isNaN(num)) return 0
      return Math.max(-1, Math.min(1, num))
    } catch {
      return 0
    }
  }
}

// Singleton para uso no lado servidor
export const servicoOllama = new ServicoOllama()
