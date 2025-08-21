import { NextResponse } from 'next/server'
import { buildSessionPayload, createSession, setSessionCookie, verifyPassword } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import type { Role, UserDoc } from '@/lib/types'

// Retrieve credentials from environment variable and parse JSON
const ADMIN_CREDENTIALS_STRING = process.env.ADMIN_CREDENTIALS;
let adminCredentials: { email: string; password: string }[] = [];

if (ADMIN_CREDENTIALS_STRING) {
  try {
    adminCredentials = JSON.parse(ADMIN_CREDENTIALS_STRING);
  } catch (error) {
    console.error("Failed to parse ADMIN_CREDENTIALS environment variable:", error);
    // In a real application, you might want to handle this error more gracefully
    // or prevent the server from starting if credentials are misconfigured.
  }
}

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // 1) Check admin env credentials
  const matchedAdmin = adminCredentials.find(credential => credential.email === email && credential.password === password)
  if (matchedAdmin) {
    const payload = buildSessionPayload({ email, role: 'admin' as Role })
    const token = createSession(payload)
    const response = NextResponse.json({ message: 'Login successful', role: 'admin' }, { status: 200 })
    setSessionCookie(response, token)
    return response
  }

  // 2) Check DB users
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