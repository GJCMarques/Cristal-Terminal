'use client'

import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'
import { Terminal, Database, Activity } from 'lucide-react'

export function QuantumStatusBar() {
    const { temaActual } = useTerminalStore()
    const corTema = corParaTema(temaActual)

    return (
        <footer className="flex items-center justify-between px-4 py-1.5 bg-[#000] border-t border-[#111] shrink-0 font-mono text-[9px] text-neutral-600 select-none">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Terminal size={10} style={{ color: corTema }} />
                    <span>QASM 3.0 ENGINE SECURE</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>STATEVECTOR CONNECTED</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Database size={10} />
                    <span>MATH.JS COMPLEX ALGEBRA</span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity size={10} style={{ color: corTema }} />
                    <span>LATENCY: 12ms</span>
                </div>
                <div>
                    <span>CRISTAL CAPITAL © {new Date().getFullYear()}</span>
                </div>
            </div>
        </footer>
    )
}
