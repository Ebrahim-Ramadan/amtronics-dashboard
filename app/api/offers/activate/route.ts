

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing offer id" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const offers = db.collection("offers");

    // Set all offers to inactive
    await offers.updateMany({}, { $set: { active: false } });

    // Set the selected offer to active
    await offers.updateOne({ _id: new ObjectId(id) }, { $set: { active: true } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}