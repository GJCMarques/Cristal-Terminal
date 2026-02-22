'use client'

// ============================================================
// CRISTAL CAPITAL TERMINAL — Configuração MFA (TOTP)
// ============================================================

import { useState, useTransition } from 'react'
import { ShieldCheck, QrCode, CheckCircle, X, Loader2, ShieldOff } from 'lucide-react'
import { gerarSecretMFA, confirmarMFA, desactivarMFA } from './actions'

export default function SetupMFAPage() {
  const [passo, setPasso]       = useState<'inicio' | 'qr' | 'confirmar' | 'sucesso' | 'desactivar'>('inicio')
  const [secret, setSecret]     = useState('')
  const [qrUrl, setQrUrl]       = useState('')
  const [codigo, setCodigo]     = useState('')
  const [erro, setErro]         = useState('')
  const [isPending, startTransition] = useTransition()

  const iniciarSetup = () => {
    startTransition(async () => {
      const res = await gerarSecretMFA()
      if ('erro' in res) { setErro(res.erro); return }
      setSecret(res.secret)
      setQrUrl(res.qrCodeUrl)
      setPasso('qr')
    })
  }

  const confirmar = () => {
    if (codigo.replace(/\s/g, '').length !== 6) {
      setErro('Introduza os 6 dígitos do código.')
      return
    }
    startTransition(async () => {
      const res = await confirmarMFA(secret, codigo)
      if (!res.sucesso) { setErro(res.erro ?? 'Código inválido'); return }
      setPasso('sucesso')
    })
  }

  const desactivar = () => {
    startTransition(async () => {
      await desactivarMFA()
      setPasso('inicio')
      setSecret('')
      setQrUrl('')
      setCodigo('')
    })
  }

  return (
    <div className="w-full max-w-sm mx-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
          <ShieldCheck size={20} className="text-amber-500" />
          <div>
            <h2 className="font-mono text-sm font-bold text-white">AUTENTICAÇÃO MFA</h2>
            <p className="font-mono text-[10px] text-neutral-500">TOTP · Google Authenticator</p>
          </div>
        </div>

        {/* Passo: Início */}
        {passo === 'inicio' && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-neutral-400 leading-relaxed">
              Active a autenticação de dois factores para proteger a sua conta com uma aplicação de autenticação (Google Authenticator, Authy, etc.).
            </p>
            <button
              type="button"
              onClick={iniciarSetup}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-black font-mono text-sm font-bold rounded transition-opacity disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
              Activar MFA
            </button>
            <button
              type="button"
              onClick={() => setPasso('desactivar')}
              className="w-full py-2 font-mono text-xs text-neutral-600 hover:text-red-400 transition-colors"
            >
              Desactivar MFA
            </button>
          </div>
        )}

        {/* Passo: QR Code */}
        {passo === 'qr' && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-neutral-400">
              Digitalize o QR code com a sua aplicação de autenticação:
            </p>
            {qrUrl && (
              <div className="flex justify-center p-3 bg-[#0A0A0A] rounded border border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR Code MFA" width={200} height={200} />
              </div>
            )}
            <div className="p-2 bg-neutral-900 rounded border border-neutral-800">
              <p className="font-mono text-[9px] text-neutral-500 mb-1">Secret manual:</p>
              <p className="font-mono text-[10px] text-amber-500 break-all tracking-wider">{secret}</p>
            </div>
            <button
              type="button"
              onClick={() => setPasso('confirmar')}
              className="w-full py-2.5 bg-amber-500 text-black font-mono text-sm font-bold rounded"
            >
              Já digitalizei → Confirmar código
            </button>
          </div>
        )}

        {/* Passo: Confirmar código */}
        {passo === 'confirmar' && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-neutral-400">
              Introduza o código de 6 dígitos da sua aplicação:
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErro('') }}
              placeholder="000 000"
              maxLength={7}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-3 font-mono text-xl text-white text-center tracking-widest outline-none focus:border-amber-500 transition-colors"
            />
            {erro && <p className="font-mono text-xs text-red-400">{erro}</p>}
            <button
              type="button"
              onClick={confirmar}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-black font-mono text-sm font-bold rounded disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Confirmar
            </button>
          </div>
        )}

        {/* Passo: Sucesso */}
        {passo === 'sucesso' && (
          <div className="text-center space-y-4">
            <CheckCircle size={40} className="mx-auto text-emerald-500" />
            <p className="font-mono text-sm font-bold text-white">MFA Activado!</p>
            <p className="font-mono text-xs text-neutral-400">
              A sua conta está agora protegida com autenticação de dois factores.
            </p>
            <a href="/" className="block w-full py-2.5 bg-amber-500 text-black font-mono text-sm font-bold rounded text-center">
              Voltar ao Terminal
            </a>
          </div>
        )}

        {/* Passo: Desactivar */}
        {passo === 'desactivar' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldOff size={16} />
              <p className="font-mono text-sm font-bold">Desactivar MFA</p>
            </div>
            <p className="font-mono text-xs text-neutral-400">
              Tem a certeza? A sua conta ficará protegida apenas por palavra-passe.
            </p>
            <button
              type="button"
              onClick={desactivar}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-900 text-red-300 font-mono text-sm font-bold rounded hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Confirmar Desactivação
            </button>
            <button
              type="button"
              onClick={() => setPasso('inicio')}
              className="w-full py-2 font-mono text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
