// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock de Dados Macroeconómicos Ampliado
// ============================================================

export interface DadosMacro {
  pais: string
  bandeira: string
  pibYoY: number
  pibTrimYoY: number
  ipsCYoY: number
  ipsCCore: number
  desemprego: number
  taxaJuro: number
  bancoCentral: string
  balancaComercial: number  // Milhares de milhões USD/mês
  deficeFiscal: number      // % PIB
  dividaPublica: number     // % PIB
  pmi: number               // PMI Composto
  cor: string
}

export const DADOS_MACRO: DadosMacro[] = [
  {
    pais: 'Estados Unidos', bandeira: '🇺🇸',
    pibYoY: 2.8, pibTrimYoY: 2.3,
    ipsCYoY: 3.1, ipsCCore: 3.3,
    desemprego: 4.1,
    taxaJuro: 4.375, bancoCentral: 'Fed',
    balancaComercial: -87.4, deficeFiscal: -6.1, dividaPublica: 123.2,
    pmi: 53.4, cor: '#3B82F6',
  },
  {
    pais: 'Zona Euro', bandeira: '🇪🇺',
    pibYoY: 0.8, pibTrimYoY: 0.4,
    ipsCYoY: 2.4, ipsCCore: 2.7,
    desemprego: 6.1,
    taxaJuro: 3.15, bancoCentral: 'BCE',
    balancaComercial: +12.1, deficeFiscal: -3.1, dividaPublica: 88.6,
    pmi: 50.2, cor: '#F59E0B',
  },
  {
    pais: 'Portugal', bandeira: '🇵🇹',
    pibYoY: 2.3, pibTrimYoY: 0.8,
    ipsCYoY: 2.1, ipsCCore: 2.4,
    desemprego: 6.5,
    taxaJuro: 3.15, bancoCentral: 'BCE',
    balancaComercial: -2.1, deficeFiscal: -1.2, dividaPublica: 97.8,
    pmi: 51.4, cor: '#10B981',
  },
  {
    pais: 'Alemanha', bandeira: '🇩🇪',
    pibYoY: -0.2, pibTrimYoY: -0.1,
    ipsCYoY: 2.6, ipsCCore: 3.0,
    desemprego: 3.4,
    taxaJuro: 3.15, bancoCentral: 'BCE',
    balancaComercial: +15.2, deficeFiscal: -2.2, dividaPublica: 64.3,
    pmi: 48.1, cor: '#6B7280',
  },
  {
    pais: 'Reino Unido', bandeira: '🇬🇧',
    pibYoY: 0.9, pibTrimYoY: 0.3,
    ipsCYoY: 3.0, ipsCCore: 3.7,
    desemprego: 4.4,
    taxaJuro: 5.25, bancoCentral: 'BoE',
    balancaComercial: -8.4, deficeFiscal: -5.1, dividaPublica: 98.2,
    pmi: 51.8, cor: '#A78BFA',
  },
  {
    pais: 'Japão', bandeira: '🇯🇵',
    pibYoY: 0.4, pibTrimYoY: 0.2,
    ipsCYoY: 2.9, ipsCCore: 2.2,
    desemprego: 2.4,
    taxaJuro: 0.50, bancoCentral: 'BoJ',
    balancaComercial: -5.2, deficeFiscal: -4.8, dividaPublica: 261.3,
    pmi: 49.8, cor: '#F472B6',
  },
  {
    pais: 'China', bandeira: '🇨🇳',
    pibYoY: 5.0, pibTrimYoY: 1.5,
    ipsCYoY: 0.7, ipsCCore: 0.4,
    desemprego: 5.1,
    taxaJuro: 3.10, bancoCentral: 'PBoC',
    balancaComercial: +96.2, deficeFiscal: -3.1, dividaPublica: 52.8,
    pmi: 51.2, cor: '#EF4444',
  },
  {
    pais: 'Brasil', bandeira: '🇧🇷',
    pibYoY: 3.4, pibTrimYoY: 0.8,
    ipsCYoY: 4.8, ipsCCore: 4.2,
    desemprego: 6.8,
    taxaJuro: 10.50, bancoCentral: 'BCB',
    balancaComercial: +8.4, deficeFiscal: -7.2, dividaPublica: 88.1,
    pmi: 52.1, cor: '#34D399',
  },
]

export interface EventoBancoCentral {
  banco: string
  pais: string
  taxaActual: number
  proximaReuniao: string
  expectativaProxima: string  // "manter", "corte25pb", "subida25pb"
  ciclo: 'corte' | 'manutenção' | 'subida'
}

export const BANCOS_CENTRAIS: EventoBancoCentral[] = [
  { banco: 'Fed', pais: '🇺🇸 EUA', taxaActual: 4.375, proximaReuniao: '20 Mar 2026', expectativaProxima: 'manter', ciclo: 'manutenção' },
  { banco: 'BCE', pais: '🇪🇺 Zona Euro', taxaActual: 3.15, proximaReuniao: '06 Mar 2026', expectativaProxima: 'corte25pb', ciclo: 'corte' },
  { banco: 'BoE', pais: '🇬🇧 R. Unido', taxaActual: 5.25, proximaReuniao: '20 Mar 2026', expectativaProxima: 'corte25pb', ciclo: 'corte' },
  { banco: 'BoJ', pais: '🇯🇵 Japão', taxaActual: 0.50, proximaReuniao: '18 Mar 2026', expectativaProxima: 'manter', ciclo: 'subida' },
  { banco: 'SNB', pais: '🇨🇭 Suíça', taxaActual: 1.00, proximaReuniao: '20 Mar 2026', expectativaProxima: 'corte25pb', ciclo: 'corte' },
  { banco: 'BCB', pais: '🇧🇷 Brasil', taxaActual: 10.50, proximaReuniao: '19 Mar 2026', expectativaProxima: 'subida25pb', ciclo: 'subida' },
]

export interface YieldCurvePontos {
  maturidade: string
  us: number
  eu: number
  uk: number
}

// Mock of Government Bond Yield Curves to understand inversion/recession signals
export const YIELD_CURVES: YieldCurvePontos[] = [
  { maturidade: '1M', us: 5.30, eu: 3.84, uk: 5.20 },
  { maturidade: '3M', us: 5.35, eu: 3.89, uk: 5.22 },
  { maturidade: '6M', us: 5.28, eu: 3.82, uk: 5.15 },
  { maturidade: '1Y', us: 4.90, eu: 3.65, uk: 4.80 },
  { maturidade: '2Y', us: 4.60, eu: 2.85, uk: 4.25 },
  { maturidade: '5Y', us: 4.25, eu: 2.45, uk: 4.00 },
  { maturidade: '10Y', us: 4.32, eu: 2.38, uk: 4.10 },
  { maturidade: '30Y', us: 4.45, eu: 2.50, uk: 4.30 },
]

export interface RiscoRecessao {
  pais: string
  probabilidade: number // 0 a 100%
  indicadorLider: number // 100 é base
  confiancaConsumidor: number // 0 a 100
}

export const RISCO_RECESSAO: RiscoRecessao[] = [
  { pais: 'Estados Unidos', probabilidade: 35, indicadorLider: 98.4, confiancaConsumidor: 68 },
  { pais: 'Zona Euro', probabilidade: 55, indicadorLider: 95.2, confiancaConsumidor: 54 },
  { pais: 'Alemanha', probabilidade: 75, indicadorLider: 92.1, confiancaConsumidor: 45 },
  { pais: 'Reino Unido', probabilidade: 45, indicadorLider: 97.4, confiancaConsumidor: 59 },
  { pais: 'Japão', probabilidade: 25, indicadorLider: 101.2, confiancaConsumidor: 71 },
  { pais: 'China', probabilidade: 15, indicadorLider: 105.4, confiancaConsumidor: 85 },
]


