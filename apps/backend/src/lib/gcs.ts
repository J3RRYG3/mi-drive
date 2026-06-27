import { Storage } from '@google-cloud/storage'

function getStorageClient(): Storage {
  const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n')

  return new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: privateKey,
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
