// Endpoint para seed de utilizadores demo (só em desenvolvimento)
import { seedUtilizadoresDemo } from '@/lib/users'
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    return NextResponse.json({ erro: 'Não disponível em produção' }, { status: 403 })
  }
  try {
    const resultado = await seedUtilizadoresDemo()
    return NextResponse.json({ ok: true, ...resultado })
  } catch (error) {
    return NextResponse.json({ erro: String(error) }, { status: 500 })
  }
}
