import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing promo code" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("orders");
    const count = await collection.countDocuments({ promoCode: code, status: "completed" });
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Error counting promo code uses:", error);
    return NextResponse.json({ error: "Failed to count promo code uses" }, { status: 500 });
  }
} 