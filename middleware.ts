// ============================================================
// CRISTAL CAPITAL TERMINAL — Middleware de Autenticação
// Edge-compatible: usa auth.config.ts (sem bcrypt/otplib)
// ============================================================

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  // Aplica a todas as rotas excepto ficheiros estáticos e _next
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)',
  ],
}
