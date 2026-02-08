import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
  console.log('Renaming column notifiedStudents to isNotified...')
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Submission" RENAME COLUMN "notifiedStudents" TO "isNotified";`
    )
    console.log('Successfully renamed column!')
  } catch (e) {
    if (e.message.includes('UndefinedColumn')) {
      console.log(
        'Column notifiedStudents does not exist. It might have been already renamed or checking for isNotified...'
      )
      try {
        // Verify if isNotified exists
        await prisma.$executeRawUnsafe(
          `SELECT "isNotified" FROM "Submission" LIMIT 1;`
        )
        console.log('Column isNotified already exists.')
      } catch (e2) {
        console.error(
          'Neither notifiedStudents nor isNotified seems to exist or another error:',
          e2
        )
      }
    } else {
      console.error('Error renaming column:', e)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
