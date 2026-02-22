import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      role: string
    } & DefaultSession['user']
  }
}

// next-auth v5 expõe JWT via 'next-auth/jwt'
// Augment com cuidado — o subpath pode variar consoante a versão beta
declare module '@auth/core/jwt' {
  interface JWT {
    role?: string
  }
}
