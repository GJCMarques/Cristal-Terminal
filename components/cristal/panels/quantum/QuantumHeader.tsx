'use client'

import { useState, useEffect } from 'react'
import {
    Globe, TrendingUp, Shield, Zap, Keyboard, LayoutGrid, Bell, Check, Atom, BarChart2, Layers, Network
} from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema, CORES_TEMA } from '@/lib/utils'
import { UserButton } from '../../UserButton'
import { LocaleSelector } from '../../LocaleSelector'

type DemoId = 'bell' | 'qae-opcao' | 'qaoa' | 'grover' | 'quantum-var' | 'vqe-liquidez'

interface TabDef {
    vista?: string
    demo?: DemoId
    label: string
    tecla: string
    icone?: React.ReactNode
}

interface GrupoTabs {
    grupo: string
    cor: string
    tabs: TabDef[]
}

const GRUPOS_TABS: GrupoTabs[] = [
    {
        grupo: 'MATEMÁTICA PURA',
        cor: '#3B82F6',
        tabs: [
            { demo: 'bell', label: 'EPR', tecla: '', icone: <Atom size={10} /> },
        ],
    },
    {
        grupo: 'MACHINE LEARNING',
        cor: '#EAB308',
        tabs: [
            { demo: 'q-gan' as any, label: 'Q-GAN', tecla: '', icone: <Network size={10} /> },
            { demo: 'tensor' as any, label: 'TENSOR', tecla: '', icone: <LayoutGrid size={10} /> },
        ],
    },
    {
        grupo: 'PORTFOLIO',
        cor: '#10B981',
        tabs: [
            { demo: 'qaoa', label: 'QAOA', tecla: '', icone: <TrendingUp size={10} /> },
        ],
    },
    {
        grupo: 'RISCO',
        cor: '#F97316',
        tabs: [
            { demo: 'quantum-var', label: 'Q-VAR', tecla: '', icone: <BarChart2 size={10} /> },
            { demo: 'grover', label: 'GROVER', tecla: '', icone: <Shield size={10} /> },
        ],
    },
    {
        grupo: 'DERIVATIVOS',
        cor: '#8B5CF6',
        tabs: [
            { demo: 'qae-opcao', label: 'QAE', tecla: '', icone: <Zap size={10} /> },
        ],
    },
    {
        grupo: 'LIQUIDEZ',
        cor: '#06B6D4',
        tabs: [
            { demo: 'vqe-liquidez', label: 'VQE', tecla: '', icone: <Layers size={10} /> },
        ],
    }
]

export function QuantumHeader() {
    const {
        definirVista,
        temaActual,
        definirTema,
        alternarPainelLateral,
        iaDisponivel,
    } = useTerminalStore()

    const [hora, setHora] = useState('')
    const [data, setData] = useState('')
    const [mostrarTemas, setMostrarTemas] = useState(false)

    // Local state to feedback selected tab, just visual
    const [activeDemo, setActiveDemo] = useState<DemoId | null>('bell')

    // null = a carregar do DB, true = ligado, false = desligado
    const [engineLigado, setEngineLigado] = useState<boolean | null>(null)

    const corTema = corParaTema(temaActual)

    // Carregar estado do engine da BD no mount
    useEffect(() => {
        fetch('/api/quantum/engine')
            .then(r => r.json())
            .then(({ ligado }) => setEngineLigado(ligado))
            .catch(() => {})
    }, [])

    useEffect(() => {
        const toggleEngine = () => setEngineLigado(p => p === null ? false : !p)
        window.addEventListener('toggle-quantum-engine', toggleEngine)

        const actualizar = () => {
            const agora = new Date()
            setHora(agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
            setData(agora.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }))
        }
        actualizar()
        const id = setInterval(actualizar, 1000)

        // Ensure sync if window event changes from elsewhere
        const onDemo = (e: any) => {
            if (e.detail) setActiveDemo(e.detail)
        }
        window.addEventListener('quantum-tab-change', onDemo)

        return () => {
            clearInterval(id)
            window.removeEventListener('toggle-quantum-engine', toggleEngine)
            window.removeEventListener('quantum-tab-change', onDemo)
        }
    }, [])

    const handleTabClick = (tab: TabDef) => {
        if (tab.vista) {
            definirVista(tab.vista as any)
        } else if (tab.demo) {
            setActiveDemo(tab.demo)
            window.dispatchEvent(new CustomEvent('quantum-tab-change', { detail: tab.demo }))
        }
    }

    return (
        <header className="flex flex-col border-b border-neutral-800 bg-black select-none shrink-0" style={{ boxShadow: `0 0 20px -5px ${corTema}55` }}>
            {/* ── Linha superior: logo + info + relógio ──────────── */}
            <div className="flex items-center h-8 border-b border-neutral-900">

                {/* Logo */}
                <div className="flex items-center gap-2 px-3 border-r border-neutral-800 h-full shrink-0" style={{ borderRightColor: corTema + '55' }}>
                    <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="#D7B56D" strokeWidth="6" strokeLinejoin="miter" />
                    </svg>
                    <span className="font-mono text-[11px] font-bold" style={{ color: corTema }}>CRISTAL CAPITAL</span>
                    <span className="font-mono text-[9px] text-neutral-500">—</span>
                    <Atom size={14} style={{ color: corTema, marginLeft: '2px' }} />
                    <span className="font-mono text-[11px] font-bold" style={{ color: corTema }}>QUANTUM ENGINE</span>
                </div>

                {/* Paleta de comandos hint */}
                <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-quantum-palette'))}
                    className="flex items-center gap-1.5 px-3 border-r border-neutral-800 h-full font-mono text-[10px] text-neutral-300 hover:text-neutral-400 transition-colors shrink-0"
                    title="Ctrl+K (Quantum)"
                >
                    <Keyboard size={11} />
                    <span>Ctrl+K</span>
                </button>

                <div className="flex-1" />

                {/* Estado IA & Engine */}
                <div className="flex items-center gap-3 px-3 border-l border-neutral-800 h-full shrink-0">
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-quantum-engine'))}
                        disabled={engineLigado === null}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-800 transition-colors disabled:cursor-default"
                        title="Toggle Quantum Engine"
                    >
                        <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold transition-all"
                            style={{
                                backgroundColor: engineLigado === null ? '#2a2a2a' : engineLigado ? '#10B981' : '#EF4444',
                                color: engineLigado === null ? '#555' : engineLigado ? '#000' : '#fff',
                                boxShadow: 'none',
                            }}
                        >
                            <div
                                className={`w-1.5 h-1.5 rounded-full ${engineLigado === true ? 'animate-pulse' : ''}`}
                                style={{ backgroundColor: engineLigado === null ? '#555' : engineLigado ? '#000' : '#fff' }}
                            />
                            {engineLigado === null ? '…' : engineLigado ? 'ON' : 'OFF'}
                        </div>
                        <span className="font-mono text-[9px] text-neutral-200">
                            {engineLigado === null ? 'LOADING...' : engineLigado ? 'ENGINE RUNNING' : 'ENGINE OFFLINE'}
                        </span>
                    </button>
                    <div className="w-px h-4 bg-neutral-800" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: iaDisponivel === true ? '#10B981' : iaDisponivel === false ? '#EF4444' : '#6B7280' }} />
                        <span className="font-mono text-[9px] text-neutral-200">
                            {iaDisponivel === true ? 'LLAMA 3 ONLINE' : iaDisponivel === false ? 'IA OFFLINE' : '…'}
                        </span>
                    </div>
                </div>

                {/* Selector de tema */}
                <div className="relative border-l border-neutral-800 h-full shrink-0">
                    <button
                        type="button"
                        onClick={() => setMostrarTemas(!mostrarTemas)}
                        className="flex items-center gap-1.5 px-3 h-full font-mono text-[10px] text-neutral-200 hover:text-white transition-colors"
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corTema }} />
                        TEMA
                    </button>
                    {mostrarTemas && (
                        <div className="absolute right-0 top-full z-50 bg-neutral-900 border border-neutral-700 rounded shadow-2xl min-w-[160px]">
                            {(Object.entries(CORES_TEMA) as [string, string][]).map(([t, c]) => {
                                const nomes: Record<string, string> = {
                                    amber: 'Âmbar', green: 'Verde', blue: 'Azul',
                                    purple: 'Roxo', red: 'Vermelho', cyan: 'Ciano',
                                    rose: 'Rosa', slate: 'Ardósia',
                                }
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { definirTema(t as Parameters<typeof definirTema>[0]); setMostrarTemas(false) }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2 font-mono text-[11px] hover:bg-neutral-800 transition-colors"
                                    >
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                                        <span className="text-neutral-300">{nomes[t] ?? t}</span>
                                        {temaActual === t && <Check size={12} className="ml-auto" style={{ color: c }} />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Toggle painel lateral */}
                <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-quantum-sidebar'))}
                    className="flex items-center justify-center px-3 h-full border-l border-neutral-800 text-neutral-300 hover:text-white transition-colors shrink-0"
                    title="Ctrl+B — Alternar painel lateral"
                >
                    <LayoutGrid size={13} />
                </button>

                {/* Selector de idioma */}
                <LocaleSelector />

                {/* Utilizador */}
                <UserButton />

                {/* Relógio */}
                <div className="flex flex-col items-end justify-center px-3 border-l border-neutral-800 h-full shrink-0">
                    <span className="font-mono text-sm font-bold leading-none" style={{ color: corTema }}>{hora}</span>
                    <span className="font-mono text-[9px] text-neutral-300 uppercase leading-none mt-0.5">{data}</span>
                </div>
            </div>

            {/* ── Linha inferior: tabs agrupados ─────────────────── */}
            <nav className="flex items-stretch h-7 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {/* Botão GIGANTE de Volta ao Cristal */}
                <button
                    onClick={() => definirVista('mercado')}
                    className="relative flex items-center gap-2 px-4 h-full border-r border-neutral-800 bg-black transition-colors font-mono text-[11px] font-black tracking-widest shrink-0 group"
                    style={{ color: '#d4d4d4' }}
                >
                    <span className="text-sm font-bold -mt-0.5 group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="tracking-widest relative z-10">VOLTAR - CRISTAL</span>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: '#64748B' }}
                    />
                </button>

                {GRUPOS_TABS.map((grupo, gi) => (
                    <div key={grupo.grupo} className="flex items-stretch shrink-0 bg-black">
                        {/* Separador de grupo */}
                        {gi > 0 && (
                            <div className="w-px bg-neutral-800 my-1" />
                        )}

                        {/* Label do grupo */}
                        <div className="flex items-center px-1.5 shrink-0" title={grupo.grupo}>
                            <div className="w-0.5 h-3 rounded-full opacity-40" style={{ background: grupo.cor }} />
                        </div>

                        {/* Tabs do grupo */}
                        {grupo.tabs.map((tab, idx) => {
                            const activo = activeDemo === tab.demo
                            return (
                                <button
                                    key={tab.demo || tab.vista || `tab-${idx}`}
                                    type="button"
                                    onClick={() => handleTabClick(tab)}
                                    className="relative flex items-center gap-1 px-2.5 font-mono text-[10px] transition-all shrink-0 whitespace-nowrap border-r border-neutral-900 group"
                                    style={{
                                        color: activo ? '#000' : '#d4d4d4',
                                        backgroundColor: activo ? grupo.cor : 'transparent',
                                        borderBottom: activo ? 'none' : '2px solid transparent',
                                    }}
                                    title={`${tab.label}${tab.tecla ? ` (${tab.tecla})` : ''}`}
                                >
                                    {tab.icone && (
                                        <span className="opacity-80 group-hover:opacity-100">{tab.icone}</span>
                                    )}
                                    {tab.tecla && (
                                        <span
                                            className="text-[8px] opacity-95"
                                            style={{ color: activo ? '#000' : grupo.cor }}
                                        >
                                            {tab.tecla}
                                        </span>
                                    )}
                                    <span className="font-bold tracking-tight">{tab.label}</span>
                                    {!activo && (
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
                                            style={{ background: grupo.cor }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ))}

                <div className="flex-1" />
            </nav>
        </header>
    )
}
