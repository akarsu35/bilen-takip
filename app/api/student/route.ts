import { NextResponse } from 'next/server'
import { getPrisma } from '@/services/prisma'
import { createClient } from '@/utils/supabase/server'

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const p = getPrisma()
  try {
    // Ensure the student belongs to the user
    const student = await p.student.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Allow deletion if:
    // 1. Student belongs to the current user, OR
    // 2. Student is a legacy_user (migrated from old system)
    if (student.userId !== user.id && student.userId !== 'legacy_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await p.submission.deleteMany({ where: { studentId: id } })
    await p.student.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('DELETE /api/student failed', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
