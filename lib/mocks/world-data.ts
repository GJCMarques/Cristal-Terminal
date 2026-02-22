// ============================================================
// CRISTAL CAPITAL TERMINAL — Mock: Dados Económicos Mundiais
// ============================================================

export type MetricaMapa = 'pib' | 'inflacao' | 'desemprego' | 'divida' | 'mercado'

export interface DadosPais {
  iso3: string          // ISO 3166-1 alpha-3 code (for react-simple-maps)
  nome: string
  bandeira: string
  pib: number           // PIB per capita (USD mil)
  crescimentoPib: number // % YoY
  inflacao: number       // % YoY
  desemprego: number     // %
  dividaPublica: number  // % PIB
  mercado: number        // % variação YTD principal índice
  moeda: string
  taxaJuro: number
  balancaComercial: number // % PIB
}

export const DADOS_MUNDIAIS: DadosPais[] = [
  // Américas
  { iso3:'USA', nome:'Estados Unidos',    bandeira:'🇺🇸', pib:82.8,  crescimentoPib:+2.8,  inflacao:3.2,  desemprego:3.7,  dividaPublica:122.4, mercado:+24.2, moeda:'USD', taxaJuro:5.33, balancaComercial:-4.8 },
  { iso3:'CAN', nome:'Canadá',            bandeira:'🇨🇦', pib:53.2,  crescimentoPib:+1.2,  inflacao:2.8,  desemprego:6.1,  dividaPublica:106.4, mercado:+8.4,  moeda:'CAD', taxaJuro:5.00, balancaComercial:-1.4 },
  { iso3:'BRA', nome:'Brasil',            bandeira:'🇧🇷', pib:11.4,  crescimentoPib:+2.9,  inflacao:4.6,  desemprego:7.8,  dividaPublica:88.4,  mercado:+12.4, moeda:'BRL', taxaJuro:11.25,balancaComercial:+2.4 },
  { iso3:'MEX', nome:'México',            bandeira:'🇲🇽', pib:12.8,  crescimentoPib:+1.5,  inflacao:4.4,  desemprego:2.8,  dividaPublica:48.2,  mercado:+4.8,  moeda:'MXN', taxaJuro:10.50,balancaComercial:-0.8 },
  { iso3:'ARG', nome:'Argentina',         bandeira:'🇦🇷', pib:13.8,  crescimentoPib:-1.6,  inflacao:142.4,desemprego:8.2,  dividaPublica:84.2,  mercado:+224.2,moeda:'ARS', taxaJuro:100.0, balancaComercial:+1.2 },
  { iso3:'CHL', nome:'Chile',             bandeira:'🇨🇱', pib:16.4,  crescimentoPib:+2.4,  inflacao:4.8,  desemprego:8.8,  dividaPublica:38.4,  mercado:+14.2, moeda:'CLP', taxaJuro:5.75, balancaComercial:+4.2 },
  { iso3:'COL', nome:'Colômbia',          bandeira:'🇨🇴', pib:6.8,   crescimentoPib:+1.8,  inflacao:9.2,  desemprego:10.4, dividaPublica:54.8,  mercado:+4.4,  moeda:'COP', taxaJuro:11.75,balancaComercial:-4.2 },
  { iso3:'PER', nome:'Peru',              bandeira:'🇵🇪', pib:7.8,   crescimentoPib:+2.4,  inflacao:3.4,  desemprego:7.2,  dividaPublica:32.8,  mercado:+8.4,  moeda:'PEN', taxaJuro:6.50, balancaComercial:+2.8 },

  // Europa
  { iso3:'DEU', nome:'Alemanha',          bandeira:'🇩🇪', pib:51.2,  crescimentoPib:-0.2,  inflacao:2.4,  desemprego:3.2,  dividaPublica:64.8,  mercado:+18.4, moeda:'EUR', taxaJuro:4.50, balancaComercial:+5.8 },
  { iso3:'FRA', nome:'França',            bandeira:'🇫🇷', pib:44.8,  crescimentoPib:+1.1,  inflacao:2.4,  desemprego:7.4,  dividaPublica:110.4, mercado:+8.4,  moeda:'EUR', taxaJuro:4.50, balancaComercial:-2.4 },
  { iso3:'GBR', nome:'Reino Unido',       bandeira:'🇬🇧', pib:46.4,  crescimentoPib:+0.8,  inflacao:3.4,  desemprego:4.2,  dividaPublica:104.8, mercado:+4.2,  moeda:'GBP', taxaJuro:5.25, balancaComercial:-4.4 },
  { iso3:'ITA', nome:'Itália',            bandeira:'🇮🇹', pib:38.4,  crescimentoPib:+0.8,  inflacao:1.2,  desemprego:6.8,  dividaPublica:137.4, mercado:+12.4, moeda:'EUR', taxaJuro:4.50, balancaComercial:+2.8 },
  { iso3:'ESP', nome:'Espanha',           bandeira:'🇪🇸', pib:32.4,  crescimentoPib:+2.4,  inflacao:2.8,  desemprego:11.8, dividaPublica:108.4, mercado:+14.4, moeda:'EUR', taxaJuro:4.50, balancaComercial:+1.4 },
  { iso3:'PRT', nome:'Portugal',          bandeira:'🇵🇹', pib:25.4,  crescimentoPib:+2.2,  inflacao:2.4,  desemprego:6.4,  dividaPublica:102.4, mercado:+8.4,  moeda:'EUR', taxaJuro:4.50, balancaComercial:-1.4 },
  { iso3:'NLD', nome:'Países Baixos',     bandeira:'🇳🇱', pib:57.8,  crescimentoPib:+0.8,  inflacao:2.4,  desemprego:3.8,  dividaPublica:48.4,  mercado:+12.4, moeda:'EUR', taxaJuro:4.50, balancaComercial:+8.4 },
  { iso3:'CHE', nome:'Suíça',             bandeira:'🇨🇭', pib:91.2,  crescimentoPib:+1.2,  inflacao:1.4,  desemprego:2.4,  dividaPublica:28.4,  mercado:+6.4,  moeda:'CHF', taxaJuro:1.50, balancaComercial:+8.8 },
  { iso3:'SWE', nome:'Suécia',            bandeira:'🇸🇪', pib:55.4,  crescimentoPib:-0.4,  inflacao:4.2,  desemprego:8.4,  dividaPublica:32.4,  mercado:+8.4,  moeda:'SEK', taxaJuro:4.00, balancaComercial:+2.4 },
  { iso3:'NOR', nome:'Noruega',           bandeira:'🇳🇴', pib:106.4, crescimentoPib:+1.8,  inflacao:5.4,  desemprego:3.8,  dividaPublica:18.4,  mercado:+4.4,  moeda:'NOK', taxaJuro:4.50, balancaComercial:+16.4},
  { iso3:'DNK', nome:'Dinamarca',         bandeira:'🇩🇰', pib:68.4,  crescimentoPib:+2.4,  inflacao:2.8,  desemprego:5.2,  dividaPublica:29.8,  mercado:+18.4, moeda:'DKK', taxaJuro:3.60, balancaComercial:+8.4 },
  { iso3:'FIN', nome:'Finlândia',         bandeira:'🇫🇮', pib:49.2,  crescimentoPib:-0.8,  inflacao:3.4,  desemprego:7.8,  dividaPublica:74.4,  mercado:+2.4,  moeda:'EUR', taxaJuro:4.50, balancaComercial:+1.4 },
  { iso3:'POL', nome:'Polónia',           bandeira:'🇵🇱', pib:19.8,  crescimentoPib:+2.8,  inflacao:6.4,  desemprego:2.8,  dividaPublica:49.8,  mercado:+8.4,  moeda:'PLN', taxaJuro:5.75, balancaComercial:-0.4 },
  { iso3:'RUS', nome:'Rússia',            bandeira:'🇷🇺', pib:15.4,  crescimentoPib:+3.2,  inflacao:8.4,  desemprego:2.8,  dividaPublica:21.4,  mercado:+12.4, moeda:'RUB', taxaJuro:16.0, balancaComercial:+5.4 },
  { iso3:'TUR', nome:'Turquia',           bandeira:'🇹🇷', pib:14.8,  crescimentoPib:+5.4,  inflacao:62.4, desemprego:8.8,  dividaPublica:29.4,  mercado:+42.4, moeda:'TRY', taxaJuro:45.0, balancaComercial:-7.4 },

  // Ásia-Pacífico
  { iso3:'CHN', nome:'China',             bandeira:'🇨🇳', pib:12.8,  crescimentoPib:+4.8,  inflacao:0.2,  desemprego:5.4,  dividaPublica:77.4,  mercado:+4.8,  moeda:'CNY', taxaJuro:3.45, balancaComercial:+4.2 },
  { iso3:'JPN', nome:'Japão',             bandeira:'🇯🇵', pib:39.8,  crescimentoPib:+0.4,  inflacao:2.8,  desemprego:2.4,  dividaPublica:254.4, mercado:+24.4, moeda:'JPY', taxaJuro:0.25, balancaComercial:+0.8 },
  { iso3:'KOR', nome:'Coreia do Sul',     bandeira:'🇰🇷', pib:32.8,  crescimentoPib:+2.4,  inflacao:2.8,  desemprego:2.8,  dividaPublica:54.4,  mercado:+4.4,  moeda:'KRW', taxaJuro:3.50, balancaComercial:+2.8 },
  { iso3:'IND', nome:'Índia',             bandeira:'🇮🇳', pib:2.4,   crescimentoPib:+7.2,  inflacao:4.8,  desemprego:8.4,  dividaPublica:84.4,  mercado:+18.4, moeda:'INR', taxaJuro:6.50, balancaComercial:-2.8 },
  { iso3:'AUS', nome:'Austrália',         bandeira:'🇦🇺', pib:64.4,  crescimentoPib:+1.4,  inflacao:3.8,  desemprego:3.8,  dividaPublica:48.4,  mercado:+7.4,  moeda:'AUD', taxaJuro:4.35, balancaComercial:+4.8 },
  { iso3:'SGP', nome:'Singapura',         bandeira:'🇸🇬', pib:88.4,  crescimentoPib:+2.4,  inflacao:3.2,  desemprego:1.8,  dividaPublica:178.4, mercado:+4.4,  moeda:'SGD', taxaJuro:3.68, balancaComercial:+18.4},
  { iso3:'IDN', nome:'Indonésia',         bandeira:'🇮🇩', pib:4.8,   crescimentoPib:+5.0,  inflacao:2.8,  desemprego:5.4,  dividaPublica:38.4,  mercado:+4.4,  moeda:'IDR', taxaJuro:6.00, balancaComercial:+1.8 },
  { iso3:'THA', nome:'Tailândia',         bandeira:'🇹🇭', pib:7.4,   crescimentoPib:+3.2,  inflacao:1.4,  desemprego:1.2,  dividaPublica:62.4,  mercado:+4.4,  moeda:'THB', taxaJuro:2.50, balancaComercial:+2.4 },

  // Médio Oriente & África
  { iso3:'SAU', nome:'Arábia Saudita',    bandeira:'🇸🇦', pib:32.4,  crescimentoPib:+1.4,  inflacao:1.8,  desemprego:3.8,  dividaPublica:24.8,  mercado:-4.4,  moeda:'SAR', taxaJuro:6.00, balancaComercial:+4.8 },
  { iso3:'ARE', nome:'Emirados Árabes',   bandeira:'🇦🇪', pib:48.8,  crescimentoPib:+4.4,  inflacao:3.4,  desemprego:2.8,  dividaPublica:28.4,  mercado:+8.4,  moeda:'AED', taxaJuro:5.40, balancaComercial:+8.4 },
  { iso3:'ZAF', nome:'África do Sul',     bandeira:'🇿🇦', pib:6.4,   crescimentoPib:+0.8,  inflacao:4.4,  desemprego:32.4, dividaPublica:72.4,  mercado:+14.4, moeda:'ZAR', taxaJuro:8.25, balancaComercial:-2.4 },
  { iso3:'EGY', nome:'Egipto',            bandeira:'🇪🇬', pib:3.8,   crescimentoPib:+3.8,  inflacao:28.4, desemprego:7.2,  dividaPublica:88.4,  mercado:+68.4, moeda:'EGP', taxaJuro:27.25,balancaComercial:-8.4 },
]

export function getCorChoropleth(valor: number, metrica: MetricaMapa): string {
  switch (metrica) {
    case 'pib': {
      if (valor < 5)   return '#1a1a2e'
      if (valor < 15)  return '#16213e'
      if (valor < 30)  return '#0f3460'
      if (valor < 50)  return '#1b5e20'
      if (valor < 70)  return '#2e7d32'
      return '#43a047'
    }
    case 'inflacao': {
      if (valor < 2)   return '#1b5e20'
      if (valor < 3)   return '#388e3c'
      if (valor < 5)   return '#f9a825'
      if (valor < 10)  return '#e65100'
      if (valor < 30)  return '#b71c1c'
      return '#7f0000'
    }
    case 'desemprego': {
      if (valor < 3)   return '#1b5e20'
      if (valor < 5)   return '#388e3c'
      if (valor < 8)   return '#f9a825'
      if (valor < 12)  return '#e65100'
      return '#b71c1c'
    }
    case 'divida': {
      if (valor < 40)  return '#1b5e20'
      if (valor < 60)  return '#388e3c'
      if (valor < 90)  return '#f9a825'
      if (valor < 120) return '#e65100'
      return '#b71c1c'
    }
    case 'mercado': {
      if (valor >= 30)  return '#1b5e20'
      if (valor >= 15)  return '#388e3c'
      if (valor >= 5)   return '#66bb6a'
      if (valor >= 0)   return '#a5d6a7'
      if (valor >= -10) return '#ef9a9a'
      if (valor >= -20) return '#e53935'
      return '#b71c1c'
    }
    default: return '#2a2a2a'
  }
}

export function getLegendaMetrica(metrica: MetricaMapa): { label: string; cor: string }[] {
  switch (metrica) {
    case 'pib':        return [
      { label: '<5k$', cor:'#1a1a2e' }, { label: '5-15k$', cor:'#16213e' },
      { label: '15-30k$', cor:'#0f3460' }, { label: '30-50k$', cor:'#1b5e20' },
      { label: '50-70k$', cor:'#2e7d32' }, { label: '>70k$', cor:'#43a047' },
    ]
    case 'inflacao':   return [
      { label: '<2%', cor:'#1b5e20' }, { label: '2-3%', cor:'#388e3c' },
      { label: '3-5%', cor:'#f9a825' }, { label: '5-10%', cor:'#e65100' },
      { label: '10-30%', cor:'#b71c1c' }, { label: '>30%', cor:'#7f0000' },
    ]
    case 'desemprego': return [
      { label: '<3%', cor:'#1b5e20' }, { label: '3-5%', cor:'#388e3c' },
      { label: '5-8%', cor:'#f9a825' }, { label: '8-12%', cor:'#e65100' },
      { label: '>12%', cor:'#b71c1c' },
    ]
    case 'divida':     return [
      { label: '<40%', cor:'#1b5e20' }, { label: '40-60%', cor:'#388e3c' },
      { label: '60-90%', cor:'#f9a825' }, { label: '90-120%', cor:'#e65100' },
      { label: '>120%', cor:'#b71c1c' },
    ]
    case 'mercado':    return [
      { label: '>30%', cor:'#1b5e20' }, { label: '15-30%', cor:'#388e3c' },
      { label: '5-15%', cor:'#66bb6a' }, { label: '0-5%', cor:'#a5d6a7' },
      { label: '-10-0%', cor:'#ef9a9a' }, { label: '<-10%', cor:'#b71c1c' },
    ]
    default: return []
  }
}
