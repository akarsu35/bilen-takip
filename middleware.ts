import { type NextRequest, NextResponse } from 'next/server'
import { decrypt, COOKIE_NAME } from '@/lib/jwt'

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = path === '/login'

  const cookie = request.cookies.get(COOKIE_NAME)?.value
  const session = cookie ? await decrypt(cookie) : null

  if (isPublicPath && session?.user) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  if (!isPublicPath && !session?.user) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
