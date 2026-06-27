import { PrismaClient } from '@prisma/client'

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function buildPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: buildConnectionUrl(),
      },
    },
  })
}

function buildConnectionUrl(): string {
  const server = process.env.AZURE_SQL_SERVER!
  const database = process.env.AZURE_SQL_DATABASE || 'midrive-user-db'
  const user = process.env.AZURE_SQL_USER!
  const password = encodeURIComponent(process.env.AZURE_SQL_PASSWORD!)

  return (
    `sqlserver://${server}:1433;` +
    `database=${database};` +
    `user=${user};` +
    `password=${password};` +
    `encrypt=true;` +
    `trustServerCertificate=false;` +
    `connectionTimeout=30;`
  )
}

// Retry logic para Azure SQL Serverless (cold starts)
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const isTransient =
        error instanceof Error &&
        (error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED'))

      if (!isTransient || attempt === retries) throw error

      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      console.warn(`[DB] Intento ${attempt}/${retries} fallido. Reintentando en ${delay}ms...`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

export const prisma: PrismaClient =
  global.__prisma ?? buildPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}
