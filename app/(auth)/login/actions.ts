'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export type EstadoLogin = {
  erro?: string
  mfaRequerido?: boolean
} | null

export async function loginAction(
  _prevState: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string
  const totpCode = formData.get('totpCode') as string | undefined

  try {
    await signIn('credentials', {
      email,
      password,
      totpCode: totpCode ?? '',
      redirectTo: (formData.get('from') as string) || '/',
    })
    return null
  } catch (error) {
    // next-auth re-lança NEXT_REDIRECT para fazer o redirect — deve propagar
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { erro: 'Credenciais inválidas. Verifique o email e a palavra-passe.' }
        case 'CallbackRouteError':
          return { erro: 'Erro na autenticação. Tente novamente.' }
        default:
          return { erro: `Erro: ${error.type}` }
      }
    }
    return { erro: 'Erro inesperado. Tente novamente.' }
  }
}
