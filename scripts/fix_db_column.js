import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Renaming column notifiedStudents to isNotified...')
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Submission" RENAME COLUMN "notifiedStudents" TO "isNotified";`
    )
    console.log('Successfully renamed column!')
  } catch (e) {
    if (
      e.message &&
      e.message.includes('column "notifiedStudents" does not exist')
    ) {
      console.log(
        'Column notifiedStudents does not exist. Checking if isNotified exists...'
      )
      try {
        await prisma.$executeRawUnsafe(
          `SELECT "isNotified" FROM "Submission" LIMIT 1;`
        )
        console.log('Column isNotified exists. All good.')
      } catch (e2) {
        console.error('Error verifying isNotified:', e2)
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
