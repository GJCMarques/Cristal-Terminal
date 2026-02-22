// ============================================================
// CRISTAL CAPITAL TERMINAL — Zustand Store Global
// ============================================================

import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'
import { parsearComando } from '@/lib/command-parser'
import type { EstadoTerminal, VistaTerminal, WatchlistItem, ContextMenuEstado } from '@/types/terminal'
import type { ClasseAtivo, MensagemIA } from '@/types/market'

const WATCHLIST_INICIAL: WatchlistItem[][] = [
  [
    { ticker: 'AAPL',   nome: 'Apple Inc.',          adicionadoEm: new Date().toISOString() },
    { ticker: 'MSFT',   nome: 'Microsoft Corp.',     adicionadoEm: new Date().toISOString() },
    { ticker: 'NVDA',   nome: 'NVIDIA Corp.',        adicionadoEm: new Date().toISOString() },
    { ticker: 'EURUSD', nome: 'Euro / Dólar EUA',    adicionadoEm: new Date().toISOString() },
    { ticker: 'XAU',    nome: 'Ouro Spot',           adicionadoEm: new Date().toISOString() },
    { ticker: 'PSI20',  nome: 'PSI 20 (Portugal)',   adicionadoEm: new Date().toISOString() },
  ],
  [
    { ticker: 'BTC',    nome: 'Bitcoin',             adicionadoEm: new Date().toISOString() },
    { ticker: 'ETH',    nome: 'Ethereum',            adicionadoEm: new Date().toISOString() },
    { ticker: 'CO1',    nome: 'Petróleo Brent',      adicionadoEm: new Date().toISOString() },
    { ticker: 'SPX',    nome: 'S&P 500',             adicionadoEm: new Date().toISOString() },
    { ticker: 'UST10',  nome: 'US Treasury 10A',     adicionadoEm: new Date().toISOString() },
  ],
]

const CONTEXT_MENU_INICIAL: ContextMenuEstado = {
  visivel: false,
  x: 0,
  y: 0,
}

export const useTerminalStore = create<EstadoTerminal>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ── Estado inicial ────────────────────────────────────
      tickerActivo: null,
      classeActivaAtivo: null,
      nomeActivoAtivo: null,

      vistaActual: 'mercado',
      vistaAnterior: null,

      inputComando: '',
      historicoComandos: [],
      indiceHistorico: -1,

      aCarregar: false,
      erro: null,

      painelLateralVisivel: true,

      watchlists: WATCHLIST_INICIAL,
      watchlistActiva: 0,

      mensagensIA: [],
      iaACarregar: false,
      iaDisponivel: null,

      temaActual: 'amber',

      contextMenu: CONTEXT_MENU_INICIAL,
      commandPaletteAberto: false,

      // ── Acções ───────────────────────────────────────────

      definirTickerActivo: (ticker, classeAtivo, nome) =>
        set({
          tickerActivo: ticker,
          classeActivaAtivo: classeAtivo ?? null,
          nomeActivoAtivo: nome ?? null,
          mensagensIA: [],
        }),

      definirVista: (vista: VistaTerminal) =>
        set((s) => ({
          vistaAnterior: s.vistaActual,
          vistaActual: vista,
        })),

      voltarVista: () =>
        set((s) => s.vistaAnterior
          ? { vistaActual: s.vistaAnterior, vistaAnterior: null }
          : {}
        ),

      definirInputComando: (input: string) =>
        set({ inputComando: input, indiceHistorico: -1 }),

      executarComando: (rawComando: string) => {
        const trimmed = rawComando.trim()
        if (!trimmed) return

        const { historicoComandos } = get()

        const novoHistorico = [
          trimmed,
          ...historicoComandos.filter((c) => c !== trimmed),
        ].slice(0, 200)

        const parsed = parsearComando(trimmed)

        if (parsed.erro) {
          set({
            historicoComandos: novoHistorico,
            inputComando: '',
            indiceHistorico: -1,
            erro: parsed.erro,
          })
          return
        }

        const updates: Partial<EstadoTerminal> = {
          historicoComandos: novoHistorico,
          inputComando: '',
          indiceHistorico: -1,
          erro: null,
        }

        if (parsed.ticker) {
          updates.tickerActivo = parsed.ticker
          updates.classeActivaAtivo = parsed.classeAtivo ?? null
          updates.mensagensIA = []
        }

        if (parsed.vista) {
          updates.vistaAnterior = get().vistaActual
          updates.vistaActual = parsed.vista
        }

        set(updates as EstadoTerminal)
      },

      navegarHistorico: (direccao: 'cima' | 'baixo') => {
        const { historicoComandos, indiceHistorico } = get()
        if (historicoComandos.length === 0) return

        let novoIndice: number
        if (direccao === 'cima') {
          novoIndice = Math.min(indiceHistorico + 1, historicoComandos.length - 1)
        } else {
          novoIndice = Math.max(indiceHistorico - 1, -1)
        }

        set({
          indiceHistorico: novoIndice,
          inputComando: novoIndice >= 0 ? (historicoComandos[novoIndice] ?? '') : '',
        })
      },

      limparErro: () => set({ erro: null }),

      alternarPainelLateral: () =>
        set((s) => ({ painelLateralVisivel: !s.painelLateralVisivel })),

      adicionarAoWatchlist: (ticker: string, nome: string) => {
        const { watchlists, watchlistActiva } = get()
        const lista = watchlists[watchlistActiva] ?? []
        if (lista.some((i) => i.ticker === ticker)) return
        const novaLista = [...lista, { ticker, nome, adicionadoEm: new Date().toISOString() }]
        const novasListas = [...watchlists]
        novasListas[watchlistActiva] = novaLista
        set({ watchlists: novasListas })
      },

      removerDoWatchlist: (ticker: string) => {
        const { watchlists, watchlistActiva } = get()
        const lista = watchlists[watchlistActiva] ?? []
        const novaLista = lista.filter((i) => i.ticker !== ticker)
        const novasListas = [...watchlists]
        novasListas[watchlistActiva] = novaLista
        set({ watchlists: novasListas })
      },

      definirWatchlistActiva: (indice: number) =>
        set({ watchlistActiva: indice }),

      adicionarMensagemIA: (mensagem: MensagemIA) =>
        set((s) => ({ mensagensIA: [...s.mensagensIA, mensagem] })),

      definirIACarregando: (aCarregar: boolean) => set({ iaACarregar: aCarregar }),

      definirIADisponivel: (disponivel: boolean) => set({ iaDisponivel: disponivel }),

      definirTema: (tema: 'amber' | 'green' | 'blue') => set({ temaActual: tema }),

      abrirContextMenu: (estado) =>
        set({ contextMenu: { ...estado, visivel: true } }),

      fecharContextMenu: () =>
        set({ contextMenu: CONTEXT_MENU_INICIAL }),

      alternarCommandPalette: () =>
        set((s) => ({ commandPaletteAberto: !s.commandPaletteAberto })),

      fecharCommandPalette: () =>
        set({ commandPaletteAberto: false }),
    })),
    { name: 'CristalCapitalTerminal' },
  ),
)

// ── Selectores derivados ──────────────────────────────────────

export const selectWatchlistActiva = (s: EstadoTerminal) =>
  s.watchlists[s.watchlistActiva] ?? []

export const selectTemTickerActivo = (s: EstadoTerminal) =>
  s.tickerActivo !== null

export const selectCorTema = (s: EstadoTerminal): string => {
  const cores = { amber: '#F59E0B', green: '#10B981', blue: '#3B82F6' }
  return cores[s.temaActual]
}
