import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

async function test() {
  console.log('Testing connection...')
  console.log(
    'DATABASE_URL starts with:',
    process.env.DATABASE_URL?.substring(0, 20)
  )

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`
    console.log('Connection successful:', res)

    const count = await prisma.student.count()
    console.log('Student count:', count)
  } catch (e) {
    console.error('Connection failed:', e)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

test()
