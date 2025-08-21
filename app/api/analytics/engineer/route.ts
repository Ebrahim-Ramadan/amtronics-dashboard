import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getSessionFromRequestHeaders } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequestHeaders(request.headers)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    let engineer = searchParams.get('engineer') || session.engineerName || ''
    if (session.role === 'sub' && !engineer) {
      const allowed = session.allowedEngineers || []
      engineer = allowed[0] || ''
    }
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

    // Aggregate orders to compute units and revenue for bundle
    const ordersAgg = await db.collection('orders').aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { $match: { 'items.product._id': { $in: ids } } },
      { $group: {
        _id: '$items.product._id',
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: [ '$items.product.price', '$items.quantity' ] } },
      }},
    ]).toArray()

    const byProduct = ordersAgg.map(row => {
      const p = products.find(pr => pr._id && pr._id.equals(row._id)) || {}
      return {
        productId: row._id,
        en_name: (p as any).en_name,
        sku: (p as any).sku,
        price: (p as any).price,
        unitsSold: row.unitsSold || 0,
        revenue: row.revenue || 0,
      }
    })

    const totalUnitsSold = byProduct.reduce((s, r) => s + (r.unitsSold || 0), 0)
    const totalRevenue = byProduct.reduce((s, r) => s + (r.revenue || 0), 0)

    return NextResponse.json({ engineer, bundle: products, analytics: { byProduct, totalUnitsSold, totalRevenue } })
  } catch (e) {
    console.error('Engineer analytics error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


