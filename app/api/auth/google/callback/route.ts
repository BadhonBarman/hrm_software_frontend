import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`
  
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${baseUrl}/api/auth/google/callback`

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=google`)
  }


  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=google_token`)
  }

  const tokens = await tokenRes.json()




  const backendRes = await fetch(
    `${process.env.BACKEND_URL}/auth/google/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_token: tokens.id_token,
      }),
    }
  )

  if (!backendRes.ok) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=backend`)
  }

  const backendData = await backendRes.json()

  const response = NextResponse.redirect(`${baseUrl}/dashboard`)


  response.cookies.set('access_token', backendData.access, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  response.cookies.set('refresh_token', backendData.refresh, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
