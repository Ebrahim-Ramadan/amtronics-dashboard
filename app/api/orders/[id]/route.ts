import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("orders");

    const result = await collection.deleteOne({
      _id: new ObjectId(orderId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}