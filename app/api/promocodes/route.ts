import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from 'mongodb' // Import ObjectId

export interface PromoCode {
  _id?: string // MongoDB ObjectId
  code: string
  percentage: number
  expiry: Date
  active: boolean
}

export async function POST(request: NextRequest) {
  try {
    const promoCodeData: PromoCode = await request.json()

    const client = await clientPromise
    const db = client.db("amtronics") // Replace with your actual database name
    const collection = db.collection("promocodes") // Replace with your actual collection name

    // Basic validation (add more comprehensive validation as needed)
    if (!promoCodeData.code || promoCodeData.percentage === undefined || !promoCodeData.expiry) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if a promo code with the same code already exists
    const existingCode = await collection.findOne({ code: promoCodeData.code })
    if (existingCode) {
      return NextResponse.json({ message: "Promo code with this code already exists" }, { status: 409 })
    }

    // Destructure to omit _id before inserting
    const { _id, ...dataToInsert } = promoCodeData;

    const result = await collection.insertOne({ ...dataToInsert, createdAt: new Date() })

    return NextResponse.json({ message: "Promo code added successfully", promoCodeId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error adding promo code:", error)
    return NextResponse.json({ error: "Failed to add promo code" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
    try {
      const { id, active }: { id: string; active: boolean } = await request.json();

      if (!id || active === undefined) {
        return NextResponse.json({ message: "Missing required fields (id and active)" }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db("amtronics"); // Replace with your actual database name
      const collection = db.collection("promocodes"); // Replace with your actual collection name

      // Find and update the promo code
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { active: active } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ message: "Promo code not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Promo code updated successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error updating promo code:", error);
      return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
    }
  }

export async function DELETE(request: NextRequest) {
  try {
    const { id }: { id: string } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Missing promo code ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics"); // Replace with your actual database name
    const collection = db.collection("promocodes"); // Replace with your actual collection name

    // Delete the promo code by ID
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Promo code not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Promo code deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}

// Add a GET method to fetch promo codes
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("amtronics"); // Replace with your actual database name
    const collection = db.collection("promocodes"); // Replace with your actual collection name

    const promoCodes = await collection.find({}).toArray();

    return NextResponse.json({ promoCodes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 });
  }
} 