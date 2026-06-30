import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    serverComponentsExternalPackages: ['mssql', '@prisma/client'],
  },
}

export default nextConfig
