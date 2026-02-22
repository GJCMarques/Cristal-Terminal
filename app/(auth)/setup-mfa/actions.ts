'use server'

import { auth } from '@/auth'
import QRCode from 'qrcode'
import { actualizarMFA, buscarUtilizadorPorEmail } from '@/lib/users'

export async function gerarSecretMFA(): Promise<{ secret: string; qrCodeUrl: string; uri: string } | { erro: string }> {
  const session = await auth()
  if (!session?.user?.email) return { erro: 'Não autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { authenticator } = await import('otplib') as any
  const secret = authenticator.generateSecret()
  const uri    = authenticator.keyuri(session.user.email, 'Cristal Capital Terminal', secret)
  const qrCodeUrl = await QRCode.toDataURL(uri, {
    width:  200,
    margin: 2,
    color:  { dark: '#F59E0B', light: '#0A0A0A' },
  })

  return { secret, qrCodeUrl, uri }
}

export async function confirmarMFA(
  secret: string,
  codigo: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  const session = await auth()
  if (!session?.user?.email) return { sucesso: false, erro: 'Não autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { authenticator: auth2fa } = await import('otplib') as any
  const valido = auth2fa.verify({ token: codigo.replace(/\s/g, ''), secret })
  if (!valido) return { sucesso: false, erro: 'Código inválido. Tente novamente.' }

  await actualizarMFA(session.user.email, secret, true)
  return { sucesso: true }
}

export async function desactivarMFA(): Promise<{ sucesso: boolean }> {
  const session = await auth()
  if (!session?.user?.email) return { sucesso: false }

  await actualizarMFA(session.user.email, '', false)
  return { sucesso: true }
}

export async function verificarMFAActivo(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.email) return false

  const user = await buscarUtilizadorPorEmail(session.user.email)
  return user?.mfaEnabled ?? false
}
