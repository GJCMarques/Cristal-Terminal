// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock do Calendário Económico
// ============================================================

export type ImportanciaEvento = 'alta' | 'media' | 'baixa'
export type EstadoEvento = 'publicado' | 'pendente' | 'em_breve'

export interface EventoEconomico {
  id: string
  timestamp: string         // ISO date
  hora: string              // HH:MM UTC
  pais: string
  bandeira: string
  evento: string
  categoria: string
  importancia: ImportanciaEvento
  anterior?: string
  previsao?: string
  actual?: string
  estado: EstadoEvento
  impactoTickers: string[]
}

function data(diasDesdeHoje: number, hora: string): string {
  const d = new Date()
  d.setDate(d.getDate() + diasDesdeHoje)
  const [h, m] = hora.split(':').map(Number)
  d.setHours(h!, m!, 0, 0)
  return d.toISOString()
}

export const CALENDARIO_EVENTOS: EventoEconomico[] = [
  // ── Hoje ──────────────────────────────────────────────────
  {
    id: 'ev-001', timestamp: data(0, '13:30'), hora: '13:30',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'IPC MoM (Jan 2026)',
    categoria: 'Inflação',
    importancia: 'alta', anterior: '+0.4%', previsao: '+0.3%', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'UST10', 'EURUSD', 'USDJPY', 'XAU'],
  },
  {
    id: 'ev-002', timestamp: data(0, '14:15'), hora: '14:15',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'Produção Industrial MoM',
    categoria: 'Actividade',
    importancia: 'media', anterior: '-0.1%', previsao: '+0.1%', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'NDX'],
  },
  {
    id: 'ev-003', timestamp: data(0, '15:00'), hora: '15:00',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'Conf. Consumidores (Prel.)',
    categoria: 'Sentimento',
    importancia: 'media', anterior: '105.3', previsao: '98.5', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'EURUSD'],
  },
  {
    id: 'ev-004', timestamp: data(0, '09:00'), hora: '09:00',
    pais: 'Zona Euro', bandeira: '🇪🇺',
    evento: 'PMI Composto (Fev, Flash)',
    categoria: 'Actividade',
    importancia: 'alta', anterior: '50.2', previsao: '50.5', actual: '51.2', estado: 'publicado',
    impactoTickers: ['EURUSD', 'DAX', 'BUND10'],
  },
  {
    id: 'ev-005', timestamp: data(0, '10:00'), hora: '10:00',
    pais: 'Zona Euro', bandeira: '🇪🇺',
    evento: 'IPC YoY (Jan, Final)',
    categoria: 'Inflação',
    importancia: 'alta', anterior: '2.2%', previsao: '2.4%', actual: '2.4%', estado: 'publicado',
    impactoTickers: ['EURUSD', 'OT10', 'BUND10'],
  },
  // ── Amanhã ────────────────────────────────────────────────
  {
    id: 'ev-006', timestamp: data(1, '07:00'), hora: '07:00',
    pais: 'Alemanha', bandeira: '🇩🇪',
    evento: 'IFO - Clima Empresarial (Fev)',
    categoria: 'Sentimento',
    importancia: 'alta', anterior: '85.1', previsao: '85.8', actual: undefined, estado: 'pendente',
    impactoTickers: ['EURUSD', 'DAX', 'BUND10'],
  },
  {
    id: 'ev-007', timestamp: data(1, '13:30'), hora: '13:30',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'Pedidos Desemprego Semana',
    categoria: 'Emprego',
    importancia: 'media', anterior: '218K', previsao: '215K', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'UST10', 'EURUSD'],
  },
  {
    id: 'ev-008', timestamp: data(1, '15:30'), hora: '15:30',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'Fed Williams — Discurso',
    categoria: 'Banco Central',
    importancia: 'alta', anterior: undefined, previsao: undefined, actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'UST10', 'EURUSD', 'XAU'],
  },
  // ── Próxima semana ────────────────────────────────────────
  {
    id: 'ev-009', timestamp: data(4, '08:00'), hora: '08:00',
    pais: 'Portugal', bandeira: '🇵🇹',
    evento: 'PIB YoY (Q4 2025, Prel.)',
    categoria: 'Crescimento',
    importancia: 'alta', anterior: '+2.1%', previsao: '+2.3%', actual: undefined, estado: 'pendente',
    impactoTickers: ['PSI20', 'OT10', 'EURUSD'],
  },
  {
    id: 'ev-010', timestamp: data(5, '12:30'), hora: '12:30',
    pais: 'Zona Euro', bandeira: '🇪🇺',
    evento: 'BCE — Actas da Reunião',
    categoria: 'Banco Central',
    importancia: 'alta', anterior: undefined, previsao: undefined, actual: undefined, estado: 'pendente',
    impactoTickers: ['EURUSD', 'DAX', 'OT10', 'BUND10'],
  },
  {
    id: 'ev-011', timestamp: data(6, '13:30'), hora: '13:30',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'PCE Deflator YoY (Jan)',
    categoria: 'Inflação',
    importancia: 'alta', anterior: '+2.6%', previsao: '+2.5%', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'NDX', 'UST10', 'XAU', 'EURUSD'],
  },
  {
    id: 'ev-012', timestamp: data(7, '13:30'), hora: '13:30',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'NFP — Nonfarm Payrolls (Fev)',
    categoria: 'Emprego',
    importancia: 'alta', anterior: '256K', previsao: '185K', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'NDX', 'UST10', 'EURUSD', 'USDJPY', 'XAU'],
  },
  {
    id: 'ev-013', timestamp: data(7, '13:30'), hora: '13:30',
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    evento: 'Taxa Desemprego (Fev)',
    categoria: 'Emprego',
    importancia: 'alta', anterior: '4.1%', previsao: '4.1%', actual: undefined, estado: 'pendente',
    impactoTickers: ['SPX', 'UST10', 'EURUSD'],
  },
]

export function obterProximoEvento(): EventoEconomico | undefined {
  return CALENDARIO_EVENTOS
    .filter((e) => e.estado === 'pendente')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]
}

export function formatarCountdown(timestamp: string): string {
  const diff = new Date(timestamp).getTime() - Date.now()
  if (diff <= 0) return 'Agora'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0)  return `${h}h ${m}m`
  return `${m}m`
}
