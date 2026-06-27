import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  type AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
})

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID!
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID!

export interface LoginResult {
  accessToken: string
  idToken: string
  refreshToken: string
  email: string
}

export async function loginWithCognito(
  email: string,
  password: string,
): Promise<LoginResult> {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH' as AuthFlowType,
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  })

  const response = await cognitoClient.send(command)
  const authResult = response.AuthenticationResult

  if (!authResult?.AccessToken || !authResult.IdToken || !authResult.RefreshToken) {
    throw new Error('Autenticación fallida: tokens no recibidos')
  }

  return {
    accessToken: authResult.AccessToken,
    idToken: authResult.IdToken,
    refreshToken: authResult.RefreshToken,
    email,
  }
}

export { USER_POOL_ID, CLIENT_ID }
