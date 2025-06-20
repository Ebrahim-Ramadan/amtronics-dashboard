import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("orders");
    const orders = await collection
      .find({ "customerInfo.email": email })
      .project({ _id: 1, total: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();
    // Convert _id to string for frontend
    const formatted = orders.map((o) => ({ ...o, _id: o._id.toString() }));
    return NextResponse.json({ orders: formatted }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
} 