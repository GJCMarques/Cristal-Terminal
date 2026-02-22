// ============================================================
// CRISTAL CAPITAL TERMINAL — Gestão de Utilizadores (SQLite Local)
// ============================================================

import { getDb } from './db'
import bcrypt from 'bcryptjs'

export type Role = 'ADMIN' | 'ANALYST' | 'TRADER' | 'VIEWER'

export interface Utilizador {
  email: string
  passwordHash: string
  nome: string
  role: Role
  mfaEnabled: boolean
  mfaSecret: string
}

// ── Leitura ───────────────────────────────────────────────────

export async function buscarUtilizadorPorEmail(email: string): Promise<Utilizador | null> {
  const db = await getDb()
  const row = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase().trim())

  if (!row) return null

  return {
    email: row.email,
    passwordHash: row.passwordHash,
    nome: row.nome,
    role: row.role as Role,
    mfaEnabled: Boolean(row.mfaEnabled),
    mfaSecret: row.mfaSecret ?? '',
  }
}

export async function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function utilizadorExiste(email: string): Promise<boolean> {
  const db = await getDb()
  const row = await db.get('SELECT email FROM users WHERE email = ?', email.toLowerCase().trim())
  return !!row
}

// ── Escrita ───────────────────────────────────────────────────

export async function criarUtilizador(
  email: string,
  password: string,
  nome: string,
  role: Role = 'VIEWER',
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 12)
  const db = await getDb()

  await db.run(
    'INSERT INTO users (email, passwordHash, nome, role, mfaEnabled, mfaSecret) VALUES (?, ?, ?, ?, ?, ?)',
    email.toLowerCase().trim(),
    passwordHash,
    nome,
    role,
    0, // false em SQLite (integer)
    ''
  )
}

export async function actualizarMFA(
  email: string,
  secret: string,
  enabled: boolean,
): Promise<void> {
  const db = await getDb()
  await db.run(
    'UPDATE users SET mfaSecret = ?, mfaEnabled = ? WHERE email = ?',
    secret,
    enabled ? 1 : 0,
    email.toLowerCase().trim()
  )
}

// ── Seed de utilizadores demo ─────────────────────────────────

const DEMO_USERS: { email: string; password: string; nome: string; role: Role }[] = [
  { email: 'admin@cristal.pt', password: 'Admin123!', nome: 'Administrador', role: 'ADMIN' },
  { email: 'analyst@cristal.pt', password: 'Analyst123!', nome: 'Ana Ferreira', role: 'ANALYST' },
  { email: 'trader@cristal.pt', password: 'Trader123!', nome: 'Tiago Mendes', role: 'TRADER' },
  { email: 'viewer@cristal.pt', password: 'Viewer123!', nome: 'Vítor Costa', role: 'VIEWER' },
]

export async function seedUtilizadoresDemo(): Promise<{ criados: number }> {
  let criados = 0
  for (const u of DEMO_USERS) {
    const existe = await utilizadorExiste(u.email)
    if (!existe) {
      await criarUtilizador(u.email, u.password, u.nome, u.role)
      criados++
    }
  }
  return { criados }
}

// ── Tipos estendidos para next-auth ───────────────────────────
// (definidos em types/next-auth.d.ts)
