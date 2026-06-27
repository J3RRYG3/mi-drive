import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loginWithCognito } from '@/lib/cognito'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = LoginSchema.parse(body)

    const tokens = await loginWithCognito(email, password)

    return NextResponse.json({ data: tokens }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.errors },
        { status: 400 },
      )
    }

    const message =
      error instanceof Error ? error.message : 'Error de autenticación'

    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
