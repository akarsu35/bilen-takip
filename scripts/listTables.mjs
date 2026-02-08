import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

try {
  const tables =
    await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  console.log(JSON.stringify(tables, null, 2))
} catch (e) {
  console.error(e)
} finally {
  await prisma.$disconnect()
}
