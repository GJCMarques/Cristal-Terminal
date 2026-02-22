// Layout mínimo para rotas de autenticação
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cristal Capital — Autenticação',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline de fundo */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
          backgroundSize: '100% 4px',
        }}
      />
      {children}
    </div>
  )
}
