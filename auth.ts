// ============================================================
// CRISTAL CAPITAL TERMINAL — NextAuth v5 (Auth.js)
// Credentials + TOTP MFA via otplib
// ============================================================

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { buscarUtilizadorPorEmail, verificarPassword } from './lib/users'
import { z } from 'zod'

const SchemaLogin = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credenciais',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'Código MFA', type: 'text'  },
      },
      async authorize(credentials) {
        const parsed = SchemaLogin.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, totpCode } = parsed.data

        const user = await buscarUtilizadorPorEmail(email)
        if (!user) return null

        const senhaValida = await verificarPassword(password, user.passwordHash)
        if (!senhaValida) return null

        // Verificar TOTP se MFA activo (dynamic import para evitar ESM/CJS)
        if (user.mfaEnabled && user.mfaSecret) {
          if (!totpCode) return null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { authenticator } = await import('otplib') as any
          const totpValido = authenticator.verify({
            token:  totpCode.replace(/\s/g, ''),
            secret: user.mfaSecret,
          })
          if (!totpValido) return null
        }

        return {
          id:    user.email,
          email: user.email,
          name:  user.nome,
          role:  user.role,
        }
      },
    }),
  ],
})
