// ============================================================
// CRISTAL CAPITAL TERMINAL — Execução Python Server-Side
// Usa python3 local com numpy, scipy, pandas, matplotlib
// ============================================================

import { auth } from '@/auth'
import { spawn } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const maxDuration = 45

// Preâmbulo carregado antes de cada execução
function carregarInit(): string {
  try {
    return readFileSync(join(process.cwd(), 'public/quant/init.py'), 'utf-8')
  } catch {
    return ''
  }
}

function executarPython(codigo: string, timeoutMs = 30000): Promise<{ stdout: string; stderr: string; duracaoMs: number }> {
  return new Promise((resolve) => {
    const init = carregarInit()
    const codigoCompleto = init + '\n\n# ── Código do utilizador ──\n' + codigo

    const inicio = Date.now()
    const proc = spawn('python3', ['-c', codigoCompleto], {
      timeout: timeoutMs,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', MPLBACKEND: 'Agg' },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString('utf-8') })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString('utf-8') })

    proc.on('close', (code) => {
      const duracaoMs = Date.now() - inicio
      // Filtrar avisos matplotlib/numpy que não são erros
      const stderrLimpo = stderr
        .split('\n')
        .filter(l => !l.includes('matplotlib') && !l.includes('UserWarning') && !l.includes('FutureWarning') && l.trim())
        .join('\n')
      resolve({ stdout, stderr: stderrLimpo, duracaoMs })
    })

    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: `Erro ao iniciar python3: ${err.message}`, duracaoMs: Date.now() - inicio })
    })
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  let body: { codigo?: string; timeout?: number }
  try {
    body = await req.json()
  } catch {
    return Response.json({ erro: 'JSON inválido' }, { status: 400 })
  }

  const { codigo, timeout = 30000 } = body
  if (!codigo || typeof codigo !== 'string') {
    return Response.json({ erro: 'Campo "codigo" obrigatório' }, { status: 400 })
  }
  if (codigo.length > 50_000) {
    return Response.json({ erro: 'Código demasiado longo (máx 50 000 caracteres)' }, { status: 400 })
  }

  const resultado = await executarPython(codigo, Math.min(timeout, 45_000))
  return Response.json(resultado)
}
