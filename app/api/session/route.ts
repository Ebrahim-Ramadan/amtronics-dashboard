import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequestHeaders } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequestHeaders(request.headers)
  if (!session) return NextResponse.json({ role: null })
  return NextResponse.json({ role: session.role, email: session.email, engineerName: session.engineerName || null })
}


