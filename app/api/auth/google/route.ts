import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`
  
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
