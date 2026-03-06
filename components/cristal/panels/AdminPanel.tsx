'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — CMS / Mega Panel 
// Gestão de Motor Quant, Motores de IA e Otimização local
// ============================================================

import { useState, useEffect } from 'react'
import { corParaTema } from '@/lib/utils'
import { useTerminalStore } from '@/store/terminal.store'
import { Settings2, Cpu, Bot, Settings, Volume2, Users, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import type { Role } from '@/lib/users'

interface CMSConfig {
    feature_ai: boolean
    feature_news_ai: boolean
    feature_quant: boolean
    feature_voice_squawk: boolean
    feature_war_room: boolean
}

export function AdminPanel() {
    const { temaActual } = useTerminalStore()
    const corTema = corParaTema(temaActual)
    const { data: session } = useSession()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState<CMSConfig>({
        feature_ai: true,
        feature_news_ai: true,
        feature_quant: true,
        feature_voice_squawk: false,
        feature_war_room: false
    })

    const role = (session?.user as { role?: Role })?.role

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/settings')
            if (res.ok) {
                const data = await res.json()
                setConfig(data)
            }
        } catch (e) {
            toast.error('Erro ao ler definições do sistema')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            if (res.ok) {
                toast.success('Alterações gravadas. Efeito imediato no sistema.')
            } else {
                toast.error('Não autorizado ou falha no servidor.')
            }
        } catch (e) {
            toast.error('Erro de conexão ao CMS.')
        } finally {
            setSaving(false)
        }
    }

    const toggleSwitch = (key: keyof CMSConfig) => {
        setConfig(c => ({ ...c, [key]: !c[key] }))
    }

    if (role !== 'MARIANA' && role !== 'ADMIN') {
        return (
            <div className="h-full bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
                <Settings2 size={40} className="text-neutral-800 mb-4" />
                <h2 className="text-neutral-400 text-sm font-bold tracking-widest">ACESSO NEGADO</h2>
                <p className="text-neutral-600 text-[10px] uppercase mt-2">Privilégios de Administrador / Arquitecto necessários</p>
            </div>
        )
    }

    return (
        <div className="h-full bg-[#0A0A0A] font-mono flex flex-col overflow-hidden">
            {/* ── CABEÇALHO ─────────────────── */}
            <div className="border-b border-neutral-800 shrink-0 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ backgroundColor: corTema + '20', color: corTema }}>
                            <Settings2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-bold tracking-wide">CMS & OVERRIDE PANEL</h1>
                            <p className="text-neutral-400 text-xs">Gestão direta de módulos pesados, IA e Otimização do Sistema.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchSettings}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                            Reload
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center whitespace-nowrap gap-2 px-3 py-1.5 rounded font-bold text-[10px] md:text-xs text-black transition-all hover:brightness-110 active:scale-95"
                            style={{ backgroundColor: corTema }}
                        >
                            <Save size={12} />
                            {saving ? 'A GRAVAR...' : 'GRAVAR MASTER'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CORPO ─────────────────────── */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Cartão Inteligência Artificial */}
                    <div className="bg-[#0f0f0f] border border-neutral-800 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                            <Bot size={16} className="text-purple-400" />
                            <h3 className="text-sm font-bold text-neutral-200">Motores Cérebro Local (Ollama)</h3>
                        </div>
                        <div className="p-4 space-y-6">
                            <ToggleRow
                                icon={<Bot size={14} />}
                                title="Assistente IA Global"
                                desc="Liga/Desliga o Chatbot Terminal e NLP Parse dos Comandos."
                                active={config.feature_ai}
                                onChange={() => toggleSwitch('feature_ai')}
                                cor={corTema}
                            />
                            <ToggleRow
                                icon={<Settings size={14} />}
                                title="Notícias AI (Background Worker)"
                                desc="Análise automática de sentimento usando LLaMA-3 no fetch `/api/news`. Desliga isto para limpar os ventoinhas do PC durante desenvolvimento UI."
                                active={config.feature_news_ai}
                                onChange={() => toggleSwitch('feature_news_ai')}
                                cor={corTema}
                            />
                        </div>
                    </div>

                    {/* Cartão Motores Financeiros */}
                    <div className="bg-[#0f0f0f] border border-neutral-800 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                            <Cpu size={16} className="text-amber-400" />
                            <h3 className="text-sm font-bold text-neutral-200">Algoritmia & Processamento Físico</h3>
                        </div>
                        <div className="p-4 space-y-6">
                            <ToggleRow
                                icon={<Cpu size={14} />}
                                title="Quant Engine (Python/WASM)"
                                desc="Desativar corta acesso aos simuladores Monte-Carlo, regressões e child processes de Python na infra-estrutura do container/server."
                                active={config.feature_quant}
                                onChange={() => toggleSwitch('feature_quant')}
                                cor={corTema}
                            />
                        </div>
                    </div>

                    {/* Cartão Experimental (Bloomberg on Steroids Features) */}
                    <div className="bg-[#0f0f0f] border border-neutral-800 rounded-lg overflow-hidden md:col-span-2">
                        <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                            <Settings2 size={16} className="text-green-400" />
                            <h3 className="text-sm font-bold text-neutral-200">Módulos Experimentais (Beta Testing)</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ToggleRow
                                icon={<Volume2 size={14} />}
                                title="Audio Squawk (TTS Alertas)"
                                desc="O Terminal irá vocalizar avisos sintéticos de Notícias e Alertas do Sentinela."
                                active={config.feature_voice_squawk}
                                onChange={() => toggleSwitch('feature_voice_squawk')}
                                cor={corTema}
                            />
                            <ToggleRow
                                icon={<Users size={14} />}
                                title="Modo War Room (SSE Co-op)"
                                desc="Ativo apenas em localhost/VPN. Liga sincronização de cursores multi-operador e partilha de gráficos."
                                active={config.feature_war_room}
                                onChange={() => toggleSwitch('feature_war_room')}
                                cor={corTema}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function ToggleRow({ icon, title, desc, active, onChange, cor }: { icon: React.ReactNode, title: string, desc: string, active: boolean, onChange: () => void, cor: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 text-neutral-300 mb-1">
                    <span className="text-neutral-500">{icon}</span>
                    <span className="text-xs font-bold">{title}</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed pr-8">{desc}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-5 w-9 items-center rounded-full shrink-0 transition-colors duration-300 ease-in-out focus:outline-none group`}
                style={{ backgroundColor: active ? cor : '#262626' }}
            >
                <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-black shadow ring-0 transition-transform duration-300 ease-in-out`}
                    style={{ transform: `translateX(${active ? '1.25rem' : '0.25rem'})` }}
                />
            </button>
        </div>
    )
}
