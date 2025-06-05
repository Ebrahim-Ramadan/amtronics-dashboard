import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sort = searchParams.get("sort") || "latest"
    const search = searchParams.get("search") || ""

    const client = await clientPromise
    const db = client.db("amtronics") // Replace with your actual database name
    const collection = db.collection("orders") // Replace with your actual collection name

    // Build the query
    const query: any = { status: "pending" }

    // Add search functionality
    if (search) {
      query.$or = [
        { "customerInfo.name": { $regex: search, $options: "i" } },
        { "customerInfo.email": { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sortObj = { createdAt: sort === "latest" ? -1 : 1 }

    // Execute queries in parallel
    const [orders, totalCount] = await Promise.all([
      collection.find(query).sort(sortObj).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    // Transform MongoDB documents
    const transformedOrders = orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      createdAt: order.createdAt.$date || order.createdAt,
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      orders: transformedOrders,
      totalCount,
      currentPage: page,
      totalPages,
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
