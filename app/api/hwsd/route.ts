import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all fees
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("amtronics");
    const searchParams = request.nextUrl.searchParams;
    
    // Handle getting a single fee by ID
    const id = searchParams.get('id');
    if (id) {
      const fee = await db.collection('hwsd').findOne({ _id: new ObjectId(id) });
      if (!fee) {
        return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
      }
      return NextResponse.json(fee);
    }
    
    // Handle getting all fees with optional filters
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');
    
    const filter: any = {};
    if (email) filter.customerEmail = email;
    if (phone) filter.customerPhone = phone;
    if (status) filter.status = status;
    
    const fees = await db.collection('hwsd')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ fees });
  } catch (error) {
    console.error('Failed to fetch HWSD fees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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