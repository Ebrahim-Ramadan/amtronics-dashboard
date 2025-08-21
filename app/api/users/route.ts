import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { buildSessionPayload, createSession, setSessionCookie, getSessionFromRequestHeaders, hashPassword } from '@/lib/auth'
import type { Role, UserDoc } from '@/lib/types'
import { ObjectId } from 'mongodb'

function requireAdmin(request: NextRequest) {
  const session = getSessionFromRequestHeaders(request.headers)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}

// List users (admin only)
export async function GET(request: NextRequest) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const client = await clientPromise
  const db = client.db('amtronics')
  const users = await db.collection<UserDoc>('users').find({}, { projection: { passwordHash: 0 } }).toArray()
  return NextResponse.json({ users })
}

// Create or update user (admin only)
export async function POST(request: NextRequest) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id, email, password, role, engineerName, allowedEngineers, active } = await request.json()

  if (!email || !role) return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
  if (!['admin', 'engineer', 'sub'].includes(role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 })

  const client = await clientPromise
  const db = client.db('amtronics')
  const users = db.collection<UserDoc>('users')

  const now = new Date()
  if (id) {
    const update: Partial<UserDoc> = { email, role, engineerName, allowedEngineers, active, updatedAt: now }
    if (password) update.passwordHash = await hashPassword(password)
    const result = await users.updateOne({ _id: new ObjectId(id) }, { $set: update })
    if (!result.matchedCount) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ message: 'User updated' })
  } else {
    if (!password) return NextResponse.json({ error: 'password is required' }, { status: 400 })
    const passwordHash = await hashPassword(password)
    const doc: UserDoc = { email, passwordHash, role, engineerName, allowedEngineers, active: active ?? true, createdAt: now, updatedAt: now }
    const result = await users.insertOne(doc as any)
    return NextResponse.json({ message: 'User created', id: result.insertedId }, { status: 201 })
  }
}

// Delete user (admin only)
export async function DELETE(request: NextRequest) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const client = await clientPromise
  const db = client.db('amtronics')
  const users = db.collection('users')
  const result = await users.deleteOne({ _id: new ObjectId(id) })
  if (!result.deletedCount) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ message: 'User deleted' })
}


