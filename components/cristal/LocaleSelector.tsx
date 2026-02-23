'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Selector de Idioma
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useTerminalStore } from '@/store/terminal.store'
import { corParaTema } from '@/lib/utils'
import { NOMES_LOCALE, BANDEIRAS_LOCALE, type Locale } from '@/lib/i18n'

const LOCALES: Locale[] = ['pt', 'en', 'es']

export function LocaleSelector() {
  const locale = useTerminalStore((s) => s.locale) as Locale
  const definirLocale = useTerminalStore((s) => s.definirLocale)
  const temaActual = useTerminalStore((s) => s.temaActual)
  const corTema = corParaTema(temaActual)

  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  return (
    <div ref={ref} className="relative border-l border-neutral-800 h-full shrink-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex items-center gap-1 px-2.5 h-full font-mono text-[10px] text-neutral-200 hover:text-white transition-colors"
        title="Idioma / Language"
      >
        <span className="text-[11px]">{BANDEIRAS_LOCALE[locale]}</span>
        <span>{NOMES_LOCALE[locale]}</span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 bg-neutral-900 border border-neutral-700 rounded shadow-2xl min-w-[110px]">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => { definirLocale(loc); setAberto(false) }}
              className="flex items-center gap-2.5 w-full px-3 py-2 font-mono text-[11px] hover:bg-neutral-800 transition-colors"
            >
              <span className="text-[13px]">{BANDEIRAS_LOCALE[loc]}</span>
              <span className="text-neutral-300">{NOMES_LOCALE[loc]}</span>
              {locale === loc && (
                <Check size={12} className="ml-auto" style={{ color: corTema }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
