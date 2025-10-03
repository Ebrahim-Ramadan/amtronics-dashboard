import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// PATCH - Update a fee by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { title, serviceType, price } = body;
    
    if (!title && !serviceType && price === undefined) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (serviceType) updateData.serviceType = serviceType;
    if (price !== undefined) updateData.price = Number(price);
    
    const result = await db.collection("hwsd").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Fee not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Fee updated successfully" });
  } catch (error) {
    console.error("Error updating HWSD fee:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a fee by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    
    const result = await db.collection("hwsd").deleteOne(
      { _id: new ObjectId(id) }
    );
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Fee not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Fee deleted successfully" });
  } catch (error) {
    console.error("Error deleting HWSD fee:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}