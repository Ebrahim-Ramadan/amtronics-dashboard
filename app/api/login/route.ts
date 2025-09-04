import { NextResponse } from 'next/server'
import { buildSessionPayload, createSession, setSessionCookie, verifyPassword } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import type { Role, UserDoc } from '@/lib/types'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Only check DB users (no .env static admins)
  const client = await clientPromise
  const db = client.db('amtronics')
  const user = await db.collection<UserDoc>('users').findOne({ email })

  if (!user || !user.active) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }

  const payload = buildSessionPayload({
    email: user.email,
    role: user.role,
    engineerName: user.engineerName,
    allowedEngineers: user.allowedEngineers,
  })
  const token = createSession(payload)
  const response = NextResponse.json({ message: 'Login successful', role: user.role }, { status: 200 })
  setSessionCookie(response, token)
  return response
}