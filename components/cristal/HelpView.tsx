'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Centro de Ajuda (HELP)
// ============================================================

import { useTerminalStore } from '@/store/terminal.store'
import type { VistaTerminal } from '@/types/terminal'

interface SecaoAjuda {
  titulo: string
  items: { comando: string; descricao: string; atalho?: string }[]
}

const SECOES: SecaoAjuda[] = [
  {
    titulo: 'COMANDOS GLOBAIS',
    items: [
      { comando: 'HELP',       descricao: 'Este ecrã de ajuda',                    atalho: 'F1' },
      { comando: 'MKTM',       descricao: 'Monitor de Mercado Global',             atalho: 'F2' },
      { comando: 'NWSM',       descricao: 'Monitor de Notícias com Sentimento IA', atalho: 'F3' },
      { comando: 'WL',         descricao: 'Lista de Observação',                   atalho: 'F4' },
      { comando: 'YAS',        descricao: 'Curvas de Rendimento Soberanas',        atalho: 'F5' },
      { comando: 'ALLQ',       descricao: 'Livro de Ordens (Todos os Preços)',     atalho: 'F6' },
      { comando: 'CRYPTO',     descricao: 'Mercado de Criptomoedas',               atalho: 'F7' },
      { comando: 'MACRO',      descricao: 'Monitor Macroeconómico Global',         atalho: 'F8' },
      { comando: 'HEATMAP',    descricao: 'Mapa de Calor S&P 500 por Sectores',    atalho: 'F9'  },
      { comando: 'CALENDARIO', descricao: 'Calendário Económico com Countdown',    atalho: 'F10' },
      { comando: 'MAP',        descricao: 'Mapa Económico Mundial Choropleth',      atalho: 'F11' },
      { comando: 'BUBBLE',     descricao: 'Gráfico de Bolhas de Mercado (Cap×YTD)',atalho: 'F12' },
      { comando: 'SCR',        descricao: 'Screener de Acções com filtros e presets',atalho: 'Ctrl+S' },
      { comando: 'CORR',       descricao: 'Matriz de Correlação entre activos',    atalho: 'Ctrl+R' },
    ],
  },
  {
    titulo: 'SELECÇÃO DE INSTRUMENTOS',
    items: [
      { comando: 'AAPL <Equity>',   descricao: 'Seleccionar ação Apple' },
      { comando: 'EURUSD <Curncy>', descricao: 'Seleccionar par de moeda EUR/USD' },
      { comando: 'XAU <Comdty>',    descricao: 'Seleccionar commodity Ouro' },
      { comando: 'SPX <Index>',     descricao: 'Seleccionar índice S&P 500' },
      { comando: 'UST10 <Govt>',    descricao: 'Seleccionar obrigação US Treasury 10A' },
    ],
  },
  {
    titulo: 'FUNÇÕES DE INSTRUMENTO',
    items: [
      { comando: '<TICKER> <Clase> GP',   descricao: 'Gráfico de Velas (Graph Price)' },
      { comando: '<TICKER> <Clase> DES',  descricao: 'Análise IA com Llama 3 (Description)' },
      { comando: '<TICKER> <Clase> ALLQ', descricao: 'Livro de Ordens do instrumento' },
    ],
  },
  {
    titulo: 'TECLADO',
    items: [
      { comando: '↑ / ↓',      descricao: 'Navegar histórico de comandos na linha de comando' },
      { comando: 'TAB',         descricao: 'Completar sugestão automática' },
      { comando: 'ENTER',       descricao: 'Executar comando' },
      { comando: 'ESC',         descricao: 'Limpar linha / fechar painel / fechar paleta' },
      { comando: 'F1 – F12',    descricao: 'Vistas rápidas (F1=Ajuda, F2=Mercado … F12=Bolhas)' },
      { comando: 'Ctrl+K',      descricao: 'Paleta de Comandos (busca rápida de tudo)' },
      { comando: 'Ctrl+Z',      descricao: 'Voltar à vista anterior' },
      { comando: 'Ctrl+B',      descricao: 'Alternar painel lateral esquerdo' },
      { comando: 'Ctrl+M',      descricao: 'Monitor de Mercado Global' },
      { comando: 'Ctrl+N',      descricao: 'Monitor de Notícias' },
      { comando: 'Ctrl+W',      descricao: 'Lista de Observação (Watchlist)' },
      { comando: 'Ctrl+G',      descricao: 'Gráfico de Velas (activo actual)' },
      { comando: 'Ctrl+S',      descricao: 'Screener de Acções' },
      { comando: 'Ctrl+R',      descricao: 'Matriz de Correlação' },
      { comando: 'Botão Dir.',   descricao: 'Menu contextual (gráfico, watchlist, análise IA…)' },
    ],
  },
  {
    titulo: 'EXEMPLOS DE FLUXO DE TRABALHO',
    items: [
      { comando: 'NVDA <Equity> GP',  descricao: 'Ver gráfico de velas NVIDIA' },
      { comando: 'NVDA <Equity> DES', descricao: 'Pedir análise IA sobre NVIDIA' },
      { comando: 'EURUSD <Curncy>',   descricao: 'Ver gráfico EUR/USD' },
      { comando: 'YAS',               descricao: 'Comparar curvas de rendimento soberanas' },
      { comando: 'MKTM',              descricao: 'Visão geral dos mercados globais' },
      { comando: 'CRYPTO',            descricao: 'Painel cripto com Fear & Greed + análise IA' },
      { comando: 'HEATMAP',           descricao: 'Drill-down sectorial S&P 500 por variação' },
    ],
  },
]

const TICKERS_RAPIDOS = [
  { g: 'Acções',      tickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'META', 'AMZN', 'JPM', 'NFLX'] },
  { g: 'Índices',     tickers: ['SPX', 'NDX', 'DAX', 'PSI20', 'FTSE', 'NKY', 'CAC40', 'HSI'] },
  { g: 'Moedas',      tickers: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD'] },
  { g: 'Crypto',      tickers: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX'] },
  { g: 'Commodities', tickers: ['XAU', 'XAG', 'CL1', 'CO1', 'NG1', 'WHEAT', 'COPPER'] },
  { g: 'Obrigações',  tickers: ['UST10', 'BUND10', 'OT10', 'GILT10', 'BTP10'] },
]

export function HelpView() {
  const { definirVista, definirTickerActivo, executarComando, temaActual } =
    useTerminalStore()

  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6 font-mono">
      {/* ── Logo / Título ──────────────────────────────── */}
      <div className="mb-8">
        <div
          className="text-2xl font-black mb-1"
          style={{ color: corTema }}
        >
          ◆ CRISTAL CAPITAL TERMINAL
        </div>
        <div className="text-neutral-500 text-sm">
          Terminal Profissional de Mercados Financeiros — Ajuda e Referência de Comandos
        </div>
        <div className="text-neutral-700 text-xs mt-1">
          v2.0.0 · Llama 3 via Ollama · React 19 · Next.js 15
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secções de comandos */}
        {SECOES.map((sec) => (
          <div key={sec.titulo} className="border border-neutral-800 rounded">
            <div
              className="px-4 py-2 text-[10px] font-bold border-b border-neutral-800"
              style={{ color: corTema, backgroundColor: corTema + '11' }}
            >
              {sec.titulo}
            </div>
            <div>
              {sec.items.map((item) => (
                <div
                  key={item.comando}
                  className="flex items-center gap-3 px-4 py-2 border-b border-neutral-900 last:border-0"
                >
                  <code
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: corTema + '22', color: corTema }}
                  >
                    {item.comando}
                  </code>
                  <span className="text-xs text-neutral-400 flex-1">{item.descricao}</span>
                  {item.atalho && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-500 shrink-0">
                      {item.atalho}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tickers rápidos ─────────────────────────────── */}
      <div className="mt-6 border border-neutral-800 rounded">
        <div
          className="px-4 py-2 text-[10px] font-bold border-b border-neutral-800"
          style={{ color: corTema, backgroundColor: corTema + '11' }}
        >
          INSTRUMENTOS DISPONÍVEIS — CLIQUE PARA CARREGAR
        </div>
        <div className="p-4 space-y-3">
          {TICKERS_RAPIDOS.map((g) => (
            <div key={g.g} className="flex items-center gap-3">
              <span className="text-[10px] text-neutral-600 w-24 shrink-0">{g.g}</span>
              <div className="flex flex-wrap gap-2">
                {g.tickers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      definirTickerActivo(t)
                      definirVista('candlestick')
                    }}
                    className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Créditos ────────────────────────────────────── */}
      <div className="mt-6 text-center text-neutral-700 text-[10px]">
        © {new Date().getFullYear()} Cristal Capital · Terminal Financeiro Profissional · Todos os direitos reservados
      </div>
    </div>
  )
}
