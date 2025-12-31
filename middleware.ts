import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  console.log('Middleware - Path:', pathname, 'Token exists:', !!accessToken)


  if (pathname.startsWith('/dashboard')) {

    if (!accessToken) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  if (pathname.startsWith('/sign-in') && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }


  const response = NextResponse.next()
  

  if (accessToken) {
    response.cookies.set('access_token', accessToken, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sign-in',
  ],
}
