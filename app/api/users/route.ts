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
  const users = await db
    .collection<UserDoc>('users')
    .find({}, { projection: { passwordHash: 0 } })
    .toArray()
  // Map to frontend-friendly format
  const mapped = users.map(u => ({
    _id: u._id?.toString(),
    name: u.engineerName || "",
    email: u.email,
    role: u.role,
    active: u.active ?? true,
  }))
  return NextResponse.json({ users: mapped })
}

// Create user (admin only)
export async function POST(request: NextRequest) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { email, password, role, engineerName, active } = await request.json()

  if (!email || !role || !password)
    return NextResponse.json({ error: 'email, password and role are required' }, { status: 400 })
  if (!['admin', 'engineer', 'user', 'sub'].includes(role))
    return NextResponse.json({ error: 'invalid role' }, { status: 400 })

  const client = await clientPromise
  const db = client.db('amtronics')
  const users = db.collection<UserDoc>('users')

  const exists = await users.findOne({ email })
  if (exists) return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })

  const now = new Date()
  const passwordHash = await hashPassword(password)
  const doc: UserDoc = {
    email,
    passwordHash,
    role,
    engineerName,
    active: active ?? true,
    createdAt: now,
    updatedAt: now,
  }
  const result = await users.insertOne(doc as any)
  return NextResponse.json({
    user: {
      _id: result.insertedId.toString(),
      name: engineerName || "",
      email,
      role,
      active: active ?? true,
    }
  }, { status: 201 })
}

// Change user role (admin only)
export async function PATCH(request: NextRequest) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { userId, role } = await request.json()
  if (!userId || !role)
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
  if (!['admin', 'engineer', 'user', 'sub'].includes(role))
    return NextResponse.json({ error: 'invalid role' }, { status: 400 })

  const client = await clientPromise
  const db = client.db('amtronics')
  const users = db.collection<UserDoc>('users')

  const result = await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role, updatedAt: new Date() } }
  )
  if (!result.matchedCount)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ message: 'Role updated' })
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


