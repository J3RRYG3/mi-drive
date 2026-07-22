import { Storage } from '@google-cloud/storage'

function getStorageClient(): Storage {
  // GCP_SERVICE_ACCOUNT_KEY_B64: el JSON completo en base64 para evitar que
  // Cloud Run corrompa el JSON al pasar saltos de línea en env vars.
  const b64 = process.env.GCP_SERVICE_ACCOUNT_KEY_B64
  const raw = process.env.GCP_SERVICE_ACCOUNT_KEY
  const saKeyJson = b64
    ? Buffer.from(b64, 'base64').toString('utf8')
    : raw
  if (saKeyJson) {
    const sa = JSON.parse(saKeyJson)
    return new Storage({
      projectId: sa.project_id,
      credentials: { client_email: sa.client_email, private_key: sa.private_key },
    })
  }

  return new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  })
}

const BUCKET_NAME =
  process.env.GCP_BUCKET_NAME ||
  `midrive-user-files-${process.env.GCP_PROJECT_ID}`

const SIGNED_URL_EXPIRY_SECONDS = 15 * 60 // 15 minutos

export async function generateSignedUploadUrl(
  userId: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const storage = getStorageClient()
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const objectPath = `users/${userId}/${Date.now()}_${safeFileName}`

  const [url] = await storage
    .bucket(BUCKET_NAME)
    .file(objectPath)
    .getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000,
      contentType: mimeType,
    })

  return url
}

export async function generateSignedDownloadUrl(
  objectPath: string,
): Promise<string> {
  const storage = getStorageClient()

  const [url] = await storage
    .bucket(BUCKET_NAME)
    .file(objectPath)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000,
    })

  return url
}

export { BUCKET_NAME }
