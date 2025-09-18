import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("amtronics");
    const offers = await db
      .collection("offers")
      .find({}, {
        projection: {
          _id: 1,
          offerDescription: 1,
          offerText: 1,
          ar_offerText: 1,
          active: 1,
          ar_offerDescription: 1
        }
      })
      .toArray();

    return NextResponse.json({ offers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("amtronics");
    const offers = db.collection("offers");

    // Add new offer (default to inactive)
    const result = await offers.insertOne({
      ...body,
      active: false
    });

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing offer id" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("amtronics");
    const offers = db.collection("offers");

    await offers.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing offer id" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("amtronics");
    const offers = db.collection("offers");

    await offers.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}