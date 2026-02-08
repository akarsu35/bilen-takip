import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

async function setup() {
  const dbUrl = process.env.DATABASE_URL
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: dbUrl?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('Attempting manual table creation...')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Student" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "parentName" TEXT NOT NULL,
        "parentPhone" TEXT NOT NULL,
        "className" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('✅ Student table created (or already exists)')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Homework" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "assignedDate" TIMESTAMP(3) NOT NULL,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "targetClasses" TEXT[],
        "targetStudents" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('✅ Homework table created')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Submission" (
        "id" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "homeworkId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "isNotified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('✅ Submission table created')

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Submission_studentId_homeworkId_key" ON "Submission"("studentId", "homeworkId");
    `)

    console.log('--- ALL TABLES CREATED ---')
  } catch (e) {
    console.error('Manual setup failed:', e)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

setup()
