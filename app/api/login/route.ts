import { NextResponse } from 'next/server'
import { buildSessionPayload, createSession, setSessionCookie, verifyPassword } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import type { Role, UserDoc } from '@/lib/types'

// Add this import
const admins = JSON.parse(process.env.ADMIN_CREDENTIALS || "[]");

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // 1. Check .env hardcoded admins first
  const admin = admins.find((a: any) => a.email === email);
  if (admin) {
    if (admin.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    // Build session payload for admin
    const payload = buildSessionPayload({
      email: admin.email,
      role: "admin",
      engineerName: "Admin",
      allowedEngineers: [],
    });
    const token = createSession(payload);
    const response = NextResponse.json({ message: 'Login successful', role: "admin" }, { status: 200 });
    setSessionCookie(response, token);
    return response;
  }

  // 2. If not found in .env, check DB users
  const client = await clientPromise;
  const db = client.db('amtronics');
  const user = await db.collection<UserDoc>('users').findOne({ email });

  if (!user || !user.active) {
    return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // Build session payload including allowedProjects and allowedPromos
  const payload = buildSessionPayload({
    email: user.email,
    role: user.role,
    engineerName: user.engineerName,
    allowedEngineers: user.allowedEngineers,
  });

  // Include allowedProjects and allowedPromos for sub users
  if (user.role === "sub") {
    payload.allowedProjects = user.allowedProjects || [];
    payload.allowedPromos = user.allowedPromos || [];
  }

  const token = createSession(payload);
  const response = NextResponse.json({ message: 'Login successful', role: user.role }, { status: 200 });
  setSessionCookie(response, token);
  return response;
}