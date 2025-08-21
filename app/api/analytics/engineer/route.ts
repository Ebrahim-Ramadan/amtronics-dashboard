import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getSessionFromRequestHeaders } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequestHeaders(request.headers)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const engineer = searchParams.get('engineer') || session.engineerName
    if (!engineer) return NextResponse.json({ error: 'Engineer not specified' }, { status: 400 })

    if (session.role === 'engineer' && session.engineerName !== engineer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (session.role === 'sub') {
      const allowed = session.allowedEngineers || []
      if (!allowed.includes(engineer)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db('amtronics')
    const projects = await db.collection('projects').find({ 'engineers.name': engineer }).project({ engineers: 1, name: 1 }).toArray()

    // Aggregate bundles for this engineer
    const bundleProductIds = new Set<string>()
    for (const p of projects) {
      for (const eng of (p.engineers || [])) {
        if (eng.name === engineer) {
          for (const ref of (eng.bundle || [])) {
            if (ref.id) bundleProductIds.add(ref.id)
          }
        }
      }
    }

    const ids = Array.from(bundleProductIds).filter(Boolean).map((id: string) => {
      try { return new ObjectId(id) } catch { return null }
    }).filter(Boolean) as ObjectId[]
    const products = await db.collection('products').find({ _id: { $in: ids } }).toArray()

    return NextResponse.json({ engineer, projects, bundle: products })
  } catch (e) {
    console.error('Engineer analytics error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


