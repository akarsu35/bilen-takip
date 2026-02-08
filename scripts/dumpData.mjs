import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

try {
  const students = await prisma.student.findMany({ take: 10 })
  const homeworks = await prisma.homework.findMany({
    include: { submissions: true },
    take: 10,
  })
  const submissions = await prisma.submission.findMany({ take: 20 })

  console.log('STUDENTS:', JSON.stringify(students, null, 2))
  console.log('HOMEWORKS:', JSON.stringify(homeworks, null, 2))
  console.log('SUBMISSIONS:', JSON.stringify(submissions, null, 2))
} catch (e) {
  console.error(e)
} finally {
  await prisma.$disconnect()
}
