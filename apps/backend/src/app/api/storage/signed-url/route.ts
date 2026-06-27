import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyToken } from '@/lib/auth-middleware'
import { generateSignedUploadUrl, generateSignedDownloadUrl } from '@/lib/gcs'

const SignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  operation: z.enum(['upload', 'download']),
  objectPath: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const jwtPayload = await verifyToken(req)
    const body = await req.json()
    const { fileName, mimeType, operation, objectPath } = SignedUrlSchema.parse(body)

    let url: string
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    if (operation === 'upload') {
      url = await generateSignedUploadUrl(jwtPayload.sub, fileName, mimeType)
    } else {
      if (!objectPath) {
        return NextResponse.json(
          { error: 'objectPath requerido para descarga' },
          { status: 400 },
        )
      }
      url = await generateSignedDownloadUrl(objectPath)
    }

    return NextResponse.json({ data: { url, expiresAt } }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 },
      )
    }

    const isAuthError =
      error instanceof Error &&
      (error.message.includes('Token') || error.message.includes('expired'))

    console.error('[POST /api/storage/signed-url]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: isAuthError ? 401 : 500 },
    )
  }
}
