import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 })
  // Clear the authenticated cookie
  response.cookies.set('authenticated', '', { path: '/', maxAge: 0 })
  return response
} 