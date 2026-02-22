'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Barra de Estado (Bottom Bar)
// ============================================================

import { useTerminalStore } from '@/store/terminal.store'

interface TickerStatus {
  label: string
  valor: string
  variacao: number
}

// Valores simulados para a status bar (em produção viria do store de mercado)
const TICKERS_STATUS: TickerStatus[] = [
  { label: 'PSI20',    valor: '6.832,14', variacao: +0.12 },
  { label: 'DAX',      valor: '22.412,3', variacao: +0.31 },
  { label: 'S&P500',   valor: '6.118,71', variacao: -0.08 },
  { label: 'EUR/USD',  valor: '1,0823',   variacao: -0.05 },
  { label: 'GBP/USD',  valor: '1,2641',   variacao: +0.03 },
  { label: 'OURO',     valor: '2.932,50', variacao: +0.42 },
  { label: 'BRENT',    valor: '74,20',    variacao: -1.82 },
  { label: 'BTC/USD',  valor: '95.800',   variacao: +4.20 },
]

function TickerChip({ item }: { item: TickerStatus }) {
  const cor = item.variacao >= 0 ? '#10B981' : '#EF4444'
  const sinal = item.variacao >= 0 ? '▲' : '▼'

  return (
    <div className="flex items-center gap-1.5 border-r border-neutral-800 px-3 shrink-0">
      <span className="font-mono text-[10px] text-neutral-500">{item.label}</span>
      <span className="font-mono text-[11px] text-white">{item.valor}</span>
      <span className="font-mono text-[10px]" style={{ color: cor }}>
        {sinal}
        {Math.abs(item.variacao).toFixed(2)}%
      </span>
    </div>
  )
}

export function StatusBar() {
  const { vistaActual, tickerActivo, temaActual } = useTerminalStore()
  const corTema =
    temaActual === 'green' ? '#10B981' : temaActual === 'blue' ? '#3B82F6' : '#F59E0B'

  const descricaoVista: Record<string, string> = {
    'mapa-mundo':   'MAPA ECONÓMICO MUNDIAL',
    bolhas:         'GRÁFICO DE BOLHAS',
    screener:       'SCREENER DE ACÇÕES',
    correlacao:     'MATRIZ DE CORRELAÇÃO',
    mercado:        'MONITOR DE MERCADO GLOBAL',
    candlestick:    `GRÁFICO DE VELAS${tickerActivo ? ` — ${tickerActivo}` : ''}`,
    'livro-ordens': `LIVRO DE ORDENS${tickerActivo ? ` — ${tickerActivo}` : ''}`,
    'yield-curve':  'CURVA DE RENDIMENTO SOBERANA',
    noticias:       'MONITOR DE NOTÍCIAS',
    watchlist:      'LISTA DE OBSERVAÇÃO',
    analise:        `ANÁLISE IA${tickerActivo ? ` — ${tickerActivo}` : ''}`,
    cripto:         'MERCADO DE CRIPTOMOEDAS',
    macro:          'MONITOR MACROECONÓMICO',
    heatmap:        'MAPA DE CALOR — S&P 500',
    calendario:     'CALENDÁRIO ECONÓMICO',
    portfolio:      'CARTEIRA DE INVESTIMENTO',
    ajuda:          'CENTRO DE AJUDA',
  }

  return (
    <footer className="flex items-center border-t border-neutral-800 bg-black h-7 overflow-hidden">
      {/* Vista actual */}
      <div
        className="flex items-center px-3 border-r border-neutral-800 shrink-0 h-full"
        style={{ borderRightColor: corTema + '66' }}
      >
        <span className="font-mono text-[10px] font-bold" style={{ color: corTema }}>
          {descricaoVista[vistaActual] ?? vistaActual.toUpperCase()}
        </span>
      </div>

      {/* Tickers em tempo real */}
      <div className="flex items-center flex-1 overflow-hidden">
        {TICKERS_STATUS.map((t) => (
          <TickerChip key={t.label} item={t} />
        ))}
      </div>

      {/* CRISTAL CAPITAL branding */}
      <div
        className="flex items-center px-3 border-l border-neutral-800 shrink-0 h-full"
      >
        <span className="font-mono text-[9px] text-neutral-600">
          © {new Date().getFullYear()} CRISTAL CAPITAL TERMINAL
        </span>
      </div>
    </footer>
  )
}
