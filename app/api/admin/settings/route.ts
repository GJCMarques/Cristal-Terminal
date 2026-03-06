// ============================================================
// CRISTAL CAPITAL TERMINAL — API de Definições de Sistema / CMS
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@/auth'
import type { Role } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    const role = (session?.user as { role?: Role })?.role

    // Apenas ADMIN ou MARIANA podem aceder
    if (role !== 'ADMIN' && role !== 'MARIANA') {
        return NextResponse.json({ erro: 'Não autorizado' }, { status: 403 })
    }

    try {
        const db = await getDb()
        const rows = await db.all("SELECT key, value FROM kv WHERE key LIKE 'feature_%'")

        // Fallback defaults se não existirem na BD
        const defaultSettings: Record<string, boolean> = {
            feature_ai: true,
            feature_news_ai: true,
            feature_quant: true,
            feature_voice_squawk: false,
            feature_war_room: false
        }

        const settings = { ...defaultSettings }

        for (const r of rows) {
            if (r.key in settings) {
                settings[r.key] = r.value === '1' || r.value === 'true'
            }
        }

        return NextResponse.json(settings)
    } catch (error) {
        return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const session = await auth()
    const role = (session?.user as { role?: Role })?.role

    if (role !== 'ADMIN' && role !== 'MARIANA') {
        return NextResponse.json({ erro: 'Não autorizado' }, { status: 403 })
    }

    try {
        const data = await req.json()
        const db = await getDb()

        // O data é um Record<string, boolean> ex: { feature_news_ai: false }
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('feature_')) {
                await db.run(
                    'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
                    key,
                    value ? '1' : '0'
                )
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ erro: 'Erro interno ao guardar definições' }, { status: 500 })
    }
}
