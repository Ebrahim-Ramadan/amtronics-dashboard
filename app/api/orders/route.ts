import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId, Sort } from 'mongodb'

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
        { "_id": { $regex: search, $options: "i" } }, // Add search by _id
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sortObj : Sort= { createdAt: sort === "latest" ? -1 : 1 }

    // Define projection to only include specific product fields
    const projection = {
      "items.product._id": 1,
      "items.product.en_name": 1,
      "items.product.price": 1,
      "items.product.sku": 1,
      "items.product.barcode": 1,
      "items.product.image": 1,
      "items.quantity": 1,
      customerInfo: 1,
      total: 1,
      discount: 1,
      promoCode: 1,
      status: 1,
      createdAt: 1,
      _id: 1,
    }
    // Execute queries in parallel
    const [orders, totalCount] = await Promise.all([
      collection.find(query).project(projection).sort(sortObj).skip(skip).limit(limit).toArray(),
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

export async function PATCH(request: NextRequest) {
  try {
    const { id, status }: { id: string; status: string } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ message: "Missing required fields (id and status)" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("amtronics")
    const collection = db.collection("orders")

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Order status updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
