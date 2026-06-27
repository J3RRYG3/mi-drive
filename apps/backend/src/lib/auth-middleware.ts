import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { NextRequest } from 'next/server'

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
      tokenUse: 'id',
      clientId: process.env.AWS_COGNITO_CLIENT_ID!,
    })
  }
  return verifier
}

export interface JwtPayload {
  sub: string
  email: string
  'cognito:username': string
}

export async function verifyToken(req: NextRequest): Promise<JwtPayload> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token de autorización no proporcionado')
  }

  const token = authHeader.slice(7)
  const payload = await getVerifier().verify(token)

  return payload as unknown as JwtPayload
}
