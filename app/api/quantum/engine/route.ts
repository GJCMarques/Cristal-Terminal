import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const KEY = 'quantum:engine:state'

export async function GET() {
  try {
    const db = await getDb()
    const row = await db.get<{ value: string }>('SELECT value FROM kv WHERE key = ?', [KEY])
    const ligado = row ? row.value !== 'off' : true // default ON se não existe
    return NextResponse.json({ ligado })
  } catch {
    return NextResponse.json({ ligado: true })
  }
}

export async function POST(req: Request) {
  try {
    const { ligado } = await req.json()
    const db = await getDb()
    await db.run(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
      [KEY, ligado ? 'on' : 'off']
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
