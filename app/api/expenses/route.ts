import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("amtronics");
    const expenses = await db
      .collection("expenses")
      .find({})
      .sort({ date: -1 })
      .toArray();
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/expenses error:", err);
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, cost, quantity = 1, note = "", date } = body;

    if (!name || cost == null || isNaN(Number(cost)) || Number(cost) < 0) {
      return NextResponse.json({ message: "Missing or invalid name/cost" }, { status: 400 });
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return NextResponse.json({ message: "Invalid or missing date" }, { status: 400 });
    }
    const doc = {
      name: String(name).trim(),
      cost: Number(cost),
      quantity: Number(quantity) || 1,
      note: String(note || ""),
      date: new Date(date),
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("amtronics");
    const res = await db.collection("expenses").insertOne(doc);
    return NextResponse.json({ message: "Expense created", id: res.insertedId }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/expenses error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, cost, quantity, note, date } = body;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (cost !== undefined) {
      if (isNaN(Number(cost)) || Number(cost) < 0) return NextResponse.json({ message: "Invalid cost" }, { status: 400 });
      update.cost = Number(cost);
    }
    if (quantity !== undefined) update.quantity = Number(quantity);
    if (note !== undefined) update.note = String(note);
    if (date !== undefined) {
      if (isNaN(new Date(date).getTime())) return NextResponse.json({ message: "Invalid date" }, { status: 400 });
      update.date = new Date(date);
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ message: "Nothing to update" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("amtronics");
    const res = await db.collection("expenses").updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (res.matchedCount === 0) return NextResponse.json({ message: "Expense not found" }, { status: 404 });
    return NextResponse.json({ message: "Expense updated" }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/expenses error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("amtronics");
    const res = await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });

    if (res.deletedCount === 0) return NextResponse.json({ message: "Expense not found" }, { status: 404 });
    return NextResponse.json({ message: "Expense deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/expenses error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}