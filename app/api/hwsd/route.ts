import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("amtronics");
    
    // Get total count
    const total = await db.collection("hwsd_fees").countDocuments({});
    
    // Get paginated results
    const fees = await db.collection("hwsd_fees")
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({ fees, total });
  } catch (error) {
    console.error("Error fetching HWSD fees:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new fee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, serviceType, price } = body;
    
    if (!title || !serviceType || !price) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    
    const newFee = {
      title,
      serviceType,
      price: Number(price),
      createdAt: new Date().toISOString()
    };
    
    const result = await db.collection("hwsd").insertOne(newFee);
    
    return NextResponse.json(
      { message: "Fee created successfully", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating HWSD fee:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}