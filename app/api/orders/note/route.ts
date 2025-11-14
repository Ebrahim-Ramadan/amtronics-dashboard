import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body?.id || "").trim();
    const notes = body?.notes;

    console.log("patch note body:", body);

    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    // Require a valid MongoDB ObjectId — avoid fallback to string match
    if (!ObjectId.isValid(orderId)) {
      console.error("Invalid ObjectId format:", orderId);
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    if (typeof notes !== "string") {
      return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("orders");

    const oid = new ObjectId(orderId);
    const result = await collection.findOneAndUpdate(
      { _id: oid },
      { $set: { notes } },
      { returnDocument: "after" }
    );
console.log('result', result);
  // Check if the update actually happened
    if (result.notes !== notes) {
      console.error("Update failed - notes don't match");
      return NextResponse.json({ error: "Failed to update notes" }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Order note updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order note:", error);
    return NextResponse.json(
      { error: "Failed to update order note" },
      { status: 500 }
    );
  }
}