import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'
import { setSession } from '@/lib/session'
import { comparePassword } from '@/lib/password'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre zorunludur' },
        { status: 400 },
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email veya şifre hatalı' },
        { status: 401 },
      )
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email veya şifre hatalı' },
        { status: 401 },
      )
    }

    // Create session
    await setSession({ id: user.id, email: user.email })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Giriş işlemi başarısız oldu' },
      { status: 500 },
    )
  }
}
