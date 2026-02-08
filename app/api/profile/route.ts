import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPrisma } from '@/services/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
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
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, schoolName, subject } = body

    const prisma = await getPrisma()
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: fullName || null,
        schoolName: schoolName || null,
      },
      create: {
        userId: user.id,
        fullName: fullName || null,
        schoolName: schoolName || null,
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
