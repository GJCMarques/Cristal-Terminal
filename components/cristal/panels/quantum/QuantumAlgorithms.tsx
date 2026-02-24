import React from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts'
import { BlochSphere3D } from './visualizers/BlochSphere3D'
import { WaveSurfacePlotly } from './visualizers/WaveSurfacePlotly'
import { EnergyLandscape3D } from './visualizers/EnergyLandscape3D'
import { ZXCalculusGraph3D } from './visualizers/ZXCalculusGraph3D'
import { EntanglementHeatmap } from './visualizers/EntanglementHeatmap'

import type {
    ResultadoBellState, ResultadoQAE, ResultadoQAOA, ResultadoGrover, ResultadoQuantumVaR, ResultadoVQE
} from '@/lib/quantum/algorithms'

// ── Helpers VIsuias ──────────────────────────────────────────

function MetricaBox({ label, valor, sub, corTema }: { label: string; valor: string; sub?: string; corTema: string }) {
    return (
        <div className="border border-neutral-800/80 rounded p-3 bg-gradient-to-br from-[#080808] to-[#040404]">
            <p className="text-[8px] text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[15px] font-bold leading-tight" style={{ color: corTema, textShadow: `0 0 10px ${corTema}55` }}>{valor}</p>
            {sub && <p className="text-[8px] text-neutral-500 mt-1 italic">{sub}</p>}
        </div>
    )
}

function SecTitulo({ titulo, corTema }: { titulo: string; corTema: string }) {
    return (
        <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: corTema, boxShadow: `0 0 8px ${corTema}` }} />
            <p className="text-[9px] font-bold tracking-widest text-neutral-300">
                {titulo}
            </p>
        </div>
    )
}

const TT_STYLE = (cor: string) => ({
    background: '#080808BB',
    backdropFilter: 'blur(4px)',
    border: `1px solid ${cor}44`,
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#AAA'
})
const TICK_STYLE = { fill: '#6B7280', fontSize: 9, fontFamily: 'monospace' }

// ── Views ───────────────────────────────────────────────────

export function RenderBell({ r, corTema }: { r: ResultadoBellState; corTema: string }) {
    const amostraData = Object.entries(r.amostras).map(([k, v]) => ({ estado: '|' + k + '⟩', contagem: v })).sort((a, b) => a.estado.localeCompare(b.estado))

    // Real Entanglement Matrix Density mapped for heatmaps
    const dens = [[0.5, 0, 0, 0.5], [0, 0, 0, 0], [0, 0, 0, 0], [0.5, 0, 0, 0.5]]
    const labels = ['|00⟩', '|01⟩', '|10⟩', '|11⟩']

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div>
                    <SecTitulo titulo="QUBIT FASE (BLOCH SPHERE)" corTema={corTema} />
                    {r.simState && <BlochSphere3D alpha={{ re: r.simState[0][0], im: r.simState[0][1] }} beta={{ re: r.simState[3][0], im: r.simState[3][1] }} color={corTema} />}
                </div>
                <div className="flex flex-col">
                    <SecTitulo titulo="ENTANGLEMENT HEATMAP ρ" corTema={corTema} />
                    <div className="flex-1"><EntanglementHeatmap densityMatrix={dens} labels={labels} color={corTema} /></div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <MetricaBox label="Estado Quântico" valor="|Φ⁺⟩" sub="Superposição Pura" corTema={corTema} />
                <MetricaBox label="Correlação" valor="100%" sub="Einstein-Podolsky-Rosen" corTema={corTema} />
                <MetricaBox label="Concurrence" valor={r.entanglementMeasure.toFixed(2)} sub="Máximo Emaranhamento" corTema={corTema} />
                <MetricaBox label="Probabilidade" valor="50 / 50" sub="|00⟩ e |11⟩ Amp." corTema={corTema} />
            </div>

            <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                <div>
                    <SecTitulo titulo="AMPLITUDES MATEMÁTICAS EXATAS" corTema={corTema} />
                    <pre className="text-[10px] p-3 rounded border border-neutral-800/80 bg-[#080808] text-neutral-400" style={{ textShadow: `0 0 5px ${corTema}33` }}>
                        {`|ψ⟩ = (1/√2)|00⟩ + (1/√2)|11⟩\n\nStatevector:\nα₀₀ = ${r.simState[0][0].toFixed(3)} + ${r.simState[0][1].toFixed(3)}i\nα₀₁ = ${r.simState[1][0].toFixed(3)} + ${r.simState[1][1].toFixed(3)}i\nα₁₀ = ${r.simState[2][0].toFixed(3)} + ${r.simState[2][1].toFixed(3)}i\nα₁₁ = ${r.simState[3][0].toFixed(3)} + ${r.simState[3][1].toFixed(3)}i`}
                    </pre>
                </div>
                <div>
                    <SecTitulo titulo="AMPLIFICAÇÃO GRÁFICA" corTema={corTema} />
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={amostraData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                            <XAxis dataKey="estado" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                            <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#111' }} contentStyle={TT_STYLE(corTema)} />
                            <Bar dataKey="contagem" fill={corTema} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export function RenderGrover({ r, corTema }: { r: ResultadoGrover; corTema: string }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                <div className="flex flex-col">
                    <SecTitulo titulo="TOPOLOGIA ZX-CALCULUS" corTema={corTema} />
                    <div className="flex-1"><ZXCalculusGraph3D color={corTema} /></div>
                </div>
                <div className="flex flex-col">
                    <SecTitulo titulo="AMPLITUDE WAVE INTERFERENCE" corTema={corTema} />
                    <div className="flex-1 border border-neutral-800 rounded-md bg-[#050505] p-2">
                        <WaveSurfacePlotly distribution={r.distribuicao} color={corTema} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <MetricaBox label="Anomalia Detectada" valor={r.estadoBinario} sub={`Vector Binário`} corTema={corTema} />
                <MetricaBox label="Amplitude P" valor={`${(r.probabilidade * 100).toFixed(1)}%`} sub="Estado Amplificado" corTema={corTema} />
                <MetricaBox label="Iter. Quânticas" valor={String(r.iteracoesQuanticas)} sub={`O(√N) Óptimo`} corTema={corTema} />
                <MetricaBox label="Speedup vs Clássico" valor={`${r.speedup}×`} sub={`O(N) Classical`} corTema={corTema} />
            </div>

            <div>
                <SecTitulo titulo="DISTRIBUIÇÃO DE AMPLITUDES (TOP 12 EIGENSTATES)" corTema={corTema} />
                <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={r.distribuicao}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#151515" vertical={false} />
                            <XAxis dataKey="estado" tick={{ ...TICK_STYLE, fontSize: 8 }} axisLine={false} />
                            <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#111' }} contentStyle={TT_STYLE(corTema)} />
                            <Bar dataKey="prob" radius={[2, 2, 0, 0]}>
                                {r.distribuicao.map((d, i) => <Cell key={i} fill={d.marcado ? '#ef4444' : corTema + '55'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export function RenderQAOA({ r, corTema }: { r: ResultadoQAOA; corTema: string }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div>
                    <SecTitulo titulo="ENERGY LANDSCAPE 3D (Z-Hamiltonian)" corTema={corTema} />
                    <EnergyLandscape3D landscape={r.landscape} color={corTema} />
                </div>
                <div>
                    <SecTitulo titulo="MARKOWITZ HAMILTONIAN DESCENDING" corTema={corTema} />
                    <div className="h-[250px] w-full border border-neutral-800 rounded-md bg-[#050505] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={r.convergencia.map((c, i) => ({ step: i, energy: c }))}>
                                <CartesianGrid stroke="#111" vertical={false} />
                                <XAxis dataKey="step" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                                <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={TT_STYLE(corTema)} />
                                <Line type="monotone" dataKey="energy" stroke={corTema} strokeWidth={2} dot={false} style={{ filter: `drop-shadow(0 0 5px ${corTema})` }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <MetricaBox label="Sharpe Ratio (CQ)" valor={r.sharpe.toFixed(3)} sub="MaxCut/Markowitz" corTema={corTema} />
                <MetricaBox label="Retorno Projetado" valor={`${(r.retornoEsperado * 100).toFixed(1)}%`} sub="Portfolio Expectation" corTema={corTema} />
                <MetricaBox label="Risco (Volatilidade)" valor={`${(r.volatilidade * 100).toFixed(1)}%`} sub="Ising Couplings" corTema={corTema} />
                <MetricaBox label="Hilbert Space" valor={`${r.nPortfoliosPossiveis}`} sub={`Dimensão 2^${r.nQubits}`} corTema={corTema} />
            </div>
        </div>
    )
}

export function RenderQAE({ r, corTema }: { r: ResultadoQAE; corTema: string }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                <div>
                    <SecTitulo titulo="ORACLE BLOCH SPHERE" corTema={corTema} />
                    <BlochSphere3D color={corTema} alpha={{ re: r.simState[1][0], im: r.simState[1][1] }} beta={{ re: r.simState[4][0], im: r.simState[4][1] }} />
                </div>
                <div className="flex flex-col justify-center gap-3">
                    <MetricaBox label="Preço Derivativo (QAE)" valor={`$${r.valorEstimado.toFixed(4)}`} sub="Quantum Amplitude Est." corTema={corTema} />
                    <MetricaBox label="Preço Exacto (Black-Scholes)" valor={`$${r.comparacaoClassica.toFixed(4)}`} sub="Clássico Analítico" corTema={corTema} />
                    <div className="grid grid-cols-2 gap-3">
                        <MetricaBox label="O(1/ε) Avaliações" valor={r.avaliacoesQuanticas.toLocaleString()} sub="Quantum Monte Carlo" corTema={corTema} />
                        <MetricaBox label="Speedup Quântico" valor={`${r.speedupFator.toLocaleString()}×`} sub="Aceleração Quadrática" corTema={corTema} />
                    </div>
                </div>
            </div>
            <div className="p-4 bg-[#080808] border border-neutral-800 rounded">
                <p className="text-[10px] text-neutral-300 tracking-wide font-mono leading-relaxed" style={{ textShadow: `0 0 5px ${corTema}55` }}>
                    <span style={{ color: corTema }}>[QUANTUM KERNEL]</span> Executando Operador Rotacional Grover <br />
                    U_Q = -H^{"{\\otimes N}"} U_0 H^{"{\\otimes N}"} U_f <br />
                    Eigenvalues são fases do tipo e^{"{±iθ}"} <br />
                    A estimativa quântica converge a integral de opção sem trajectórias completas.
                </p>
            </div>
        </div>
    )
}

export function RenderVaR({ r, corTema }: { r: ResultadoQuantumVaR; corTema: string }) {
    return (
        <div className="space-y-4">
            <SecTitulo titulo="QUANTUM MONTE CARLO VaR (CAIL DISTRIBUTION)" corTema={corTema} />
            <div className="h-[200px] w-full border border-neutral-800 rounded bg-[#050505] p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={r.distribuicao}>
                        <CartesianGrid stroke="#151515" vertical={false} />
                        <XAxis dataKey="retorno" tick={{ ...TICK_STYLE, fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#111' }} contentStyle={TT_STYLE(corTema)} />
                        <Bar dataKey="prob" radius={[2, 2, 0, 0]}>
                            {r.distribuicao.map((d, i) => <Cell key={i} fill={d.retorno < -r.var95 ? '#ef4444' : corTema + '55'} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <MetricaBox label="Quantum VaR (95%)" valor={`${r.var95.toFixed(2)}%`} sub="10-day Risk" corTema={corTema} />
                <MetricaBox label="Quantum VaR (99%)" valor={`${r.var99.toFixed(2)}%`} sub="Tail Risk" corTema={corTema} />
                <MetricaBox label="O(1/ε) Evals" valor={`${r.avaliacoesQuanticas}`} sub="Oracle queries" corTema={corTema} />
                <MetricaBox label="Speedup vs MC" valor={`${r.speedupFator}×`} sub="Quadratic" corTema={corTema} />
            </div>
        </div>
    )
}

export function RenderVQE({ r, corTema }: { r: ResultadoVQE; corTema: string }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div>
                    <SecTitulo titulo="VQE ANSATZ" corTema={corTema} />
                    <div className="flex-1"><ZXCalculusGraph3D color={corTema} /></div>
                </div>
                <div>
                    <SecTitulo titulo="MINIMIZE ⟨ψ(θ)|H|ψ(θ)⟩" corTema={corTema} />
                    <div className="h-[250px] w-full border border-neutral-800 rounded bg-[#050505] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={r.convergenciaEnergia.map((c, i) => ({ opt: i, energy: c }))}>
                                <CartesianGrid stroke="#111" vertical={false} />
                                <XAxis dataKey="opt" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                                <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={TT_STYLE(corTema)} />
                                <Line type="monotone" dataKey="energy" stroke={corTema} strokeWidth={2} dot={false} style={{ filter: `drop-shadow(0 0 5px ${corTema})` }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <MetricaBox label="Eigenvalue Mín." valor={r.eigenvalueMin.toFixed(4)} sub="Ground State Energy" corTema={corTema} />
                <MetricaBox label="Von Neumann Ent." valor={`S(ρ) = ${r.entanglementEntropy.toFixed(2)}`} sub="Decoerência" corTema={corTema} />
                <MetricaBox label="Ising Couplings" valor="Pauli X, Y, Z" sub="Decomposition" corTema={corTema} />
                <MetricaBox label="Hardware Circuit" valor={r.ansatz.substring(0, 10)} sub={r.circuitDepth + ' depth'} corTema={corTema} />
            </div>
        </div>
    )
}
