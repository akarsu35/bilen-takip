import prisma from './prisma'
import type { PrismaClient } from '@prisma/client'

type CreateStudentInput = {
  name: string
  parentName: string
  parentPhone: string
  className: string
}

export async function createStudent(
  data: CreateStudentInput,
  db: PrismaClient = prisma,
) {
  return db.student.create({ data })
}

export async function getStudentById(id: string, db: PrismaClient = prisma) {
  return db.student.findUnique({ where: { id } })
}

export async function getStudents(
  filter?: { className?: string },
  db: PrismaClient = prisma,
) {
  const where = filter?.className ? { className: filter.className } : undefined
  return db.student.findMany({ where })
}

export async function updateStudent(
  id: string,
  data: Partial<CreateStudentInput>,
  db: PrismaClient = prisma,
) {
  return db.student.update({ where: { id }, data })
}

export async function deleteStudent(id: string, db: PrismaClient = prisma) {
  return db.student.delete({ where: { id } })
}

export default {
  createStudent,
  getStudentById,
  getStudents,
  updateStudent,
  deleteStudent,
}
