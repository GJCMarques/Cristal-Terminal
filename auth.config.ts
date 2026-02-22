// ============================================================
// CRISTAL CAPITAL TERMINAL — Auth Config (edge-compatible)
// Usado pelo middleware — sem bcrypt nem otplib aqui
// ============================================================

import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user
      const path = nextUrl.pathname

      // Rotas sempre públicas
      const isPublic =
        path.startsWith('/login') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/api/seed-redis') ||
        path.startsWith('/api/init-scheduler')

      if (isPublic) return true
      if (loggedIn) return true

      // Redirecionar para /login guardando a URL de destino
      return Response.redirect(new URL(`/login?from=${encodeURIComponent(path)}`, nextUrl))
    },

    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'VIEWER'
        token.email = user.email ?? token.email
        token.name = user.name ?? token.name
        token.sub = user.id ?? token.sub
      }
      return token
    },

    session({ session, token }) {
      if (session.user && token) {
        (session.user as { role?: string }).role = (token.role as string) ?? 'VIEWER'
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  providers: [], // preenchido em auth.ts
}
