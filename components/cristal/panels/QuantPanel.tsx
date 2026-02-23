'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Ambiente Quant
// Python via Pyodide (WASM) + Cálculos C++ em TypeScript
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import {
  Terminal, Play, RotateCcw, BookOpen, ChevronRight, Loader2,
  FlaskConical, Activity, TrendingUp, Calculator, Code2, Cpu,
} from 'lucide-react'
import { blackScholes, volImplicita, binomialCRR } from '@/lib/quant/black-scholes'
import { calcularVaR, simularGBM, fitNelsonSiegel, opcaoMonteCarlo } from '@/lib/quant/monte-carlo'
import { retornosLog, sharpe, maxDrawdown, correlacao, desvioPadrao, media } from '@/lib/quant/statistics'

// ── Tipos ─────────────────────────────────────────────────────

interface LinhaOutput {
  id: number
  tipo: 'stdout' | 'stderr' | 'resultado' | 'info' | 'sistema'
  texto: string
  ts: string
}

interface Exemplo {
  id: string
  titulo: string
  descricao: string
  icone: React.ReactNode
  codigo: string
}

// ── Exemplos pré-construídos ───────────────────────────────────

const EXEMPLOS: Exemplo[] = [
  {
    id: 'bs-gregas',
    titulo: 'Black-Scholes + Gregas',
    descricao: 'Opção Call europeia com todas as gregas',
    icone: <Calculator size={12} />,
    codigo: `// ── Black-Scholes — Call Europeia ────────────────────
const bs = blackScholes({ S: 100, K: 105, T: 0.25, r: 0.05, sigma: 0.20 })

tabela({
  "Preco Call":  fmt(bs.call, 4),
  "Preco Put":   fmt(bs.put, 4),
  "Delta (Call)": fmt(bs.delta_call, 4),
  "Delta (Put)":  fmt(bs.delta_put, 4),
  "Gamma":        fmt(bs.gamma, 6),
  "Theta (Call)": fmt(bs.theta_call, 4) + " /dia",
  "Vega":         fmt(bs.vega, 4) + " /1% vol",
  "Rho":          fmt(bs.rho_call, 4) + " /1% juro",
  "d1":           fmt(bs.d1, 4),
  "d2":           fmt(bs.d2, 4),
})`,
  },
  {
    id: 'vol-implicita',
    titulo: 'Volatilidade Implícita',
    descricao: 'Newton-Raphson a partir do preço de mercado',
    icone: <Activity size={12} />,
    codigo: `// ── Volatilidade Implícita — Newton-Raphson ──────────
const precoMercado = 3.80   // preço observado no mercado

const vi = volImplicita(precoMercado, { S: 100, K: 105, T: 0.25, r: 0.05 })

// Verificação: BS com vol implícita deve reproduzir o preço
const verificacao = blackScholes({ S: 100, K: 105, T: 0.25, r: 0.05, sigma: vi })

tabela({
  "Preco Mercado":    fmt(precoMercado, 2),
  "Vol Implícita":    fmtPct(vi),
  "BS (verificacao)": fmt(verificacao.call, 4),
  "Erro":             fmt(Math.abs(verificacao.call - precoMercado), 8),
})`,
  },
  {
    id: 'monte-carlo-gbm',
    titulo: 'Monte Carlo — GBM',
    descricao: 'Simulação de trajectórias de preço (10 000 sim.)',
    icone: <TrendingUp size={12} />,
    codigo: `// ── Simulação Monte Carlo — Geometric Brownian Motion ─
const resultado = simularGBM({
  S0: 100,
  mu: 0.08,        // 8% retorno anualizado
  sigma: 0.20,     // 20% volatilidade
  T: 1,            // 1 ano
  passos: 252,     // passos diários
  simulacoes: 10000,
})

tabela({
  "Preço Inicial":    "100.00",
  "Percentil  5%":   fmt(resultado.percentis.p5, 2),
  "Percentil 25%":   fmt(resultado.percentis.p25, 2),
  "Mediana   50%":   fmt(resultado.percentis.p50, 2),
  "Percentil 75%":   fmt(resultado.percentis.p75, 2),
  "Percentil 95%":   fmt(resultado.percentis.p95, 2),
  "Média Final":     fmt(resultado.mediaFinal, 2),
  "Vol Realizada":   fmtPct(resultado.volRealizada),
})`,
  },
  {
    id: 'var-portfolio',
    titulo: 'VaR & CVaR — Portfolio',
    descricao: 'Value at Risk a 95% (3 métodos)',
    icone: <FlaskConical size={12} />,
    codigo: `// ── Value at Risk e Expected Shortfall ───────────────
// Retornos diários simulados (normalmente viria de dados reais)
const retornos = Array.from({ length: 500 }, () => {
  const u1 = Math.random(), u2 = Math.random()
  return 0.0004 + 0.012 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
})

const historico   = calcularVaR({ retornos, confianca: 0.95, metodo: 'historico' })
const parametrico = calcularVaR({ retornos, confianca: 0.95, metodo: 'parametrico' })
const mc          = calcularVaR({ retornos, confianca: 0.95, metodo: 'montecarlo', simulacoes: 5000 })

tabela({
  "Método":               "VaR 95%     CVaR",
  "Histórico":            fmtPct(historico.var)   + "   " + fmtPct(historico.cvar),
  "Paramétrico (Normal)": fmtPct(parametrico.var) + "   " + fmtPct(parametrico.cvar),
  "Monte Carlo":          fmtPct(mc.var)           + "   " + fmtPct(mc.cvar),
})

// Estatísticas dos retornos
tabela({
  "Retorno Médio Diário": fmtPct(retornos.reduce((s,v)=>s+v,0)/retornos.length),
  "Desvio Padrão":        fmtPct(desvioPadrao(retornos)),
  "Sharpe Anualizado":    fmt(sharpe(retornos), 3),
  "Max Drawdown":         "(calcular com série de preços)",
})`,
  },
  {
    id: 'nelson-siegel',
    titulo: 'Curva de Taxas Nelson-Siegel',
    descricao: 'Fitting da curva de rendimento soberana',
    icone: <TrendingUp size={12} />,
    codigo: `// ── Nelson-Siegel — Yield Curve Fitting ──────────────
// Dados das OTs Portuguesas (exemplo)
const maturidades = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30]
const yields      = [0.032, 0.033, 0.035, 0.036, 0.036, 0.037, 0.038, 0.039, 0.040, 0.041, 0.042]

const coef = fitNelsonSiegel({ maturidades, yields })

tabela({
  "Beta0 (nível LP)":   fmt(coef.beta0 * 100, 4) + "%",
  "Beta1 (slope CP)":   fmt(coef.beta1 * 100, 4) + "%",
  "Beta2 (curvatura)":  fmt(coef.beta2 * 100, 4) + "%",
  "Lambda (decaimento)": fmt(coef.lambda, 4),
  "RMSE fitting":        fmt(coef.erroRMSE * 10000, 2) + " bps",
})`,
  },
  {
    id: 'opcao-americana',
    titulo: 'Opção Americana — Binomial CRR',
    descricao: 'Cox-Ross-Rubinstein (200 passos)',
    icone: <Code2 size={12} />,
    codigo: `// ── Binomial CRR — Opção Americana vs Europeia ───────
const params = { S: 100, K: 100, T: 0.5, r: 0.05, sigma: 0.25, q: 0.02 }

const europeia = blackScholes(params)
const americana = binomialCRR({ ...params, passos: 200, americana: true })

tabela({
  "Europeia  Call (BS)":        fmt(europeia.call, 4),
  "Americana Call (Binomial)":  fmt(americana.call, 4),
  "Early Exercise Premium (C)": fmt(americana.call - europeia.call, 4),
  "Europeia  Put  (BS)":        fmt(europeia.put, 4),
  "Americana Put  (Binomial)":  fmt(americana.put, 4),
  "Early Exercise Premium (P)": fmt(americana.put - europeia.put, 4),
})`,
  },
  {
    id: 'mc-opcao-exotica',
    titulo: 'Monte Carlo — Opções Exóticas',
    descricao: 'Asian call, barrier knock-out',
    icone: <Cpu size={12} />,
    codigo: `// ── Monte Carlo — Opções Exóticas ────────────────────
const base = { S: 100, K: 100, T: 0.25, r: 0.05, sigma: 0.25, simulacoes: 50000, passos: 63 }

const vanilla  = opcaoMonteCarlo({ ...base, tipo: 'call' })
const asian    = opcaoMonteCarlo({ ...base, tipo: 'asian-call' })
const barrier  = opcaoMonteCarlo({ ...base, tipo: 'barrier-up-out', barreira: 120 })
const bs_ref   = blackScholes({ S: 100, K: 100, T: 0.25, r: 0.05, sigma: 0.25 })

tabela({
  "Vanilla Call (MC)":        fmt(vanilla, 4),
  "Vanilla Call (BS ref)":    fmt(bs_ref.call, 4),
  "Asian Call (média aritmética)": fmt(asian, 4),
  "Barrier Up-Out (K=120)":   fmt(barrier, 4),
})`,
  },
]

// ── Contexto de execução JavaScript ───────────────────────────

function criarContexto(output: (linha: Omit<LinhaOutput, 'id' | 'ts'>) => void) {
  const fmt = (v: number, casas = 2) => v.toFixed(casas)
  const fmtPct = (v: number, casas = 2) => `${(v * 100).toFixed(casas)}%`
  const fmtMoeda = (v: number, simbolo = '$') => `${simbolo}${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const tabela = (dados: Record<string, string | number>) => {
    const maxK = Math.max(...Object.keys(dados).map(k => k.length))
    const linhas = Object.entries(dados).map(([k, v]) => `  ${k.padEnd(maxK)}  ${v}`)
    output({ tipo: 'resultado', texto: linhas.join('\n') })
  }

  return {
    // Funções matemáticas
    blackScholes, volImplicita, binomialCRR,
    calcularVaR, simularGBM, fitNelsonSiegel, opcaoMonteCarlo,
    retornosLog, sharpe, maxDrawdown, correlacao, desvioPadrao, media,
    // Formatadores
    fmt, fmtPct, fmtMoeda,
    // Output
    tabela,
    print: (v: unknown) => output({ tipo: 'stdout', texto: String(v) }),
    // Math JS
    Math, JSON, Array, Object, Number, String, Boolean, Date, parseInt, parseFloat, isNaN, isFinite,
  }
}

// ── Componente Principal ───────────────────────────────────────

export function QuantPanel() {
  const { temaActual } = useTerminalStore()
  const corTema = corParaTema(temaActual)

  const [codigo, setCodigo]           = useState(EXEMPLOS[0].codigo)
  const [output, setOutput]           = useState<LinhaOutput[]>([])
  const [aExecutar, setAExecutar]     = useState(false)
  const [exemploActivo, setExemplo]   = useState(EXEMPLOS[0].id)
  const [abaSel, setAbaSel]           = useState<'editor' | 'exemplos'>('exemplos')
  const idRef  = useRef(0)
  const outRef = useRef<HTMLDivElement>(null)

  const adicionarLinha = useCallback((linha: Omit<LinhaOutput, 'id' | 'ts'>) => {
    const nova: LinhaOutput = {
      ...linha,
      id: ++idRef.current,
      ts: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setOutput(prev => [...prev.slice(-500), nova])
  }, [])

  useEffect(() => {
    adicionarLinha({
      tipo: 'sistema',
      texto: '╔══════════════════════════════════════════════════════╗\n║  CRISTAL CAPITAL TERMINAL — Ambiente Quant v1.0     ║\n║  Motor: TypeScript + Black-Scholes + Monte Carlo    ║\n║  C++: native/quant/*.cpp → public/wasm/quant.wasm   ║\n╚══════════════════════════════════════════════════════╝\n\nSeleccione um exemplo à esquerda ou escreva código.\nFunções: blackScholes, volImplicita, binomialCRR,\n         simularGBM, calcularVaR, fitNelsonSiegel,\n         opcaoMonteCarlo, sharpe, maxDrawdown, ...\nUtilitários: fmt(n, casas), fmtPct(n), tabela({...}), print()',
    })
  }, [adicionarLinha])

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: 'smooth' })
  }, [output])

  const executar = useCallback(async () => {
    if (!codigo.trim()) return
    setAExecutar(true)

    adicionarLinha({ tipo: 'info', texto: `▶ ${new Date().toLocaleTimeString('pt-PT')}` })

    try {
      const ctx = criarContexto(adicionarLinha)
      const fn = new Function(...Object.keys(ctx), `"use strict";\n${codigo}`)
      const resultado = fn(...Object.values(ctx))

      if (resultado !== undefined && resultado !== null) {
        const texto = typeof resultado === 'object'
          ? JSON.stringify(resultado, null, 2)
          : String(resultado)
        if (texto !== 'undefined') adicionarLinha({ tipo: 'resultado', texto })
      }
    } catch (err: unknown) {
      adicionarLinha({
        tipo: 'stderr',
        texto: err instanceof Error ? err.message : String(err),
      })
    }

    setAExecutar(false)
  }, [codigo, adicionarLinha])

  const limpar = () => setOutput([])

  const carregarExemplo = (ex: Exemplo) => {
    setExemplo(ex.id)
    setCodigo(ex.codigo)
    setAbaSel('editor')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      executar()
    }
    // Tab → 2 espaços
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const s = ta.selectionStart
      const val = ta.value
      ta.value = val.slice(0, s) + '  ' + val.slice(ta.selectionEnd)
      ta.selectionStart = ta.selectionEnd = s + 2
      setCodigo(ta.value)
    }
  }

  const corLinha = (tipo: LinhaOutput['tipo']) => {
    switch (tipo) {
      case 'stderr':   return '#EF4444'
      case 'resultado': return corTema
      case 'info':     return corTema + '88'
      case 'sistema':  return '#6B7280'
      default:         return '#D1D5DB'
    }
  }

  return (
    <div className="flex h-full bg-[#050505] font-mono overflow-hidden">

      {/* ── Coluna esquerda: Exemplos / Editor ─────────────────── */}
      <div className="flex flex-col w-72 shrink-0 border-r border-neutral-900">

        {/* Tabs */}
        <div className="flex border-b border-neutral-900">
          {(['exemplos', 'editor'] as const).map(aba => (
            <button
              key={aba}
              onClick={() => setAbaSel(aba)}
              className="flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors"
              style={{
                color: abaSel === aba ? corTema : '#4B5563',
                borderBottom: abaSel === aba ? `1px solid ${corTema}` : '1px solid transparent',
                backgroundColor: abaSel === aba ? corTema + '0A' : 'transparent',
              }}
            >
              {aba === 'exemplos' ? <><BookOpen size={9} className="inline mr-1" />Exemplos</> : <><Code2 size={9} className="inline mr-1" />Editor</>}
            </button>
          ))}
        </div>

        {abaSel === 'exemplos' ? (
          /* Lista de exemplos */
          <div className="flex-1 overflow-y-auto">
            {EXEMPLOS.map(ex => (
              <button
                key={ex.id}
                onClick={() => carregarExemplo(ex)}
                className="w-full text-left px-3 py-2.5 border-b border-neutral-900 transition-colors"
                style={{
                  backgroundColor: exemploActivo === ex.id ? corTema + '12' : 'transparent',
                  borderLeft: exemploActivo === ex.id ? `2px solid ${corTema}` : '2px solid transparent',
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5" style={{ color: exemploActivo === ex.id ? corTema : '#6B7280' }}>
                  {ex.icone}
                  <span className="text-[10px] font-bold truncate">{ex.titulo}</span>
                </div>
                <p className="text-[9px] text-neutral-600 truncate pl-4">{ex.descricao}</p>
              </button>
            ))}
          </div>
        ) : (
          /* Mini editor / info sobre funções */
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[9px] text-neutral-600 uppercase tracking-widest mb-2">Funções Disponíveis</p>
            {[
              ['blackScholes(opts)', 'Europeia BS + gregas'],
              ['volImplicita(mkt, opts)', 'IV Newton-Raphson'],
              ['binomialCRR(opts)', 'Americanas CRR'],
              ['simularGBM(params)', 'Monte Carlo GBM'],
              ['opcaoMonteCarlo(opts)', 'MC exóticas'],
              ['calcularVaR(params)', 'VaR / CVaR'],
              ['fitNelsonSiegel(p)', 'Yield curve fitting'],
              ['retornosLog(precos)', 'Log returns'],
              ['sharpe(ret, rf)', 'Sharpe ratio'],
              ['maxDrawdown(precos)', 'Max drawdown'],
              ['correlacao(a, b)', 'Correlação Pearson'],
              ['desvioPadrao(arr)', 'Desvio padrão'],
            ].map(([fn, desc]) => (
              <div key={fn} className="mb-1.5">
                <div className="text-[9px]" style={{ color: corTema }}>{fn}</div>
                <div className="text-[8px] text-neutral-600 pl-1">{desc}</div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-neutral-900">
              <p className="text-[9px] text-neutral-600 uppercase tracking-widest mb-1">Formatadores</p>
              {[
                ['fmt(n, casas)', 'Número decimal'],
                ['fmtPct(n)', 'Percentagem'],
                ['fmtMoeda(n)', 'Moeda'],
                ['tabela({...})', 'Tabela alinhada'],
                ['print(v)', 'Output simples'],
              ].map(([fn, desc]) => (
                <div key={fn} className="mb-1.5">
                  <div className="text-[9px]" style={{ color: corTema + 'BB' }}>{fn}</div>
                  <div className="text-[8px] text-neutral-600 pl-1">{desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-900">
              <p className="text-[9px]" style={{ color: '#6B7280' }}>
                <span style={{ color: corTema }}>C++ WASM</span><br />
                Código fonte em<br />
                <span className="text-neutral-500">native/quant/*.cpp</span><br />
                Compilar com Emscripten<br />
                → <span className="text-neutral-500">public/wasm/quant.wasm</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Coluna central: Editor de código ───────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header editor */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-neutral-900"
          style={{ backgroundColor: '#080808' }}
        >
          <div className="flex items-center gap-2">
            <Terminal size={11} style={{ color: corTema }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: corTema }}>
              AMBIENTE QUANT
            </span>
            <span className="text-[9px] text-neutral-700">TypeScript + C++ WASM + Pyodide</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-700">Ctrl+Enter para executar</span>
            <button
              onClick={limpar}
              className="flex items-center gap-1 px-2 py-1 text-[9px] text-neutral-600 hover:text-neutral-400 border border-neutral-800 rounded transition-colors"
            >
              <RotateCcw size={9} />
              Limpar
            </button>
            <button
              onClick={executar}
              disabled={aExecutar}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold tracking-widest transition-all disabled:opacity-50"
              style={{ backgroundColor: corTema, color: '#000' }}
            >
              {aExecutar ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
              {aExecutar ? 'A calcular…' : 'EXECUTAR'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden relative">
          {/* Números de linha */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#080808] border-r border-neutral-900 overflow-hidden pointer-events-none z-10">
            {codigo.split('\n').map((_, i) => (
              <div
                key={i}
                className="text-right pr-2 text-[9px] leading-5"
                style={{ color: '#374151' }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 pl-10 pr-3 py-1 w-full h-full bg-transparent resize-none outline-none text-[11px] leading-5 text-neutral-200"
            style={{
              caretColor: corTema,
              fontFamily: 'IBM Plex Mono, JetBrains Mono, monospace',
              tabSize: 2,
            }}
          />
        </div>

        {/* ── Output / Console ────────────────────────────────── */}
        <div
          className="border-t border-neutral-900"
          style={{ height: '45%', minHeight: '120px' }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-900 bg-[#080808]">
            <ChevronRight size={10} style={{ color: corTema }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: corTema }}>OUTPUT</span>
            <span className="text-[9px] text-neutral-700">{output.length} linhas</span>
          </div>
          <div
            ref={outRef}
            className="h-full overflow-y-auto p-3 pb-16"
          >
            {output.map(linha => (
              <pre
                key={linha.id}
                className="text-[10px] leading-[1.6] whitespace-pre-wrap break-all mb-0.5"
                style={{ color: corLinha(linha.tipo), fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {linha.tipo === 'info' && <span style={{ color: corTema + '60' }}>{linha.ts} </span>}
                {linha.texto}
              </pre>
            ))}
            {aExecutar && (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 size={10} className="animate-spin" style={{ color: corTema }} />
                <span className="text-[10px]" style={{ color: corTema + '88' }}>A calcular…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
