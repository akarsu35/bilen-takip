import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getDbUrl = () => process.env.DATABASE_URL || process.env.DIRECT_URL

const createPrismaClient = () => {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    console.error('CRITICAL: No database connection URL found.')
    return null
  }

  try {
    const isSupabase =
      dbUrl.includes('supabase.co') || dbUrl.includes('supabase.com')
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    const adapter = new PrismaPg(pool)
    return new PrismaClient({
      adapter,
      log: ['query', 'error', 'warn'],
    })
  } catch (error) {
    console.error('Prisma initialization error:', error)
    return null
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma as PrismaClient

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    throw new Error(
      'PrismaClient is not initialized. Check your environment variables.',
    )
  }
  return prisma as PrismaClient
}

export default prisma as PrismaClient
