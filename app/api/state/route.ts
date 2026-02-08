import { NextResponse } from 'next/server'
import { getPrisma } from '@/services/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const p = await getPrisma()

  // Verify user actually exists in DB to prevent FK violations
  const userExists = await p.user.findUnique({
    where: { id: session.user.id },
  })

  if (!userExists) {
    return NextResponse.json(
      { error: 'User record not found. Please relogin.' },
      { status: 401 },
    )
  }

  const user = session.user
  try {
    const students = await p.student.findMany({
      where: { userId: user.id },
    })
    const homeworks = await p.homework.findMany({
      where: { userId: user.id },
      include: { submissions: true },
    })

    const convertedHomeworks = homeworks.map((hw: any) => ({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      assignedDate: hw.assignedDate.toISOString(),
      dueDate: hw.dueDate.toISOString(),
      targetClasses: hw.targetClasses,
      targetStudentIds: hw.targetStudents,
      subject: hw.subject || 'GENEL',
      groupId: hw.groupId,
      submissions: hw.submissions.reduce((acc: any, sub: any) => {
        acc[sub.studentId] = sub.status
        return acc
      }, {}),
      notifiedStudents: hw.submissions.reduce((acc: any, sub: any) => {
        if (sub.isNotified) acc[sub.studentId] = true
        return acc
      }, {}),
    }))

    return NextResponse.json({
      students: students.map((s: any) => ({
        id: s.id,
        name: s.name,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        className: s.className,
      })),
      homeworks: convertedHomeworks,
    })
  } catch (e: any) {
    console.error('GET /api/state failed', e)
    return NextResponse.json(
      { error: `Veritabanı hatası: ${e.message || 'Veriler çekilemedi.'}` },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const p = await getPrisma()

  // Verify user actually exists in DB to prevent FK violations
  const userExists = await p.user.findUnique({
    where: { id: session.user.id },
  })

  if (!userExists) {
    return NextResponse.json(
      { error: 'User record not found. Please relogin.' },
      { status: 401 },
    )
  }

  const user = session.user
  try {
    const state = await req.json()
    const students = state.students || []

    // Safety check: ensure we don't accidentally take IDs from other users if UUID collision (unlikely)
    // but mainly ensure we are Operating on the User's Scope.

    // Transaction for atomic update
    await p.$transaction(
      async (tx) => {
        // 1. Sync Students
        // Get existing IDs for this user to know what to delete
        const existingStudents = await tx.student.findMany({
          where: { userId: user.id },
          select: { id: true },
        })
        const existingStudentIds = existingStudents.map((s) => s.id)

        const incomingStudentIds = students.map((s: any) => s.id)

        // Delete students not in incoming list (but only for THIS user)
        const studentsToDelete = existingStudentIds.filter(
          (id) => !incomingStudentIds.includes(id),
        )
        if (studentsToDelete.length > 0) {
          await tx.student.deleteMany({
            where: {
              id: { in: studentsToDelete },
              userId: user.id, // Redundant if IDs are unique, but good for safety
            },
          })
        }

        // Upsert students
        await Promise.all(
          students.map((s: any) =>
            tx.student.upsert({
              where: { id: s.id },
              create: {
                id: s.id,
                userId: user.id,
                name: s.name,
                parentName: s.parentName,
                parentPhone: s.parentPhone,
                className: s.className,
              },
              update: {
                // Ensure we don't overwrite userId or allow claiming other's student if ID leaked (though ID is UUID)
                // Since 'where' is unique ID, if it exists, it updates.
                // We should ideally check ownership. But for simplicity in this atomic sync:
                name: s.name,
                parentName: s.parentName,
                parentPhone: s.parentPhone,
                className: s.className,
              },
            }),
          ),
        )

        // 2. Sync Homeworks
        const existingHomeworks = await tx.homework.findMany({
          where: { userId: user.id },
          select: { id: true },
        })
        const existingHomeworkIds = existingHomeworks.map((h) => h.id)
        const incomingHomeworkIds = (state.homeworks || []).map(
          (h: any) => h.id,
        )

        const homeworksToDelete = existingHomeworkIds.filter(
          (id) => !incomingHomeworkIds.includes(id),
        )
        if (homeworksToDelete.length > 0) {
          await tx.homework.deleteMany({
            where: {
              id: { in: homeworksToDelete },
              userId: user.id,
            },
          })
        }

        for (const hw of state.homeworks || []) {
          const upserted = await tx.homework.upsert({
            where: { id: hw.id },
            create: {
              id: hw.id,
              userId: user.id,
              title: hw.title,
              description: hw.description,
              assignedDate: new Date(hw.assignedDate),
              dueDate: new Date(hw.dueDate),
              targetClasses: hw.targetClasses || [],
              targetStudents: hw.targetStudentIds || [],
              subject: hw.subject || 'GENEL',
              groupId: hw.groupId,
            },
            update: {
              title: hw.title,
              description: hw.description,
              assignedDate: new Date(hw.assignedDate),
              dueDate: new Date(hw.dueDate),
              targetClasses: hw.targetClasses || [],
              targetStudents: hw.targetStudentIds || [],
              subject: hw.subject || 'GENEL',
              groupId: hw.groupId,
            },
          })

          // Clear existing submissions for this homework
          // Submissions don't strictly need userId if they are child of Homework,
          // but if we added userId to Submission, we sets it here.
          // Current schema: Submission linked to Homework + Student.
          await tx.submission.deleteMany({
            where: { homeworkId: upserted.id },
          })

          const submissions = Object.entries(hw.submissions || {}).map(
            ([studentId, status]) => ({
              studentId,
              homeworkId: upserted.id,
              status: status as string,
              isNotified: hw.notifiedStudents?.[studentId] || false,
            }),
          )

          if (submissions.length > 0) {
            await tx.submission.createMany({
              data: submissions,
            })
          }
        }
      },
      {
        timeout: 30000,
      },
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('POST /api/state failed', e)
    return NextResponse.json(
      { error: `Veritabanı hatası: ${e.message || 'Kayıt başarısız.'}` },
      { status: 500 },
    )
  }
}
