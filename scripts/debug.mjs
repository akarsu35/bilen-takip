import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

async function debug() {
  console.log('--- DEBUG DIAGNOSTICS ---')
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL is not found in .env file!')
    process.exit(1)
  }

  console.log(
    '✅ DATABASE_URL found (starts with: ' + dbUrl.substring(0, 20) + '...)'
  )

  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  })

  console.log('Attempting to connect to database...')

  try {
    const client = await pool.connect()
    console.log('✅ Basic PG connection successful!')
    client.release()

    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    const res = await prisma.$queryRaw`SELECT 1 as result`
    console.log('✅ Prisma $queryRaw successful:', res)

    const studentCount = await prisma.student.count()
    console.log('📊 Current Student Count in DB:', studentCount)

    await prisma.$disconnect()
  } catch (err) {
    console.error('❌ CONNECTION FAILED!')
    console.error(err)
  } finally {
    await pool.end()
    console.log('--- DIAGNOSTICS COMPLETE ---')
  }
}

debug()
