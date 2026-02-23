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
  { iso3: "004", nome: "Afghanistan", bandeira: "🗺️", pib: 45, crescimentoPib: -0.8, inflacao: 18.5, desemprego: 14, dividaPublica: 72, mercado: 8, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "008", nome: "Albania", bandeira: "🗺️", pib: 21, crescimentoPib: 2, inflacao: 10.5, desemprego: 2, dividaPublica: 150, mercado: 20, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "012", nome: "Algeria", bandeira: "🗺️", pib: 34, crescimentoPib: 2.7, inflacao: 1.5, desemprego: 11, dividaPublica: 19, mercado: 1, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "024", nome: "Angola", bandeira: "🗺️", pib: 55, crescimentoPib: 2.7, inflacao: 8.5, desemprego: 14, dividaPublica: 82, mercado: -2, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "010", nome: "Antarctica", bandeira: "🗺️", pib: 59, crescimentoPib: -1.1, inflacao: 1.5, desemprego: 11, dividaPublica: 44, mercado: 6, moeda: 'LOCAL', taxaJuro: 2, balancaComercial: 4 },
  { iso3: "032", nome: "Argentina", bandeira: "🗺️", pib: 22, crescimentoPib: -0.9, inflacao: 22.5, desemprego: 5, dividaPublica: 133, mercado: 37, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "051", nome: "Armenia", bandeira: "🗺️", pib: 42, crescimentoPib: -1.9, inflacao: 7.5, desemprego: 5, dividaPublica: 123, mercado: 17, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "036", nome: "Australia", bandeira: "🗺️", pib: 35, crescimentoPib: -0.3, inflacao: 13.5, desemprego: 14, dividaPublica: 152, mercado: 18, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "040", nome: "Austria", bandeira: "🗺️", pib: 10, crescimentoPib: -0.6, inflacao: 3.5, desemprego: 14, dividaPublica: 37, mercado: 13, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "031", nome: "Azerbaijan", bandeira: "🗺️", pib: 56, crescimentoPib: -1.3, inflacao: 5.5, desemprego: 2, dividaPublica: 155, mercado: 15, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "044", nome: "Bahamas", bandeira: "🗺️", pib: 26, crescimentoPib: 2.3, inflacao: 20.5, desemprego: 2, dividaPublica: 65, mercado: -15, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "050", nome: "Bangladesh", bandeira: "🗺️", pib: 42, crescimentoPib: -1.9, inflacao: 7.5, desemprego: 5, dividaPublica: 123, mercado: 17, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "112", nome: "Belarus", bandeira: "🗺️", pib: 59, crescimentoPib: -1.1, inflacao: 1.5, desemprego: 11, dividaPublica: 44, mercado: 6, moeda: 'LOCAL', taxaJuro: 2, balancaComercial: 4 },
  { iso3: "056", nome: "Belgium", bandeira: "🗺️", pib: 50, crescimentoPib: -1.6, inflacao: 13.5, desemprego: 14, dividaPublica: 77, mercado: 33, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "084", nome: "Belize", bandeira: "🗺️", pib: 4, crescimentoPib: -1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 49, mercado: 31, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "204", nome: "Benin", bandeira: "🗺️", pib: 13, crescimentoPib: 2.6, inflacao: 19.5, desemprego: 8, dividaPublica: 106, mercado: 4, moeda: 'LOCAL', taxaJuro: 8, balancaComercial: 6 },
  { iso3: "064", nome: "Bhutan", bandeira: "🗺️", pib: 11, crescimentoPib: -1.5, inflacao: 20.5, desemprego: 2, dividaPublica: 140, mercado: 30, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "068", nome: "Bolivia", bandeira: "🗺️", pib: 51, crescimentoPib: -1.5, inflacao: 20.5, desemprego: 2, dividaPublica: 90, mercado: -10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "070", nome: "Bosnia and Herz.", bandeira: "🗺️", pib: 51, crescimentoPib: -0.5, inflacao: 10.5, desemprego: 2, dividaPublica: 150, mercado: -10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "072", nome: "Botswana", bandeira: "🗺️", pib: 52, crescimentoPib: -0.4, inflacao: 17.5, desemprego: 5, dividaPublica: 13, mercado: 7, moeda: 'LOCAL', taxaJuro: 9, balancaComercial: 3 },
  { iso3: "076", nome: "Brazil", bandeira: "🗺️", pib: 13, crescimentoPib: -1.4, inflacao: 9.5, desemprego: 8, dividaPublica: 16, mercado: 4, moeda: 'LOCAL', taxaJuro: 8, balancaComercial: 6 },
  { iso3: "096", nome: "Brunei", bandeira: "🗺️", pib: 14, crescimentoPib: -1.4, inflacao: 16.5, desemprego: 11, dividaPublica: 29, mercado: 21, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "100", nome: "Bulgaria", bandeira: "🗺️", pib: 28, crescimentoPib: -1.6, inflacao: 24.5, desemprego: 8, dividaPublica: 151, mercado: 19, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "854", nome: "Burkina Faso", bandeira: "🗺️", pib: 2, crescimentoPib: 0, inflacao: 12.5, desemprego: 5, dividaPublica: 143, mercado: -3, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "108", nome: "Burundi", bandeira: "🗺️", pib: 10, crescimentoPib: -0.6, inflacao: 3.5, desemprego: 14, dividaPublica: 37, mercado: 13, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "116", nome: "Cambodia", bandeira: "🗺️", pib: 5, crescimentoPib: 2.2, inflacao: 13.5, desemprego: 14, dividaPublica: 152, mercado: -12, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "120", nome: "Cameroon", bandeira: "🗺️", pib: 41, crescimentoPib: -1, inflacao: 15.5, desemprego: 2, dividaPublica: 20, mercado: 0, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "124", nome: "Canada", bandeira: "🗺️", pib: 29, crescimentoPib: 1.4, inflacao: 1.5, desemprego: 11, dividaPublica: 44, mercado: 36, moeda: 'LOCAL', taxaJuro: 12, balancaComercial: -6 },
  { iso3: "140", nome: "Central African Rep.", bandeira: "🗺️", pib: 11, crescimentoPib: -1.5, inflacao: 20.5, desemprego: 2, dividaPublica: 140, mercado: 30, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "148", nome: "Chad", bandeira: "🗺️", pib: 9, crescimentoPib: 1.4, inflacao: 1.5, desemprego: 11, dividaPublica: 144, mercado: -4, moeda: 'LOCAL', taxaJuro: 12, balancaComercial: -6 },
  { iso3: "152", nome: "Chile", bandeira: "🗺️", pib: 6, crescimentoPib: 2.3, inflacao: 20.5, desemprego: 2, dividaPublica: 15, mercado: 5, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "156", nome: "China", bandeira: "🗺️", pib: 4, crescimentoPib: 2.2, inflacao: 6.5, desemprego: 11, dividaPublica: 139, mercado: 31, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "170", nome: "Colombia", bandeira: "🗺️", pib: 27, crescimentoPib: -1.7, inflacao: 17.5, desemprego: 5, dividaPublica: 138, mercado: 2, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "178", nome: "Congo", bandeira: "🗺️", pib: 23, crescimentoPib: -1.9, inflacao: 14.5, desemprego: 8, dividaPublica: 86, mercado: -6, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "188", nome: "Costa Rica", bandeira: "🗺️", pib: 22, crescimentoPib: -0.9, inflacao: 22.5, desemprego: 5, dividaPublica: 133, mercado: 37, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "384", nome: "Côte d'Ivoire", bandeira: "🗺️", pib: 2, crescimentoPib: -0.9, inflacao: 22.5, desemprego: 5, dividaPublica: 83, mercado: -3, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "191", nome: "Croatia", bandeira: "🗺️", pib: 48, crescimentoPib: -1.6, inflacao: 24.5, desemprego: 8, dividaPublica: 51, mercado: -1, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "192", nome: "Cuba", bandeira: "🗺️", pib: 20, crescimentoPib: 2, inflacao: 3.5, desemprego: 14, dividaPublica: 137, mercado: 3, moeda: 'LOCAL', taxaJuro: 1, balancaComercial: 7 },
  { iso3: "196", nome: "Cyprus", bandeira: "🗺️", pib: 47, crescimentoPib: 0.3, inflacao: 22.5, desemprego: 5, dividaPublica: 158, mercado: -18, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "203", nome: "Czechia", bandeira: "🗺️", pib: 36, crescimentoPib: 2.8, inflacao: 15.5, desemprego: 2, dividaPublica: 45, mercado: 35, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "180", nome: "Dem. Rep. Congo", bandeira: "🗺️", pib: 32, crescimentoPib: -0.4, inflacao: 17.5, desemprego: 5, dividaPublica: 113, mercado: 27, moeda: 'LOCAL', taxaJuro: 9, balancaComercial: 3 },
  { iso3: "208", nome: "Denmark", bandeira: "🗺️", pib: 47, crescimentoPib: -1.7, inflacao: 17.5, desemprego: 5, dividaPublica: 38, mercado: -18, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "262", nome: "Djibouti", bandeira: "🗺️", pib: 47, crescimentoPib: -0.7, inflacao: 7.5, desemprego: 5, dividaPublica: 98, mercado: -18, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "214", nome: "Dominican Rep.", bandeira: "🗺️", pib: 28, crescimentoPib: 2.3, inflacao: 9.5, desemprego: 8, dividaPublica: 91, mercado: 19, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "218", nome: "Ecuador", bandeira: "🗺️", pib: 48, crescimentoPib: -1.6, inflacao: 24.5, desemprego: 8, dividaPublica: 51, mercado: -1, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "818", nome: "Egypt", bandeira: "🗺️", pib: 42, crescimentoPib: -0.9, inflacao: 22.5, desemprego: 5, dividaPublica: 33, mercado: 17, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "222", nome: "El Salvador", bandeira: "🗺️", pib: 18, crescimentoPib: -0.1, inflacao: 9.5, desemprego: 8, dividaPublica: 141, mercado: 29, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "226", nome: "Eq. Guinea", bandeira: "🗺️", pib: 22, crescimentoPib: 1, inflacao: 2.5, desemprego: 5, dividaPublica: 103, mercado: 37, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "232", nome: "Eritrea", bandeira: "🗺️", pib: 57, crescimentoPib: -1.2, inflacao: 12.5, desemprego: 5, dividaPublica: 18, mercado: 32, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "233", nome: "Estonia", bandeira: "🗺️", pib: 4, crescimentoPib: -0.9, inflacao: 11.5, desemprego: 11, dividaPublica: 109, mercado: 31, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "748", nome: "eSwatini", bandeira: "🗺️", pib: 57, crescimentoPib: -0.2, inflacao: 2.5, desemprego: 5, dividaPublica: 78, mercado: 32, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "231", nome: "Ethiopia", bandeira: "🗺️", pib: 40, crescimentoPib: -1.1, inflacao: 8.5, desemprego: 14, dividaPublica: 157, mercado: -17, moeda: 'LOCAL', taxaJuro: 1, balancaComercial: 7 },
  { iso3: "238", nome: "Falkland Is.", bandeira: "🗺️", pib: 44, crescimentoPib: 1.1, inflacao: 16.5, desemprego: 11, dividaPublica: 29, mercado: -9, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "242", nome: "Fiji", bandeira: "🗺️", pib: 27, crescimentoPib: 2.3, inflacao: 2.5, desemprego: 5, dividaPublica: 78, mercado: 2, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "246", nome: "Finland", bandeira: "🗺️", pib: 41, crescimentoPib: -2, inflacao: 0.5, desemprego: 2, dividaPublica: 110, mercado: 0, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "260", nome: "Fr. S. Antarctic Lands", bandeira: "🗺️", pib: 15, crescimentoPib: 1.7, inflacao: 18.5, desemprego: 14, dividaPublica: 72, mercado: 38, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "250", nome: "France", bandeira: "🗺️", pib: 52, crescimentoPib: 2.5, inflacao: 12.5, desemprego: 5, dividaPublica: 43, mercado: 7, moeda: 'LOCAL', taxaJuro: 9, balancaComercial: 3 },
  { iso3: "266", nome: "Gabon", bandeira: "🗺️", pib: 8, crescimentoPib: 2.3, inflacao: 9.5, desemprego: 8, dividaPublica: 41, mercado: 39, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "270", nome: "Gambia", bandeira: "🗺️", pib: 38, crescimentoPib: 1.9, inflacao: 14.5, desemprego: 8, dividaPublica: 11, mercado: 9, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "268", nome: "Georgia", bandeira: "🗺️", pib: 43, crescimentoPib: -1.9, inflacao: 14.5, desemprego: 8, dividaPublica: 136, mercado: 34, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "276", nome: "Germany", bandeira: "🗺️", pib: 4, crescimentoPib: -0.9, inflacao: 11.5, desemprego: 11, dividaPublica: 109, mercado: 31, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "288", nome: "Ghana", bandeira: "🗺️", pib: 60, crescimentoPib: 2, inflacao: 3.5, desemprego: 14, dividaPublica: 87, mercado: 23, moeda: 'LOCAL', taxaJuro: 1, balancaComercial: 7 },
  { iso3: "300", nome: "Greece", bandeira: "🗺️", pib: 48, crescimentoPib: 2.3, inflacao: 9.5, desemprego: 8, dividaPublica: 141, mercado: -1, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "304", nome: "Greenland", bandeira: "🗺️", pib: 13, crescimentoPib: -1.4, inflacao: 9.5, desemprego: 8, dividaPublica: 16, mercado: 4, moeda: 'LOCAL', taxaJuro: 8, balancaComercial: 6 },
  { iso3: "320", nome: "Guatemala", bandeira: "🗺️", pib: 14, crescimentoPib: -1.4, inflacao: 16.5, desemprego: 11, dividaPublica: 29, mercado: 21, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "324", nome: "Guinea", bandeira: "🗺️", pib: 2, crescimentoPib: -1.9, inflacao: 7.5, desemprego: 5, dividaPublica: 23, mercado: -3, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "624", nome: "Guinea-Bissau", bandeira: "🗺️", pib: 2, crescimentoPib: 1, inflacao: 2.5, desemprego: 5, dividaPublica: 53, mercado: -3, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "328", nome: "Guyana", bandeira: "🗺️", pib: 14, crescimentoPib: -1.4, inflacao: 16.5, desemprego: 11, dividaPublica: 29, mercado: 21, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "332", nome: "Haiti", bandeira: "🗺️", pib: 16, crescimentoPib: 2.8, inflacao: 15.5, desemprego: 2, dividaPublica: 145, mercado: -5, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "340", nome: "Honduras", bandeira: "🗺️", pib: 57, crescimentoPib: -0.2, inflacao: 2.5, desemprego: 5, dividaPublica: 78, mercado: 32, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "348", nome: "Hungary", bandeira: "🗺️", pib: 15, crescimentoPib: -0.3, inflacao: 13.5, desemprego: 14, dividaPublica: 102, mercado: 38, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "352", nome: "Iceland", bandeira: "🗺️", pib: 29, crescimentoPib: 2.4, inflacao: 16.5, desemprego: 11, dividaPublica: 104, mercado: 36, moeda: 'LOCAL', taxaJuro: 12, balancaComercial: -6 },
  { iso3: "356", nome: "India", bandeira: "🗺️", pib: 6, crescimentoPib: 2.3, inflacao: 20.5, desemprego: 2, dividaPublica: 15, mercado: 5, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "360", nome: "Indonesia", bandeira: "🗺️", pib: 23, crescimentoPib: -0.9, inflacao: 4.5, desemprego: 8, dividaPublica: 146, mercado: -6, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "364", nome: "Iran", bandeira: "🗺️", pib: 35, crescimentoPib: 2.7, inflacao: 8.5, desemprego: 14, dividaPublica: 32, mercado: 18, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "368", nome: "Iraq", bandeira: "🗺️", pib: 38, crescimentoPib: 2.8, inflacao: 4.5, desemprego: 8, dividaPublica: 71, mercado: 9, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "372", nome: "Ireland", bandeira: "🗺️", pib: 44, crescimentoPib: -1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 149, mercado: -9, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "376", nome: "Israel", bandeira: "🗺️", pib: 9, crescimentoPib: -1.6, inflacao: 6.5, desemprego: 11, dividaPublica: 114, mercado: -4, moeda: 'LOCAL', taxaJuro: 12, balancaComercial: -6 },
  { iso3: "380", nome: "Italy", bandeira: "🗺️", pib: 36, crescimentoPib: -1.3, inflacao: 5.5, desemprego: 2, dividaPublica: 105, mercado: 35, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "388", nome: "Jamaica", bandeira: "🗺️", pib: 19, crescimentoPib: 1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 124, mercado: -14, moeda: 'LOCAL', taxaJuro: 2, balancaComercial: 4 },
  { iso3: "392", nome: "Japan", bandeira: "🗺️", pib: 11, crescimentoPib: 2.5, inflacao: 5.5, desemprego: 2, dividaPublica: 80, mercado: 30, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "400", nome: "Jordan", bandeira: "🗺️", pib: 7, crescimentoPib: -1.7, inflacao: 17.5, desemprego: 5, dividaPublica: 88, mercado: 22, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "398", nome: "Kazakhstan", bandeira: "🗺️", pib: 21, crescimentoPib: 0, inflacao: 5.5, desemprego: 2, dividaPublica: 30, mercado: 20, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "404", nome: "Kenya", bandeira: "🗺️", pib: 25, crescimentoPib: -1.8, inflacao: 3.5, desemprego: 14, dividaPublica: 112, mercado: 28, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "414", nome: "Kuwait", bandeira: "🗺️", pib: 30, crescimentoPib: -0.6, inflacao: 3.5, desemprego: 14, dividaPublica: 87, mercado: -7, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "417", nome: "Kyrgyzstan", bandeira: "🗺️", pib: 15, crescimentoPib: 2.7, inflacao: 8.5, desemprego: 14, dividaPublica: 132, mercado: 38, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "418", nome: "Laos", bandeira: "🗺️", pib: 40, crescimentoPib: 3, inflacao: 18.5, desemprego: 14, dividaPublica: 97, mercado: -17, moeda: 'LOCAL', taxaJuro: 1, balancaComercial: 7 },
  { iso3: "428", nome: "Latvia", bandeira: "🗺️", pib: 10, crescimentoPib: -1.6, inflacao: 13.5, desemprego: 14, dividaPublica: 127, mercado: 13, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "422", nome: "Lebanon", bandeira: "🗺️", pib: 44, crescimentoPib: -1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 149, mercado: -9, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "426", nome: "Lesotho", bandeira: "🗺️", pib: 15, crescimentoPib: -0.3, inflacao: 13.5, desemprego: 14, dividaPublica: 102, mercado: 38, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "430", nome: "Liberia", bandeira: "🗺️", pib: 37, crescimentoPib: 2.8, inflacao: 22.5, desemprego: 5, dividaPublica: 58, mercado: -8, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "434", nome: "Libya", bandeira: "🗺️", pib: 18, crescimentoPib: 2.8, inflacao: 4.5, desemprego: 8, dividaPublica: 21, mercado: 29, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "440", nome: "Lithuania", bandeira: "🗺️", pib: 28, crescimentoPib: -0.6, inflacao: 14.5, desemprego: 8, dividaPublica: 61, mercado: 19, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "442", nome: "Luxembourg", bandeira: "🗺️", pib: 47, crescimentoPib: 1.3, inflacao: 12.5, desemprego: 5, dividaPublica: 68, mercado: -18, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "807", nome: "Macedonia", bandeira: "🗺️", pib: 58, crescimentoPib: 2.8, inflacao: 4.5, desemprego: 8, dividaPublica: 121, mercado: -11, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "450", nome: "Madagascar", bandeira: "🗺️", pib: 37, crescimentoPib: 2.8, inflacao: 22.5, desemprego: 5, dividaPublica: 58, mercado: -8, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "454", nome: "Malawi", bandeira: "🗺️", pib: 4, crescimentoPib: -1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 49, mercado: 31, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "458", nome: "Malaysia", bandeira: "🗺️", pib: 38, crescimentoPib: -1.1, inflacao: 19.5, desemprego: 8, dividaPublica: 131, mercado: 9, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "466", nome: "Mali", bandeira: "🗺️", pib: 28, crescimentoPib: 2.3, inflacao: 9.5, desemprego: 8, dividaPublica: 91, mercado: 19, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "478", nome: "Mauritania", bandeira: "🗺️", pib: 16, crescimentoPib: -0.3, inflacao: 20.5, desemprego: 2, dividaPublica: 115, mercado: -5, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "484", nome: "Mexico", bandeira: "🗺️", pib: 14, crescimentoPib: -1.4, inflacao: 16.5, desemprego: 11, dividaPublica: 29, mercado: 21, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "498", nome: "Moldova", bandeira: "🗺️", pib: 3, crescimentoPib: -0.9, inflacao: 4.5, desemprego: 8, dividaPublica: 96, mercado: 14, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "496", nome: "Mongolia", bandeira: "🗺️", pib: 43, crescimentoPib: -0.9, inflacao: 4.5, desemprego: 8, dividaPublica: 46, mercado: 34, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "499", nome: "Montenegro", bandeira: "🗺️", pib: 35, crescimentoPib: 0.7, inflacao: 3.5, desemprego: 14, dividaPublica: 62, mercado: 18, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "504", nome: "Morocco", bandeira: "🗺️", pib: 3, crescimentoPib: -0.9, inflacao: 4.5, desemprego: 8, dividaPublica: 96, mercado: 14, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "508", nome: "Mozambique", bandeira: "🗺️", pib: 31, crescimentoPib: 0.5, inflacao: 0.5, desemprego: 2, dividaPublica: 10, mercado: 10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "104", nome: "Myanmar", bandeira: "🗺️", pib: 6, crescimentoPib: -0.8, inflacao: 0.5, desemprego: 2, dividaPublica: 135, mercado: 5, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "516", nome: "Namibia", bandeira: "🗺️", pib: 30, crescimentoPib: 2.5, inflacao: 23.5, desemprego: 14, dividaPublica: 117, mercado: -7, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "524", nome: "Nepal", bandeira: "🗺️", pib: 17, crescimentoPib: 2.8, inflacao: 22.5, desemprego: 5, dividaPublica: 158, mercado: 12, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "528", nome: "Netherlands", bandeira: "🗺️", pib: 5, crescimentoPib: 0.2, inflacao: 8.5, desemprego: 14, dividaPublica: 32, mercado: -12, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "540", nome: "New Caledonia", bandeira: "🗺️", pib: 27, crescimentoPib: -0.7, inflacao: 7.5, desemprego: 5, dividaPublica: 48, mercado: 2, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "554", nome: "New Zealand", bandeira: "🗺️", pib: 14, crescimentoPib: -0.4, inflacao: 6.5, desemprego: 11, dividaPublica: 89, mercado: 21, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "558", nome: "Nicaragua", bandeira: "🗺️", pib: 8, crescimentoPib: -1.6, inflacao: 24.5, desemprego: 8, dividaPublica: 101, mercado: 39, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "562", nome: "Niger", bandeira: "🗺️", pib: 22, crescimentoPib: -1.9, inflacao: 7.5, desemprego: 5, dividaPublica: 73, mercado: 37, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "566", nome: "Nigeria", bandeira: "🗺️", pib: 44, crescimentoPib: -1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 149, mercado: -9, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "408", nome: "North Korea", bandeira: "🗺️", pib: 34, crescimentoPib: 0.6, inflacao: 21.5, desemprego: 11, dividaPublica: 49, mercado: 1, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "578", nome: "Norway", bandeira: "🗺️", pib: 41, crescimentoPib: 0, inflacao: 5.5, desemprego: 2, dividaPublica: 80, mercado: 0, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "512", nome: "Oman", bandeira: "🗺️", pib: 36, crescimentoPib: 2.8, inflacao: 15.5, desemprego: 2, dividaPublica: 45, mercado: 35, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "586", nome: "Pakistan", bandeira: "🗺️", pib: 48, crescimentoPib: -0.6, inflacao: 14.5, desemprego: 8, dividaPublica: 111, mercado: -1, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "275", nome: "Palestine", bandeira: "🗺️", pib: 34, crescimentoPib: -0.4, inflacao: 6.5, desemprego: 11, dividaPublica: 139, mercado: 1, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "591", nome: "Panama", bandeira: "🗺️", pib: 51, crescimentoPib: 2.5, inflacao: 5.5, desemprego: 2, dividaPublica: 30, mercado: -10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "598", nome: "Papua New Guinea", bandeira: "🗺️", pib: 27, crescimentoPib: 1.3, inflacao: 12.5, desemprego: 5, dividaPublica: 18, mercado: 2, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "600", nome: "Paraguay", bandeira: "🗺️", pib: 47, crescimentoPib: -0.7, inflacao: 7.5, desemprego: 5, dividaPublica: 98, mercado: -18, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "604", nome: "Peru", bandeira: "🗺️", pib: 53, crescimentoPib: -1.4, inflacao: 9.5, desemprego: 8, dividaPublica: 116, mercado: 24, moeda: 'LOCAL', taxaJuro: 8, balancaComercial: 6 },
  { iso3: "608", nome: "Philippines", bandeira: "🗺️", pib: 18, crescimentoPib: 0.9, inflacao: 24.5, desemprego: 8, dividaPublica: 51, mercado: 29, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "616", nome: "Poland", bandeira: "🗺️", pib: 7, crescimentoPib: -1.7, inflacao: 17.5, desemprego: 5, dividaPublica: 88, mercado: 22, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "620", nome: "Portugal", bandeira: "🗺️", pib: 7, crescimentoPib: 0.3, inflacao: 22.5, desemprego: 5, dividaPublica: 58, mercado: 22, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "630", nome: "Puerto Rico", bandeira: "🗺️", pib: 49, crescimentoPib: 1.4, inflacao: 1.5, desemprego: 11, dividaPublica: 94, mercado: 16, moeda: 'LOCAL', taxaJuro: 12, balancaComercial: -6 },
  { iso3: "634", nome: "Qatar", bandeira: "🗺️", pib: 26, crescimentoPib: -1.8, inflacao: 10.5, desemprego: 2, dividaPublica: 125, mercado: -15, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "642", nome: "Romania", bandeira: "🗺️", pib: 52, crescimentoPib: -1.4, inflacao: 2.5, desemprego: 5, dividaPublica: 103, mercado: 7, moeda: 'LOCAL', taxaJuro: 9, balancaComercial: 3 },
  { iso3: "643", nome: "Russia", bandeira: "🗺️", pib: 32, crescimentoPib: -0.4, inflacao: 17.5, desemprego: 5, dividaPublica: 113, mercado: 27, moeda: 'LOCAL', taxaJuro: 9, balancaComercial: 3 },
  { iso3: "646", nome: "Rwanda", bandeira: "🗺️", pib: 6, crescimentoPib: -1.8, inflacao: 10.5, desemprego: 2, dividaPublica: 75, mercado: 5, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "728", nome: "S. Sudan", bandeira: "🗺️", pib: 9, crescimentoPib: 1.4, inflacao: 1.5, desemprego: 11, dividaPublica: 144, mercado: -4, moeda: 'LOCAL', taxaJuro: 12, balancaComercial: -6 },
  { iso3: "682", nome: "Saudi Arabia", bandeira: "🗺️", pib: 31, crescimentoPib: -1.5, inflacao: 20.5, desemprego: 2, dividaPublica: 40, mercado: 10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "686", nome: "Senegal", bandeira: "🗺️", pib: 44, crescimentoPib: -1.9, inflacao: 21.5, desemprego: 11, dividaPublica: 149, mercado: -9, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "688", nome: "Serbia", bandeira: "🗺️", pib: 59, crescimentoPib: 2.9, inflacao: 11.5, desemprego: 11, dividaPublica: 134, mercado: 6, moeda: 'LOCAL', taxaJuro: 2, balancaComercial: 4 },
  { iso3: "694", nome: "Sierra Leone", bandeira: "🗺️", pib: 6, crescimentoPib: 0.3, inflacao: 15.5, desemprego: 2, dividaPublica: 45, mercado: 5, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "703", nome: "Slovakia", bandeira: "🗺️", pib: 47, crescimentoPib: -0.7, inflacao: 7.5, desemprego: 5, dividaPublica: 98, mercado: -18, moeda: 'LOCAL', taxaJuro: 14, balancaComercial: 8 },
  { iso3: "705", nome: "Slovenia", bandeira: "🗺️", pib: 54, crescimentoPib: -0.4, inflacao: 6.5, desemprego: 11, dividaPublica: 39, mercado: -19, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "090", nome: "Solomon Is.", bandeira: "🗺️", pib: 50, crescimentoPib: -1.6, inflacao: 13.5, desemprego: 14, dividaPublica: 77, mercado: 33, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "706", nome: "Somalia", bandeira: "🗺️", pib: 51, crescimentoPib: -1.5, inflacao: 20.5, desemprego: 2, dividaPublica: 90, mercado: -10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "710", nome: "South Africa", bandeira: "🗺️", pib: 6, crescimentoPib: 0.3, inflacao: 15.5, desemprego: 2, dividaPublica: 45, mercado: 5, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "410", nome: "South Korea", bandeira: "🗺️", pib: 42, crescimentoPib: 1, inflacao: 2.5, desemprego: 5, dividaPublica: 153, mercado: 17, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "724", nome: "Spain", bandeira: "🗺️", pib: 28, crescimentoPib: -1.6, inflacao: 24.5, desemprego: 8, dividaPublica: 151, mercado: 19, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "144", nome: "Sri Lanka", bandeira: "🗺️", pib: 42, crescimentoPib: -0.9, inflacao: 22.5, desemprego: 5, dividaPublica: 33, mercado: 17, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "729", nome: "Sudan", bandeira: "🗺️", pib: 28, crescimentoPib: -1.6, inflacao: 24.5, desemprego: 8, dividaPublica: 151, mercado: 19, moeda: 'LOCAL', taxaJuro: 13, balancaComercial: -9 },
  { iso3: "740", nome: "Suriname", bandeira: "🗺️", pib: 57, crescimentoPib: -0.2, inflacao: 2.5, desemprego: 5, dividaPublica: 78, mercado: 32, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "752", nome: "Sweden", bandeira: "🗺️", pib: 15, crescimentoPib: -1.3, inflacao: 23.5, desemprego: 14, dividaPublica: 42, mercado: 38, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "756", nome: "Switzerland", bandeira: "🗺️", pib: 36, crescimentoPib: 1.8, inflacao: 0.5, desemprego: 2, dividaPublica: 135, mercado: 35, moeda: 'LOCAL', taxaJuro: 5, balancaComercial: -5 },
  { iso3: "760", nome: "Syria", bandeira: "🗺️", pib: 41, crescimentoPib: -1, inflacao: 15.5, desemprego: 2, dividaPublica: 20, mercado: 0, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "158", nome: "Taiwan", bandeira: "🗺️", pib: 13, crescimentoPib: -1.4, inflacao: 9.5, desemprego: 8, dividaPublica: 16, mercado: 4, moeda: 'LOCAL', taxaJuro: 8, balancaComercial: 6 },
  { iso3: "762", nome: "Tajikistan", bandeira: "🗺️", pib: 23, crescimentoPib: 0.1, inflacao: 19.5, desemprego: 8, dividaPublica: 56, mercado: -6, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "834", nome: "Tanzania", bandeira: "🗺️", pib: 43, crescimentoPib: -0.9, inflacao: 4.5, desemprego: 8, dividaPublica: 46, mercado: 34, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "764", nome: "Thailand", bandeira: "🗺️", pib: 26, crescimentoPib: -1.8, inflacao: 10.5, desemprego: 2, dividaPublica: 125, mercado: -15, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "626", nome: "Timor-Leste", bandeira: "🗺️", pib: 58, crescimentoPib: 1.9, inflacao: 14.5, desemprego: 8, dividaPublica: 61, mercado: -11, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "768", nome: "Togo", bandeira: "🗺️", pib: 50, crescimentoPib: -1.6, inflacao: 13.5, desemprego: 14, dividaPublica: 77, mercado: 33, moeda: 'LOCAL', taxaJuro: 11, balancaComercial: -3 },
  { iso3: "780", nome: "Trinidad and Tobago", bandeira: "🗺️", pib: 51, crescimentoPib: 2.5, inflacao: 5.5, desemprego: 2, dividaPublica: 30, mercado: -10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "788", nome: "Tunisia", bandeira: "🗺️", pib: 14, crescimentoPib: -0.4, inflacao: 6.5, desemprego: 11, dividaPublica: 89, mercado: 21, moeda: 'LOCAL', taxaJuro: 7, balancaComercial: 9 },
  { iso3: "792", nome: "Turkey", bandeira: "🗺️", pib: 45, crescimentoPib: 0.2, inflacao: 8.5, desemprego: 14, dividaPublica: 132, mercado: 8, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "795", nome: "Turkmenistan", bandeira: "🗺️", pib: 26, crescimentoPib: 2.3, inflacao: 20.5, desemprego: 2, dividaPublica: 65, mercado: -15, moeda: 'LOCAL', taxaJuro: 15, balancaComercial: 5 },
  { iso3: "800", nome: "Uganda", bandeira: "🗺️", pib: 53, crescimentoPib: 2.6, inflacao: 19.5, desemprego: 8, dividaPublica: 56, mercado: 24, moeda: 'LOCAL', taxaJuro: 8, balancaComercial: 6 },
  { iso3: "804", nome: "Ukraine", bandeira: "🗺️", pib: 60, crescimentoPib: -1.1, inflacao: 8.5, desemprego: 14, dividaPublica: 57, mercado: 23, moeda: 'LOCAL', taxaJuro: 1, balancaComercial: 7 },
  { iso3: "784", nome: "United Arab Emirates", bandeira: "🗺️", pib: 22, crescimentoPib: 2, inflacao: 17.5, desemprego: 5, dividaPublica: 13, mercado: 37, moeda: 'LOCAL', taxaJuro: 19, balancaComercial: -7 },
  { iso3: "826", nome: "United Kingdom", bandeira: "🗺️", pib: 43, crescimentoPib: 1.1, inflacao: 9.5, desemprego: 8, dividaPublica: 16, mercado: 34, moeda: 'LOCAL', taxaJuro: 18, balancaComercial: -4 },
  { iso3: "840", nome: "United States of America", bandeira: "🗺️", pib: 25, crescimentoPib: 0.2, inflacao: 8.5, desemprego: 14, dividaPublica: 82, mercado: 28, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "858", nome: "Uruguay", bandeira: "🗺️", pib: 35, crescimentoPib: 0.7, inflacao: 3.5, desemprego: 14, dividaPublica: 62, mercado: 18, moeda: 'LOCAL', taxaJuro: 6, balancaComercial: -8 },
  { iso3: "860", nome: "Uzbekistan", bandeira: "🗺️", pib: 37, crescimentoPib: 0.8, inflacao: 17.5, desemprego: 5, dividaPublica: 88, mercado: -8, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "548", nome: "Vanuatu", bandeira: "🗺️", pib: 21, crescimentoPib: 0, inflacao: 5.5, desemprego: 2, dividaPublica: 30, mercado: 20, moeda: 'LOCAL', taxaJuro: 0, balancaComercial: -10 },
  { iso3: "862", nome: "Venezuela", bandeira: "🗺️", pib: 44, crescimentoPib: 0.1, inflacao: 1.5, desemprego: 11, dividaPublica: 119, mercado: -9, moeda: 'LOCAL', taxaJuro: 17, balancaComercial: -1 },
  { iso3: "704", nome: "Vietnam", bandeira: "🗺️", pib: 5, crescimentoPib: -0.8, inflacao: 18.5, desemprego: 14, dividaPublica: 122, mercado: -12, moeda: 'LOCAL', taxaJuro: 16, balancaComercial: 2 },
  { iso3: "732", nome: "W. Sahara", bandeira: "🗺️", pib: 38, crescimentoPib: 0.9, inflacao: 24.5, desemprego: 8, dividaPublica: 101, mercado: 9, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 },
  { iso3: "887", nome: "Yemen", bandeira: "🗺️", pib: 31, crescimentoPib: -1.5, inflacao: 20.5, desemprego: 2, dividaPublica: 40, mercado: 10, moeda: 'LOCAL', taxaJuro: 10, balancaComercial: 0 },
  { iso3: "894", nome: "Zambia", bandeira: "🗺️", pib: 57, crescimentoPib: 2.8, inflacao: 22.5, desemprego: 5, dividaPublica: 108, mercado: 32, moeda: 'LOCAL', taxaJuro: 4, balancaComercial: -2 },
  { iso3: "716", nome: "Zimbabwe", bandeira: "🗺️", pib: 38, crescimentoPib: -1.1, inflacao: 19.5, desemprego: 8, dividaPublica: 131, mercado: 9, moeda: 'LOCAL', taxaJuro: 3, balancaComercial: 1 }
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
