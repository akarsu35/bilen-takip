import prisma from './prisma'
import type { PrismaClient } from '@prisma/client'

type CreateHomeworkInput = {
  title: string
  description: string
  assignedDate: Date
  dueDate: Date
  targetClasses?: string[]
  targetStudents?: string[]
}

export async function createHomework(
  data: CreateHomeworkInput,
  db: PrismaClient = prisma,
) {
  return db.homework.create({ data })
}

export async function getHomeworkById(id: string, db: PrismaClient = prisma) {
  return db.homework.findUnique({ where: { id } })
}

export async function getHomeworks(
  filter?: { className?: string },
  db: PrismaClient = prisma,
) {
  const where = filter?.className
    ? { targetClasses: { has: filter.className } }
    : undefined
  return db.homework.findMany({ where })
}

export async function updateHomework(
  id: string,
  data: Partial<CreateHomeworkInput>,
  db: PrismaClient = prisma,
) {
  return db.homework.update({ where: { id }, data })
}

export async function deleteHomework(id: string, db: PrismaClient = prisma) {
  return db.homework.delete({ where: { id } })
}

export default {
  createHomework,
  getHomeworkById,
  getHomeworks,
  updateHomework,
  deleteHomework,
}
