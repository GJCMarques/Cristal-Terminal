'use client'

import { useRef, useEffect } from 'react'
import 'katex/dist/katex.min.css'

// ── KaTeX formula renderer ──────────────────────────────────────
// Shared across Quant, Quantum, YieldCurve and other panels

interface MathFormulaProps {
  tex: string
  display?: boolean
}

export function MathFormula({ tex, display = false }: MathFormulaProps) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) {
      try {
        const katex = require('katex')
        katex.render(tex, ref.current, { throwOnError: false, displayMode: display })
      } catch {
        if (ref.current) ref.current.textContent = tex
      }
    }
  }, [tex, display])
  return <span ref={ref} />
}

interface FormulaBlockProps {
  tex: string
  label: string
}

export function FormulaBlock({ tex, label }: FormulaBlockProps) {
  return (
    <div className="border border-[#111] rounded px-3 py-2 bg-[#050505] flex flex-col gap-1">
      <p className="text-[8px] text-[#333] uppercase tracking-widest">{label}</p>
      <div className="text-[10px] text-[#666] font-mono overflow-x-auto">
        <MathFormula tex={tex} display />
      </div>
    </div>
  )
}
