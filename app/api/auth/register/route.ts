import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'
import { setSession } from '@/lib/session'
import { hashPassword } from '@/lib/password'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre zorunludur' },
        { status: 400 },
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanımda' },
        { status: 400 },
      )
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    })

    // Create session
    await setSession({ id: user.id, email: user.email })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kayıt işlemi başarısız oldu' },
      { status: 500 },
    )
  }
}
