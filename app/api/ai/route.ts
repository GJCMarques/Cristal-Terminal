// ============================================================
// CRISTAL CAPITAL TERMINAL — API Route IA (Ollama / Llama 3)
// ============================================================
// Substituição completa da integração OpenAI por Ollama local.
// Endpoint: POST /api/ai  |  GET /api/ai (health check)

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const MODELO = process.env.OLLAMA_MODEL ?? "llama3";

export const maxDuration = 60;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(8_000),
      }),
    )
    .min(1)
    .max(30),
  context: z.record(z.unknown()).optional(),
  stream: z.boolean().optional().default(true),
});

const SISTEMA_ANALISTA = `Você é um analista financeiro sénior do Cristal Capital Terminal.
Responda SEMPRE em Português de Portugal (PT-PT), de forma concisa e profissional.
Use terminologia financeira precisa. Baseie as análises nos dados fornecidos.
NUNCA forneça recomendações específicas de compra ou venda de activos.
NUNCA invente dados numéricos que não constem no contexto fornecido.
Limite as respostas a 3-4 parágrafos curtos e objectivos.`;

export async function POST(req: NextRequest) {
  // ── Validação ──────────────────────────────────────────────
  let corpo: z.infer<typeof requestSchema>;
  try {
    corpo = requestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { erro: "Requisição inválida", detalhe: String(err) },
      { status: 400 },
    );
  }

  // ── Montar mensagens ───────────────────────────────────────
  const mensagens: { role: string; content: string }[] = [
    { role: "system", content: SISTEMA_ANALISTA },
  ];

  if (corpo.context && Object.keys(corpo.context).length > 0) {
    mensagens.push({
      role: "system",
      content: `Contexto de mercado:\n${JSON.stringify(corpo.context).slice(0, 4_000)}`,
    });
  }

  mensagens.push(...corpo.messages);

  // ── Chamar Ollama ──────────────────────────────────────────
  let respostaOllama: Response;
  try {
    respostaOllama = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(50_000),
      body: JSON.stringify({
        model: MODELO,
        messages: mensagens,
        stream: corpo.stream,
        options: { temperature: 0.65, num_predict: 600, top_p: 0.9 },
      }),
    });
  } catch {
    return NextResponse.json(
      {
        erro: "Serviço IA local indisponível. Inicie o Ollama em http://localhost:11434",
        disponivel: false,
      },
      { status: 503 },
    );
  }

  if (!respostaOllama.ok) {
    return NextResponse.json(
      { erro: `Ollama: erro ${respostaOllama.status}` },
      { status: 502 },
    );
  }

  // ── Streaming ──────────────────────────────────────────────
  if (corpo.stream) {
    const stream = new ReadableStream({
      async start(ctrl) {
        const reader = respostaOllama.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const linhas = buf.split("\n");
            buf = linhas.pop() ?? "";
            for (const linha of linhas) {
              if (!linha.trim()) continue;
              try {
                const chunk = JSON.parse(linha);
                if (chunk.message?.content) {
                  ctrl.enqueue(new TextEncoder().encode(chunk.message.content));
                }
                if (chunk.done) { ctrl.close(); return; }
              } catch { /* JSON incompleto */ }
            }
          }
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  }

  // ── Resposta completa ──────────────────────────────────────
  const dados = await respostaOllama.json();
  return NextResponse.json({ conteudo: dados.message?.content ?? "", modelo: MODELO });
}

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2_000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        disponivel: true,
        modelo: MODELO,
        modelos: (data.models ?? []).map((m: { name: string }) => m.name),
      });
    }
  } catch { /* offline */ }
  return NextResponse.json({ disponivel: false, modelo: MODELO, modelos: [] });
}
