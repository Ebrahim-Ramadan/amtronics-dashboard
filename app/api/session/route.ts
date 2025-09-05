import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequestHeaders } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequestHeaders(request.headers)
  if (!session) {
    return NextResponse.json({ user: null })
  }
  // Return user object matching your User type
  return NextResponse.json({
    user: {
      _id: session._id || "", // If you store _id in session, otherwise ""
      name: session.engineerName || session.name || "",
      email: session.email,
      role: session.role,
      active: session.active ?? true // Default to true if not present
    }
  })
}


