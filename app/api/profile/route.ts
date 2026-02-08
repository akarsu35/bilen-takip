import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/services/prisma'

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, schoolName, subject } = body

    const prisma = await getPrisma()
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        fullName: fullName || null,
        schoolName: schoolName || null,
        subject: subject || null,
      },
      create: {
        userId: session.user.id,
        fullName: fullName || null,
        schoolName: schoolName || null,
        subject: subject || null,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 },
    )
  }
}
