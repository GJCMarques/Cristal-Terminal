'use client'

import { useEffect, useState } from 'react'
import { Terminal, X, Atom } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'

export function QuantumCommandPalette() {
    const { temaActual, executarComando } = useTerminalStore()
    const [aberto, setAberto] = useState(false)
    const [input, setInput] = useState('')

    const corTema = corParaTema(temaActual)

    useEffect(() => {
        const handleToggle = () => {
            setAberto(prev => {
                if (!prev) setInput('') // reset on open
                return !prev
            })
        }

        // Close on esc
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAberto(false)
        }

        window.addEventListener('toggle-quantum-palette', handleToggle)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('toggle-quantum-palette', handleToggle)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    if (!aberto) return null

    const pularParaDemo = (demo: string) => {
        setAberto(false)
        window.dispatchEvent(new CustomEvent('quantum-tab-change', { detail: demo }))
    }

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-start justify-center pt-[12vh]"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="w-full max-w-xl bg-[#080808] border rounded-lg shadow-2xl flex flex-col overflow-hidden"
                style={{ borderColor: `${corTema}44`, boxShadow: `0 20px 50px -10px ${corTema}22` }}
            >
                <div className="flex items-center px-4 py-3 border-b border-[#1A1A1A]">
                    <Terminal size={14} className="mr-3" style={{ color: corTema }} />
                    <input
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && input.trim()) {
                                // Custom parse for quantum
                                const val = input.trim().toLowerCase()
                                if (val === 'bell' || val === 'epr') pularParaDemo('bell')
                                if (val === 'var' || val === 'risk') pularParaDemo('quantum-var')
                                if (val === 'qae' || val === 'options') pularParaDemo('qae-opcao')
                                if (val === 'qaoa' || val === 'portfolio') pularParaDemo('qaoa')
                                if (val === 'grover') pularParaDemo('grover')
                                if (val === 'vqe' || val === 'liquidity') pularParaDemo('vqe-liquidez')
                                setAberto(false)
                            }
                        }}
                        placeholder="Search Quantum Engine or type /command..."
                        className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-white placeholder-neutral-600"
                    />
                    <button onClick={() => setAberto(false)} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <div className="p-2 space-y-1">
                    <p className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Available Operations</p>
                    <button onClick={() => pularParaDemo('bell')} className="w-full text-left px-3 py-2 text-[11px] font-mono text-neutral-300 hover:bg-[#1A1A1A] rounded flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-2"><Atom size={12} style={{ color: corTema }} /> Bell State Simulation</div>
                        <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">Jump To</span>
                    </button>
                    <button onClick={() => pularParaDemo('qaoa')} className="w-full text-left px-3 py-2 text-[11px] font-mono text-neutral-300 hover:bg-[#1A1A1A] rounded flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-2"><Atom size={12} style={{ color: corTema }} /> QAOA Markowitz Optmization</div>
                        <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">Jump To</span>
                    </button>
                    <button onClick={() => pularParaDemo('quantum-var')} className="w-full text-left px-3 py-2 text-[11px] font-mono text-neutral-300 hover:bg-[#1A1A1A] rounded flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-2"><Atom size={12} style={{ color: corTema }} /> Quantum Monte Carlo VaR</div>
                        <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">Jump To</span>
                    </button>
                    <button onClick={() => pularParaDemo('qae-opcao')} className="w-full text-left px-3 py-2 text-[11px] font-mono text-neutral-300 hover:bg-[#1A1A1A] rounded flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-2"><Atom size={12} style={{ color: corTema }} /> QAE Option Pricing</div>
                        <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">Jump To</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
